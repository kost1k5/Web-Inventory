const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Пользователь всегда приходит через OAuth (Google или GitHub).
// provider + providerId — уникальная пара: один человек может иметь
// два отдельных аккаунта (через Google и через GitHub) — это осознанное решение.
// theme и language сохраняются на сервере, чтобы настройки не терялись при смене браузера.
const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  // 'google' или 'github'
  provider: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  // ID пользователя на стороне провайдера
  providerId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  isAdmin: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  isBlocked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  theme: {
    type: DataTypes.STRING,
    defaultValue: 'light',
  },
  language: {
    type: DataTypes.STRING,
    defaultValue: 'en',
  },
}, {
  indexes: [
    { unique: true, fields: ['provider', 'providerId'] },
  ],
});

module.exports = User;
