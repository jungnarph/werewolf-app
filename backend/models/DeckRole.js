const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DeckRole = sequelize.define('DeckRole', {
  deck_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'decks',
      key: 'id'
    }
  },
  role_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'roles',
      key: 'id'
    }
  },
  quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    validate: {
      min: 1
    }
  }
}, {
  tableName: 'deck_roles',
  timestamps: false
});

module.exports = DeckRole;