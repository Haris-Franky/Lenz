const express = require('express');
const photosController = require('../controllers/photos.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/:id/like', requireAuth, photosController.like);
router.delete('/:id/like', requireAuth, photosController.unlike);

module.exports = router;
