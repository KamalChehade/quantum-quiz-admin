module.exports = (sequelize, DataTypes) => {
  const GameSession = sequelize.define('GameSession', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    status: { type: DataTypes.ENUM('waiting', 'active', 'ended'), defaultValue: 'waiting' },
    currentQuestionId: { type: DataTypes.INTEGER, allowNull: true },
    startedAt: { type: DataTypes.DATE },
    endedAt: { type: DataTypes.DATE },
  }, {
    tableName: 'game_sessions',
    timestamps: true,
  });

  GameSession.associate = (models) => {
    GameSession.belongsTo(models.Question, { foreignKey: 'currentQuestionId', as: 'currentQuestion' });
  };

  return GameSession;
};
