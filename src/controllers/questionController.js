const { Question } = require('../models');
const ExpressError = require('../utils/expressError');

// 📘 Get all questions
exports.getAllQuestions = async (req, res, next) => {
    try {
        const questions = await Question.findAll({ order: [['order', 'ASC']] });
        res.json(questions);
    } catch (err) {
        next(err);
    }
};

// 📗 Get single question by ID
exports.getQuestionById = async (req, res, next) => {
    try {
        const question = await Question.findByPk(req.params.id);
        if (!question) throw new ExpressError('Question not found', 404);
        res.json(question);
    } catch (err) {
        next(err);
    }
};

// 🟩 Create new question
exports.createQuestion = async (req, res, next) => {
    try {
        const { text, choices, correctAnswer, order } = req.body;

        if (!text || !choices || !correctAnswer) {
            throw new ExpressError('Missing required fields', 400);
        }

        const question = await Question.create({
            text,
            choices,
            correctAnswer,
            order: order || 0,
        });

        res.status(201).json(question);
    } catch (err) {
        next(err);
    }
};

// 🟨 Update question
exports.updateQuestion = async (req, res, next) => {
    try {
        const { text, choices, correctAnswer, order } = req.body;
        const question = await Question.findByPk(req.params.id);

        if (!question) throw new ExpressError('Question not found', 404);

        await question.update({
            text: text ?? question.text,
            choices: choices ?? question.choices,
            correctAnswer: correctAnswer ?? question.correctAnswer,
            order: order ?? question.order,
        });

        res.json(question);
    } catch (err) {
        next(err);
    }
};

// 🟥 Delete question
exports.deleteQuestion = async (req, res, next) => {
    try {
        const question = await Question.findByPk(req.params.id);
        if (!question) throw new ExpressError('Question not found', 404);

        await question.destroy();
        res.json({ message: 'Question deleted successfully' });
    } catch (err) {
        next(err);
    }
};
