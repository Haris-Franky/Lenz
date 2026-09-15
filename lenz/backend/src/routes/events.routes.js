const express = require('express');
const eventsController = require('../controllers/events.controller');
const photosController = require('../controllers/photos.controller');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

const router = express.Router();

// Consultation : accessible sans compte
router.get('/', eventsController.list);
router.get('/:id', optionalAuth, eventsController.getOne);

// Création : compte requis (le créateur devient "créateur" de cet événement)
router.post('/', requireAuth, eventsController.create);

// Dépôt de photo sur un événement : compte requis
router.post('/:id/photos', requireAuth, upload.single('photo'), photosController.upload);

module.exports = router;
