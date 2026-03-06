const { Router } = require('express');
const User = require('../models/User');
const { requireAdmin } = require('../middleware/auth');

const router = Router();

router.get('/users', requireAdmin, async (_req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'isAdmin', 'isBlocked', 'createdAt'],
      order: [['createdAt', 'DESC']],
    });

    return res.json(users);
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.put('/users/:id', requireAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const updates = {};
    if (typeof req.body.isBlocked === 'boolean') updates.isBlocked = req.body.isBlocked;
    if (typeof req.body.isAdmin === 'boolean') updates.isAdmin = req.body.isAdmin;

    await user.update(updates);
    return res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ error: 'Failed to update user' });
  }
});

router.delete('/users/:id', requireAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    await user.destroy();
    return res.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ error: 'Failed to delete user' });
  }
});

module.exports = router;
