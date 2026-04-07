// Authentication & authorization middleware

function requireAuth(req, res, next) {
  if (!req.session.user) {
    req.session.error = 'Please login to continue.';
    return res.redirect('/login');
  }
  if (req.session.user.is_banned) {
    req.session.destroy();
    return res.redirect('/login');
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user) {
    req.session.error = 'Please login to continue.';
    return res.redirect('/login');
  }
  if (req.session.user.role !== 'admin') {
    return res.status(403).render('error', { title: 'Forbidden', message: 'Admin access only.', code: 403 });
  }
  next();
}

function redirectIfAuth(req, res, next) {
  if (req.session.user) return res.redirect('/confessions');
  next();
}

module.exports = { requireAuth, requireAdmin, redirectIfAuth };
