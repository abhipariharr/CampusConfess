const ChatModel = require('../models/chat.model');
const NotificationModel = require('../models/notification.model');
const { filterBadWords } = require('../utils/badWords');
const db = require('../config/db');

module.exports = function (io) {
  // Track connected users: userId → Set<socketId>
  const userSockets = new Map();
  // Track socket -> { userId, roomCode }
  const socketUsers = new Map();

  // Helper: join a user to their personal notification room
  function joinUserRoom(userId, socket) {
    const room = `user:${userId}`;
    socket.join(room);
    if (!userSockets.has(userId)) userSockets.set(userId, new Set());
    userSockets.get(userId).add(socket.id);
  }

  io.on('connection', (socket) => {
    const session = socket.request.session;
    if (!session || !session.user) {
      socket.disconnect();
      return;
    }
    const userId = session.user.id;
    const anonUsername = session.user.anon_username;

    joinUserRoom(userId, socket);

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

    // ─── Leave Room ────────────────────────────────────────────────────────
    socket.on('leave_room', async ({ roomCode }) => {
      try {
        const room = await ChatModel.getRoomByCode(roomCode);
        if (!room) return;

        socket.leave(roomCode);
        socket.to(roomCode).emit('user_left', { message: 'Your chat partner ended the chat.' });
        socketUsers.delete(socket.id);
      } catch (err) {
        console.error('leave_room error:', err);
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
        const myProfile = participants.find(p => p.user_id === userId);
        if (!myProfile) return;

        const filtered = filterBadWords(content.trim());
        await ChatModel.saveMessage({ room_id: room.id, sender_id: userId, content: filtered });

        io.to(roomCode).emit('new_message', {
          content: filtered,
          label: myProfile.anon_label,
          isMine: false, // client overrides for self
          senderId: userId,
          timestamp: new Date().toISOString(),
        });

        // Notify offline participants via notification
        const other = participants.find(p => p.user_id !== userId);
        if (other) {
          const notifId = await NotificationModel.create({
            user_id: other.user_id,
            type: 'message',
            from_user_id: userId,
            content: `New message from ${myProfile.anon_label}`,
            link: `/chat/${roomCode}`,
          });
          io.to(`user:${other.user_id}`).emit('new_notification', {
            notification: { id: notifId, user_id: other.user_id, type: 'message', from_user_id: userId, content: `New message from ${myProfile.anon_label}`, link: `/chat/${roomCode}`, is_read: 0, created_at: new Date().toISOString() }
          });
        }
      } catch (err) {
        console.error('send_message error:', err);
      }
    });

    // ─── Request Reveal ────────────────────────────────────────────────────
    socket.on('request_reveal', async ({ roomCode }) => {
      try {
        const room = await ChatModel.getRoomByCode(roomCode);
        if (!room) return;

        const participants = await ChatModel.getParticipants(room.id);
        const target = participants.find(p => p.user_id !== userId);

        await ChatModel.requestReveal(room.id, userId, target?.user_id);

        socket.to(roomCode).emit('reveal_requested', { from: 'your chat partner' });
        socket.emit('reveal_sent');

        // Notify target user if they're offline
        if (target) {
          const notifId = await NotificationModel.create({
            user_id: target.user_id,
            type: 'reveal_request',
            from_user_id: userId,
            content: `${target.anon_label} wants to reveal identities`,
            link: `/chat/${roomCode}`,
          });
          io.to(`user:${target.user_id}`).emit('new_notification', {
            notification: { id: notifId, user_id: target.user_id, type: 'reveal_request', from_user_id: userId, content: `${target.anon_label} wants to reveal identities`, link: `/chat/${roomCode}`, is_read: 0, created_at: new Date().toISOString() }
          });
        }
      } catch (err) {
        console.error('request_reveal error:', err);
      }
    });

    // ─── Accept Reveal ─────────────────────────────────────────────────────
    socket.on('accept_reveal', async ({ roomCode }) => {
      try {
        const room = await ChatModel.getRoomByCode(roomCode);
        if (!room) return;

        const participants = await ChatModel.getParticipants(room.id);
        const bothAccepted = await ChatModel.acceptReveal(room.id, userId);

        if (bothAccepted) {
          const userIds = participants.map(p => p.user_id);
          const [users] = await db.query(
            'SELECT id, anon_username, avatar_color FROM users WHERE id IN (?)',
            [userIds]
          );
          io.to(roomCode).emit('identities_revealed', { users });

          // Notify both users of reveal completion
          for (const p of participants) {
            if (p.user_id !== userId) {
              const notifId = await NotificationModel.create({
                user_id: p.user_id,
                type: 'reveal_accepted',
                from_user_id: userId,
                content: 'Identities have been revealed!',
                link: `/chat/${roomCode}`,
              });
              io.to(`user:${p.user_id}`).emit('new_notification', {
                notification: { id: notifId, user_id: p.user_id, type: 'reveal_accepted', from_user_id: userId, content: 'Identities have been revealed!', link: `/chat/${roomCode}`, is_read: 0, created_at: new Date().toISOString() }
              });
            }
          }
        } else {
          socket.to(roomCode).emit('reveal_accepted_one');

          // Notify partner that user accepted reveal
          const target = participants.find(p => p.user_id !== userId);
          if (target) {
            const notifId = await NotificationModel.create({
              user_id: target.user_id,
              type: 'reveal_accepted',
              from_user_id: userId,
              content: 'Your chat partner accepted the reveal request',
              link: `/chat/${roomCode}`,
            });
            io.to(`user:${target.user_id}`).emit('new_notification', {
              notification: { id: notifId, user_id: target.user_id, type: 'reveal_accepted', from_user_id: userId, content: 'Your chat partner accepted the reveal request', link: `/chat/${roomCode}`, is_read: 0, created_at: new Date().toISOString() }
            });
          }
        }
      } catch (err) {
        console.error('accept_reveal error:', err);
      }
    });

    // ─── Typing Indicator ──────────────────────────────────────────────────
    socket.on('typing', ({ roomCode, isTyping }) => {
      socket.to(roomCode).emit('user_typing', { isTyping });
    });

    // ─── Fetch Notifications ─────────────────────────────────────────────────
    socket.on('get_notifications', async () => {
      try {
        const notifications = await NotificationModel.getForUser(userId);
        socket.emit('notifications', { notifications });
      } catch (err) {
        console.error('get_notifications error:', err);
      }
    });

    // ─── Mark Notifications Read ─────────────────────────────────────────────
    socket.on('mark_read', async ({ ids }) => {
      try {
        await NotificationModel.markRead(ids, userId);
        socket.emit('notifications_read', { ids });
      } catch (err) {
        console.error('mark_read error:', err);
      }
    });

    // ─── Disconnect ────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      const info = socketUsers.get(socket.id);
      if (info) {
        socket.to(info.roomCode).emit('user_left', { message: 'Your chat partner disconnected.' });
        socketUsers.delete(socket.id);
      }
      // Clean up socket tracking
      const sockets = userSockets.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) userSockets.delete(userId);
      }
    });
  });
};
