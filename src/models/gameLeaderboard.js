module.exports = (sequelize, DataTypes) => {
  const GameLeaderboard = sequelize.define('GameLeaderboard', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    
    gameSessionId: { type: DataTypes.INTEGER, allowNull: false },
    participantId: { type: DataTypes.INTEGER, allowNull: false },

    totalScore: { type: DataTypes.INTEGER, defaultValue: 0 },
    totalQuestionsAnswered: { type: DataTypes.INTEGER, defaultValue: 0 },
    correctAnswersCount: { type: DataTypes.INTEGER, defaultValue: 0 },
    accuracyPercent: { type: DataTypes.FLOAT, defaultValue: 0 },
    fastestAnswerSeconds: { type: DataTypes.FLOAT, allowNull: true },
    questionsCorrect: { type: DataTypes.JSON, defaultValue: [] }, // e.g. [1,4,5,6]

    rank: { type: DataTypes.INTEGER, allowNull: true },
  }, {
    tableName: 'game_leaderboards',
    timestamps: true,
  });

  GameLeaderboard.associate = (models) => {
    GameLeaderboard.belongsTo(models.Participant, { foreignKey: 'participantId', as: 'participant' });
    GameLeaderboard.belongsTo(models.GameSession, { foreignKey: 'gameSessionId', as: 'gameSession' });
  };

  return GameLeaderboard;
};
