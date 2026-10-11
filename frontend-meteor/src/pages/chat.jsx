import React, { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Context } from "../context/ChatContext";
import Side from "../components/Side";
import Chats from "../components/Chats";
import Chatbox from "../components/Chatbox";

const Chat = () => {
  const { user, setUser } = useContext(Context);
  const [fetchAgain, setFetchAgain] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const stored = localStorage.getItem("info");
      if (!stored) {
        navigate("/");
        return;
      }
      const parsed = JSON.parse(stored);
      if (!parsed?.token) {
        navigate("/");
        return;
      }
      if (!user) {
        setUser(parsed);
      }
    } catch (e) {
      console.error("Auth check error:", e);
      navigate("/");
    }
  }, [navigate, setUser, user]);

  if (!user) {
    return (
      <div className="h-[100dvh] w-full bg-zinc-950 flex flex-col items-center justify-center text-zinc-400 gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
        <span className="text-sm">Loading your chats...</span>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-full bg-zinc-950 text-white flex flex-col overflow-hidden">
      {/* Top Navigation & App Bar */}
      <header className="shrink-0 z-30">
        <Side />
      </header>

      {/* Main Chat Workspace */}
      <main className="flex-1 min-h-0 flex gap-2 sm:gap-3 p-1.5 sm:p-3 overflow-hidden">
        <Chats fetchAgain={fetchAgain} setFetchAgain={setFetchAgain} />
        <Chatbox fetchAgain={fetchAgain} setFetchAgain={setFetchAgain} />
      </main>
    </div>
  );
};

export default Chat;
