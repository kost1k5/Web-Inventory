const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');
const { findOrCreateUser } = require('../utils/userService');

require('dotenv').config();

// SERIALIZEUSER - сохраняем в сессию
passport.serializeUser((user, done) => {
  // user - полный объект User из БД
  done(null, user.id); // Что тут писать?
});

// DESERIALIZEUSER - достаём из БД по ID
passport.deserializeUser(async (id, done) => {
  try {
    console.log('[deserializeUser] called with id:', id);
    const user = await User.findByPk(id);
    console.log('[deserializeUser] user found:', user ? user.email : 'NOT FOUND');
    // Если пользователь заблокирован — сессия сразу инвалидируется
    if (!user || user.isBlocked) return done(null, false);
    done(null, user);
  } catch (error) {
    console.error('[deserializeUser] error:', error);
    done(error, null);
  }
});

// GOOGLE STRATEGY
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email =
          (profile.emails && profile.emails[0]?.value) ||
          `${profile.id}@googleuser.noreply`;
        const displayName = profile.displayName || profile.name?.givenName || 'Google User';
        const user = await findOrCreateUser('google', profile.id, email, displayName);
        done(null, user);
      } catch (error) {
        done(error, null);
      }
    }
  )
);

// FACEBOOK STRATEGY (временно отключена - не получается создать аккаунт)
/*
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: process.env.FACEBOOK_CALLBACK_URL,
        profileFields: ['id', 'displayName', 'emails'], // Запрашиваем email у Facebook
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await findOrCreateUser(
          'facebook',
          profile.id,
          profile.emails[0].value,
          profile.displayName
        );
        done(null, user);
      } catch (error) {
        done(error, null);
      }
    }
  )
);
*/

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL,
      scope: ['user:email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // GitHub может не отдавать email если он скрыт в настройках профиля.
        // Используем noreply-адрес как запасной вариант.
        const email =
          (profile.emails && profile.emails[0]?.value) ||
          `${profile.username}@users.noreply.github.com`;

        const displayName = profile.displayName || profile.username || 'GitHub User';

        const user = await findOrCreateUser(
          'github',
          profile.id,
          email,
          displayName
        );
        done(null, user);
      } catch (error) {
        done(error, null);
      }
    }
  )
);


module.exports = passport;