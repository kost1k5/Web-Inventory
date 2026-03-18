const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Item = sequelize.define('Item', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
  },
  inventoryId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  customId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  version: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  textField1: { type: DataTypes.STRING },
  textField2: { type: DataTypes.STRING },
  textField3: { type: DataTypes.STRING },
  textareaField1: { type: DataTypes.TEXT },
  textareaField2: { type: DataTypes.TEXT },
  textareaField3: { type: DataTypes.TEXT },
  numberField1: { type: DataTypes.INTEGER },
  numberField2: { type: DataTypes.INTEGER },
  numberField3: { type: DataTypes.INTEGER },
  documentField1: { type: DataTypes.STRING },
  documentField2: { type: DataTypes.STRING },
  documentField3: { type: DataTypes.STRING },
  booleanField1: { type: DataTypes.BOOLEAN },
  booleanField2: { type: DataTypes.BOOLEAN },
  booleanField3: { type: DataTypes.BOOLEAN },
}, {
  timestamps: true,
  indexes: [
    { unique: true, fields: ['inventoryId', 'customId'] },
  ],
});

module.exports = Item;


