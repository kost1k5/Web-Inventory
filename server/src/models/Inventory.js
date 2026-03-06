const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Инвентарь — это шаблон. Он определяет набор полей и формат ID для своих Items.
// customIdFormat хранится как JSON-строка — массив элементов формата:
//   [{ type: 'text', value: 'INV-' }, { type: 'r6' }]
// Формат разбирается в routes/inventories.js функцией parseCustomIdFormat().
// version используется для optimistic locking при автосохранении настроек.
const Inventory = sequelize.define('Inventory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  ownerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  categoryId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Categories',
      key: 'id',
    },
  },
  imageUrl: {
    type: DataTypes.STRING,
  },
  // Если true — любой залогиненный может добавлять items
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  // Формат кастомного ID (JSON-массив элементов)
  customIdFormat: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '[{"type":"text","value":"INV-"},{"type":"r6"}]',
  },
  version: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
}, {
  timestamps: true,
});

module.exports = Inventory;
