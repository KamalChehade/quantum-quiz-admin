module.exports = (sequelize, DataTypes) => {
  const QuestionLeaderboard = sequelize.define('QuestionLeaderboard', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

    questionId: { type: DataTypes.INTEGER, allowNull: false },
    participantId: { type: DataTypes.INTEGER, allowNull: false },

    rank: { type: DataTypes.INTEGER, allowNull: false }, // 1, 2, 3...
    scoreForQuestion: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    isCorrect: { type: DataTypes.BOOLEAN, allowNull: false },
    answeredAt: { type: DataTypes.DATE, allowNull: false },

  }, {
    tableName: 'question_leaderboards',
    timestamps: true,
  });

  QuestionLeaderboard.associate = (models) => {
    QuestionLeaderboard.belongsTo(models.Question, { foreignKey: 'questionId', as: 'question' });
    QuestionLeaderboard.belongsTo(models.Participant, { foreignKey: 'participantId', as: 'participant' });
  };

  return QuestionLeaderboard;
};
