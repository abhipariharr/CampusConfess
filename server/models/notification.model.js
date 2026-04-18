const db = require('../config/db');

const NotificationModel = {
  async create({ user_id, type, from_user_id = null, content, link = null }) {
    const [result] = await db.query(
      'INSERT INTO notifications (user_id, type, from_user_id, content, link) VALUES (?,?,?,?,?)',
      [user_id, type, from_user_id, content, link]
    );
    return result.insertId;
  },

  async getForUser(userId, limit = 20) {
    const [rows] = await db.query(
      `SELECT n.*, u.anon_username AS from_username, u.avatar_color AS from_avatar_color
       FROM notifications n
       LEFT JOIN users u ON n.from_user_id = u.id
       WHERE n.user_id = ?
       ORDER BY n.created_at DESC
       LIMIT ?`,
      [userId, limit]
    );
    return rows;
  },

  async getUnreadCount(userId) {
    const [rows] = await db.query(
      'SELECT COUNT(*) AS cnt FROM notifications WHERE user_id = ? AND is_read = 0',
      [userId]
    );
    return rows[0]?.cnt || 0;
  },

  async markRead(ids, userId) {
    if (!ids || ids.length === 0) return;
    const placeholders = ids.map(() => '?').join(',');
    await db.query(
      `UPDATE notifications SET is_read = 1 WHERE id IN (${placeholders}) AND user_id = ?`,
      [...ids, userId]
    );
  },

  async markAllRead(userId) {
    await db.query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [userId]);
  },

  async deleteOld(daysOld = 30) {
    await db.query(
      'DELETE FROM notifications WHERE is_read = 1 AND created_at < DATE_SUB(NOW(), INTERVAL ? DAY)',
      [daysOld]
    );
  },
};

module.exports = NotificationModel;
