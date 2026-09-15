
const API_URL = "https://lenz-backend-x7eh.onrender.com";

function getToken() {
  return localStorage.getItem('lenz_token');
}

function getCurrentUser() {
  const raw = localStorage.getItem('lenz_user');
  return raw ? JSON.parse(raw) : null;
}

function setSession(token, user) {
  localStorage.setItem('lenz_token', token);
  localStorage.setItem('lenz_user', JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem('lenz_token');
  localStorage.removeItem('lenz_user');
}

async function apiFetch(path, options = {}) {
  const headers = options.headers || {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  if (!(options.body instanceof FormData) && options.body) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(API_BASE + path, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || 'Une erreur est survenue.');
  }
  return data;
}

function renderNavbar(activePage) {
  const user = getCurrentUser();
  const nav = document.getElementById('navbar');
  if (!nav) return;

  nav.innerHTML = `
    <a href="index.html" class="brand">Lenz</a>
    <nav>
      <a href="index.html">Accueil</a>
      ${user ? '<a href="create-event.html">Créer un événement</a>' : ''}
      ${
        user
          ? `<span style="color: var(--text-muted)">Connecté : ${user.username}</span>
             <button class="btn btn-secondary" id="logoutBtn">Déconnexion</button>`
          : `<a href="login.html" class="btn btn-secondary">Connexion</a>
             <a href="register.html" class="btn btn-primary">Inscription</a>`
      }
    </nav>
  `;

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      clearSession();
      window.location.href = 'index.html';
    });
  }
}

function stateLabel(state) {
  return (
    {
      AVANT_OUVERTURE: 'À venir',
      OUVERT: 'Ouvert',
      EN_VOTE: 'En vote',
      CLOTURE: 'Clôturé'
    }[state] || state
  );
}

function stateBadgeClass(state) {
  return (
    {
      AVANT_OUVERTURE: 'badge-avant',
      OUVERT: 'badge-ouvert',
      EN_VOTE: 'badge-vote',
      CLOTURE: 'badge-cloture'
    }[state] || ''
  );
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
}
