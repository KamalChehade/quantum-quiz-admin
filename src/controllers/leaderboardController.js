const {
  QuestionLeaderboard,
  Answer,
  Participant,
  Question,
} = require("../models");

exports.generateLeaderboardForQuestion = async (questionId) => {
  try {
    console.log(`Generating leaderboard for question ${questionId}`);

    // 1️⃣ Fetch the question to get correct answer + choices
    const question = await Question.findByPk(questionId);
    if (!question) throw new Error(`Question ${questionId} not found`);

    // Parse choices and find the correct one
    let correctAnswerText = null;
    try {
      const parsedChoices = JSON.parse(question.choices);
      const correctChoice = parsedChoices.find(
        (c) => c.key === question.correctAnswer
      );
      correctAnswerText = correctChoice ? correctChoice.text : null;
    } catch (err) {
      console.error("Error parsing choices JSON:", err);
    }

    // 2️⃣ Fetch all answers for the question
    const answers = await Answer.findAll({
      where: { questionId },
      include: [
        {
          model: Participant,
          as: "participant",
          attributes: ["id", "name", "phone"],
        },
      ],
      order: [
        ["isCorrect", "DESC"],
        ["answeredAt", "ASC"],
      ],
    });

    // 3️⃣ Clear existing leaderboard for this question
    await QuestionLeaderboard.destroy({ where: { questionId } });

    const leaderboardEntries = [];
    let rank = 1;

    // Separate correct / incorrect
    const correctAnswers = answers.filter((a) => a.isCorrect);
    const incorrectAnswers = answers.filter((a) => !a.isCorrect);

    // 4️⃣ Insert correct answers first
    for (const answer of correctAnswers) {
      const score = calculateScore(rank);

      await QuestionLeaderboard.create({
        questionId,
        participantId: answer.participantId,
        rank: rank,
        scoreForQuestion: score,
        answeredAt: answer.answeredAt,
        isCorrect: answer.isCorrect,
      });

      leaderboardEntries.push({
        rank: rank,
        name: answer.participant ? answer.participant.name : null,
        score: score,
        answeredAt: answer.answeredAt,
        isCorrect: true,
        correctAnswer: {
          key: question.correctAnswer,
          text: correctAnswerText,
        },
      });

      rank++;
    }

    // 5️⃣ Append incorrect answers (rank = null, score = 0)
    for (const answer of incorrectAnswers) {
      await QuestionLeaderboard.create({
        questionId,
        participantId: answer.participantId,
        rank: 0,
        scoreForQuestion: 0,
        answeredAt: answer.answeredAt,
        isCorrect: false,
      });

      leaderboardEntries.push({
        rank: null,
        name: answer.participant ? answer.participant.name : null,
        score: 0,
        answeredAt: answer.answeredAt,
        isCorrect: false,
        correctAnswer: {
          key: question.correctAnswer,
          text: correctAnswerText,
        },
      });
    }

    console.log(
      `Generated leaderboard with ${leaderboardEntries.length} entries`
    );
    return leaderboardEntries;
  } catch (error) {
    console.error("Error generating question leaderboard:", error);
    throw error;
  }
};

// Helper function to calculate score based on rank
function calculateScore(rank) {
  return Math.max(0, 100 - (rank - 1) * 10);
}
