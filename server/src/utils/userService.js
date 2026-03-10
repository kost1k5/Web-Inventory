const User = require('../models/User');

async function findOrCreateUser(provider, providerId, email, name) {
  try {
    let user = await User.findOne({ where: { provider, providerId } });
    if (user) return user;

    user = await User.create({ provider, providerId, email, name });
    return user;
  } catch (error) {
    console.error('Error in findOrCreateUser:', error.message);
    throw error;
  }
}

module.exports = { findOrCreateUser };

