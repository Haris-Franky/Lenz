const fs = require('fs');
const path = require('path');
const db = require('../config/db');
const { canUploadPhoto, canVote } = require('../services/eventStateMachine');
const { uploadDir } = require('../middleware/upload');

function isOfficialPhotographer(eventId, userId) {
  return !!db
    .prepare('SELECT 1 FROM event_photographers WHERE event_id = ? AND user_id = ?')
    .get(eventId, userId);
}

/**
 * POST /api/events/:id/photos
 * Dépôt d'une photo par un utilisateur connecté sur un événement ouvert.
 * Applique les 3 quotas, sauf pour le(s) photographe(s) officiel(s).
 */
function upload(req, res) {
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!event) return res.status(404).json({ error: 'Événement introuvable.' });

  if (!req.file) {
    return res.status(400).json({ error: 'Aucune photo reçue.' });
  }

  const cleanup = () => fs.unlink(path.join(uploadDir, req.file.filename), () => {});

  if (!canUploadPhoto(event)) {
    cleanup();
    return res.status(403).json({
      error: "Le dépôt n'est pas possible en dehors de la période d'ouverture de l'événement."
    });
  }

  const isOfficial = isOfficialPhotographer(event.id, req.user.id);

  if (!isOfficial) {
    const myPhotosCount = db
      .prepare('SELECT COUNT(*) AS c FROM photos WHERE event_id = ? AND user_id = ?')
      .get(event.id, req.user.id).c;

    if (myPhotosCount >= event.max_photos_per_person) {
      cleanup();
      return res.status(403).json({ error: 'Vous avez atteint votre nombre maximum de photos.' });
    }

    const distinctContributors = db
      .prepare('SELECT COUNT(DISTINCT user_id) AS c FROM photos WHERE event_id = ?')
      .get(event.id).c;
    const alreadyContributed = myPhotosCount > 0;

    if (!alreadyContributed && distinctContributors >= event.max_contributors) {
      cleanup();
      return res
        .status(403)
        .json({ error: "L'événement a atteint le nombre maximum de contributeurs." });
    }

    const totalPhotos = db
      .prepare('SELECT COUNT(*) AS c FROM photos WHERE event_id = ?')
      .get(event.id).c;

    if (totalPhotos >= event.max_total_photos) {
      cleanup();
      return res
        .status(403)
        .json({ error: "L'événement a atteint le nombre total de photos autorisé." });
    }
  }

  const result = db
    .prepare('INSERT INTO photos (event_id, user_id, filename) VALUES (?, ?, ?)')
    .run(event.id, req.user.id, req.file.filename);

  const photo = db.prepare('SELECT * FROM photos WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ photo: { id: photo.id, filename: photo.filename, likesCount: 0 } });
}

/**
 * POST /api/photos/:id/like
 * Ajoute (ou confirme) le "j'aime" de l'utilisateur connecté sur une photo.
 */
function like(req, res) {
  const photo = db.prepare('SELECT * FROM photos WHERE id = ?').get(req.params.id);
  if (!photo) return res.status(404).json({ error: 'Photo introuvable.' });

  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(photo.event_id);
  if (!canVote(event)) {
    return res.status(403).json({ error: "Le vote n'est pas ouvert pour cet événement." });
  }

  db.prepare('INSERT OR IGNORE INTO likes (photo_id, user_id) VALUES (?, ?)').run(
    photo.id,
    req.user.id
  );

  const likesCount = db
    .prepare('SELECT COUNT(*) AS c FROM likes WHERE photo_id = ?')
    .get(photo.id).c;

  res.json({ likesCount, likedByMe: true });
}

/**
 * DELETE /api/photos/:id/like
 * Retire le "j'aime" de l'utilisateur connecté.
 */
function unlike(req, res) {
  const photo = db.prepare('SELECT * FROM photos WHERE id = ?').get(req.params.id);
  if (!photo) return res.status(404).json({ error: 'Photo introuvable.' });

  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(photo.event_id);
  if (!canVote(event)) {
    return res.status(403).json({ error: "Le vote n'est pas ouvert pour cet événement." });
  }

  db.prepare('DELETE FROM likes WHERE photo_id = ? AND user_id = ?').run(photo.id, req.user.id);

  const likesCount = db
    .prepare('SELECT COUNT(*) AS c FROM likes WHERE photo_id = ?')
    .get(photo.id).c;

  res.json({ likesCount, likedByMe: false });
}

module.exports = { upload, like, unlike };
