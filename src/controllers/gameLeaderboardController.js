const { Answer, Participant, Question, GameLeaderboard } = require('../models');
const { Op } = require('sequelize');

exports.generateGameLeaderboard = async (gameSessionId) => {
  // Fetch all answers within this game session
  const questions = await Question.findAll({ where: { gameSessionId } });
  const questionIds = questions.map(q => q.id);

  const answers = await Answer.findAll({
    where: { questionId: { [Op.in]: questionIds } },
    include: [{ model: Participant, as: 'participant' }],
    order: [['answeredAt', 'ASC']],
  });

  // Group answers by participant
  const participantMap = {};

  for (const ans of answers) {
    const pid = ans.participantId;
    if (!participantMap[pid]) {
      participantMap[pid] = {
        participant: ans.participant,
        totalScore: 0,
        totalQuestionsAnswered: 0,
        correctAnswersCount: 0,
        answeredTimes: [],
        questionsCorrect: [],
      };
    }

    const entry = participantMap[pid];
    entry.totalQuestionsAnswered += 1;
    entry.answeredTimes.push(new Date(ans.answeredAt));

    if (ans.isCorrect) {
      entry.correctAnswersCount += 1;
      entry.totalScore += 10; // or your scoring rule
      entry.questionsCorrect.push(ans.questionId);
    }
  }

  // Compute summary stats
  const results = Object.values(participantMap).map(p => {
    const accuracy = p.totalQuestionsAnswered > 0
      ? (p.correctAnswersCount / p.totalQuestionsAnswered) * 100
      : 0;

    // Compute the participant's fastest answer time (earliest answeredAt) in seconds since epoch
    const fastestAnswerSeconds = (p.answeredTimes && p.answeredTimes.length)
      ? Math.min(...p.answeredTimes.map(d => new Date(d).getTime())) / 1000
      : null;

    return {
      participantId: p.participant?.id || null,
      participant: p.participant,
      totalScore: p.totalScore,
      totalQuestionsAnswered: p.totalQuestionsAnswered,
      correctAnswersCount: p.correctAnswersCount,
      accuracyPercent: accuracy,
      fastestAnswerSeconds: fastestAnswerSeconds,
      questionsCorrect: p.questionsCorrect,
    };
  });

  // Sort and rank
  results.sort((a, b) => b.totalScore - a.totalScore || b.accuracyPercent - a.accuracyPercent);

  for (let i = 0; i < results.length; i++) {
    const res = results[i];
    res.rank = i + 1;

    // Save snapshot to DB
    await GameLeaderboard.create({
      gameSessionId,
      participantId: res.participantId,
      totalScore: res.totalScore,
      totalQuestionsAnswered: res.totalQuestionsAnswered,
      correctAnswersCount: res.correctAnswersCount,
      accuracyPercent: res.accuracyPercent,
      fastestAnswerSeconds: res.fastestAnswerSeconds,
      questionsCorrect: res.questionsCorrect,
      rank: res.rank,
    });
  }

  return results;
};
