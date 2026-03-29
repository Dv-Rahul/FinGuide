const express = require('express');
const router = express.Router();
const multer = require('multer');
const { scanReceipt } = require('../controllers/ocrController');
const { protect } = require('../middleware/authMiddleware');

// Store receipt uploads purely in memory before feeding to Tesseract.js
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Define POST route that requires Auth and an uploaded 'receipt' image
router.post('/scan', protect, upload.single('receipt'), scanReceipt);

module.exports = router;
