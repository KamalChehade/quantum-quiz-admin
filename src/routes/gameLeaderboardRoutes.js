const express = require('express');
const router = express.Router();
const gameLeaderboardController = require('../controllers/gameLeaderboardController');

// Generate leaderboard for a specific game session
router.get('/game/:gameSessionId', async (req, res, next) => {
  try {
    const leaderboard = await gameLeaderboardController.generateGameLeaderboard(req.params.gameSessionId);
    res.json(leaderboard);
  } catch (e) { next(e); }
});

module.exports = router;
