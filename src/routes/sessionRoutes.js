const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const authenticateToken = require('../middlewares/authMiddleware');

router.post('/', sessionController.createSession);
router.get('/resolve/:joinCode', sessionController.resolveJoinCode);
router.post('/:id/end', sessionController.endGame);

// Admin-only reset endpoint
router.post('/admin/reset-session', authenticateToken, sessionController.resetSessionData);

module.exports = router;
