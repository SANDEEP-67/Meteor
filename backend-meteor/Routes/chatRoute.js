
const express = require("express");
const protect = require("../middleware/authMiddleware");

const {
  accessChat,
  fetchChats,
  createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,
} = require("../controller/chatController");

const chatrouter = express.Router();

// Access or create a one-to-one chat
chatrouter.route("/")
  .post(protect, accessChat)
  .get(protect, fetchChats);

// Create a group chat
chatrouter.route("/group")
  .post(protect, createGroupChat);

// Rename a group
chatrouter.route("/rename")
  .put(protect, renameGroup);

// Add a user to a group
chatrouter.route("/groupadd")
  .put(protect, addToGroup);

// Remove a user from a group
chatrouter.route("/groupremove")
  .put(protect, removeFromGroup);

module.exports = chatrouter;
