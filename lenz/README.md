# Lenz — Photos des événements du campus

Plateforme qui rassemble en un seul endroit les photos prises par les étudiants
pendant les événements du campus, permet au public de voter, et met en avant
la photo gagnante « à la une ».

Projet réalisé dans le cadre du cahier des charges « Lenz (nom de travail) ».

## Stack technique

- **Back-end** : Node.js, Express, better-sqlite3 (SQLite), JWT (jsonwebtoken),
  bcryptjs, multer (upload de fichiers).
- **Front-end** : HTML / CSS / JavaScript natif (aucun framework, servi
  directement par Express pour simplifier le lancement).
- **Base de données** : SQLite (fichier unique, aucun serveur à installer).

## Architecture

```
lenz/
├── backend/
│   ├── src/
│   │   ├── config/db.js              → connexion SQLite
│   │   ├── middleware/
│   │   │   ├── auth.js               → vérification JWT
│   │   │   └── upload.js             → configuration multer
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── events.controller.js
│   │   │   └── photos.controller.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── events.routes.js
│   │   │   └── photos.routes.js
│   │   ├── services/
│   │   │   └── eventStateMachine.js  → cycle de vie d'un événement
│   │   ├── db/
│   │   │   ├── schema.sql
│   │   │   ├── migrate.js
│   │   │   ├── seed.js               → données de démo
│   │   │   └── seed.sql
│   │   └── server.js
│   ├── uploads/                      → photos déposées (créé automatiquement)
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── index.html                    → accueil / feed
│   ├── login.html / register.html    → comptes utilisateurs
│   ├── create-event.html             → création d'un événement
│   ├── event.html                    → détail d'un événement (galerie, dépôt, vote)
│   ├── css/style.css
│   └── js/{api,auth,feed,create-event,event-detail}.js
└── README.md
```

## Le cycle de vie d'un événement

L'état d'un événement (`AVANT_OUVERTURE`, `OUVERT`, `EN_VOTE`, `CLOTURE`) n'est
**jamais stocké** en base : il est recalculé à chaque requête à partir des
trois dates fixées par le créateur (`open_at`, `close_at`, `vote_end_at`)
comparées à l'instant présent (voir `services/eventStateMachine.js`). Cela
évite toute tâche planifiée et garantit que l'état est toujours exact.

- **AVANT_OUVERTURE** : personne ne peut déposer de photo.
- **OUVERT** : le dépôt est possible, les votes commencent à s'accumuler.
- **EN_VOTE** : le dépôt est fermé, le vote continue.
- **CLOTURE** : la photo la plus aimée devient la photo « à la une ».

## Prérequis

- Node.js ≥ 18
- npm

## Installation et démarrage

```bash
cd backend
npm install
cp .env.example .env
npm run migrate   # crée les tables SQLite
npm run seed       # (optionnel) insère des comptes et événements de démo
npm start           # démarre le serveur sur http://localhost:3000
```

Le front-end est servi automatiquement par le même serveur Express : ouvrez
simplement **http://localhost:3000** dans votre navigateur.

Pour le développement avec rechargement automatique :

```bash
npm run dev
```

### Comptes de démonstration (après `npm run seed`)

| Utilisateur | Mot de passe   |
|-------------|----------------|
| alice       | password123    |
| bob         | password123    |
| chloe       | password123    |

L'événement « Concours d'éloquence 2026 » créé par le seed est déjà **ouvert**
(dépôt et vote possibles immédiatement) pour tester tout de suite le parcours
complet. `bob` est désigné comme photographe officiel (non bloqué par les
quotas).

## Variables d'environnement (`backend/.env`)

| Variable        | Description                                 |
|-----------------|----------------------------------------------|
| `PORT`          | Port du serveur (défaut `3000`)              |
| `JWT_SECRET`    | Secret de signature des tokens JWT           |
| `JWT_EXPIRES_IN`| Durée de validité du token (défaut `7d`)     |
| `DB_PATH`       | Emplacement du fichier SQLite                |
| `UPLOAD_DIR`    | Dossier de stockage des photos               |
| `MAX_UPLOAD_MB` | Taille max d'une photo en Mo (défaut `8`)    |

## API — résumé des routes

| Méthode | Route                        | Auth | Description                              |
|---------|------------------------------|------|-------------------------------------------|
| POST    | `/api/auth/register`         | non  | Inscription                               |
| POST    | `/api/auth/login`             | non  | Connexion                                 |
| GET     | `/api/auth/me`                 | oui  | Profil courant                            |
| GET     | `/api/events`                   | non  | Liste des événements (feed)               |
| POST    | `/api/events`                   | oui  | Créer un événement (fixe toutes les règles)|
| GET     | `/api/events/:id`               | non  | Détail + galerie + état                   |
| POST    | `/api/events/:id/photos`       | oui  | Déposer une photo (`multipart/form-data`, champ `photo`) |
| POST    | `/api/photos/:id/like`         | oui  | Aimer une photo                           |
| DELETE  | `/api/photos/:id/like`         | oui  | Retirer son « j'aime »                    |

## Parcours de démonstration

1. `npm run seed` puis se connecter avec `alice` / `password123`.
2. Aller sur l'événement « Concours d'éloquence 2026 » (déjà ouvert).
3. Se connecter avec `bob` ou `chloe` et déposer des photos.
4. Aimer les photos déposées (bouton ❤️ sur chaque vignette).
5. Créer un nouvel événement via « Créer un événement » avec des dates
   d'ouverture/fermeture/fin de vote très rapprochées pour observer le
   changement d'état automatique.
6. Une fois la fin du vote passée, recharger la page : la photo la plus
   aimée apparaît en bannière « à la une » et sur la page d'accueil.

## Ce qui n'est pas dans le périmètre (hors scope)

Conformément au cahier des charges : pas d'application mobile native, pas de
paiement, pas de messagerie privée, pas de modération automatique avancée,
pas de notifications e-mail/push (bonus non implémenté ici).

## Pistes d'amélioration (bonus du cahier des charges)

- Notifications à l'ouverture d'un événement / passage à la une.
- Classement top 3 des photos (actuellement seule la 1ère est mise en avant).
- Partage externe d'une photo à la une (lien public).
- Recherche et filtres d'événements par date ou titre.
