const sequelize = require('../config/database');
const User = require('./User');
const Role = require('./Role');
const Deck = require('./Deck');
const DeckRole = require('./DeckRole');

// Define associations
Deck.hasMany(DeckRole, { foreignKey: 'deck_id', onDelete: 'CASCADE' });
DeckRole.belongsTo(Deck, { foreignKey: 'deck_id' });

Role.hasMany(DeckRole, { foreignKey: 'role_id' });
DeckRole.belongsTo(Role, { foreignKey: 'role_id' });

User.hasMany(Role, { foreignKey: 'created_by' });
Role.belongsTo(User, { foreignKey: 'created_by' });

User.hasMany(Deck, { foreignKey: 'created_by' });
Deck.belongsTo(User, { foreignKey: 'created_by' });

const syncDatabase = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log('Database synced successfully');
  } catch (error) {
    console.error('Database sync error:', error);
  }
};

module.exports = {
  sequelize,
  User,
  Role,
  Deck,
  DeckRole,
  syncDatabase
};