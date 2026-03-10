const express = require('express');
const passport = require('passport');
const router = express.Router();
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const error = `${FRONTEND_URL}/login?error=auth_failed`;

// OAuth стартует на сервере, чтобы callback, session и Passport оставались в одном контуре.
router.get('/google', 
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: error }),
  (req, res) => {
    if (req.user?.isBlocked) {
      req.logout(() => {});
      return res.redirect(`${FRONTEND_URL}/login?error=blocked`);
    }
    // Перед redirect явно фиксируем session, иначе браузер может уйти раньше записи в store.
    req.session.save((err) => {
      if (err) console.error('Session save error:', err);
      res.redirect(`${FRONTEND_URL}/dashboard`);
    });
  }
);



// Facebook OAuth routes are disabled.
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
    // Поведение идентично Google callback: сначала session, потом redirect на frontend.
    req.session.save((err) => {
      if (err) console.error('Session save error:', err);
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

// Маршрут /me используется фронтендом как источник прав и текущего профиля.
router.get('/me', (req, res) => {
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
