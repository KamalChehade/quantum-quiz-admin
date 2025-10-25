const { Admin } = require("../models"); // Import Admin model from your Sequelize index.js
const ExpressError = require("../utils/expressError");
const { comparePassword } = require("../utils/passwordUtils");
const generateToken = require("../utils/generateToken");

const authService = {
  /**
   * Login service for Admins
   * @param {Object} credentials
   * @param {string} credentials.username
   * @param {string} credentials.password
   */
  login: async ({ username, password }) => {
    if (!username) {
      throw new ExpressError("Please provide a username.", 400);
    }
    if (!password) {
      throw new ExpressError("Please provide a password.", 400);
    }

    // 🔍 Find admin by username
    const admin = await Admin.findOne({ where: { username } });
    if (!admin) {
      throw new ExpressError("Invalid username or password.", 401);
    }

    // 🔐 Compare password (using bcrypt)
    const isPasswordValid = await comparePassword(password, admin.password);
    if (!isPasswordValid) {
      throw new ExpressError("Invalid username or password.", 401);
    }

    // 🪪 Generate JWT token
    const token = generateToken({
      id: admin.id,
      username: admin.username,
      role: "admin",
    });

    return {
      message: "Login successful",
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        created_at: admin.created_at,
      },
    };
  },
};

module.exports = authService;
