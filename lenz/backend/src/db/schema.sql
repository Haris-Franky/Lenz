-- Schéma de la base de données Lenz

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT NOT NULL UNIQUE,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS events (
  id                     INTEGER PRIMARY KEY AUTOINCREMENT,
  title                  TEXT NOT NULL,
  description            TEXT,
  event_date             TEXT,
  cover_image            TEXT,
  creator_id             INTEGER NOT NULL,

  open_at                TEXT NOT NULL,
  close_at               TEXT NOT NULL,
  vote_end_at            TEXT NOT NULL,

  max_photos_per_person  INTEGER NOT NULL DEFAULT 3,
  max_contributors       INTEGER NOT NULL DEFAULT 30,
  max_total_photos       INTEGER NOT NULL DEFAULT 100,

  created_at             TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (creator_id) REFERENCES users(id)
);

-- Photographes officiels d'un événement (non bloqués par les quotas)
CREATE TABLE IF NOT EXISTS event_photographers (
  event_id  INTEGER NOT NULL,
  user_id   INTEGER NOT NULL,
  PRIMARY KEY (event_id, user_id),
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS photos (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id    INTEGER NOT NULL,
  user_id     INTEGER NOT NULL,
  filename    TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS likes (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  photo_id    INTEGER NOT NULL,
  user_id     INTEGER NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (photo_id, user_id),
  FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_photos_event ON photos(event_id);
CREATE INDEX IF NOT EXISTS idx_likes_photo ON likes(photo_id);
