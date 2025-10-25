const express = require('express');
const router = express.Router();
const participantController = require('../controllers/participantController');

// Join a session
router.post('/join', participantController.joinSession);

module.exports = router;
