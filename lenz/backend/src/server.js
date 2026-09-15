require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const eventsRoutes = require('./routes/events.routes');
const photosRoutes = require('./routes/photos.routes');
const { uploadDir } = require('./middleware/upload');

const app = express();

app.use(cors());
app.use(express.json());

// Sert les photos uploadées de façon statique
app.use('/uploads', express.static(uploadDir));

// Sert le frontend statique (utile pour une démo tout-en-un)
app.use(express.static(path.join(__dirname, '..', '..', 'frontend')));

app.use('/api/auth', authRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/photos', photosRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Gestion des erreurs Multer / autres erreurs non interceptées
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Erreur serveur.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Lenz API démarrée sur http://localhost:${PORT}`);
});

const path = require('path');

// Remonte de src/ (1) -> backend/ (2) -> lenz/ -> pointe vers frontend/
app.use(express.static(path.join(__dirname, '../../frontend')));

// Route par défaut pour rediriger vers index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/index.html'));
});