const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Элемент инвентаря. Структура фиксированная — по 3 поля каждого типа.
// Какие поля отображать и с каким заголовком — решает InventoryField конкретного инвентаря.
// customId — уникален в рамках одного инвентаря (composite unique index ниже).
// version нужен для optimistic locking: при сохранении клиент передаёт version,
// сервер проверяет совпадение и либо сохраняет (version++), либо возвращает 409.
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
  // Три текстовых поля (однострочные)
  textField1: { type: DataTypes.STRING },
  textField2: { type: DataTypes.STRING },
  textField3: { type: DataTypes.STRING },
  // Три текстовых поля (многострочные)
  textareaField1: { type: DataTypes.TEXT },
  textareaField2: { type: DataTypes.TEXT },
  textareaField3: { type: DataTypes.TEXT },
  // Три числовых поля
  numberField1: { type: DataTypes.INTEGER },
  numberField2: { type: DataTypes.INTEGER },
  numberField3: { type: DataTypes.INTEGER },
  // Три поля для ссылок на документы/изображения
  documentField1: { type: DataTypes.STRING },
  documentField2: { type: DataTypes.STRING },
  documentField3: { type: DataTypes.STRING },
  // Три булевых поля (чекбоксы)
  booleanField1: { type: DataTypes.BOOLEAN },
  booleanField2: { type: DataTypes.BOOLEAN },
  booleanField3: { type: DataTypes.BOOLEAN },
}, {
  timestamps: true,
  indexes: [
    // customId уникален только внутри одного инвентаря, не глобально
    { unique: true, fields: ['inventoryId', 'customId'] },
  ],
});

module.exports = Item;
