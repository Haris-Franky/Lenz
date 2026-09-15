(async function init() {
  renderNavbar('feed');

  const featuredSection = document.getElementById('featuredSection');
  const eventsSection = document.getElementById('eventsSection');

  try {
    const { events } = await apiFetch('/events');

    const withFeatured = events.filter((e) => e.featuredPhoto);
    const recent = events;

    featuredSection.innerHTML =
      withFeatured.length === 0
        ? '<div class="empty-state">Aucune photo à la une pour le moment.</div>'
        : withFeatured
            .map(
              (e) => `
        <a class="card" href="event.html?id=${e.id}">
          <img src="/uploads/${e.featuredPhoto.filename}" alt="Photo à la une de ${e.title}" />
          <div class="card-body">
            <span class="badge ${stateBadgeClass(e.state)}">${stateLabel(e.state)}</span>
            <h3>${e.title}</h3>
            <p>❤️ ${e.featuredPhoto.likesCount} j'aime</p>
          </div>
        </a>`
            )
            .join('');

    eventsSection.innerHTML =
      recent.length === 0
        ? '<div class="empty-state">Aucun événement pour le moment. Soyez le premier à en créer un !</div>'
        : recent
            .map(
              (e) => `
        <a class="card" href="event.html?id=${e.id}">
          ${
            e.coverImage
              ? `<img src="${e.coverImage}" alt="${e.title}" />`
              : '<div class="cover-placeholder"></div>'
          }
          <div class="card-body">
            <span class="badge ${stateBadgeClass(e.state)}">${stateLabel(e.state)}</span>
            <h3>${e.title}</h3>
            <p>${e.description || ''}</p>
            <p>${formatDate(e.eventDate)}</p>
          </div>
        </a>`
            )
            .join('');
  } catch (err) {
    eventsSection.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
})();
