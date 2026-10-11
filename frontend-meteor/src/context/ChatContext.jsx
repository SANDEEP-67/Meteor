import React, { useState, useEffect } from "react";
import { Context } from "./ChatContextInstance";

export const ChatProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("info");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [selectedChat, setSelectedChat] = useState(null);
  const [chats, setChats] = useState([]);
  const [notification, setNotification] = useState([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("info");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (JSON.stringify(parsed) !== JSON.stringify(user)) {
          setUser(parsed);
        }
      }
    } catch (e) {
      console.error("Error reading localStorage:", e);
    }
  }, [user]);

  return (
    <Context.Provider
      value={{
        user,
        setUser,
        selectedChat,
        setSelectedChat,
        chats,
        setChats,
        notification,
        setNotification,
      }}
    >
      {children}
    </Context.Provider>
  );
};

export default ChatProvider;
