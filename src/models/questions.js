module.exports = (sequelize, DataTypes) => {
  const Question = sequelize.define('Question', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

    text: { type: DataTypes.STRING, allowNull: false },

    // Example: [{ key: 'A', text: 'Paris' }, { key: 'B', text: 'Rome' }]
    choices: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },

    // Could be 'A' or index 0 — depends on your frontend
    correctAnswer: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    gameSessionId: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },

    order: { type: DataTypes.INTEGER, allowNull: false },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: false },
  }, {
    tableName: 'questions',
    timestamps: true,
  });

  Question.associate = (models) => {
    Question.hasMany(models.Answer, { foreignKey: 'questionId', as: 'answers' });
  };

  return Question;
};
