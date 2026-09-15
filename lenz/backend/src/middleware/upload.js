const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const uploadDir = path.resolve(process.env.UPLOAD_DIR || './uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = crypto.randomBytes(16).toString('hex');
    cb(null, `${Date.now()}_${unique}${ext}`);
  }
});

function fileFilter(req, file, cb) {
  if (!allowedTypes.has(file.mimetype)) {
    return cb(new Error('Format de fichier non supporté (jpeg, png, webp, gif uniquement).'));
  }
  cb(null, true);
}

const maxMb = parseInt(process.env.MAX_UPLOAD_MB || '8', 10);

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: maxMb * 1024 * 1024 }
});

module.exports = { upload, uploadDir };
