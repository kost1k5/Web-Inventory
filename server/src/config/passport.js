const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');
const { findOrCreateUser } = require('../utils/userService');

require('dotenv').config();

// В сессии хранится только user.id; полный профиль восстанавливается через deserializeUser.
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    if (!user || user.isBlocked) return done(null, false);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

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

// Facebook strategy is kept here but not enabled.
/*
// GitHub нужен как второй OAuth provider и использует fallback email,
// потому что часть аккаунтов скрывает основной адрес.
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: process.env.FACEBOOK_CALLBACK_URL,
        profileFields: ['id', 'displayName', 'emails'],
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