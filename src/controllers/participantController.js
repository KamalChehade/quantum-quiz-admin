const { Participant, GameSession } = require('../models');
exports.joinSession = async (req, res, next) => {
  try {
    const { name, phone, sessionId } = req.body;
    const s = await GameSession.findByPk(sessionId);
    if (!s) return res.status(400).json({ message: 'Invalid session' });
    const p = await Participant.create({ name, phone, gameSessionId: sessionId, score: 0 });
    res.status(201).json({ participantId: p.id });
  } catch (e) { next(e); }
};
