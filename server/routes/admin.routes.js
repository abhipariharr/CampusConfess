const express   = require('express');
const router    = express.Router();
const { requireAdmin } = require('../middleware/auth');
const UserModel = require('../models/user.model');
const ConfessionModel = require('../models/confession.model');
const db        = require('../config/db');

async function logAction(adminId, action, targetUserId, details) {
  await db.query(
    'INSERT INTO admin_logs (admin_id, action, target_user_id, details) VALUES (?,?,?,?)',
    [adminId, action, targetUserId || null, details || null]
  );
}

// ─── GET /admin ───────────────────────────────────────────────────────────────
router.get('/', requireAdmin, async (req, res) => {
  try {
    const users   = await UserModel.getAllForAdmin();
    const reports = await ConfessionModel.getAllReports();
    const [logs]  = await db.query(
      `SELECT al.*, u.anon_username AS admin_username, tu.anon_username AS target_username
       FROM admin_logs al
       LEFT JOIN users u  ON al.admin_id       = u.id
       LEFT JOIN users tu ON al.target_user_id = tu.id
       ORDER BY al.created_at DESC LIMIT 50`
    );
    const [stats] = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM users)       AS total_users,
        (SELECT COUNT(*) FROM confessions) AS total_confessions,
        (SELECT COUNT(*) FROM reports WHERE status='pending') AS pending_reports,
        (SELECT COUNT(*) FROM users WHERE is_banned=1) AS banned_users
    `);
    const confessions = await ConfessionModel.getAllForAdmin();
    res.render('admin/dashboard', {
      title: 'Admin Panel',
      users,
      reports,
      logs,
      stats: stats[0],
      confessions,
    });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    req.session.error = 'Could not load admin dashboard.';
    res.redirect('/confessions');
  }
});

// ─── POST /admin/ban/:userId ──────────────────────────────────────────────────
router.post('/ban/:userId', requireAdmin, async (req, res) => {
  try {
    await UserModel.ban(req.params.userId);
    await logAction(req.session.user.id, 'BAN_USER', req.params.userId, req.body.reason || 'Admin action');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to ban user.' });
  }
});

// ─── POST /admin/unban/:userId ────────────────────────────────────────────────
router.post('/unban/:userId', requireAdmin, async (req, res) => {
  try {
    await UserModel.unban(req.params.userId);
    await logAction(req.session.user.id, 'UNBAN_USER', req.params.userId, '');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to unban user.' });
  }
});

// ─── POST /admin/report/:id/review ────────────────────────────────────────────
router.post('/report/:id/review', requireAdmin, async (req, res) => {
  try {
    const { status, note } = req.body;
    await ConfessionModel.updateReportStatus(req.params.id, status, note || '');
    await logAction(req.session.user.id, 'UPDATE_REPORT', null, `Report #${req.params.id} → ${status}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update report.' });
  }
});

// ─── DELETE /admin/confession/:id ─────────────────────────────────────────────
router.delete('/confession/:id', requireAdmin, async (req, res) => {
  try {
    await ConfessionModel.deleteAsAdmin(req.params.id);
    await logAction(req.session.user.id, 'DELETE_CONFESSION', null, `Confession #${req.params.id} deleted by admin`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete confession.' });
  }
});

// ─── GET /admin/confessions ───────────────────────────────────────────────────
router.get('/confessions', requireAdmin, async (req, res) => {
  try {
    const confessions = await ConfessionModel.getAllForAdmin();
    res.render('admin/confessions', { title: 'Manage Confessions', confessions });
  } catch (err) {
    console.error('Admin confessions error:', err);
    req.session.error = 'Could not load confessions.';
    res.redirect('/admin');
  }
});

module.exports = router;
