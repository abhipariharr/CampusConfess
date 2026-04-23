const db = require('../config/db');

const UserModel = {
  async findByEmail(email) {
  const [rows] = await db.query(
    'SELECT * FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1',
    [email]
  );
  return rows[0] || null;
},

  async findById(id) {
    const [rows] = await db.query('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
    return rows[0] || null;
  },

  async create({ email, password_hash, real_name, anon_username, avatar_color, gender }) {
    const [result] = await db.query(
      'INSERT INTO users (email, password_hash, real_name, anon_username, avatar_color, gender) VALUES (?,?,?,?,?,?)',
      [email, password_hash, real_name, anon_username, avatar_color || '#7c3aed', gender]
    );
    return result.insertId;
  },

  async updatePassword(userId, password_hash) {
    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [password_hash, userId]);
  },

  async updateProfile(userId, { bio, gender }) {
    if (bio !== undefined) {
      await db.query('UPDATE users SET bio = ? WHERE id = ?', [bio, userId]);
    }
    if (gender !== undefined) {
      await db.query('UPDATE users SET gender = ? WHERE id = ?', [gender || null, userId]);
    }
  },

  async getInterests(userId) {
    const [rows] = await db.query('SELECT interest FROM user_interests WHERE user_id = ?', [userId]);
    return rows.map(r => r.interest);
  },

  async setInterests(userId, interests) {
    await db.query('DELETE FROM user_interests WHERE user_id = ?', [userId]);
    if (interests && interests.length > 0) {
      const values = interests.map(i => [userId, i.trim().toLowerCase()]);
      await db.query('INSERT IGNORE INTO user_interests (user_id, interest) VALUES ?', [values]);
    }
  },

  async ban(userId) {
    await db.query('UPDATE users SET is_banned = 1 WHERE id = ?', [userId]);
  },

  async unban(userId) {
    await db.query('UPDATE users SET is_banned = 0 WHERE id = ?', [userId]);
  },

  async emailExists(email) {
    const [rows] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    return rows.length > 0;
  },

  async createPasswordReset(userId, token, expiresAt) {
    await db.query(
      'INSERT INTO password_resets (user_id, token, expires_at) VALUES (?,?,?)',
      [userId, token, expiresAt]
    );
  },

  async findPasswordReset(token) {
    const [rows] = await db.query(
      'SELECT * FROM password_resets WHERE token = ? AND used = 0 AND expires_at > NOW() LIMIT 1',
      [token]
    );
    return rows[0] || null;
  },

  async markResetUsed(token) {
    await db.query('UPDATE password_resets SET used = 1 WHERE token = ?', [token]);
  },

  async getAllForAdmin() {
    const [rows] = await db.query(
      'SELECT id, email, real_name, anon_username, role, is_banned, created_at FROM users ORDER BY created_at DESC'
    );
    return rows;
  },
};

module.exports = UserModel;
