const express = require('express');
const router = express.Router();
const leaderboardController = require('../controllers/leaderboardController');

// Generate leaderboard for a specific question
router.get('/question/:questionId', async (req, res, next) => {
  try {
    const leaderboard = await leaderboardController.generateLeaderboardForQuestion(req.params.questionId);
    res.json(leaderboard);
  } catch (e) { next(e); }
});

module.exports = router;
