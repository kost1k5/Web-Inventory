const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const InventoryField = sequelize.define('InventoryField', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  inventoryId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Inventories',
      key: 'id',
    },
  },
  fieldType: {
    type: DataTypes.ENUM('text', 'multiline', 'number', 'document', 'checkbox'),
    allowNull: false,
  },
  fieldIndex: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0,
      max: 2,
    },
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    
  },
  description: {
    type: DataTypes.TEXT,
  },
  showInTable: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['inventoryId', 'fieldType', 'fieldIndex'],
      name: 'inventory_field_unique',
    },
    {
      fields: ['inventoryId', 'order'],
      name: 'inventory_field_order_index',
    },
  ],
});

module.exports = InventoryField;