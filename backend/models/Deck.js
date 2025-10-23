const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Deck = sequelize.define('Deck', {
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'decks',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Deck;