renderNavbar();

const container = document.getElementById('eventContainer');
const params = new URLSearchParams(window.location.search);
const eventId = params.get('id');

async function loadEvent() {
  try {
    const { event, photos, featuredPhoto, photographers } = await apiFetch(`/events/${eventId}`);
    render(event, photos, featuredPhoto, photographers);
  } catch (err) {
    container.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
}

function render(event, photos, featuredPhoto, photographers) {
  const user = getCurrentUser();
  const canUpload = event.state === 'OUVERT' && user;
  const canVote = (event.state === 'OUVERT' || event.state === 'EN_VOTE') && user;

  container.innerHTML = `
    <span class="badge ${stateBadgeClass(event.state)}">${stateLabel(event.state)}</span>
    <h1 style="margin-bottom:4px;">${event.title}</h1>
    <p style="color: var(--text-muted);">${event.description || ''}</p>
    <p style="color: var(--text-muted); font-size:0.85rem;">
      Ouverture : ${formatDate(event.openAt)} · Fermeture : ${formatDate(event.closeAt)} ·
      Fin du vote : ${formatDate(event.voteEndAt)}
    </p>
    <p style="color: var(--text-muted); font-size:0.85rem;">
      Limites : ${event.maxPhotosPerPerson} photo(s)/personne ·
      ${event.maxContributors} contributeurs max · ${event.maxTotalPhotos} photos au total
      ${photographers.length ? ` · Photographe(s) officiel(s) : ${photographers.map((p) => p.username).join(', ')}` : ''}
    </p>

    ${
      featuredPhoto
        ? `<div class="featured-banner">
             <img src="/uploads/${featuredPhoto.filename}" alt="Photo à la une" />
             <div>
               <div class="badge badge-cloture">Photo à la une</div>
               <p style="margin:6px 0 0;">❤️ ${featuredPhoto.likesCount} j'aime</p>
             </div>
           </div>`
        : ''
    }

    <div id="uploadZone"></div>

    <h2 class="section-title">Galerie (${photos.length} photo${photos.length > 1 ? 's' : ''})</h2>
    <div id="alertGallery"></div>
    <div class="photo-grid" id="photoGrid">
      ${
        photos.length === 0
          ? '<div class="empty-state">Aucune photo pour le moment.</div>'
          : photos
              .map(
                (p) => `
        <div class="photo-tile" data-photo-id="${p.id}">
          <img src="/uploads/${p.filename}" alt="Photo de ${p.author}" />
          ${
            canVote
              ? `<button class="like-btn ${p.likedByMe ? 'liked' : ''}" data-liked="${p.likedByMe}">
                   ❤️ <span class="like-count">${p.likesCount}</span>
                 </button>`
              : `<span class="like-btn">❤️ ${p.likesCount}</span>`
          }
        </div>`
              )
              .join('')
      }
    </div>
  `;

  const uploadZone = document.getElementById('uploadZone');
  if (canUpload) {
    uploadZone.innerHTML = `
      <form id="uploadForm" style="margin:20px 0; display:flex; gap:10px; align-items:center;">
        <input type="file" name="photo" accept="image/*" required />
        <button class="btn btn-primary" type="submit">Déposer ma photo</button>
      </form>
      <div id="uploadAlert"></div>
    `;
    document.getElementById('uploadForm').addEventListener('submit', handleUpload);
  } else if (!user) {
    uploadZone.innerHTML = `<p style="color: var(--text-muted);"><a href="login.html" style="color:var(--accent-2);">Connectez-vous</a> pour déposer une photo ou voter.</p>`;
  } else if (event.state === 'AVANT_OUVERTURE') {
    uploadZone.innerHTML = `<p style="color: var(--text-muted);">Le dépôt de photos n'est pas encore ouvert.</p>`;
  } else if (event.state !== 'OUVERT') {
    uploadZone.innerHTML = `<p style="color: var(--text-muted);">Le dépôt de photos est terminé pour cet événement.</p>`;
  }

  if (canVote) {
    document.querySelectorAll('.like-btn[data-liked]').forEach((btn) => {
      btn.addEventListener('click', () => handleLike(btn));
    });
  }
}

async function handleUpload(e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  const alertBox = document.getElementById('uploadAlert');

  try {
    await apiFetch(`/events/${eventId}/photos`, { method: 'POST', body: formData });
    alertBox.innerHTML = `<div class="alert alert-success">Photo déposée avec succès !</div>`;
    form.reset();
    loadEvent();
  } catch (err) {
    alertBox.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
}

async function handleLike(btn) {
  const tile = btn.closest('.photo-tile');
  const photoId = tile.dataset.photoId;
  const liked = btn.dataset.liked === 'true';
  const alertBox = document.getElementById('alertGallery');

  try {
    const result = await apiFetch(`/photos/${photoId}/like`, {
      method: liked ? 'DELETE' : 'POST'
    });
    btn.dataset.liked = String(result.likedByMe);
    btn.classList.toggle('liked', result.likedByMe);
    btn.querySelector('.like-count').textContent = result.likesCount;
  } catch (err) {
    alertBox.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
}

loadEvent();
