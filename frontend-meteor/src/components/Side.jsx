import React, { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Search,
  Bell,
  ChevronDown,
  X,
  LogOut,
  User as UserIcon,
  Flame,
  MessageCircle,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { Context } from "../context/ChatContext";
import API_URL from "../config/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Side = () => {
  const {
    user,
    setSelectedChat,
    chats,
    setChats,
    notification,
    setNotification,
  } = useContext(Context);

  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("info");
    navigate("/");
  };

  const handleSearchQuery = async (queryText) => {
    const trimmed = (queryText !== undefined ? queryText : search).trim();
    if (!trimmed) {
      setSearchResult([]);
      setLoading(false);
      return;
    }

    if (!user?.token) return;

    setLoading(true);
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.get(
        `${API_URL}/api/user?search=${encodeURIComponent(trimmed)}`,
        config
      );

      setSearchResult(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Search failed:", error);
      setSearchResult([]);
    } finally {
      setLoading(false);
    }
  };

  // Search live as user types with smooth 250ms debounce
  useEffect(() => {
    const trimmed = search.trim();
    if (!trimmed) {
      setSearchResult([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      handleSearchQuery(trimmed);
    }, 250);

    return () => clearTimeout(timer);
  }, [search, user?.token]);

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    handleSearchQuery(search);
  };

  const getSender = (loggedUser, users = []) => {
    if (!loggedUser?._id || !users.length) return "Someone";
    const sender = users.find(
      (person) => String(person?._id) !== String(loggedUser._id)
    );
    return sender?.name || "Someone";
  };

  const accessChat = async (userId) => {
    if (!user?.token) return;

    setActionLoadingId(userId);
    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.post(
        `${API_URL}/api/chat`,
        { userId },
        config
      );

      closeSearch();

      if (!chats.some((chat) => chat._id === data._id)) {
        setChats([data, ...chats]);
      }

      setSelectedChat(data);
    } catch (error) {
      console.error("Unable to access chat:", error);
      alert(
        error.response?.data?.message ||
          "Unable to start conversation. Please try again."
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearch("");
    setSearchResult([]);
    setLoading(false);
  };

  const clearAllNotifications = () => {
    setNotification([]);
  };

  return (
    <>
      {/* Top Navbar */}
      <div className="w-full h-14 sm:h-16 px-3 sm:px-6 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800/80 flex items-center justify-between text-white select-none">
        {/* Left: Search Trigger */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-zinc-800/90 hover:bg-zinc-800 border border-zinc-700/60 text-zinc-300 hover:text-white transition-all text-xs sm:text-sm cursor-pointer shadow-sm group"
            aria-label="Search users"
          >
            <Search className="w-4 h-4 text-zinc-400 group-hover:text-violet-400 transition-colors" />
            <span className="hidden sm:inline font-medium">Find People</span>
            <span className="hidden md:inline px-1.5 py-0.5 rounded text-[10px] bg-zinc-700/60 text-zinc-400 font-mono">
              Search
            </span>
          </button>
        </div>

        {/* Center: Brand */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 p-0.5 flex items-center justify-center shadow-md shadow-violet-600/30">
            <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center">
              <Flame className="w-4 h-4 text-violet-400" />
            </div>
          </div>
          <span className="font-extrabold tracking-wider text-base sm:text-lg bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            METEOR
          </span>
        </div>

        {/* Right: Notifications & Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notifications Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={`Notifications: ${notification?.length || 0}`}
                className="relative p-2 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/40 text-zinc-300 hover:text-white transition-all cursor-pointer"
              >
                <Bell className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                {notification?.length > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-violet-600 text-white font-bold text-[10px] flex items-center justify-center px-1 shadow-md shadow-violet-600/50 animate-pulse">
                    {notification.length}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-80 p-2 bg-zinc-900 border border-zinc-800 shadow-2xl rounded-2xl text-white"
            >
              <div className="flex items-center justify-between px-2 py-1.5">
                <DropdownMenuLabel className="font-bold text-sm text-zinc-200 p-0">
                  Notifications
                </DropdownMenuLabel>
                {notification?.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAllNotifications}
                    className="text-[11px] text-zinc-400 hover:text-violet-400 transition-colors cursor-pointer"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <DropdownMenuSeparator className="bg-zinc-800 my-1" />

              <div className="max-h-72 overflow-y-auto custom-scrollbar flex flex-col gap-1">
                {!notification?.length ? (
                  <div className="py-6 text-center text-xs text-zinc-500">
                    No new messages
                  </div>
                ) : (
                  notification.map((item, index) => {
                    const isGroup = item.chat?.isGroupChat;
                    const senderName = isGroup
                      ? item.chat.chatName
                      : getSender(user, item.chat?.users);

                    return (
                      <DropdownMenuItem
                        key={item._id || `${item.chat?._id}-${index}`}
                        className="p-2.5 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 text-zinc-200 hover:text-white cursor-pointer transition-colors border border-transparent hover:border-zinc-700/50"
                        onSelect={() => {
                          setSelectedChat(item.chat);
                          setNotification((prev) =>
                            prev.filter((entry) => entry !== item)
                          );
                        }}
                      >
                        <div className="flex items-start gap-2.5 w-full">
                          <div className="w-8 h-8 rounded-full bg-violet-600/20 text-violet-400 flex items-center justify-center shrink-0 mt-0.5">
                            <MessageCircle className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate text-zinc-200">
                              {senderName}
                            </p>
                            <p className="text-[11px] text-zinc-400 truncate">
                              {item.content?.startsWith("http")
                                ? "Shared a link or image"
                                : item.content || "New message"}
                            </p>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    );
                  })
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Account Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/40 text-white transition-all cursor-pointer"
                aria-label="Account options"
              >
                <img
                  src={
                    user?.pic ||
                    "https://img.freepik.com/premium-vector/user-profile-icon-flat-style-member-avatar-vector-illustration-isolated-background-human-permission-sign-business-concept_157943-15752.jpg?semt=ais_hybrid&w=740"
                  }
                  alt={user?.name || "Avatar"}
                  className="w-7 h-7 rounded-full object-cover border border-zinc-700 shrink-0"
                />
                <span className="hidden sm:inline text-xs font-medium max-w-[100px] truncate">
                  {user?.name || "User"}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-52 p-1.5 bg-zinc-900 border border-zinc-800 shadow-2xl rounded-2xl text-white"
            >
              <div className="px-3 py-2">
                <p className="text-xs font-semibold text-white truncate">
                  {user?.name}
                </p>
                <p className="text-[11px] text-zinc-400 truncate">
                  {user?.email}
                </p>
              </div>
              <DropdownMenuSeparator className="bg-zinc-800 my-1" />

              <DropdownMenuItem
                className="flex items-center gap-2 p-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 cursor-pointer transition-colors"
                onSelect={() => setProfileOpen(true)}
              >
                <UserIcon className="w-4 h-4 text-violet-400" />
                <span>My Profile</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-zinc-800 my-1" />

              <DropdownMenuItem
                className="flex items-center gap-2 p-2 rounded-xl text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer transition-colors"
                onSelect={logout}
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Profile Modal */}
      {profileOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150"
          onClick={() => setProfileOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-sm rounded-2xl glass-panel p-6 shadow-2xl relative border border-zinc-700/60 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setProfileOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              aria-label="Close profile"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-5">User Profile</h2>

            <div className="relative w-24 h-24 mx-auto mb-4">
              <img
                src={
                  user?.pic ||
                  "https://img.freepik.com/premium-vector/user-profile-icon-flat-style-member-avatar-vector-illustration-isolated-background-human-permission-sign-business-concept_157943-15752.jpg?semt=ais_hybrid&w=740"
                }
                alt={user?.name || "Profile"}
                className="w-24 h-24 rounded-full object-cover border-2 border-violet-500 shadow-lg shadow-violet-500/20"
              />
              <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-zinc-950" />
            </div>

            <h3 className="text-lg font-bold text-white break-words">
              {user?.name || "Meteor User"}
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5 break-all">
              {user?.email || "No email available"}
            </p>

            <div className="mt-5 p-3 rounded-xl bg-zinc-800/50 border border-zinc-700/40 text-xs text-zinc-400 flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Status: Active on Meteor</span>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={() => setProfileOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors cursor-pointer"
              >
                Done
              </button>
              <button
                type="button"
                onClick={logout}
                className="px-4 py-2.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 text-xs font-semibold transition-colors cursor-pointer"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-in User Search Drawer / Panel */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 flex bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={closeSearch}
        >
          <div
            className="w-full max-w-md h-full bg-zinc-900 border-r border-zinc-800 shadow-2xl flex flex-col p-4 sm:p-5 relative animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-violet-400" />
                <h2 className="font-bold text-base text-white">Find People</h2>
              </div>
              <button
                type="button"
                onClick={closeSearch}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                aria-label="Close search"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input Form */}
            <form onSubmit={handleSearch} className="my-4 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or email..."
                  autoFocus
                  className="w-full h-11 pl-10 pr-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-500 text-xs sm:text-sm focus:outline-none focus:border-violet-500 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !search.trim()}
                className="px-4 h-11 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shrink-0"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
              </button>
            </form>

            {/* Search Results Feed */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar flex flex-col gap-2">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2 text-zinc-400">
                  <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
                  <span className="text-xs">Searching users...</span>
                </div>
              ) : searchResult.length > 0 ? (
                searchResult.map((person) => (
                  <div
                    key={person._id}
                    className="p-3 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/40 flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={
                          person.pic ||
                          "https://img.freepik.com/premium-vector/user-profile-icon-flat-style-member-avatar-vector-illustration-isolated-background-human-permission-sign-business-concept_157943-15752.jpg?semt=ais_hybrid&w=740"
                        }
                        alt={person.name}
                        className="w-10 h-10 rounded-full object-cover border border-zinc-700 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-white truncate">
                          {person.name}
                        </p>
                        <p className="text-[11px] text-zinc-400 truncate">
                          {person.email}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={actionLoadingId === person._id}
                      onClick={() => accessChat(person._id)}
                      className="px-3.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-all cursor-pointer shrink-0 disabled:opacity-50"
                    >
                      {actionLoadingId === person._id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        "Message"
                      )}
                    </button>
                  </div>
                ))
              ) : search.trim() ? (
                <div className="text-center py-16 text-zinc-500 text-xs">
                  No users found for "{search}".
                </div>
              ) : (
                <div className="text-center py-16 text-zinc-500 text-xs flex flex-col items-center gap-2">
                  <UserIcon className="w-8 h-8 text-zinc-600" />
                  <span>Type a name or email to find people.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Side;
