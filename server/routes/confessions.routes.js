const express  = require('express');
const router   = express.Router();
const { body, validationResult } = require('express-validator');
const { requireAuth }   = require('../middleware/auth');
const { apiRateLimit }  = require('../middleware/rateLimiter');
const ConfessionModel   = require('../models/confession.model');
const { filterBadWords, containsBadWords } = require('../utils/badWords');

// ─── GET /confessions ─────────────────────────────────────────────────────────
router.get('/', requireAuth, async (req, res) => {
  try {
    const sort  = req.query.sort === 'trending' ? 'trending' : 'latest';
    const page  = Math.max(1, parseInt(req.query.page) || 1);
    const limit = 15;
    const offset = (page - 1) * limit;

    const confessions = await ConfessionModel.getFeed({ sort, limit, offset });

    // Determine which confessions the current user has liked
    const ids = confessions.map(c => c.id);
    const likedIds = ids.length > 0
      ? await ConfessionModel.getLikedIds(req.session.user.id, ids)
      : [];

    res.render('feed/index', {
      title: 'Feed',
      confessions,
      likedIds,
      sort,
      page,
      pageScript: 'confessions.js',
    });
  } catch (err) {
    console.error('Feed error:', err);
    req.session.error = 'Could not load confessions.';
    res.render('feed/index', { title: 'Feed', confessions: [], likedIds: [], sort: 'latest', page: 1, pageScript: 'confessions.js' });
  }
});

// ─── GET /confessions/new ─────────────────────────────────────────────────────
router.get('/new', requireAuth, (req, res) => {
  res.render('feed/post', { title: 'Post Confession' });
});

// ─── POST /confessions ────────────────────────────────────────────────────────
router.post('/', requireAuth, [
  body('content').trim().isLength({ min: 10, max: 1500 }).withMessage('Confession must be 10–1500 characters.'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.session.error = errors.array()[0].msg;
    return res.redirect('/confessions/new');
  }
  try {
    let { content, tags } = req.body;
    content = filterBadWords(content);
    const tagArr = (tags || '').split(',').map(t => t.trim().toLowerCase()).filter(Boolean).slice(0, 5);
    await ConfessionModel.create({ user_id: req.session.user.id, content, tags: tagArr.join(',') });
    req.session.success = 'Your confession has been posted anonymously! 🎭';
    res.redirect('/confessions');
  } catch (err) {
    console.error('Post error:', err);
    req.session.error = 'Failed to post confession.';
    res.redirect('/confessions/new');
  }
});

// ─── POST /confessions/:id/like ───────────────────────────────────────────────
router.post('/:id/like', requireAuth, apiRateLimit, async (req, res) => {
  try {
    const result = await ConfessionModel.toggleLike(req.params.id, req.session.user.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle like.' });
  }
});

// ─── POST /confessions/:id/comment ───────────────────────────────────────────
router.post('/:id/comment', requireAuth, [
  body('content').trim().isLength({ min: 1, max: 500 }).withMessage('Comment must be 1-500 characters.'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.session.error = errors.array()[0].msg;
    return res.redirect(`/confessions`);
  }
  try {
    const content = filterBadWords(req.body.content);
    await ConfessionModel.addComment({
      confession_id: req.params.id,
      user_id: req.session.user.id,
      content,
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to post comment.' });
  }
});

// ─── GET /confessions/:id/comments ───────────────────────────────────────────
router.get('/:id/comments', requireAuth, async (req, res) => {
  try {
    const comments = await ConfessionModel.getComments(req.params.id);
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load comments.' });
  }
});

// ─── POST /confessions/:id/report ────────────────────────────────────────────
router.post('/:id/report', requireAuth, async (req, res) => {
  try {
    const { reason, comment_id } = req.body;
    await ConfessionModel.report({
      reporter_id:   req.session.user.id,
      confession_id: comment_id ? null : req.params.id,
      comment_id:    comment_id || null,
      reason:        reason || 'Inappropriate content',
    });
    res.json({ success: true, message: 'Report submitted. Thank you.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to report.' });
  }
});

// ─── DELETE /confessions/:id ──────────────────────────────────────────────────
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await ConfessionModel.delete(req.params.id, req.session.user.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete.' });
  }
});

module.exports = router;
