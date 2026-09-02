const app = document.querySelector('#person-app');
const personId = decodeURIComponent(location.pathname.split('/').filter(Boolean).pop() || '');

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}

function render(person) {
  const roles = Array.isArray(person.roles) ? person.roles : [];
  const sports = Array.isArray(person.sportIds) ? person.sportIds : [];
  app.innerHTML = `
    <section class="person-hero">
      <div class="person-avatar">${person.image ? `<img src="${escapeHtml(person.image)}" alt="">` : 'UW'}</div>
      <div>
        <p class="eyebrow">${roles.map(escapeHtml).join(' · ') || 'Sports person'}</p>
        <h1>${escapeHtml(person.name)}</h1>
        ${person.nationality ? `<p>${escapeHtml(person.nationality)}</p>` : ''}
        ${person.currentTeamId ? `<p>Current team: ${escapeHtml(person.currentTeamId)}</p>` : ''}
      </div>
    </section>
    <section class="person-section">
      <h2>Sports</h2>
      <div class="person-tags">${sports.length ? sports.map((sport) => `<span>${escapeHtml(sport)}</span>`).join('') : '<span>Not specified</span>'}</div>
    </section>
    <section class="person-section">
      <h2>Career graph</h2>
      <p>This profile is connected to the person identity layer. Player, athlete, manager and coaching histories can share this identity as verified data is ingested.</p>
    </section>
  `;
}

async function load() {
  if (!personId) {
    app.innerHTML = '<p>Person profile not found.</p>';
    return;
  }
  try {
    const response = await fetch(`/api/people/${encodeURIComponent(personId)}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Profile request failed: ${response.status}`);
    const payload = await response.json();
    if (!payload.person) throw new Error('Profile is empty');
    render(payload.person);
  } catch (error) {
    app.innerHTML = `<section class="person-error"><h1>Profile unavailable</h1><p>${escapeHtml(error.message)}</p></section>`;
  }
}

load();
