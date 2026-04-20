const db  = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const { getChatLabel }  = require('../utils/anonName');

const ChatModel = {
  async findOrCreateRoom({ type = 'random', interest = null, userId }) {
    // Get current user's gender for opposite-gender matching
    const [userRows] = await db.query('SELECT gender FROM users WHERE id = ?', [userId]);
    const userGender = userRows[0]?.gender;

    // Look for a waiting room of this type with 1 participant (not the current user)
    // For random chat, also filter by opposite gender
    let query = `
      SELECT cr.id, cr.room_code FROM chat_rooms cr
      JOIN chat_participants cp ON cr.id = cp.room_id
      JOIN users u ON cp.user_id = u.id
      WHERE cr.room_type = ? AND cr.is_active = 1
        AND cp.user_id != ?
        AND (SELECT COUNT(*) FROM chat_participants WHERE room_id = cr.id) = 1
    `;
    const params = [type, userId];

    // Opposite gender filter for random chat
    if (type === 'random' && userGender && ['male', 'female'].includes(userGender)) {
      const oppositeGender = userGender === 'male' ? 'female' : 'male';
      query += ' AND u.gender = ?';
      params.push(oppositeGender);
    }

    if (type === 'interest' && interest) {
      query = `
        SELECT cr.id, cr.room_code FROM chat_rooms cr
        JOIN chat_participants cp ON cr.id = cp.room_id
        JOIN users u ON cp.user_id = u.id
        WHERE cr.room_type = 'interest' AND cr.interest_tag = ? AND cr.is_active = 1
          AND cp.user_id != ?
          AND (SELECT COUNT(*) FROM chat_participants WHERE room_id = cr.id) = 1
      `;
      params.unshift(interest);
    }

    query += ' LIMIT 1';

    const [waiting] = await db.query(query, params);
    if (waiting.length > 0) {
      const room = waiting[0];
      const label = getChatLabel();
      await db.query(
        'INSERT INTO chat_participants (room_id, user_id, anon_label) VALUES (?,?,?)',
        [room.id, userId, label]
      );
      return { roomId: room.id, roomCode: room.room_code, isNew: false };
    }

    // Create new room
    const roomCode = uuidv4();
    const [result] = await db.query(
      'INSERT INTO chat_rooms (room_code, room_type, interest_tag) VALUES (?,?,?)',
      [roomCode, type, interest || null]
    );
    const roomId = result.insertId;
    const label  = getChatLabel();
    await db.query(
      'INSERT INTO chat_participants (room_id, user_id, anon_label) VALUES (?,?,?)',
      [roomId, userId, label]
    );
    return { roomId, roomCode, isNew: true };
  },

  async getRoomByCode(roomCode) {
    const [rows] = await db.query('SELECT * FROM chat_rooms WHERE room_code = ? LIMIT 1', [roomCode]);
    return rows[0] || null;
  },

  async getParticipants(roomId) {
    const [rows] = await db.query(
      `SELECT cp.*, u.anon_username, u.avatar_color
       FROM chat_participants cp JOIN users u ON cp.user_id = u.id
       WHERE cp.room_id = ?`,
      [roomId]
    );
    return rows;
  },

  async getParticipant(roomId, userId) {
    const [rows] = await db.query(
      'SELECT * FROM chat_participants WHERE room_id = ? AND user_id = ? LIMIT 1',
      [roomId, userId]
    );
    return rows[0] || null;
  },

  async saveMessage({ room_id, sender_id, content, is_system = false }) {
    const [result] = await db.query(
      'INSERT INTO chat_messages (room_id, sender_id, content, is_system) VALUES (?,?,?,?)',
      [room_id, sender_id, content, is_system ? 1 : 0]
    );
    return result.insertId;
  },

  async getMessages(roomId, limit = 60) {
    const [rows] = await db.query(
      `SELECT cm.*, cp.anon_label
       FROM chat_messages cm
       JOIN chat_participants cp ON cm.room_id = cp.room_id AND cm.sender_id = cp.user_id
       WHERE cm.room_id = ?
       ORDER BY cm.created_at ASC
       LIMIT ?`,
      [roomId, limit]
    );
    return rows;
  },

  async requestReveal(roomId, requesterId, targetId) {
    await db.query(
      'UPDATE chat_participants SET reveal_requested = 1 WHERE room_id = ? AND user_id = ?',
      [roomId, requesterId]
    );
  },

  async acceptReveal(roomId, userId) {
    await db.query(
      'UPDATE chat_participants SET reveal_accepted = 1 WHERE room_id = ? AND user_id = ?',
      [roomId, userId]
    );
    // Check if both accepted
    const [rows] = await db.query(
      'SELECT COUNT(*) as cnt FROM chat_participants WHERE room_id = ? AND reveal_accepted = 1',
      [roomId]
    );
    if (rows[0].cnt >= 2) {
      await db.query('UPDATE chat_rooms SET revealed_at = NOW() WHERE id = ?', [roomId]);
    }
    return rows[0].cnt >= 2;
  },

  async hideReveal(roomId, userId) {
    await db.query('UPDATE chat_rooms SET revealed_at = NULL WHERE id = ?', [roomId]);
    await db.query('UPDATE chat_participants SET reveal_requested = 0, reveal_accepted = 0 WHERE room_id = ?', [roomId]);
  },

  async blockUser(roomId, userId) {
    await db.query(
      'UPDATE chat_participants SET is_blocked = 1 WHERE room_id = ? AND user_id != ?',
      [roomId, userId]
    );
    await db.query('UPDATE chat_rooms SET is_active = 0 WHERE id = ?', [roomId]);
  },

  async leaveRoom(roomId, userId) {
    await db.query('DELETE FROM chat_participants WHERE room_id = ? AND user_id = ?', [roomId, userId]);
    const [remaining] = await db.query('SELECT COUNT(*) as cnt FROM chat_participants WHERE room_id = ?', [roomId]);
    if (remaining[0].cnt === 0) {
      await db.query('DELETE FROM chat_messages WHERE room_id = ?', [roomId]);
      await db.query('DELETE FROM chat_rooms WHERE id = ?', [roomId]);
    }
  },

  async reportUser({ reporter_id, reported_user_id, room_id, reason }) {
    await db.query(
      'INSERT INTO reports (reporter_id, reported_user_id, reason) VALUES (?,?,?)',
      [reporter_id, reported_user_id, reason]
    );
  },

  async getUserRooms(userId) {
    const [rows] = await db.query(
      `SELECT cr.*, cp.anon_label, cp.joined_at,
              (SELECT COUNT(*) FROM chat_messages WHERE room_id = cr.id) AS msg_count
       FROM chat_rooms cr
       JOIN chat_participants cp ON cr.id = cp.room_id
       WHERE cp.user_id = ? AND cr.is_active = 1
       ORDER BY cp.joined_at DESC`,
      [userId]
    );
    return rows;
  },
};

module.exports = ChatModel;
