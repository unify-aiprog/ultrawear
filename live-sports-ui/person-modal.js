const esc = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));

function firstName(value) { return String(value || '').trim().split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'UW'; }

function normalizeStats(person) {
  if (person?.stats && typeof person.stats === 'object' && !Array.isArray(person.stats)) return Object.entries(person.stats).slice(0, 6);
  if (Array.isArray(person?.stats)) return person.stats.slice(0, 6).map((item) => [item.label || item.name || 'Stat', item.value ?? item.total ?? '—']);
  return [];
}

function closeModal() {
  document.querySelector('.person-modal-backdrop')?.remove();
  document.body.classList.remove('modal-open');
}

function render(person, entityType) {
  const roles = Array.isArray(person.roles) ? person.roles : [entityType || 'Sports person'];
  const sports = Array.isArray(person.sportIds) ? person.sportIds : [];
  const stats = normalizeStats(person);
  const meta = [...roles, ...sports, person.nationality].filter(Boolean).slice(0, 8);
  const backdrop = document.createElement('div');
  backdrop.className = 'person-modal-backdrop';
  backdrop.setAttribute('role', 'presentation');
  backdrop.innerHTML = `<section class="person-modal" role="dialog" aria-modal="true" aria-labelledby="person-modal-title"><button class="person-modal-close" type="button" aria-label="Close profile">×</button><div class="person-modal-head"><div class="person-modal-avatar">${person.image ? `<img src="${esc(person.image)}" alt="">` : esc(firstName(person.name))}</div><div><p class="eyebrow">${esc(roles.join(' · '))}</p><h2 id="person-modal-title">${esc(person.name || 'Sports person')}</h2>${person.currentTeamId ? `<p>Current team: ${esc(person.currentTeamId)}</p>` : ''}</div></div><div class="person-modal-meta">${meta.map((item) => `<span class="person-modal-chip">${esc(item)}</span>`).join('')}</div>${stats.length ? `<div class="person-modal-section"><h3>Stats</h3><div class="person-modal-stats">${stats.map(([label,value]) => `<div class="person-modal-stat"><b>${esc(value)}</b><span>${esc(label)}</span></div>`).join('')}</div></div>` : `<div class="person-modal-section"><h3>Profile data</h3><p class="person-modal-note">Verified performance statistics will appear here as they are available in the canonical data graph.</p></div>`}<div class="person-modal-section"><h3>Career</h3><p class="person-modal-note">This compact profile uses the shared person identity. Player, athlete and manager histories can be connected without creating another page for every role.</p></div></section>`;
  document.body.appendChild(backdrop); document.body.classList.add('modal-open');
  backdrop.querySelector('.person-modal-close').addEventListener('click', closeModal);
  backdrop.addEventListener('click', (event) => { if (event.target === backdrop) closeModal(); });
  document.addEventListener('keydown', function onKey(event) { if (event.key === 'Escape') { closeModal(); document.removeEventListener('keydown', onKey); } });
}

export async function openPersonModal(id, entityType = 'player') {
  if (!id) return;
  closeModal();
  const backdrop = document.createElement('div'); backdrop.className = 'person-modal-backdrop';
  backdrop.innerHTML = '<section class="person-modal" role="dialog" aria-modal="true" aria-label="Loading profile"><button class="person-modal-close" type="button" aria-label="Close profile">×</button><div class="person-modal-loading">Loading profile…</div></section>';
  document.body.appendChild(backdrop); document.body.classList.add('modal-open');
  backdrop.querySelector('.person-modal-close').addEventListener('click', closeModal);
  backdrop.addEventListener('click', (event) => { if (event.target === backdrop) closeModal(); });
  try {
    const response = await fetch(`/api/people/${encodeURIComponent(id)}`, { headers: { accept: 'application/json' }, cache: 'no-store' });
    if (!response.ok) throw new Error(`Profile request failed: ${response.status}`);
    const payload = await response.json();
    if (!payload?.person) throw new Error('Profile is empty');
    backdrop.remove(); document.body.classList.remove('modal-open'); render(payload.person, entityType);
  } catch (error) {
    const body = backdrop.querySelector('.person-modal-loading');
    if (body) body.innerHTML = `<p>Profile unavailable.</p><p class="person-modal-note">${esc(error.message)}</p>`;
  }
}

export function bindPersonModals(root = document) {
  root.addEventListener('click', (event) => {
    const trigger = event.target.closest?.('[data-person-id]');
    if (!trigger) return;
    event.preventDefault();
    openPersonModal(decodeURIComponent(trigger.dataset.personId || ''), decodeURIComponent(trigger.dataset.personType || 'player'));
  });
}
