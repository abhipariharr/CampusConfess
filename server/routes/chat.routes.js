const express   = require('express');
const router    = express.Router();
const { requireAuth } = require('../middleware/auth');
const ChatModel = require('../models/chat.model');

const INTERESTS = ['music','gaming','tech','art','sports','books','travel','movies','food','fitness','fashion','science'];

// ─── GET /chat ────────────────────────────────────────────────────────────────
router.get('/', requireAuth, async (req, res) => {
  try {
    const rooms = await ChatModel.getUserRooms(req.session.user.id);
    res.render('chat/index', { title: 'Chat', rooms, interests: INTERESTS, roomCode: null, messages: [], participants: [], pageScript: 'chat.js', includeSocket: true });
  } catch (err) {
    console.error('Chat index error:', err);
    res.render('chat/index', { title: 'Chat', rooms: [], interests: INTERESTS, roomCode: null, messages: [], participants: [], pageScript: 'chat.js', includeSocket: true });
  }
});

// ─── POST /chat/random ────────────────────────────────────────────────────────
router.post('/random', requireAuth, async (req, res) => {
  try {
    const { roomId, roomCode } = await ChatModel.findOrCreateRoom({ type: 'random', userId: req.session.user.id });
    res.redirect(`/chat/${roomCode}`);
  } catch (err) {
    console.error('Random chat error:', err);
    req.session.error = 'Could not start chat.';
    res.redirect('/chat');
  }
});

// ─── POST /chat/interest ──────────────────────────────────────────────────────
router.post('/interest', requireAuth, async (req, res) => {
  try {
    const { interest } = req.body;
    if (!INTERESTS.includes(interest)) {
      req.session.error = 'Invalid interest selected.';
      return res.redirect('/chat');
    }
    const { roomCode } = await ChatModel.findOrCreateRoom({ type: 'interest', interest, userId: req.session.user.id });
    res.redirect(`/chat/${roomCode}`);
  } catch (err) {
    console.error('Interest chat error:', err);
    req.session.error = 'Could not start chat.';
    res.redirect('/chat');
  }
});

// ─── GET /chat/:roomCode ──────────────────────────────────────────────────────
router.get('/:roomCode', requireAuth, async (req, res) => {
  try {
    const room = await ChatModel.getRoomByCode(req.params.roomCode);
    if (!room) {
      req.session.error = 'Chat room not found.';
      return res.redirect('/chat');
    }
    const participants = await ChatModel.getParticipants(room.id);
    const isMember = participants.some(p => p.user_id === req.session.user.id);
    if (!isMember) {
      req.session.error = 'You are not part of this chat.';
      return res.redirect('/chat');
    }
    const messages  = await ChatModel.getMessages(room.id);
    const myProfile = participants.find(p => p.user_id === req.session.user.id);
    res.render('chat/room', {
      title: 'Anonymous Chat Room',
      room,
      participants,
      messages,
      myProfile,
      pageScript:    'chat.js',
      includeSocket: true,
    });
  } catch (err) {
    console.error('Chat room error:', err);
    req.session.error = 'Could not load chat room.';
    res.redirect('/chat');
  }
});

// ─── POST /chat/:roomCode/reveal ──────────────────────────────────────────────
router.post('/:roomCode/reveal', requireAuth, async (req, res) => {
  try {
    const room = await ChatModel.getRoomByCode(req.params.roomCode);
    if (!room) return res.status(404).json({ error: 'Room not found.' });
    await ChatModel.requestReveal(room.id, req.session.user.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to request reveal.' });
  }
});

// ─── POST /chat/:roomCode/reveal/accept ───────────────────────────────────────
router.post('/:roomCode/reveal/accept', requireAuth, async (req, res) => {
  try {
    const room      = await ChatModel.getRoomByCode(req.params.roomCode);
    if (!room) return res.status(404).json({ error: 'Room not found.' });
    const bothAccepted = await ChatModel.acceptReveal(room.id, req.session.user.id);
    res.json({ success: true, bothAccepted });
  } catch (err) {
    res.status(500).json({ error: 'Failed to accept reveal.' });
  }
});

// ─── POST /chat/:roomCode/block ───────────────────────────────────────────────
router.post('/:roomCode/block', requireAuth, async (req, res) => {
  try {
    const room = await ChatModel.getRoomByCode(req.params.roomCode);
    if (!room) return res.status(404).json({ error: 'Room not found.' });
    await ChatModel.blockUser(room.id, req.session.user.id);
    req.session.success = 'User blocked and chat ended.';
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to block user.' });
  }
});

// ─── POST /chat/:roomCode/report ──────────────────────────────────────────────
router.post('/:roomCode/report', requireAuth, async (req, res) => {
  try {
    const room = await ChatModel.getRoomByCode(req.params.roomCode);
    if (!room) return res.status(404).json({ error: 'Room not found.' });
    const participants = await ChatModel.getParticipants(room.id);
    const other = participants.find(p => p.user_id !== req.session.user.id);
    if (other) {
      await ChatModel.reportUser({
        reporter_id: req.session.user.id,
        reported_user_id: other.user_id,
        room_id: room.id,
        reason: req.body.reason || 'Inappropriate behavior in chat',
      });
    }
    res.json({ success: true, message: 'Report submitted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to report.' });
  }
});

// ─── GET /notifications ────────────────────────────────────────────────────────
router.get('/notifications', requireAuth, async (req, res) => {
  try {
    const NotificationModel = require('../models/notification.model');
    const notifications = await NotificationModel.getForUser(req.session.user.id);
    const unreadCount = await NotificationModel.getUnreadCount(req.session.user.id);
    res.json({ notifications, unreadCount });
  } catch (err) {
    console.error('Notifications error:', err);
    res.status(500).json({ error: 'Failed to load notifications.' });
  }
});

// ─── POST /notifications/read ─────────────────────────────────────────────────
router.post('/notifications/read', requireAuth, async (req, res) => {
  try {
    const NotificationModel = require('../models/notification.model');
    const { ids } = req.body;
    if (ids && ids.length) {
      await NotificationModel.markRead(ids, req.session.user.id);
    } else {
      await NotificationModel.markAllRead(req.session.user.id);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark as read.' });
  }
});

module.exports = router;
