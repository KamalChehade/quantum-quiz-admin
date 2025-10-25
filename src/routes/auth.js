const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth");
const asyncHandler = require("express-async-handler");
// validateRequest middleware requires a Joi schema; not used for signin here
 
 
// ✅ Signin
router.post("/signin", asyncHandler(authController.login));
 

module.exports = router;
