/**
 * Middleware для проверки: залогинен ли пользователь?
 * Используется для защиты приватных роутов
 * 
 * Пример:
 * router.post('/inventories', requireAuth, createInventory);
 * // Только залогиненные юзеры могут создавать инвентари
 */
function requireAuth(req, res, next) {
  if (req.isAuthenticated()) {
    if (req.user?.isBlocked) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Your account is blocked'
      });
    }
    // req.user содержит объект User из БД
    return next();
  }
  // Не залогинен — возвращаем 401
  res.status(401).json({
    error: 'Unauthorized',
    message: 'You must be logged in to access this resource'
  });
}

/**
 * Middleware для проверки: админ ли пользователь?
 * Используется для защиты админских роутов
 */
function requireAdmin(req, res, next) {
  // Сначала проверяем, залогинен ли
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Потом проверяем, админ ли
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
