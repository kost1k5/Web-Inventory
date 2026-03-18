const express = require('express');
const passport = require('passport');
const router = express.Router();
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const error = `${FRONTEND_URL}/login?error=auth_failed`;
const { requireAuth } = require('../middleware/auth');
const User = require('../models/User');

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

// Маршрут /me используется как источник прав и текущего профиля.
router.get('/me', (req, res) => {
  res.set('Cache-Control', 'no-store');
  if (req.isAuthenticated() && !req.user?.isBlocked) {
    return res.json(req.user);
  }
  res.status(401).json({ error: 'Unauthorized' });
});
 

router.get('/users/:userId', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userId, {
      attributes: ['id', 'name', 'email', 'createdAt'],
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json(user);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
});

router.put('/me/settings', requireAuth, async (req, res) => {
try{
  const {language, theme} = req.body;
   let updates = {};
   const allowedThemes = [ 'light', 'dark'];
   const allowedLanguages = ['en', 'ru'];

   const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (language !== undefined) {
  if (!allowedLanguages.includes(language)) {
    return res.status(400).json({ error: 'Invalid language' });
  }

  if (user.language !== language) {
    updates.language = language;
  }
}

if (theme !== undefined) {
  if (!allowedThemes.includes(theme)) {
    return res.status(400).json({ error: 'Invalid theme' });
  }

  if (user.theme !== theme) {
    updates.theme = theme;
  }
}
    
   
  if (Object.keys(updates).length > 0) {
    await user.update(updates);
  }

res.set('Cache-Control', 'no-store');

return res.json({
  settings: {
    theme: user.theme,
    language: user.language,
  },
});
} catch (error) {
  return res.status(500).json({ error: 'Failed to update settings' });

}
})

module.exports = router;
