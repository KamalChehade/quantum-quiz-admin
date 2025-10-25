module.exports = (sequelize, DataTypes) => {
  const Answer = sequelize.define('Answer', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

    participantId: { type: DataTypes.INTEGER, allowNull: false },
    gameSessionId: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    questionId: { type: DataTypes.INTEGER, allowNull: false },

    // Store the key (like 'A') or index ('0') matching choices array
    selectedAnswer: { type: DataTypes.STRING, allowNull: false },

    isCorrect: { type: DataTypes.BOOLEAN, allowNull: false },
    answeredAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, {
    tableName: 'answers',
    timestamps: false,
  });

  Answer.associate = (models) => {
    Answer.belongsTo(models.Participant, { foreignKey: 'participantId', as: 'participant' });
    Answer.belongsTo(models.Question, { foreignKey: 'questionId', as: 'question' });
  };
 
  return Answer;
};
