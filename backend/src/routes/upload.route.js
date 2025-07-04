// File: backend/src/routes/upload.route.js

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuration de multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', '..', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'event-' + uniqueSuffix + ext);
  }
});

router.options('/', (req, res) => {
  res.sendStatus(200);
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images sont autorisées'), false);
    }
  }
});

// Middleware CORS spécifique pour les uploads
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:5173');
  res.header('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  next();
});

// Route d'upload
router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Aucun fichier téléchargé' });
  }

  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ 
    success: true,
    url: fileUrl
  });
});

// Gestion des erreurs multer
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ 
      error: err.code === 'LIMIT_FILE_SIZE' 
        ? 'La taille du fichier ne doit pas dépasser 5MB' 
        : err.message 
    });
  } else if (err) {
    return res.status(500).json({ error: err.message });
  }
  next();
});

module.exports = router;