require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../config/db');

function iso(offsetMinutesFromNow) {
  return new Date(Date.now() + offsetMinutesFromNow * 60 * 1000).toISOString();
}

const passwordHash = bcrypt.hashSync('password123', 10);

const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users (username, email, password_hash)
  VALUES (@username, @email, @password_hash)
`);

const demoUsers = [
  { username: 'alice', email: 'alice@campus.mg', password_hash: passwordHash },
  { username: 'bob', email: 'bob@campus.mg', password_hash: passwordHash },
  { username: 'chloe', email: 'chloe@campus.mg', password_hash: passwordHash }
];

for (const u of demoUsers) insertUser.run(u);

const alice = db.prepare('SELECT id FROM users WHERE username = ?').get('alice');
const bob = db.prepare('SELECT id FROM users WHERE username = ?').get('bob');

// Événement 1 : déjà ouvert, dépôt possible maintenant
const insertEvent = db.prepare(`
  INSERT INTO events
    (title, description, event_date, cover_image, creator_id,
     open_at, close_at, vote_end_at,
     max_photos_per_person, max_contributors, max_total_photos)
  VALUES (@title, @description, @event_date, @cover_image, @creator_id,
          @open_at, @close_at, @vote_end_at,
          @max_photos_per_person, @max_contributors, @max_total_photos)
`);

const result1 = insertEvent.run({
  title: "Concours d'éloquence 2026",
  description: "Le grand concours d'éloquence annuel du campus.",
  event_date: iso(0),
  cover_image: null,
  creator_id: alice.id,
  open_at: iso(-60),       // ouvert depuis 1h
  close_at: iso(60 * 24),  // ferme dans 24h
  vote_end_at: iso(60 * 48), // vote se termine dans 48h
  max_photos_per_person: 3,
  max_contributors: 30,
  max_total_photos: 100
});

db.prepare('INSERT OR IGNORE INTO event_photographers (event_id, user_id) VALUES (?, ?)')
  .run(result1.lastInsertRowid, bob.id);

// Événement 2 : pas encore ouvert
insertEvent.run({
  title: 'Finale de basket 2026',
  description: "La grande finale du tournoi inter-classes.",
  event_date: iso(60 * 24 * 3),
  cover_image: null,
  creator_id: bob.id,
  open_at: iso(60 * 24 * 2),
  close_at: iso(60 * 24 * 3),
  vote_end_at: iso(60 * 24 * 4),
  max_photos_per_person: 2,
  max_contributors: 50,
  max_total_photos: 200
});

console.log('Seed terminé.');
console.log('Comptes de démo (mot de passe : password123) : alice, bob, chloe');
