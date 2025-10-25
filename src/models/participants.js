module.exports = (sequelize, DataTypes) => {
  const Participant = sequelize.define('Participant', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    phone: { type: DataTypes.STRING, allowNull: false },
    gameSessionId: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    score: { type: DataTypes.INTEGER, defaultValue: 0 },
    joinedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, {
    tableName: 'participants',
    timestamps: false,
    indexes: [
      {
        unique: true,
        name: 'uniq_participant_session_phone',
        fields: ['gameSessionId', 'phone']
      }
    ]
  });

  Participant.associate = (models) => {
    Participant.hasMany(models.Answer, { foreignKey: 'participantId', as: 'answers' });
  };

  return Participant;
};