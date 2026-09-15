renderNavbar();

if (!getCurrentUser()) {
  window.location.href = 'login.html';
}

const alertBox = document.getElementById('alertBox');
const form = document.getElementById('createForm');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(form);
  const raw = Object.fromEntries(formData.entries());

  const payload = {
    title: raw.title,
    description: raw.description,
    eventDate: raw.eventDate ? new Date(raw.eventDate).toISOString() : null,
    coverImage: raw.coverImage || null,
    maxPhotosPerPerson: parseInt(raw.maxPhotosPerPerson, 10),
    maxContributors: parseInt(raw.maxContributors, 10),
    maxTotalPhotos: parseInt(raw.maxTotalPhotos, 10),
    openAt: new Date(raw.openAt).toISOString(),
    closeAt: new Date(raw.closeAt).toISOString(),
    voteEndAt: new Date(raw.voteEndAt).toISOString()
  };

  try {
    const { event } = await apiFetch('/events', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    window.location.href = `event.html?id=${event.id}`;
  } catch (err) {
    alertBox.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
});
