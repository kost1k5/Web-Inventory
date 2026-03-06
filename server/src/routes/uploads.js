const express = require('express');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Настройка multer: где сохранять и как называть файлы
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    // Генерируем уникальное имя файла
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },  // max 5MB
  fileFilter: (req, file, cb) => {
    // Только картинки!
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images allowed'));
    }
  }
});

// POST /api/upload - загрузить картинку
router.post('/', upload.single('image'), (req, file, cb) => {
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

module.exports = router;