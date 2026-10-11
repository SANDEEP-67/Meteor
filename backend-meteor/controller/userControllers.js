const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const generate = require("../config/generate");
const asyncHandler = require("express-async-handler");

// Function to find user and compare password
const findUser = async (user, password) => {
  if (!user || !user.password) return false;
  return bcrypt.compare(password, user.password);
};

// Function to register a new user
// It checks if the user already exists, hashes the password, and creates a new user in the database
// If successful, it returns the user details along with a generated token
const register = asyncHandler(async (req, res) => {
  const { name, email, pwd, pic } = req.body;

  if (!name || !email || !pwd) {
    return res.status(400).json({ message: "Please Enter all the fields" });
  }

  const userExists = await User.findOne({ email: email.toLowerCase() });
  if (userExists) {
    return res.status(400).json({ message: "User already exists with this email" });
  }

  // Hash the password using bcrypt
  const salt = await bcrypt.genSalt(10);
  const password = await bcrypt.hash(pwd, salt);

  try {
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      pic,
    });

    if (user) {
      return res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        pic: user.pic,
        token: generate(user._id),
      });
    } else {
      return res.status(400).json({ message: "Failed to create user" });
    }
  } catch (error) {
    console.error("User registration error:", error.message);
    return res.status(500).json({ message: error.message || "Server error" });
  }
});

// Function to log in a user
// It checks if the user exists, compares the provided password with the stored hashed password
const login = asyncHandler(async (req, res) => {
  const { email, pwd } = req.body;
  if (!email || !pwd) {
    return res.status(400).json({ message: "Please Enter all the fields" });
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const passwordMatch = await bcrypt.compare(pwd, user.password);
  if (!passwordMatch) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  return res.status(200).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    pic: user.pic,
    token: generate(user._id),
  });
});

// /user/ GET - search users by name or email
const allUser = asyncHandler(async (req, res) => {
  const search = req.query.search ? req.query.search.trim() : "";
  const q = search
    ? {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      }
    : {};

  const users = await User.find(q)
    .find({ _id: { $ne: req.user._id } })
    .select("-password");

  res.status(200).json(users);
});

module.exports = { register, login, allUser };

