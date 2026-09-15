const db = require('../config/db');
const { getEventState } = require('../services/eventStateMachine');

function serializeEvent(event, extra = {}) {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    eventDate: event.event_date,
    coverImage: event.cover_image,
    creatorId: event.creator_id,
    openAt: event.open_at,
    closeAt: event.close_at,
    voteEndAt: event.vote_end_at,
    maxPhotosPerPerson: event.max_photos_per_person,
    maxContributors: event.max_contributors,
    maxTotalPhotos: event.max_total_photos,
    state: getEventState(event),
    ...extra
  };
}

/**
 * GET /api/events
 * Page d'accueil / feed : événements récents + leur photo à la une si clôturés.
 */
function list(req, res) {
  const events = db
    .prepare('SELECT * FROM events ORDER BY created_at DESC')
    .all();

  const withHighlight = events.map((event) => {
    const state = getEventState(event);
    let featuredPhoto = null;

    if (state === 'CLOTURE') {
      featuredPhoto = db
        .prepare(
          `SELECT p.*, COUNT(l.id) AS likes_count
           FROM photos p
           LEFT JOIN likes l ON l.photo_id = p.id
           WHERE p.event_id = ?
           GROUP BY p.id
           ORDER BY likes_count DESC, p.created_at ASC
           LIMIT 1`
        )
        .get(event.id);
    }

    return serializeEvent(event, {
      featuredPhoto: featuredPhoto
        ? { id: featuredPhoto.id, filename: featuredPhoto.filename, likesCount: featuredPhoto.likes_count }
        : null
    });
  });

  res.json({ events: withHighlight });
}

/**
 * POST /api/events
 * Création d'un événement par un utilisateur connecté (il devient "créateur").
 */
function create(req, res) {
  const {
    title,
    description,
    eventDate,
    coverImage,
    openAt,
    closeAt,
    voteEndAt,
    maxPhotosPerPerson,
    maxContributors,
    maxTotalPhotos,
    officialPhotographerIds
  } = req.body;

  if (!title || !openAt || !closeAt || !voteEndAt) {
    return res.status(400).json({
      error: "Titre, date d'ouverture, de fermeture et de fin de vote sont requis."
    });
  }

  const open = new Date(openAt);
  const close = new Date(closeAt);
  const voteEnd = new Date(voteEndAt);

  if (!(open < close && close < voteEnd)) {
    return res.status(400).json({
      error: "L'ordre des dates doit être : ouverture < fermeture < fin du vote."
    });
  }

  const result = db
    .prepare(
      `INSERT INTO events
        (title, description, event_date, cover_image, creator_id,
         open_at, close_at, vote_end_at,
         max_photos_per_person, max_contributors, max_total_photos)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      title,
      description || null,
      eventDate || null,
      coverImage || null,
      req.user.id,
      open.toISOString(),
      close.toISOString(),
      voteEnd.toISOString(),
      maxPhotosPerPerson || 3,
      maxContributors || 30,
      maxTotalPhotos || 100
    );

  const eventId = result.lastInsertRowid;

  if (Array.isArray(officialPhotographerIds)) {
    const insertPhotographer = db.prepare(
      'INSERT OR IGNORE INTO event_photographers (event_id, user_id) VALUES (?, ?)'
    );
    for (const userId of officialPhotographerIds) {
      insertPhotographer.run(eventId, userId);
    }
  }

  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId);
  res.status(201).json({ event: serializeEvent(event) });
}

/**
 * GET /api/events/:id
 * Détail d'un événement : état, galerie de photos avec compteur de likes,
 * et si connecté, indication des photos déjà likées par l'utilisateur.
 */
function getOne(req, res) {
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!event) return res.status(404).json({ error: 'Événement introuvable.' });

  const photos = db
    .prepare(
      `SELECT p.id, p.filename, p.user_id, p.created_at,
              u.username AS author,
              COUNT(l.id) AS likes_count
       FROM photos p
       JOIN users u ON u.id = p.user_id
       LEFT JOIN likes l ON l.photo_id = p.id
       WHERE p.event_id = ?
       GROUP BY p.id
       ORDER BY likes_count DESC, p.created_at DESC`
    )
    .all(event.id);

  let likedPhotoIds = new Set();
  if (req.user) {
    const rows = db
      .prepare(
        `SELECT l.photo_id FROM likes l
         JOIN photos p ON p.id = l.photo_id
         WHERE p.event_id = ? AND l.user_id = ?`
      )
      .all(event.id, req.user.id);
    likedPhotoIds = new Set(rows.map((r) => r.photo_id));
  }

  const photographers = db
    .prepare(
      `SELECT u.id, u.username FROM event_photographers ep
       JOIN users u ON u.id = ep.user_id
       WHERE ep.event_id = ?`
    )
    .all(event.id);

  const state = getEventState(event);
  const featuredPhoto =
    state === 'CLOTURE' && photos.length > 0
      ? photos[0] // déjà trié par likes décroissants
      : null;

  res.json({
    event: serializeEvent(event),
    photographers,
    photos: photos.map((p) => ({
      id: p.id,
      filename: p.filename,
      author: p.author,
      likesCount: p.likes_count,
      likedByMe: likedPhotoIds.has(p.id),
      createdAt: p.created_at
    })),
    featuredPhoto: featuredPhoto
      ? { id: featuredPhoto.id, filename: featuredPhoto.filename, likesCount: featuredPhoto.likes_count }
      : null
  });
}

module.exports = { list, create, getOne };
