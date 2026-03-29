const express = require('express');
const router = express.Router();
const { getAIAdvice, copilotChat } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.get('/advice', protect, getAIAdvice);
router.post('/chat', protect, copilotChat);

module.exports = router;
