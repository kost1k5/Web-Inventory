const User = require('../models/User');

async function findOrCreateUser(provider, providerId, email, name) {
  try {
    // 1. Ищем по провайдеру + providerId (точное совпадение)
    let user = await User.findOne({ where: { provider, providerId } });
    if (user) return user;

    // 2. Создаём нового пользователя (GitHub и Google — отдельные аккаунты)
    user = await User.create({ provider, providerId, email, name });
    return user;
  } catch (error) {
    console.error('Error in findOrCreateUser:', error.message);
    throw error;
  }
}

/**
 * Проверить, заблокирован ли пользователь.
 * Passport вызывает done(null, false) если возвращаем null.
 */
async function checkBlocked(user) {
  if (user && user.isBlocked) return null;
  return user;
}
module.exports = { findOrCreateUser };

