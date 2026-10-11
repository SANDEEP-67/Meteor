const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");

const protect = asyncHandler(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const secret = process.env.JWT_SECRET || "sandeep-secret";
      const decoded = jwt.verify(token, secret);

      req.user = await User.findById(decoded.id).select("-password");
      if (!req.user) {
        return res
          .status(401)
          .json({ message: "Not authorized, user not found" });
      }
      return next();
    } catch (error) {
      console.error("Auth token verification error:", error.message);
      return res
        .status(401)
        .json({ message: "Not authorized, token invalid or expired" });
    }
  }

  return res
    .status(401)
    .json({ message: "Not authorized, no token provided" });
});

module.exports = protect;

