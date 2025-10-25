const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

const generateToken = (payload, expiresIn = "20d") => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

module.exports = generateToken;
