const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');
const { verifyAdmin } = require('../middlewares/authMiddleware');

// You can add verifyAdmin middleware once your admin login is ready

router.get('/', questionController.getAllQuestions);
router.get('/:id', questionController.getQuestionById);
router.post('/', questionController.createQuestion);
router.put('/:id', questionController.updateQuestion);
router.delete('/:id', questionController.deleteQuestion);

module.exports = router;
