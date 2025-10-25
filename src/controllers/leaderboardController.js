const { QuestionLeaderboard, Answer, Participant, Question } = require('../models');

exports.generateLeaderboardForQuestion = async (questionId) => {
  try {
    console.log(`Generating leaderboard for question ${questionId}`);
    
    const answers = await Answer.findAll({
      where: { questionId },
      include: [{
        model: Participant,
        as: 'participant', // use the association alias defined in the models
        attributes: ['id', 'name', 'phone']
      }],
      order: [
        ['isCorrect', 'DESC'], // Correct answers first
        ['answeredAt', 'ASC']  // Then by who answered fastest
      ]
    });

    // Clear existing leaderboard for this question
    await QuestionLeaderboard.destroy({ where: { questionId } });

    const leaderboardEntries = [];
    let rank = 1;

    // Create leaderboard entries with proper ranking
    // We'll include correct answers first (ranked), then include incorrect answers as unranked entries
    const correctAnswers = answers.filter(a => a.isCorrect);
    const incorrectAnswers = answers.filter(a => !a.isCorrect);

    for (const answer of correctAnswers) {
      const score = calculateScore(rank);

      // Persist per-question leaderboard row (use field name from the model)
      await QuestionLeaderboard.create({
        questionId,
        participantId: answer.participantId,
        rank: rank,
        scoreForQuestion: score,
        answeredAt: answer.answeredAt,
        isCorrect: answer.isCorrect
      });

      leaderboardEntries.push({
        rank: rank,
        name: answer.participant ? answer.participant.name : null,
        score: score,
        answeredAt: answer.answeredAt,
        isCorrect: true,
      });

      rank++;
    }

    // Append incorrect answers (no rank, zero score) so UI can show who attempted
    for (const answer of incorrectAnswers) {
      // DB requires a non-null rank, use 0 as sentinel for unranked/incorrect
      await QuestionLeaderboard.create({
        questionId,
        participantId: answer.participantId,
        rank: 0,
        scoreForQuestion: 0,
        answeredAt: answer.answeredAt,
        isCorrect: false
      });

      leaderboardEntries.push({
        rank: null, // keep null in API response so UI shows 'unranked'
        name: answer.participant ? answer.participant.name : null,
        score: 0,
        answeredAt: answer.answeredAt,
        isCorrect: false,
      });
    }

    console.log(`Generated leaderboard with ${leaderboardEntries.length} entries`);
    return leaderboardEntries;

  } catch (error) {
    console.error('Error generating question leaderboard:', error);
    throw error;
  }
};

// Helper function to calculate score based on rank
function calculateScore(rank) {
   return Math.max(0, 100 - ((rank - 1) * 10));
}