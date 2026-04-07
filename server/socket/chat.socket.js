const ChatModel = require('../models/chat.model');
const { filterBadWords } = require('../utils/badWords');
const db = require('../config/db');

module.exports = function (io) {
  // Track connected users: socketId → { userId, roomCode }
  const socketUsers = new Map();

  io.on('connection', (socket) => {
    const session = socket.request.session;
    if (!session || !session.user) {
      socket.disconnect();
      return;
    }
    const userId = session.user.id;
    const anonUsername = session.user.anon_username;

    // ─── Join Room ─────────────────────────────────────────────────────────
    socket.on('join_room', async ({ roomCode }) => {
      try {
        const room = await ChatModel.getRoomByCode(roomCode);
        if (!room) return;

        const participants = await ChatModel.getParticipants(room.id);
        const isMember = participants.some(p => p.user_id === userId);
        if (!isMember) return;

        socket.join(roomCode);
        socketUsers.set(socket.id, { userId, roomCode, roomId: room.id });

        const myProfile = participants.find(p => p.user_id === userId);

        socket.emit('room_joined', {
          roomCode,
          myLabel: myProfile?.anon_label,
          participantCount: participants.length,
        });

        // Notify others in the room
        socket.to(roomCode).emit('user_joined', {
          label: myProfile?.anon_label,
          participantCount: participants.length,
        });
      } catch (err) {
        console.error('join_room error:', err);
      }
    });

    // ─── Send Message ──────────────────────────────────────────────────────
    socket.on('send_message', async ({ roomCode, content }) => {
      try {
        if (!content || content.trim().length === 0) return;
        if (content.length > 1000) return;

        const info = socketUsers.get(socket.id);
        if (!info || info.roomCode !== roomCode) return;

        const room = await ChatModel.getRoomByCode(roomCode);
        if (!room || !room.is_active) {
          socket.emit('room_closed');
          return;
        }

        const participants = await ChatModel.getParticipants(room.id);
        const myProfile    = participants.find(p => p.user_id === userId);
        if (!myProfile) return;

        const filtered = filterBadWords(content.trim());
        await ChatModel.saveMessage({ room_id: room.id, sender_id: userId, content: filtered });

        io.to(roomCode).emit('new_message', {
          content: filtered,
          label:   myProfile.anon_label,
          isMine:  false, // client overrides for self
          senderId: userId,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        console.error('send_message error:', err);
      }
    });

    // ─── Request Reveal ────────────────────────────────────────────────────
    socket.on('request_reveal', async ({ roomCode }) => {
      try {
        const room = await ChatModel.getRoomByCode(roomCode);
        if (!room) return;
        await ChatModel.requestReveal(room.id, userId);
        socket.to(roomCode).emit('reveal_requested', { from: 'your chat partner' });
        socket.emit('reveal_sent');
      } catch (err) {
        console.error('reveal error:', err);
      }
    });

    // ─── Accept Reveal ─────────────────────────────────────────────────────
    socket.on('accept_reveal', async ({ roomCode }) => {
      try {
        const room = await ChatModel.getRoomByCode(roomCode);
        if (!room) return;
        const bothAccepted = await ChatModel.acceptReveal(room.id, userId);
        if (bothAccepted) {
          // Fetch real usernames for both participants
          const participants = await ChatModel.getParticipants(room.id);
          const userIds = participants.map(p => p.user_id);
          const [users] = await db.query(
            'SELECT id, anon_username, avatar_color FROM users WHERE id IN (?)',
            [userIds]
          );
          io.to(roomCode).emit('identities_revealed', { users });
        } else {
          socket.to(roomCode).emit('reveal_accepted_one');
        }
      } catch (err) {
        console.error('accept_reveal error:', err);
      }
    });

    // ─── Typing Indicator ──────────────────────────────────────────────────
    socket.on('typing', ({ roomCode, isTyping }) => {
      socket.to(roomCode).emit('user_typing', { isTyping });
    });

    // ─── Disconnect ────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      const info = socketUsers.get(socket.id);
      if (info) {
        socket.to(info.roomCode).emit('user_left', { message: 'Your chat partner disconnected.' });
        socketUsers.delete(socket.id);
      }
    });
  });
};
