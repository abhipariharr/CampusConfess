const rateLimit = require('express-rate-limit');

const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: 'Too many login attempts. Please try again in 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    req.session.error = 'Too many login attempts. Please wait 15 minutes.';
    res.redirect('/login');
  },
});

const signupRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  handler: (req, res) => {
    req.session.error = 'Too many signup attempts. Please try again later.';
    res.redirect('/signup');
  },
});

const forgotPasswordRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  handler: (req, res) => {
    req.session.error = 'Too many reset requests. Please try again in an hour.';
    res.redirect('/forgot-password');
  },
});

const apiRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { loginRateLimit, signupRateLimit, forgotPasswordRateLimit, apiRateLimit };
