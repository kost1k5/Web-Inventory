const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ItemLike = sequelize.define('ItemLike', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  itemId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['itemId', 'userId'],
      name: 'item_like_unique',
    },
  ],
});

module.exports = ItemLike;
