import React, { useContext, useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import {
  Users,
  Plus,
  Search,
  MessageSquarePlus,
  X,
  Loader2,
  Sparkles,
  Check,
} from "lucide-react";
import { Context } from "../context/ChatContext";
import API_URL from "../config/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const DEFAULT_AVATAR =
  "https://img.freepik.com/premium-vector/user-profile-icon-flat-style-member-avatar-vector-illustration-isolated-background-human-permission-sign-business-concept_157943-15752.jpg?semt=ais_hybrid&w=740";

const Chats = ({ fetchAgain }) => {
  const { user, selectedChat, setSelectedChat, chats, setChats } =
    useContext(Context);

  const [loggedUser, setLoggedUser] = useState(null);
  const [filterQuery, setFilterQuery] = useState("");

  // Group modal state
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [groupChatName, setGroupChatName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [groupError, setGroupError] = useState("");

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

  const fetchChats = useCallback(async () => {
    if (!user?.token) return;
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.get(`${API_URL}/api/chat`, config);
      if (Array.isArray(data)) {
        setChats(data);
      }
    } catch (err) {
      console.error("Failed to fetch chats:", err);
    }
  }, [user, setChats]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("info");
      if (stored) {
        setLoggedUser(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }
    fetchChats();
  }, [fetchAgain, fetchChats]);

  // Search people to add into group
  const handleSearch = async (query) => {
    setSearch(query);
    if (!query.trim()) {
      setSearchResult([]);
      return;
    }

    if (!user?.token) return;

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
      console.error("Group member search failed:", e);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAddUserToGroup = (u) => {
    if (selectedUsers.some((sel) => sel._id === u._id)) {
      return;
    }
    setSelectedUsers([...selectedUsers, u]);
  };

  const handleRemoveUserFromGroup = (u) => {
    setSelectedUsers(selectedUsers.filter((usr) => usr._id !== u._id));
  };

  const handleCreateGroup = async () => {
    setGroupError("");
    if (!groupChatName.trim()) {
      setGroupError("Please specify a group name.");
      return;
    }
    if (selectedUsers.length < 2) {
      setGroupError("Please add at least 2 other members to create a group.");
      return;
    }

    try {
      setCreateLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.post(
        `${API_URL}/api/chat/group`,
        {
          name: groupChatName.trim(),
          users: JSON.stringify(selectedUsers.map((u) => u._id)),
        },
        config
      );

      setChats([data, ...chats]);
      setSelectedChat(data);
      setGroupDialogOpen(false);
      setGroupChatName("");
      setSelectedUsers([]);
      setSearch("");
      setSearchResult([]);
    } catch (error) {
      console.error("Failed to create group:", error);
      setGroupError(
        error.response?.data?.message || "Failed to create group chat."
      );
    } finally {
      setCreateLoading(false);
    }
  };

  // Filtered chats list
  const filteredChats = useMemo(() => {
    if (!filterQuery.trim()) return chats;
    const q = filterQuery.toLowerCase();
    return chats.filter((c) => {
      if (c.isGroupChat) {
        return c.chatName?.toLowerCase().includes(q);
      }
      const otherName = getSender(loggedUser || user, c.users)?.toLowerCase();
      const otherEmail = getEmail(loggedUser || user, c.users)?.toLowerCase();
      return otherName?.includes(q) || otherEmail?.includes(q);
    });
  }, [chats, filterQuery, loggedUser, user]);

  return (
    <div
      className={`${
        selectedChat ? "hidden md:flex" : "flex"
      } flex-col w-full md:w-[320px] lg:w-[360px] xl:w-[380px] shrink-0 bg-zinc-900/95 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl text-white`}
    >
      {/* Top Header of Chats list */}
      <div className="p-3.5 sm:p-4 border-b border-zinc-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
            Conversations
          </h2>
          {chats?.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700/60 text-zinc-400 font-semibold text-[11px]">
              {chats.length}
            </span>
          )}
        </div>

        {/* Create Group Chat Dialog */}
        <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
          <DialogTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-md shadow-violet-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Group</span>
            </button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-md bg-zinc-900 border border-zinc-800 text-white rounded-2xl p-5">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-violet-400" />
                <span>Create Hangout Group</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-400">
                Hangout zones allow multiple friends to message and start group video calls together.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3.5 mt-2">
              {groupError && (
                <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
                  {groupError}
                </div>
              )}

              {/* Group name input */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-zinc-300">
                  Group Name
                </label>
                <input
                  type="text"
                  value={groupChatName}
                  onChange={(e) => setGroupChatName(e.target.value)}
                  placeholder="e.g., Code & Coffee, Gaming Squad"
                  className="w-full h-10 px-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-xs sm:text-sm placeholder:text-zinc-500 focus:outline-none focus:border-violet-500"
                />
              </div>

              {/* Add participants search input */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-zinc-300">
                  Add Members (min. 2)
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search by name or email..."
                    className="w-full h-10 pl-9 pr-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-xs sm:text-sm placeholder:text-zinc-500 focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              {/* Selected User Badges */}
              {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-zinc-800/40 border border-zinc-800 max-h-24 overflow-y-auto custom-scrollbar">
                  {selectedUsers.map((u) => (
                    <div
                      key={u._id}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-600/30 border border-violet-500/40 text-violet-200 text-xs"
                    >
                      <span className="truncate max-w-[120px]">{u.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveUserFromGroup(u)}
                        className="text-violet-300 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Search Suggestions */}
              {searchLoading ? (
                <div className="flex items-center justify-center py-4 text-xs text-zinc-400 gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                  <span>Searching users...</span>
                </div>
              ) : searchResult.length > 0 ? (
                <div className="flex flex-col gap-1 max-h-40 overflow-y-auto custom-scrollbar">
                  {searchResult.map((u) => {
                    const isSelected = selectedUsers.some(
                      (sel) => sel._id === u._id
                    );
                    return (
                      <div
                        key={u._id}
                        onClick={() =>
                          isSelected
                            ? handleRemoveUserFromGroup(u)
                            : handleAddUserToGroup(u)
                        }
                        className={`p-2 rounded-xl flex items-center justify-between gap-2 text-xs cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-violet-600/20 text-white border border-violet-500/40"
                            : "bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={u.pic || DEFAULT_AVATAR}
                            alt={u.name}
                            className="w-7 h-7 rounded-full object-cover shrink-0"
                          />
                          <div className="truncate">
                            <span className="font-semibold block truncate">
                              {u.name}
                            </span>
                            <span className="text-[10px] text-zinc-400 block truncate">
                              {u.email}
                            </span>
                          </div>
                        </div>

                        {isSelected ? (
                          <span className="p-1 rounded-md bg-violet-600 text-white shrink-0">
                            <Check className="w-3 h-3" />
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-zinc-700 text-zinc-300 text-[10px] shrink-0">
                            Add
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : null}

              {/* Action Button */}
              <button
                type="button"
                disabled={createLoading}
                onClick={handleCreateGroup}
                className="w-full mt-2 h-10 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-violet-600/20 disabled:opacity-50"
              >
                {createLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating Group...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Create Zone</span>
                  </>
                )}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter / Search inside existing chats */}
      <div className="px-3 pt-3 pb-2 shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full h-9 pl-9 pr-3 rounded-xl bg-zinc-800/60 border border-zinc-700/50 text-white placeholder:text-zinc-500 text-xs focus:outline-none focus:border-violet-500 transition-all"
          />
          {filterQuery && (
            <button
              type="button"
              onClick={() => setFilterQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-2 space-y-1.5">
        {filteredChats?.length > 0 ? (
          filteredChats.map((c) => {
            const isSelected = selectedChat?._id === c._id;
            const isGroup = c.isGroupChat;
            const chatTitle = isGroup
              ? c.chatName
              : getSender(loggedUser || user, c.users);
            const chatSubtitle = isGroup
              ? `${c.users?.length || 0} members`
              : getEmail(loggedUser || user, c.users);
            const chatPic = isGroup
              ? null
              : getImage(loggedUser || user, c.users);

            return (
              <div
                key={c._id}
                onClick={() => setSelectedChat(c)}
                className={`p-3 rounded-xl flex items-center gap-3 cursor-pointer transition-all border ${
                  isSelected
                    ? "bg-violet-600/20 border-violet-500/50 text-white shadow-md shadow-violet-600/10"
                    : "bg-zinc-800/40 hover:bg-zinc-800/80 border-transparent hover:border-zinc-700/50 text-zinc-200"
                }`}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  {isGroup ? (
                    <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
                      <Users className="w-5 h-5" />
                    </div>
                  ) : (
                    <img
                      src={chatPic || DEFAULT_AVATAR}
                      alt={chatTitle}
                      className="w-11 h-11 rounded-full object-cover border border-zinc-700 shadow-sm"
                    />
                  )}
                  {isSelected && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-violet-400 border-2 border-zinc-900" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs sm:text-sm font-bold truncate text-white">
                      {chatTitle}
                    </p>
                    {isGroup && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/30 uppercase tracking-wider shrink-0">
                        Group
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                    {c.latestMessage?.content || chatSubtitle}
                  </p>
                </div>
              </div>
            );
          })
        ) : filterQuery ? (
          <div className="text-center py-12 text-zinc-500 text-xs">
            No chats matching "{filterQuery}"
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center text-zinc-500 gap-2">
            <MessageSquarePlus className="w-8 h-8 text-zinc-600" />
            <p className="text-xs font-medium text-zinc-400">
              No conversations yet
            </p>
            <p className="text-[11px] text-zinc-500 max-w-[200px]">
              Click "Find People" in the top bar to start chatting with anyone.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chats;
