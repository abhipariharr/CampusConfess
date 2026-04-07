/* ─── Confessions Feed JS ─────────────────────────────── */
(function () {
  const reportModal = document.getElementById('reportModal')
    ? new bootstrap.Modal(document.getElementById('reportModal')) : null;
  let activeReportId = null;

  // ─── Like Toggle ────────────────────────────────────────
  document.querySelectorAll('.like-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id  = btn.dataset.id;
      btn.disabled = true;
      try {
        const r = await fetch(`/confessions/${id}/like`, { method: 'POST' });
        const d = await r.json();
        const countEl = document.getElementById(`like-count-${id}`);
        const icon    = btn.querySelector('i');
        if (d.liked) {
          btn.classList.add('liked');
          icon.className = 'bi bi-heart-fill';
          if (countEl) countEl.textContent = parseInt(countEl.textContent || 0) + 1;
        } else {
          btn.classList.remove('liked');
          icon.className = 'bi bi-heart';
          if (countEl) countEl.textContent = Math.max(0, parseInt(countEl.textContent || 0) - 1);
        }
      } catch (e) { console.error('Like error:', e); }
      btn.disabled = false;
    });
  });

  // ─── Comments Toggle ─────────────────────────────────────
  document.querySelectorAll('.comment-toggle-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id     = btn.dataset.id;
      const panel  = document.getElementById(`comments-${id}`);
      const listEl = document.getElementById(`comment-list-${id}`);

      if (panel.classList.contains('d-none')) {
        panel.classList.remove('d-none');
        // Load comments
        try {
          const r    = await fetch(`/confessions/${id}/comments`);
          const data = await r.json();
          listEl.innerHTML = '';
          if (data.length === 0) {
            listEl.innerHTML = '<p class="text-muted small text-center py-2">No comments yet. Be first!</p>';
          } else {
            data.forEach(c => {
              listEl.appendChild(buildComment(c));
            });
          }
        } catch (e) { listEl.innerHTML = '<p class="text-muted small">Could not load comments.</p>'; }
      } else {
        panel.classList.add('d-none');
      }
    });
  });

  // ─── Submit Comment ──────────────────────────────────────
  document.querySelectorAll('.comment-submit').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id      = btn.dataset.id;
      const input   = document.querySelector(`.comment-input[data-id="${id}"]`);
      const content = input.value.trim();
      if (!content) return;

      btn.disabled = true;
      try {
        const r = await fetch(`/confessions/${id}/comment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        });
        const d = await r.json();
        if (d.success) {
          const listEl = document.getElementById(`comment-list-${id}`);
          const emptyEl = listEl.querySelector('p');
          if (emptyEl) emptyEl.remove();
          listEl.appendChild(buildComment({ content, anon_username: 'You', avatar_color: '#7c3aed', created_at: new Date() }));
          input.value = '';
          // Update count
          const countEl = btn.closest('.card-body').querySelector('.comment-toggle-btn span');
          if (countEl) countEl.textContent = parseInt(countEl.textContent || 0) + 1;
        }
      } catch (e) { console.error('Comment error:', e); }
      btn.disabled = false;
    });
  });

  // Allow Enter key in comment inputs
  document.querySelectorAll('.comment-input').forEach(input => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        document.querySelector(`.comment-submit[data-id="${input.dataset.id}"]`)?.click();
      }
    });
  });

  // ─── Report ──────────────────────────────────────────────
  document.querySelectorAll('.report-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeReportId = btn.dataset.id;
      reportModal && reportModal.show();
    });
  });

  document.getElementById('submitReport')?.addEventListener('click', async () => {
    if (!activeReportId) return;
    const reason = document.getElementById('reportReason').value;
    try {
      const r = await fetch(`/confessions/${activeReportId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const d = await r.json();
      if (d.success) {
        reportModal.hide();
        showToast('Report submitted. Thank you.', 'success');
        activeReportId = null;
      }
    } catch (e) { console.error('Report error:', e); }
  });

  // ─── Helpers ─────────────────────────────────────────────
  function buildComment(c) {
    const el = document.createElement('div');
    el.className = 'comment-item d-flex gap-2 align-items-start';
    const color = c.avatar_color || '#7c3aed';
    const initl = (c.anon_username || 'A').charAt(0);
    const time  = c.created_at ? new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
    el.innerHTML = `
      <div class="avatar-sm flex-shrink-0" style="background:${color};width:28px;height:28px;font-size:.75rem">${initl}</div>
      <div>
        <span class="fw-semibold text-sm me-2">${escHtml(c.anon_username)}</span>
        <span class="text-muted" style="font-size:.7rem">${time}</span>
        <div class="text-sm mt-1">${escHtml(c.content)}</div>
      </div>
    `;
    return el;
  }

  function showToast(msg, type='success') {
    const el = document.createElement('div');
    el.className = `alert alert-float alert-${type} alert-dismissible d-flex align-items-center gap-2`;
    el.innerHTML = `<i class="bi bi-check-circle-fill"></i><span>${escHtml(msg)}</span><button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  }

  function escHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
})();
