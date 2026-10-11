
const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const Chat = require("../models/chatModel");
const User = require("../models/userModel");

// @description  Access or create a one-to-one chat
// @route        POST /api/chat
// @access       Protected
const accessChat = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({
      message: "User ID is required",
    });
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({
      message: "Invalid user ID",
    });
  }

  if (String(userId) === String(req.user._id)) {
    return res.status(400).json({
      message: "You cannot create a chat with yourself",
    });
  }

  const targetUser = await User.findById(userId).select("_id");

  if (!targetUser) {
    return res.status(404).json({
      message: "User not found",
    });
  }

  let chat = await Chat.findOne({
    isGroupChat: false,
    users: {
      $all: [req.user._id, targetUser._id],
      $size: 2,
    },
  })
    .populate("users", "-password")
    .populate("latestMessage");

  if (chat) {
    chat = await User.populate(chat, {
      path: "latestMessage.sender",
      select: "name pic email",
    });

    return res.status(200).json(chat);
  }

  const createdChat = await Chat.create({
    chatName: "sender",
    isGroupChat: false,
    users: [req.user._id, targetUser._id],
  });

  const fullChat = await Chat.findById(createdChat._id)
    .populate("users", "-password")
    .populate("latestMessage");

  return res.status(201).json(fullChat);
});

// @description  Fetch all chats for the logged-in user
// @route        GET /api/chat
// @access       Protected
const fetchChats = asyncHandler(async (req, res) => {
  const chats = await Chat.find({
    users: req.user._id,
  })
    .populate("users", "-password")
    .populate("groupAdmin", "-password")
    .populate({
      path: "latestMessage",
      populate: {
        path: "sender",
        select: "name pic email",
      },
    })
    .sort({ updatedAt: -1 });

  return res.status(200).json(chats);
});

// @description  Create a group chat
// @route        POST /api/chat/group
// @access       Protected
const createGroupChat = asyncHandler(async (req, res) => {
  const { name } = req.body;
  let { users } = req.body;

  // Validate group name
  if (typeof name !== "string" || !name.trim()) {
    return res.status(400).json({
      message: "Group name is required",
    });
  }

  // Support either an array or a JSON-stringified array
  if (typeof users === "string") {
    try {
      users = JSON.parse(users);
    } catch {
      return res.status(400).json({
        message: "Invalid users format",
      });
    }
  }

  if (!Array.isArray(users)) {
    return res.status(400).json({
      message: "Users must be an array",
    });
  }

  // Accept either user IDs or user objects
  users = users
    .map((user) => user?._id ?? user)
    .filter((id) => id != null)
    .map(String);

  // Remove duplicate IDs
  users = [...new Set(users)];

  // The existing app logic expects at least two other users
  if (users.length < 2) {
    return res.status(400).json({
      message: "Select at least 2 other users to create a group",
    });
  }

  // Validate all IDs before querying MongoDB
  const invalidId = users.some(
    (id) => !mongoose.Types.ObjectId.isValid(id)
  );

  if (invalidId) {
    return res.status(400).json({
      message: "One or more user IDs are invalid",
    });
  }

  // Prevent the current user from being counted as a selected user
  const currentUserId = String(req.user._id);

  users = users.filter((id) => id !== currentUserId);

  if (users.length < 2) {
    return res.status(400).json({
      message: "Select at least 2 other users to create a group",
    });
  }

  // Add the authenticated user to the group
  users.push(currentUserId);

  // Confirm that every selected user exists
  const existingUsers = await User.find({
    _id: { $in: users },
  }).select("_id");

  if (existingUsers.length !== users.length) {
    return res.status(400).json({
      message: "One or more selected users do not exist",
    });
  }

  // Create the group
  const createdChat = await Chat.create({
    chatName: name.trim(),
    users,
    isGroupChat: true,
    groupAdmin: req.user._id,
  });

  // Return the populated group to the frontend
  const fullGroupChat = await Chat.findById(createdChat._id)
    .populate("users", "-password")
    .populate("groupAdmin", "-password")
    .populate("latestMessage");

  return res.status(201).json(fullGroupChat);
});

// @description  Rename a group chat
// @route        PUT /api/chat/rename
// @access       Protected
const renameGroup = asyncHandler(async (req, res) => {
  const { chatId, chatName } = req.body;

  if (!chatId || !mongoose.Types.ObjectId.isValid(chatId)) {
    return res.status(400).json({
      message: "A valid chat ID is required",
    });
  }

  if (typeof chatName !== "string" || !chatName.trim()) {
    return res.status(400).json({
      message: "Group name is required",
    });
  }

  const chat = await Chat.findById(chatId);

  if (!chat) {
    return res.status(404).json({
      message: "Chat not found",
    });
  }

  if (!chat.isGroupChat) {
    return res.status(400).json({
      message: "This chat is not a group",
    });
  }

  if (String(chat.groupAdmin) !== String(req.user._id)) {
    return res.status(403).json({
      message: "Only the group admin can rename this group",
    });
  }

  chat.chatName = chatName.trim();

  const updatedChat = await chat.save();

  const populatedChat = await Chat.findById(updatedChat._id)
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  return res.status(200).json(populatedChat);
});

// @description  Add users to a group
// @route        PUT /api/chat/groupadd
// @access       Protected
const addToGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;

  if (
    !chatId ||
    !mongoose.Types.ObjectId.isValid(chatId) ||
    !userId ||
    !mongoose.Types.ObjectId.isValid(userId)
  ) {
    return res.status(400).json({
      message: "Valid chat ID and user ID are required",
    });
  }

  const chat = await Chat.findById(chatId);

  if (!chat) {
    return res.status(404).json({
      message: "Chat not found",
    });
  }

  if (!chat.isGroupChat) {
    return res.status(400).json({
      message: "This chat is not a group",
    });
  }

  if (String(chat.groupAdmin) !== String(req.user._id)) {
    return res.status(403).json({
      message: "Only the group admin can add members",
    });
  }

  const userExists = await User.findById(userId).select("_id");

  if (!userExists) {
    return res.status(404).json({
      message: "User not found",
    });
  }

  if (chat.users.some((id) => String(id) === String(userId))) {
    return res.status(400).json({
      message: "User is already in this group",
    });
  }

  chat.users.push(userId);
  await chat.save();

  const updatedChat = await Chat.findById(chat._id)
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  return res.status(200).json(updatedChat);
});

// @description  Remove a user from a group
// @route        PUT /api/chat/groupremove
// @access       Protected
const removeFromGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;

  if (
    !chatId ||
    !mongoose.Types.ObjectId.isValid(chatId) ||
    !userId ||
    !mongoose.Types.ObjectId.isValid(userId)
  ) {
    return res.status(400).json({
      message: "Valid chat ID and user ID are required",
    });
  }

  const chat = await Chat.findById(chatId);

  if (!chat) {
    return res.status(404).json({
      message: "Chat not found",
    });
  }

  if (!chat.isGroupChat) {
    return res.status(400).json({
      message: "This chat is not a group",
    });
  }

  const isAdmin = String(chat.groupAdmin) === String(req.user._id);
  const isRemovingSelf = String(userId) === String(req.user._id);

  if (!isAdmin && !isRemovingSelf) {
    return res.status(403).json({
      message: "Only the group admin can remove other members",
    });
  }

  if (!chat.users.some((id) => String(id) === String(userId))) {
    return res.status(404).json({
      message: "User is not in this group",
    });
  }

  // Transfer admin role if the admin leaves
  if (String(chat.groupAdmin) === String(userId)) {
    const replacementAdmin = chat.users.find(
      (id) => String(id) !== String(userId)
    );

    chat.groupAdmin = replacementAdmin ?? null;
  }

  chat.users = chat.users.filter(
    (id) => String(id) !== String(userId)
  );

  await chat.save();

  const updatedChat = await Chat.findById(chat._id)
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  return res.status(200).json(updatedChat);
});

module.exports = {
  accessChat,
  fetchChats,
  createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,
};
