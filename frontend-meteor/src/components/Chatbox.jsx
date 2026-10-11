import React, { useContext, useEffect, useRef, useState, useCallback } from "react";
import axios from "axios";
import io from "socket.io-client";
import {
  ArrowLeft,
  Video,
  Info,
  Send,
  Image as ImageIcon,
  Loader2,
  X,
  UserPlus,
  Users,
  LogOut,
  Edit2,
  PhoneCall,
  Flame,
  Check,
} from "lucide-react";
import { Context } from "../context/ChatContext";
import API_URL from "../config/api";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const DEFAULT_AVATAR =
  "https://img.freepik.com/premium-vector/user-profile-icon-flat-style-member-avatar-vector-illustration-isolated-background-human-permission-sign-business-concept_157943-15752.jpg?semt=ais_hybrid&w=740";

let socket;
let selectedChatCompare;

const Chatbox = ({ fetchAgain, setFetchAgain }) => {
  const {
    user,
    selectedChat,
    setSelectedChat,
    notification,
    setNotification,
  } = useContext(Context);

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Group edit modal state
  const [groupChatName, setGroupChatName] = useState("");
  const [search, setSearch] = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [groupActionLoading, setGroupActionLoading] = useState(false);

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Helper functions
  const getSender = (currentUser, users) => {
    if (!currentUser || !users || users.length < 2) return "Chat";
    return users[0]?._id === currentUser?._id
      ? users[1]?.name || "Unknown"
      : users[0]?.name || "Unknown";
  };

  const getEmail = (currentUser, users) => {
    if (!currentUser || !users || users.length < 2) return "";
    return users[0]?._id === currentUser?._id
      ? users[1]?.email || ""
      : users[0]?.email || "";
  };

  const getImage = (currentUser, users) => {
    if (!currentUser || !users || users.length < 2) return DEFAULT_AVATAR;
    return users[0]?._id === currentUser?._id
      ? users[1]?.pic || DEFAULT_AVATAR
      : users[0]?.pic || DEFAULT_AVATAR;
  };

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Initialize socket once
  useEffect(() => {
    if (!user) return;

    try {
      socket = io(API_URL || undefined, {
        transports: ["websocket", "polling"],
        reconnectionAttempts: 5,
        timeout: 10000,
      });

      socket.emit("setup", user);
      socket.on("connected", () => setSocketConnected(true));
      socket.on("connect_error", () => {
        setSocketConnected(false);
      });
      socket.on("typing", () => setIsTyping(true));
      socket.on("stop typing", () => setIsTyping(false));
    } catch (err) {
      console.warn("Socket init error, falling back to polling:", err.message);
      setSocketConnected(false);
    }

    return () => {
      if (socket) socket.disconnect();
    };
  }, [user]);


  // Fetch messages when selected chat changes
  const fetchMessages = useCallback(async () => {
    if (!selectedChat || !user?.token) return;

    try {
      setLoadingMessages(true);
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.get(
        `${API_URL}/api/message/${selectedChat._id}`,
        config
      );

      setMessages(Array.isArray(data) ? data : []);
      setLoadingMessages(false);
      socket.emit("join chat", selectedChat._id);
    } catch (err) {
      console.error("Failed to fetch messages:", err);
      setLoadingMessages(false);
    }
  }, [selectedChat, user]);

  useEffect(() => {
    fetchMessages();
    selectedChatCompare = selectedChat;
    setGroupChatName(selectedChat?.chatName || "");
  }, [selectedChat, fetchMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Listen for incoming messages
  useEffect(() => {
    if (!socket) return;

    const messageListener = (newMessageReceived) => {
      if (
        !selectedChatCompare ||
        selectedChatCompare._id !== newMessageReceived.chat._id
      ) {
        // Notification
        if (!notification.some((n) => n._id === newMessageReceived._id)) {
          setNotification([newMessageReceived, ...notification]);
          setFetchAgain(!fetchAgain);
        }
      } else {
        setMessages((prev) => [...prev, newMessageReceived]);
      }
    };

    socket.on("message recieved", messageListener);

    return () => {
      socket.off("message recieved", messageListener);
    };
  }, [notification, fetchAgain, setFetchAgain, setNotification]);

  // Polling fallback when WebSockets are disconnected or in serverless environment
  useEffect(() => {
    if (socketConnected || !selectedChat || !user?.token) return;

    const pollInterval = setInterval(() => {
      fetchMessages();
    }, 4000);

    return () => clearInterval(pollInterval);
  }, [socketConnected, selectedChat, user?.token, fetchMessages]);

  // Send message
  const sendMessage = async (e, directContent = null) => {
    if (e) e.preventDefault();
    const contentToSend = directContent !== null ? directContent : newMessage;

    if (!contentToSend || !contentToSend.trim()) return;

    socket?.emit("stop typing", selectedChat._id);
    setTyping(false);

    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.post(
        `${API_URL}/api/message`,
        {
          content: contentToSend.trim(),
          chatId: selectedChat._id,
        },
        config
      );

      if (directContent === null) {
        setNewMessage("");
      }

      socket?.emit("new message", data);
      setMessages((prev) => [...prev, data]);
      setFetchAgain(!fetchAgain);
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  // Typing handler
  const typingHandler = (e) => {
    setNewMessage(e.target.value);

    if (!socketConnected || !selectedChat) return;

    if (!typing) {
      setTyping(true);
      socket?.emit("typing", selectedChat._id);
    }

    const lastTypingTime = new Date().getTime();
    const timerLength = 2500;
    setTimeout(() => {
      const timeNow = new Date().getTime();
      const timeDiff = timeNow - lastTypingTime;
      if (timeDiff >= timerLength && typing) {
        socket?.emit("stop typing", selectedChat._id);
        setTyping(false);
      }
    }, timerLength);
  };

  // Handle image upload
  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "Chat_MERN");

    try {
      setUploadingImage(true);
      const res = await fetch(
        "https://api.cloudinary.com/v1_1/doa4ffp1m/image/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();
      if (data.secure_url) {
        sendMessage(null, data.secure_url);
      }
    } catch (err) {
      console.error("Image upload failed:", err);
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Video call link generator
  const startVideoCall = () => {
    const videoLink = `https://vcalll.vercel.app/room/${user._id}+${selectedChat._id}`;
    window.open(videoLink, "_blank");
    sendMessage(null, videoLink);
  };

  // Group Admin actions: Rename, Add user, Remove user
  const handleRenameGroup = async () => {
    if (!groupChatName.trim()) return;

    try {
      setGroupActionLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.put(
        `${API_URL}/api/chat/rename`,
        {
          chatId: selectedChat._id,
          chatName: groupChatName.trim(),
        },
        config
      );

      setSelectedChat(data);
      setFetchAgain(!fetchAgain);
    } catch (err) {
      console.error("Failed to rename group:", err);
    } finally {
      setGroupActionLoading(false);
    }
  };

  const handleGroupSearch = async (query) => {
    setSearch(query);
    if (!query.trim()) {
      setSearchResult([]);
      return;
    }

    try {
      setSearchLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.get(
        `${API_URL}/api/user?search=${encodeURIComponent(query.trim())}`,
        config
      );

      setSearchResult(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAddUserToGroup = async (userToAdd) => {
    if (selectedChat.users.some((u) => u._id === userToAdd._id)) {
      alert("User is already in this group.");
      return;
    }

    if (selectedChat.groupAdmin?._id !== user._id) {
      alert("Only group admins can add new participants.");
      return;
    }

    try {
      setGroupActionLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.put(
        `${API_URL}/api/chat/groupadd`,
        {
          chatId: selectedChat._id,
          userId: userToAdd._id,
        },
        config
      );

      setSelectedChat(data);
      setFetchAgain(!fetchAgain);
      setSearch("");
      setSearchResult([]);
    } catch (error) {
      console.error("Error adding user:", error);
    } finally {
      setGroupActionLoading(false);
    }
  };

  const handleRemoveUserFromGroup = async (userToRemove) => {
    const isAdmin = selectedChat.groupAdmin?._id === user._id;
    const isSelf = userToRemove._id === user._id;

    if (!isAdmin && !isSelf) {
      alert("Only admins can remove members.");
      return;
    }

    try {
      setGroupActionLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.put(
        `${API_URL}/api/chat/groupremove`,
        {
          chatId: selectedChat._id,
          userId: userToRemove._id,
        },
        config
      );

      if (isSelf) {
        setSelectedChat(null);
      } else {
        setSelectedChat(data);
      }
      setFetchAgain(!fetchAgain);
      fetchMessages();
    } catch (error) {
      console.error("Error removing user:", error);
    } finally {
      setGroupActionLoading(false);
    }
  };

  return (
    <div
      className={`${
        selectedChat ? "flex" : "hidden md:flex"
      } flex-1 min-w-0 flex-col bg-zinc-900/95 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl text-white`}
    >
      {selectedChat ? (
        <div className="flex flex-col h-full w-full overflow-hidden">
          {/* Active Chat Top Header */}
          <div className="h-16 px-3 sm:px-5 border-b border-zinc-800 flex items-center justify-between shrink-0 bg-zinc-900/60 backdrop-blur-md">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              {/* Mobile Back Button */}
              <button
                type="button"
                onClick={() => setSelectedChat(null)}
                className="md:hidden p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer shrink-0"
                aria-label="Back to chats"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              {/* Chat Avatar */}
              <div className="relative shrink-0">
                {selectedChat.isGroupChat ? (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
                    <Users className="w-5 h-5" />
                  </div>
                ) : (
                  <img
                    src={getImage(user, selectedChat.users)}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover border border-zinc-700 shadow-sm"
                  />
                )}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-zinc-900" />
              </div>

              {/* Chat Name & Subtitle */}
              <div className="min-w-0">
                <h2 className="text-sm sm:text-base font-bold text-white truncate">
                  {selectedChat.isGroupChat
                    ? selectedChat.chatName
                    : getSender(user, selectedChat.users)}
                </h2>
                <p className="text-[11px] text-zinc-400 truncate">
                  {selectedChat.isGroupChat
                    ? `${selectedChat.users?.length || 0} participants`
                    : "Active in Meteor"}
                </p>
              </div>
            </div>

            {/* Actions: Video Call & Details Modal */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Video Call Button */}
              <button
                type="button"
                onClick={startVideoCall}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800/80 hover:bg-violet-600/20 text-zinc-300 hover:text-violet-300 border border-zinc-700/50 hover:border-violet-500/40 transition-all text-xs font-semibold cursor-pointer"
                title="Start a video call"
              >
                <Video className="w-4 h-4 text-violet-400" />
                <span className="hidden sm:inline">Call</span>
              </button>

              {/* Info / Edit Dialog */}
              {selectedChat.isGroupChat ? (
                <Dialog>
                  <DialogTrigger asChild>
                    <button
                      type="button"
                      className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/50 transition-colors cursor-pointer"
                      title="Group Settings"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </DialogTrigger>

                  <DialogContent className="sm:max-w-md bg-zinc-900 border border-zinc-800 text-white rounded-2xl p-5">
                    <DialogHeader>
                      <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                        <Users className="w-5 h-5 text-violet-400" />
                        <span>Manage Hangout Group</span>
                      </DialogTitle>
                      <DialogDescription className="text-xs text-zinc-400">
                        Admin: {selectedChat.groupAdmin?.name || "Admin"}
                      </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col gap-4 mt-2">
                      {/* Rename group */}
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-zinc-400">
                          Group Name
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={groupChatName}
                            onChange={(e) => setGroupChatName(e.target.value)}
                            className="flex-1 h-9 px-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-xs focus:outline-none focus:border-violet-500"
                          />
                          <button
                            type="button"
                            disabled={groupActionLoading}
                            onClick={handleRenameGroup}
                            className="px-3 h-9 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                          >
                            Save
                          </button>
                        </div>
                      </div>

                      {/* Current members */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-zinc-400">
                          Members ({selectedChat.users?.length || 0})
                        </label>
                        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto custom-scrollbar p-2 rounded-xl bg-zinc-800/40 border border-zinc-800">
                          {selectedChat.users?.map((u) => (
                            <div
                              key={u._id}
                              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-xs text-zinc-200"
                            >
                              <img
                                src={u.pic || DEFAULT_AVATAR}
                                alt={u.name}
                                className="w-4 h-4 rounded-full object-cover"
                              />
                              <span className="truncate max-w-[100px]">
                                {u.name}
                                {u._id === selectedChat.groupAdmin?._id &&
                                  " (Admin)"}
                              </span>
                              {(selectedChat.groupAdmin?._id === user._id ||
                                u._id === user._id) && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveUserFromGroup(u)}
                                  className="text-zinc-400 hover:text-red-400"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Add new members */}
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-zinc-400">
                          Add Participants
                        </label>
                        <input
                          type="text"
                          value={search}
                          onChange={(e) => handleGroupSearch(e.target.value)}
                          placeholder="Search users to add..."
                          className="w-full h-9 px-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-violet-500"
                        />
                        {searchLoading ? (
                          <div className="py-2 text-center text-xs text-zinc-400">
                            Searching...
                          </div>
                        ) : searchResult.length > 0 ? (
                          <div className="flex flex-col gap-1 mt-1 max-h-28 overflow-y-auto custom-scrollbar">
                            {searchResult.map((u) => (
                              <div
                                key={u._id}
                                onClick={() => handleAddUserToGroup(u)}
                                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-between text-xs cursor-pointer text-zinc-200"
                              >
                                <span>{u.name}</span>
                                <span className="text-[10px] text-violet-400">
                                  + Add
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <DialogFooter className="mt-4 flex !justify-between">
                      <button
                        type="button"
                        onClick={() => handleRemoveUserFromGroup(user)}
                        className="px-3.5 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Leave Group</span>
                      </button>

                      <DialogClose asChild>
                        <button
                          type="button"
                          className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer"
                        >
                          Close
                        </button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              ) : (
                <Dialog>
                  <DialogTrigger asChild>
                    <button
                      type="button"
                      className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/50 transition-colors cursor-pointer"
                      title="User Details"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </DialogTrigger>

                  <DialogContent className="sm:max-w-sm bg-zinc-900 border border-zinc-800 text-white rounded-2xl p-6 text-center">
                    <DialogHeader>
                      <DialogTitle className="text-base font-bold text-white">
                        User Info
                      </DialogTitle>
                    </DialogHeader>

                    <div className="flex flex-col items-center mt-3">
                      <img
                        src={getImage(user, selectedChat.users)}
                        alt=""
                        className="w-20 h-20 rounded-full object-cover border-2 border-violet-500 shadow-md shadow-violet-500/20 mb-3"
                      />
                      <h3 className="text-base font-bold text-white">
                        {getSender(user, selectedChat.users)}
                      </h3>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {getEmail(user, selectedChat.users)}
                      </p>
                    </div>

                    <DialogFooter className="mt-5">
                      <DialogClose asChild>
                        <button
                          type="button"
                          className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer"
                        >
                          Close
                        </button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          {/* Messages Feed Area */}
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3 sm:p-4 space-y-2.5">
            {loadingMessages ? (
              <div className="h-full flex flex-col items-center justify-center gap-2 text-zinc-400">
                <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
                <span className="text-xs">Loading message history...</span>
              </div>
            ) : messages?.length > 0 ? (
              messages.map((m, i) => {
                const isMine = m.sender?._id === user._id;
                const prevMsg = i > 0 ? messages[i - 1] : null;
                const isSameSenderAsPrev = prevMsg?.sender?._id === m.sender?._id;
                const isCallLink =
                  typeof m.content === "string" &&
                  m.content.includes("vcalll.vercel.app");
                const isImage =
                  typeof m.content === "string" &&
                  (m.content.startsWith("https://res.cloudinary.com") ||
                    m.content.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i));

                return (
                  <div
                    key={m._id || i}
                    className={`flex flex-col ${
                      isMine ? "items-end" : "items-start"
                    } ${isSameSenderAsPrev ? "mt-1" : "mt-3"}`}
                  >
                    {/* Sender name for group chats if not mine */}
                    {!isMine && selectedChat.isGroupChat && !isSameSenderAsPrev && (
                      <span className="text-[10px] font-semibold text-violet-400 ml-11 mb-1">
                        {m.sender?.name}
                      </span>
                    )}

                    <div
                      className={`flex items-end gap-2 max-w-[85%] sm:max-w-[75%] ${
                        isMine ? "flex-row-reverse" : "flex-row"
                      }`}
                    >
                      {/* Avatar for other sender */}
                      {!isMine && (
                        <div className="w-8 h-8 shrink-0">
                          {!isSameSenderAsPrev ? (
                            <img
                              src={m.sender?.pic || DEFAULT_AVATAR}
                              alt=""
                              className="w-8 h-8 rounded-full object-cover border border-zinc-700"
                            />
                          ) : (
                            <div className="w-8" />
                          )}
                        </div>
                      )}

                      {/* Bubble Content */}
                      <div
                        className={`p-3 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm break-words ${
                          isMine
                            ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-tr-xs"
                            : "bg-zinc-800 text-zinc-100 border border-zinc-700/60 rounded-tl-xs"
                        }`}
                      >
                        {isImage ? (
                          <div className="relative overflow-hidden rounded-xl">
                            <img
                              src={m.content}
                              alt="Shared attachment"
                              className="max-h-72 max-w-full rounded-xl object-cover cursor-pointer hover:opacity-95 transition-opacity"
                              onClick={() => window.open(m.content, "_blank")}
                            />
                          </div>
                        ) : isCallLink ? (
                          <div className="flex flex-col gap-2 p-1">
                            <div className="flex items-center gap-2 text-violet-200">
                              <PhoneCall className="w-4 h-4 animate-pulse" />
                              <span className="font-semibold text-xs">
                                Video Hangout Room
                              </span>
                            </div>
                            <a
                              href={m.content}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-semibold transition-colors"
                            >
                              Join Call Now
                            </a>
                          </div>
                        ) : (
                          <span>{m.content}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500 gap-2">
                <Flame className="w-10 h-10 text-violet-500/50" />
                <p className="text-sm font-semibold text-zinc-300">
                  No messages here yet
                </p>
                <p className="text-xs text-zinc-500 max-w-xs">
                  Send a message or photo below to start the conversation!
                </p>
              </div>
            )}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex items-center gap-2 ml-10 text-xs text-zinc-400">
                <div className="flex gap-1 py-1 px-2.5 rounded-full bg-zinc-800 border border-zinc-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:0.4s]" />
                </div>
                <span className="text-[11px] text-zinc-500">typing...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Message Input Bar */}
          <div className="p-2.5 sm:p-3.5 border-t border-zinc-800 bg-zinc-900/90 shrink-0">
            <form
              onSubmit={sendMessage}
              className="flex items-center gap-1.5 sm:gap-2"
            >
              {/* File upload button */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                disabled={uploadingImage}
                onClick={() => fileInputRef.current?.click()}
                className="p-2 sm:p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-violet-400 border border-zinc-700/60 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                title="Send photo"
              >
                {uploadingImage ? (
                  <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
                ) : (
                  <ImageIcon className="w-5 h-5" />
                )}
              </button>

              {/* Message Input */}
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={newMessage}
                  onChange={typingHandler}
                  placeholder="Type a message..."
                  className="w-full h-11 px-4 rounded-xl bg-zinc-800/80 border border-zinc-700/60 text-white placeholder:text-zinc-500 text-xs sm:text-sm focus:outline-none focus:border-violet-500 transition-all"
                />
              </div>

              {/* Send Button */}
              <button
                type="submit"
                disabled={!newMessage.trim() || uploadingImage}
                className="h-11 px-3.5 sm:px-4 rounded-xl bg-violet-600 hover:bg-violet-500 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer shadow-md shadow-violet-600/25 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Send message"
              >
                <Send className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* Empty State on Desktop */
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-zinc-400">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 p-0.5 shadow-xl shadow-violet-600/20 mb-4 flex items-center justify-center">
            <div className="w-full h-full bg-zinc-950 rounded-[14px] flex items-center justify-center">
              <Flame className="w-8 h-8 text-violet-400" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-white">Welcome to Meteor</h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-sm">
            Select a conversation from the sidebar or click "Find People" to search and start a new chat.
          </p>
          <div className="mt-5 flex items-center gap-3 text-xs text-zinc-500">
            <span className="px-2.5 py-1 rounded-lg bg-zinc-800/80 border border-zinc-800">
              ⚡ Real-time Socket sync
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-zinc-800/80 border border-zinc-800">
              📹 1-Click Video Calls
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbox;
