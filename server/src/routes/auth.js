const express = require('express');
const passport = require('passport');
const router = express.Router();
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const error = `${FRONTEND_URL}/login?error=auth_failed`;

// 1. GET /api/auth/google - начинает OAuth
router.get('/google', 
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// 2. GET /api/auth/google/callback - Google редиректит сюда
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: error }),
  (req, res) => {
    if (req.user?.isBlocked) {
      req.logout(() => {});
      return res.redirect(`${FRONTEND_URL}/login?error=blocked`);
    }
    // Явно сохраняем сессию в PostgreSQL перед редиректом
    // (без этого redirect может уйти до того как async-запись в БД завершится)
    req.session.save((err) => {
      if (err) console.error('Session save error (google):', err);
      console.log('[google/callback] session saved, sid:', req.sessionID, 'user:', req.user?.email);
      res.redirect(`${FRONTEND_URL}/dashboard`);
    });
  }
);



// FACEBOOK ROUTES (временно отключены)
/*
router.get('/facebook', 
  passport.authenticate('facebook', { scope: ['profile', 'email'] })
);

router.get('/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: error }),
  (req, res) => {
     res.redirect('http://localhost:5173/dashboard');
  }
);
*/

// GITHUB ROUTES
router.get('/github', 
  passport.authenticate('github', { scope: ['user:email'] })
);

router.get('/github/callback',
  passport.authenticate('github', { failureRedirect: error }),
  (req, res) => {
    if (req.user?.isBlocked) {
      req.logout(() => {});
      return res.redirect(`${FRONTEND_URL}/login?error=blocked`);
    }
    // Явно сохраняем сессию в PostgreSQL перед редиректом
    req.session.save((err) => {
      if (err) console.error('Session save error (github):', err);
      console.log('[github/callback] session saved, sid:', req.sessionID, 'user:', req.user?.email);
      res.redirect(`${FRONTEND_URL}/dashboard`);
    });
  }
);

router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

router.get('/me', (req, res) => {
  console.log('[/me] isAuthenticated:', req.isAuthenticated(), 'sessionID:', req.sessionID, 'user:', req.user?.email);
  if (req.isAuthenticated() && !req.user?.isBlocked) {
    return res.json(req.user);
  }
  res.status(401).json({ error: 'Unauthorized' });
});

router.get('/users/:userId', async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findByPk(req.params.userId, {
      attributes: ['id', 'name', 'email', 'createdAt'],
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json(user);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
});

module.exports = router;
