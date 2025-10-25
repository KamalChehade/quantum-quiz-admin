const express = require("express");
const router = express.Router();

// Import and attach sub-routes
router.use("/auth", require("./auth"));
router.use("/questions", require("./questionRoutes"));
router.use('/session', require('./sessionRoutes'));
router.use('/participant', require('./participantRoutes'));
router.use('/leaderboard', require('./leaderboardRoutes'));
router.use('/game-leaderboard', require('./gameLeaderboardRoutes'));
 
module.exports = router;