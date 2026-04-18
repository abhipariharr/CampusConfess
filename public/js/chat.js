/* ─── Socket.io Chat Client ─────────────────────────────── */
(function () {
  if (typeof window.ROOM_CODE === 'undefined') return; // Only run on room page

  const socket      = io();
  const chatEl      = document.getElementById('chatMessages');
  const msgInput    = document.getElementById('msgInput');
  const sendBtn     = document.getElementById('sendBtn');
  const typingEl    = document.getElementById('typingIndicator');
  const revealBtn   = document.getElementById('revealBtn');
  const revealModal = new bootstrap.Modal(document.getElementById('revealModal'));
  const acceptBtn   = document.getElementById('acceptRevealBtn');
  const blockBtn    = document.getElementById('blockUserBtn');
  const reportBtn   = document.getElementById('reportUserBtn');

  let typingTimer;

  // ─── Set current room for navbar badge ────────────────────
  window.currentRoomCode = window.ROOM_CODE;

  // ─── Join room ────────────────────────────────────────────
  socket.emit('join_room', { roomCode: window.ROOM_CODE });

  // Mark messages as read when viewing this room
  socket.emit('mark_messages_read', { roomCode: window.ROOM_CODE });

  socket.on('room_joined', ({ participantCount }) => {
    if (participantCount >= 2) {
      appendSystemMsg('Chat started! Everything is anonymous until you both reveal.');
    } else {
      appendSystemMsg('Waiting for a partner to join...');
    }
    scrollBottom();
  });

  socket.on('user_joined', ({ label, participantCount }) => {
    if (participantCount >= 2) {
      document.getElementById('chatPartnerLabel').textContent = label || 'Anonymous Partner';
      appendSystemMsg(`${label || 'Someone'} joined the chat 👋`);
      scrollBottom();
    }
  });

  socket.on('user_left', ({ message }) => {
    appendSystemMsg(message || 'Your chat partner disconnected.');
    if (sendBtn) sendBtn.disabled = true;
  });

  socket.on('room_closed', () => {
    appendSystemMsg('This chat room has been closed.');
    if (sendBtn) sendBtn.disabled = true;
    if (msgInput) msgInput.disabled = true;
  });

  // ─── Messaging ───────────────────────────────────────────
  function sendMessage() {
    const content = msgInput.value.trim();
    if (!content) return;
    socket.emit('send_message', { roomCode: window.ROOM_CODE, content });
    appendMessage(content, window.MY_LABEL, true);
    msgInput.value = '';
    scrollBottom();
    socket.emit('typing', { roomCode: window.ROOM_CODE, isTyping: false });
  }

  sendBtn.addEventListener('click', sendMessage);
  msgInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });

  // Typing indicator
  msgInput.addEventListener('input', () => {
    socket.emit('typing', { roomCode: window.ROOM_CODE, isTyping: true });
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
      socket.emit('typing', { roomCode: window.ROOM_CODE, isTyping: false });
    }, 1500);
  });

  socket.on('user_typing', ({ isTyping }) => {
    typingEl.textContent = isTyping ? 'typing...' : '\u00a0';
  });

  socket.on('new_message', ({ content, label, senderId }) => {
    if (String(senderId) === String(window.MY_USER_ID)) return; // Already shown locally
    appendMessage(content, label, false);
    scrollBottom();
  });

  // ─── Real-time Notifications ─────────────────────────────────────────
  socket.on('new_notification', ({ notification }) => {
    // Update badge in navbar if present
    const badge = document.getElementById('notifBadge');
    if (badge) {
      const count = (parseInt(badge.textContent) || 0) + 1;
      badge.textContent = count;
      badge.style.display = 'block';
    }
    // If notification dropdown is open, refresh the list
    const notifList = document.getElementById('notifList');
    const notifDropdown = document.getElementById('notifDropdown');
    if (notifList && notifDropdown && notifDropdown.style.display === 'block') {
      socket.emit('get_notifications');
    }
  });

  // ─── Reveal System ───────────────────────────────────────
  revealBtn && revealBtn.addEventListener('click', async () => {
    revealBtn.disabled = true;
    revealBtn.innerHTML = '<i class="bi bi-hourglass-split me-1"></i>Waiting...';
    socket.emit('request_reveal', { roomCode: window.ROOM_CODE });
  });

  socket.on('reveal_sent', () => {
    appendSystemMsg('Reveal request sent. Waiting for your partner to accept...');
  });

  socket.on('reveal_requested', () => {
    appendSystemMsg('Your chat partner wants to reveal their identity!');
    revealModal.show();
  });

  acceptBtn && acceptBtn.addEventListener('click', async () => {
    revealModal.hide();
    socket.emit('accept_reveal', { roomCode: window.ROOM_CODE });
  });

  socket.on('reveal_accepted_one', () => {
    appendSystemMsg('You accepted the reveal. Waiting for your partner...');
  });

  socket.on('identities_revealed', ({ users }) => {
    const names = users.map(u => u.anon_username).join(' & ');
    appendSystemMsg(`🎭 Identities revealed! You are chatting with: ${names}`);
    if (revealBtn) revealBtn.style.display = 'none';
    users.forEach(u => {
      const label = document.getElementById('chatPartnerLabel');
      if (label && String(u.id) !== String(window.MY_USER_ID)) {
        label.textContent = u.anon_username;
      }
    });
  });

  // ─── Block & Report ──────────────────────────────────────
  blockBtn && blockBtn.addEventListener('click', async () => {
    if (!confirm('Block this user and end the chat?')) return;
    const r = await fetch(`/chat/${window.ROOM_CODE}/block`, { method: 'POST' });
    const d = await r.json();
    if (d.success) { appendSystemMsg('User blocked. Chat ended.'); msgInput.disabled = true; sendBtn.disabled = true; }
  });

  reportBtn && reportBtn.addEventListener('click', async () => {
    const reason = prompt('Brief reason for report:') || 'Inappropriate behavior';
    const r = await fetch(`/chat/${window.ROOM_CODE}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    const d = await r.json();
    if (d.success) appendSystemMsg('Report submitted. Our team will review shortly.');
  });

  // ─── Helpers ─────────────────────────────────────────────
  function appendMessage(content, label, isMine) {
    const wrap = document.createElement('div');
    wrap.className = `d-flex ${isMine ? 'justify-content-end' : 'justify-content-start'} mb-2`;
    const bubble = document.createElement('div');
    bubble.className = `message-bubble ${isMine ? 'message-mine' : 'message-theirs'}`;
    if (!isMine && label) {
      bubble.innerHTML = `<div class="message-label text-muted mb-1" style="font-size:.7rem">${escHtml(label)}</div>`;
    }
    const txt = document.createElement('div');
    txt.textContent = content;
    bubble.appendChild(txt);
    const time = document.createElement('div');
    time.style.cssText = 'font-size:.65rem;opacity:.6;text-align:right;margin-top:4px';
    time.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    bubble.appendChild(time);
    wrap.appendChild(bubble);
    chatEl.appendChild(wrap);
  }

  function appendSystemMsg(text) {
    const el = document.createElement('div');
    el.className = 'text-center text-muted small py-2';
    el.style.animation = 'fadeSlideIn .3s ease';
    el.innerHTML = `<i class="bi bi-info-circle me-1"></i>${escHtml(text)}`;
    chatEl.appendChild(el);
    scrollBottom();
  }

  function scrollBottom() {
    chatEl.scrollTop = chatEl.scrollHeight;
  }

  function escHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  // Scroll to bottom on load
  scrollBottom();
})();
