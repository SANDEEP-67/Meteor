import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./App.css";
import App from "./App.jsx";
import Home from "./pages/home.jsx";
import Chat from "./pages/chat.jsx";
import { ChatProvider, Context } from "./context/ChatContext.jsx";

import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";

const router = createBrowserRouter([
  { path: "/", element: <Home /> },
  { path: "/chat", element: <Chat /> },
  { path: "/main", element: <App /> },
  { path: "*", element: <Navigate to="/" replace /> },
]);

export { Context };

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ChatProvider>
      <RouterProvider router={router} />
    </ChatProvider>
  </React.StrictMode>
);
