const {DataTypes} = require('sequelize');
const sequelize = require('../config/database');

const InventoryAccess = sequelize.define('InventoryAccess', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

inventoryId:{
    type: DataTypes.UUID,
    allowNull: false,
},
userId:{
    type: DataTypes.UUID,
    allowNull: false
},
},{
    timestamps: true,
     indexes: [
    {
      unique: true,
      fields: ['inventoryId', 'userId'], // ← Composite unique!
    }
  ]
})

module.exports = InventoryAccess;
