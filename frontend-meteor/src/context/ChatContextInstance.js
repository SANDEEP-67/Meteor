import { createContext, useContext } from "react";

export const Context = createContext(null);

export const useChat = () => {
  const ctx = useContext(Context);
  if (!ctx) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return ctx;
};

export default Context;
