const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Role = sequelize.define('Role', {
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  team: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      isIn: [['Villager', 'Werewolf', 'Village/Werewolf', 'Neutral']]
    }
  },
  score: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  image_url: {
    type: DataTypes.STRING(500)
  },
  image_hash: {
    type: DataTypes.STRING(64)
  },
  is_official: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  created_by: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'roles',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = Role;