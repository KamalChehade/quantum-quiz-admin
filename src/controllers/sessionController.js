const { GameSession } = require('../models');
const { nanoid } = require('nanoid');
const { Participant, Answer, QuestionLeaderboard, GameLeaderboard } = require('../models');

exports.createSession = async (req, res, next) => {
  try {
    const joinCode = nanoid(6).toUpperCase();
    const s = await GameSession.create({ joinCode, status: 'LOBBY' });
    res.json({ sessionId: s.id, joinCode });
  } catch (e) { next(e); }
};

exports.resolveJoinCode = async (req, res, next) => {
  try {
    const s = await GameSession.findOne({ where: { joinCode: req.params.joinCode }});
    if (!s) return res.status(404).json({ message: 'Invalid code' });
    res.json({ sessionId: s.id, status: s.status });
  } catch (e) { next(e); }
};

exports.endGame = async (req, res, next) => {
  try {
    const s = await GameSession.findByPk(req.params.id);
    if (!s) return res.status(404).json({ message: 'Not found' });
    await s.update({ status: 'GAME_ENDED' });
    res.json({ ok: true });
  } catch (e) { next(e); }
};

// Admin-only: reset/delete session data except Questions
exports.resetSessionData = async (req, res, next) => {
  try {
    // require admin
    const user = req.user || {};
    console.log('[DEBUG] resetSessionData called. req.user =', user);
    if (user.role_name !== 'admin') return res.status(403).json({ message: 'Forbidden' });

    const gameSessionId = req.body.gameSessionId || 1;

    // Delete dependent data for the session (participants, answers, leaderboards)
  const deletedAnswers = await Answer.destroy({ where: { gameSessionId } });

  // Find questions for the session and delete their question-level leaderboards
  const questions = await require('../models').Question.findAll({ where: { gameSessionId } });
  const questionIds = questions.map(q => q.id);
  const qlbDeleted = questionIds.length ? await QuestionLeaderboard.destroy({ where: { questionId: questionIds } }) : 0;

  const glbDeleted = await GameLeaderboard.destroy({ where: { gameSessionId } });
    const participantsDeleted = await Participant.destroy({ where: { gameSessionId } });

    // Optionally delete the GameSession record itself
    const gsDeleted = await GameSession.destroy({ where: { id: gameSessionId } });

      // Clear in-memory live data and notify connected clients (admins & players)
      try {
        const socketService = require('../services/socketService');
        if (socketService && typeof socketService.clearLiveData === 'function') {
          await socketService.clearLiveData(gameSessionId);
        }
      } catch (e) {
        console.error('Error clearing live data via socketService:', e);
      }

      res.json({
        ok: true,
        deleted: {
          answers: deletedAnswers,
          questionLeaderboards: qlbDeleted,
          gameLeaderboards: glbDeleted,
          participants: participantsDeleted,
          gameSessions: gsDeleted,
        }
      });
  } catch (e) { next(e); }
};
