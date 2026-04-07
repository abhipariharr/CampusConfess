const db = require('../config/db');

const ConfessionModel = {
  async create({ user_id, content, tags }) {
    const [result] = await db.query(
      'INSERT INTO confessions (user_id, content, tags) VALUES (?,?,?)',
      [user_id, content, tags || '']
    );
    return result.insertId;
  },

  async getFeed({ sort = 'latest', limit = 20, offset = 0 }) {
    const order = sort === 'trending' ? 'c.like_count DESC, c.created_at DESC' : 'c.created_at DESC';
    const [rows] = await db.query(
      `SELECT c.*, u.anon_username, u.avatar_color
       FROM confessions c
       JOIN users u ON c.user_id = u.id
       WHERE c.is_flagged = 0
       ORDER BY ${order}
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    return rows;
  },

  async getById(id) {
    const [rows] = await db.query(
      `SELECT c.*, u.anon_username, u.avatar_color
       FROM confessions c JOIN users u ON c.user_id = u.id
       WHERE c.id = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  },

  async getComments(confessionId) {
    const [rows] = await db.query(
      `SELECT cc.*, u.anon_username, u.avatar_color
       FROM confession_comments cc JOIN users u ON cc.user_id = u.id
       WHERE cc.confession_id = ? AND cc.is_flagged = 0
       ORDER BY cc.created_at ASC`,
      [confessionId]
    );
    return rows;
  },

  async addComment({ confession_id, user_id, content }) {
    const [result] = await db.query(
      'INSERT INTO confession_comments (confession_id, user_id, content) VALUES (?,?,?)',
      [confession_id, user_id, content]
    );
    await db.query('UPDATE confessions SET comment_count = comment_count + 1 WHERE id = ?', [confession_id]);
    return result.insertId;
  },

  async toggleLike(confession_id, user_id) {
    const [existing] = await db.query(
      'SELECT id FROM confession_likes WHERE confession_id = ? AND user_id = ?',
      [confession_id, user_id]
    );
    if (existing.length > 0) {
      await db.query('DELETE FROM confession_likes WHERE confession_id = ? AND user_id = ?', [confession_id, user_id]);
      await db.query('UPDATE confessions SET like_count = GREATEST(like_count - 1, 0) WHERE id = ?', [confession_id]);
      return { liked: false };
    } else {
      await db.query('INSERT INTO confession_likes (confession_id, user_id) VALUES (?,?)', [confession_id, user_id]);
      await db.query('UPDATE confessions SET like_count = like_count + 1 WHERE id = ?', [confession_id]);
      return { liked: true };
    }
  },

  async hasLiked(confession_id, user_id) {
    const [rows] = await db.query(
      'SELECT id FROM confession_likes WHERE confession_id = ? AND user_id = ?',
      [confession_id, user_id]
    );
    return rows.length > 0;
  },

  async getLikedIds(userId, confessionIds) {
    if (!confessionIds.length) return [];
    const [rows] = await db.query(
      'SELECT confession_id FROM confession_likes WHERE user_id = ? AND confession_id IN (?)',
      [userId, confessionIds]
    );
    return rows.map(r => r.confession_id);
  },

  async report({ reporter_id, confession_id, comment_id, reason }) {
    await db.query(
      'INSERT INTO reports (reporter_id, confession_id, comment_id, reason) VALUES (?,?,?,?)',
      [reporter_id, confession_id || null, comment_id || null, reason]
    );
    if (confession_id) await db.query('UPDATE confessions SET is_flagged = 1 WHERE id = ?', [confession_id]);
    if (comment_id) await db.query('UPDATE confession_comments SET is_flagged = 1 WHERE id = ?', [comment_id]);
  },

  async delete(id, user_id) {
    await db.query('DELETE FROM confessions WHERE id = ? AND user_id = ?', [id, user_id]);
  },

  async getAllReports() {
    const [rows] = await db.query(
      `SELECT r.*, u.anon_username AS reporter_anon,
              c.content AS confession_content
       FROM reports r
       JOIN users u ON r.reporter_id = u.id
       LEFT JOIN confessions c ON r.confession_id = c.id
       ORDER BY r.created_at DESC`
    );
    return rows;
  },

  async updateReportStatus(id, status, admin_note) {
    await db.query('UPDATE reports SET status = ?, admin_note = ? WHERE id = ?', [status, admin_note, id]);
  },
};

module.exports = ConfessionModel;
