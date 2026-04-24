const express    = require('express');
const router     = express.Router();
const bcrypt     = require('bcryptjs');
const crypto     = require('crypto');
const { body, validationResult } = require('express-validator');

const { loginRateLimit, signupRateLimit, forgotPasswordRateLimit } = require('../middleware/rateLimiter');
const { redirectIfAuth } = require('../middleware/auth');
const UserModel  = require('../models/user.model');
const { generateAnonUsername } = require('../utils/anonName');
const { sendPasswordResetEmail } = require('../utils/mailer');

// ─── GET /login ───────────────────────────────────────────────────────────────
router.get('/login', redirectIfAuth, (req, res) => {
  res.render('auth/login', { title: 'Login', layout: 'layouts/auth' });
});

// ─── POST /login ──────────────────────────────────────────────────────────────
router.post('/login', redirectIfAuth, loginRateLimit, [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.session.error = 'Please enter a valid email and password.';
    return res.redirect('/login');
  }
  try {
    const { email, password, remember_me } = req.body;

const user = await UserModel.findByEmail(email);

// 🔍 DEBUG START
console.log("INPUT EMAIL:", email);
console.log("USER:", user);
// 🔍 DEBUG END

let match = false;
if (user) {
  match = await bcrypt.compare(password, user.password_hash);

  console.log("INPUT PASSWORD:", password);
  console.log("DB HASH:", user.password_hash);
  console.log("MATCH:", match);
}

if (!user || !match) {
  req.session.error = 'Invalid email or password.';
  return res.redirect('/login');
}
    if (user.is_banned) {
      req.session.error = 'Your account has been suspended. Contact support.';
      return res.redirect('/login');
    }
    req.session.user = { id: user.id, anon_username: user.anon_username, role: user.role, avatar_color: user.avatar_color, gender: user.gender };
    if (remember_me) req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
    res.redirect('/confessions');
  } catch (err) {
    console.error('Login error:', err);
    req.session.error = 'An error occurred. Please try again.';
    res.redirect('/login');
  }
});

// ─── GET /signup ──────────────────────────────────────────────────────────────
router.get('/signup', redirectIfAuth, (req, res) => {
  res.render('auth/signup', { title: 'Create Account', layout: 'layouts/auth' });
});

// ─── POST /signup ─────────────────────────────────────────────────────────────
router.post('/signup', redirectIfAuth, signupRateLimit, [
  body('real_name').trim().isLength({ min: 2, max: 80 }).withMessage('Full name must be 2-80 characters.'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required.'),
  body('gender').isIn(['male', 'female', 'other']).withMessage('Please select a valid gender.'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter.')
    .matches(/[0-9]/).withMessage('Password must contain a number.'),
  body('confirm_password').custom((val, { req }) => {
    if (val !== req.body.password) throw new Error('Passwords do not match.');
    return true;
  }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.session.error = errors.array()[0].msg;
    return res.redirect('/signup');
  }
  try {
    const { real_name, email, password, gender } = req.body;
    if (await UserModel.emailExists(email)) {
      req.session.error = 'An account with this email already exists.';
      return res.redirect('/signup');
    }
    const db = require('../config/db');
    const password_hash  = await bcrypt.hash(password, 12);
    const anon_username  = await generateAnonUsername(db);
    const colors = ['#7c3aed','#06b6d4','#ec4899','#f59e0b','#10b981'];
    const avatar_color   = colors[Math.floor(Math.random() * colors.length)];
    const userId = await UserModel.create({ email, password_hash, real_name, anon_username, avatar_color, gender });
    req.session.user = { id: userId, anon_username, role: 'user', avatar_color };
    req.session.success = `Welcome, ${anon_username}! Your anonymous account is ready.`;
    res.redirect('/confessions');
  } catch (err) {
    console.error('Signup error:', err);
    req.session.error = 'Signup failed. Please try again.';
    res.redirect('/signup');
  }
});

// ─── GET /logout ──────────────────────────────────────────────────────────────
router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

// ─── GET /forgot-password ─────────────────────────────────────────────────────
router.get('/forgot-password', redirectIfAuth, (req, res) => {
  res.render('auth/forgot-password', { title: 'Reset Password', layout: 'layouts/auth' });
});

// ─── POST /forgot-password ────────────────────────────────────────────────────
router.post('/forgot-password', redirectIfAuth, forgotPasswordRateLimit, [
  body('email').isEmail(),
], async (req, res) => {
  try {
    const { email } = req.body;
    const user = await UserModel.findByEmail(email);
    // Always show success (prevent user enumeration)
    req.session.success = 'If that email exists, a reset link has been sent.';
    if (user) {
      const token     = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await UserModel.createPasswordReset(user.id, token, expiresAt);
      const baseUrl   = `${req.protocol}://${req.get('host')}`;
      await sendPasswordResetEmail(user.email, `${baseUrl}/reset-password/${token}`);
    }
    res.redirect('/forgot-password');
  } catch (err) {
    console.error('Forgot password error:', err);
    req.session.error = 'An error occurred. Please try again.';
    res.redirect('/forgot-password');
  }
});

// ─── GET /reset-password/:token ───────────────────────────────────────────────
router.get('/reset-password/:token', redirectIfAuth, async (req, res) => {
  const reset = await UserModel.findPasswordReset(req.params.token);
  if (!reset) {
    req.session.error = 'Reset link is invalid or has expired.';
    return res.redirect('/forgot-password');
  }
  res.render('auth/reset-password', { title: 'New Password', layout: 'layouts/auth', token: req.params.token });
});

// ─── POST /reset-password/:token ──────────────────────────────────────────────
router.post('/reset-password/:token', redirectIfAuth, [
  body('password').isLength({ min: 8 }).matches(/[A-Z]/).matches(/[0-9]/),
  body('confirm_password').custom((val, { req }) => {
    if (val !== req.body.password) throw new Error('Passwords do not match.');
    return true;
  }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.session.error = errors.array()[0].msg;
    return res.redirect(`/reset-password/${req.params.token}`);
  }
  try {
    const reset = await UserModel.findPasswordReset(req.params.token);
    if (!reset) {
      req.session.error = 'Reset link is invalid or has expired.';
      return res.redirect('/forgot-password');
    }
    const hash = await bcrypt.hash(req.body.password, 12);
    await UserModel.updatePassword(reset.user_id, hash);
    await UserModel.markResetUsed(req.params.token);
    req.session.success = 'Password updated! Please login.';
    res.redirect('/login');
  } catch (err) {
    console.error('Reset error:', err);
    req.session.error = 'An error occurred. Please try again.';
    res.redirect('/forgot-password');
  }
});

module.exports = router;
