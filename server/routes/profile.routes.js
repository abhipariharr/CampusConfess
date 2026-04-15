const express    = require('express');
const router     = express.Router();
const { body, validationResult } = require('express-validator');
const { requireAuth } = require('../middleware/auth');
const UserModel  = require('../models/user.model');

const ALL_INTERESTS = ['music','gaming','tech','art','sports','books','travel','movies','food','fitness','fashion','science','photography','cooking','coding','anime','yoga','dance','theatre','politics','nature','volunteering'];

// ─── GET /profile ─────────────────────────────────────────────────────────────
router.get('/', requireAuth, async (req, res) => {
  try {
    const user      = await UserModel.findById(req.session.user.id);
    const interests = await UserModel.getInterests(req.session.user.id);
    res.render('profile/index', { title: 'My Profile', user, interests, allInterests: ALL_INTERESTS });
  } catch (err) {
    console.error('Profile error:', err);
    req.session.error = 'Could not load profile.';
    res.redirect('/confessions');
  }
});

// ─── POST /profile ────────────────────────────────────────────────────────────
router.post('/', requireAuth, [
  body('bio').optional().trim().isLength({ max: 300 }),
], async (req, res) => {
  try {
    const { bio, gender, interests } = req.body;
    await UserModel.updateProfile(req.session.user.id, { bio: bio || '', gender: gender || null });
    // Update session with new gender
    req.session.user.gender = gender || null;
    const interestArr = Array.isArray(interests) ? interests : (interests ? [interests] : []);
    await UserModel.setInterests(req.session.user.id, interestArr.slice(0, 10));
    req.session.success = 'Profile updated!';
    res.redirect('/profile');
  } catch (err) {
    console.error('Profile update error:', err);
    req.session.error = 'Failed to update profile.';
    res.redirect('/profile');
  }
});

module.exports = router;
