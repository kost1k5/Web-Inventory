function requireAuth(req, res, next) {
  if (req.isAuthenticated()) {
    if (req.user?.isBlocked) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Your account is blocked'
      });
    }
    return next();
  }
  res.status(401).json({
    error: 'Unauthorized',
    message: 'You must be logged in to access this resource'
  });
}

function requireAdmin(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (!req.user.isAdmin) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Only admins can access this resource'
    });
  }
  
  next();
}

module.exports = {
  requireAuth,
  requireAdmin
};
