
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connect = require("./config/db");

const userRouter = require("./Routes/userRoute");
const chatRouter = require("./Routes/chatRoute");
const messageRouter = require("./Routes/messageRouter");

const app = express();

// Allow localhost on any port and configure deployed frontend URLs via .env
const allowedOrigins = (process.env.FRONTEND_URLS || "")
  .split(",")
  .map((url) => url.trim().replace(/\/$/, ""))
  .filter(Boolean);

const isAllowedOrigin = (origin) => {
  // Requests without an Origin header include curl and server-to-server calls.
  if (!origin) return true;

  const normalizedOrigin = origin.replace(/\/$/, "");

  // Local Vite/React development servers
  if (
    /^http:\/\/localhost:\d+$/.test(normalizedOrigin) ||
    /^http:\/\/127\.0\.0\.1:\d+$/.test(normalizedOrigin)
  ) {
    return true;
  }

  // Configured production and preview frontend URLs
  return allowedOrigins.includes(normalizedOrigin);
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// API routes
app.use("/api/user", userRouter);
app.use("/api/chat", chatRouter);
app.use("/api/message", messageRouter);

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend API is running!",
  });
});

// Connect database before accepting requests
const PORT = process.env.PORT || 8080;

async function startServer() {
  try {
    await connect();

    const server = app.listen(PORT, () => {
      console.log(`Backend running on port ${PORT}`);
    });

    const io = require("socket.io")(server, {
      pingTimeout: 60000,
      cors: corsOptions,
    });

    io.on("connection", (socket) => {
      console.log("Socket connected:", socket.id);

      socket.on("setup", (userData) => {
        if (!userData?._id) return;

        socket.join(String(userData._id));
        socket.emit("connected");
      });

      socket.on("join chat", (room) => {
        if (!room) return;
        socket.join(String(room));
      });

      socket.on("new message", (message) => {
        const chat = message?.chat;
        const senderId = message?.sender?._id;

        if (!chat?.users || !senderId) {
          console.warn("Invalid message: chat users or sender missing");
          return;
        }

        chat.users.forEach((user) => {
          const userId = String(user?._id || user);

          if (userId !== String(senderId)) {
            socket.to(userId).emit("message recieved", message);
          }
        });
      });

      socket.on("typing", (room) => {
        if (room) socket.to(String(room)).emit("typing");
      });

      socket.on("stop typing", (room) => {
        if (room) socket.to(String(room)).emit("stop typing");
      });

      socket.on("disconnect", () => {
        console.log("Socket disconnected:", socket.id);
      });
    });
  } catch (error) {
    console.error("Failed to start backend:", error.message);
    process.exit(1);
  }
}

startServer();
