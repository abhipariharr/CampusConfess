/* ─── Matchmaking JS ──────────────────────────────────── */
(function () {
  document.querySelectorAll('.start-match-chat').forEach(btn => {
    btn.addEventListener('click', async () => {
      const userId = btn.dataset.userId;
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Starting...';
      try {
        const r = await fetch(`/match/${userId}/chat`, { method: 'POST' });
        const d = await r.json();
        if (d.redirect) {
          window.location.href = d.redirect;
        } else {
          btn.disabled = false;
          btn.innerHTML = '<i class="bi bi-chat-dots me-2"></i>Start Anon Chat';
          alert(d.error || 'Could not start chat.');
        }
      } catch (e) {
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-chat-dots me-2"></i>Start Anon Chat';
        console.error('Match chat error:', e);
      }
    });
  });
})();
