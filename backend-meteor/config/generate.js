const jwt = require("jsonwebtoken");

// This function generates a JWT token for a user based on their ID
// The token is signed with a secret key and has an expiration time of 30 days
const generate = (id) => {
  const secret = process.env.JWT_SECRET || "sandeep-secret";
  return jwt.sign({ id }, secret, { expiresIn: "30d" });
};

module.exports = generate;

