const express    = require('express');
const router     = express.Router();
const { requireAuth } = require('../middleware/auth');
const MatchModel = require('../models/match.model');
const ChatModel  = require('../models/chat.model');
const UserModel  = require('../models/user.model');
const db = require('../config/db');

// ─── GET /match ───────────────────────────────────────────────────────────────
router.get('/', requireAuth, async (req, res) => {
  try {
    const myInterests = await UserModel.getInterests(req.session.user.id);
    if (myInterests.length === 0) {
      req.session.error = 'Add some interests to your profile to find matches!';
      return res.redirect('/profile');
    }
    const matches = await MatchModel.computeMatches(req.session.user.id);
    res.render('match/index', { title: 'Find Matches', matches, myInterests, pageScript: 'match.js' });
  } catch (err) {
    console.error('Match error:', err);
    res.render('match/index', { title: 'Find Matches', matches: [], myInterests: [], pageScript: 'match.js' });
  }
});

// ─── POST /match/:userId/chat ─────────────────────────────────────────────────
router.post('/:userId/chat', requireAuth, async (req, res) => {
  try {
    const targetId = parseInt(req.params.userId);
    if (targetId === req.session.user.id) {
      return res.status(400).json({ error: 'Cannot chat with yourself.' });
    }
    const { roomCode } = await ChatModel.findOrCreateRoom({ type: 'direct', userId: req.session.user.id });
    // Add target user to room
    const room = await ChatModel.getRoomByCode(roomCode);
    await db.query(
      'INSERT IGNORE INTO chat_participants (room_id, user_id) VALUES (?,?)',
      [room.id, targetId]
    );
    res.json({ success: true, redirect: `/chat/${roomCode}` });
  } catch (err) {
    console.error('Match chat error:', err);
    res.status(500).json({ error: 'Could not initiate chat.' });
  }
});

module.exports = router;
