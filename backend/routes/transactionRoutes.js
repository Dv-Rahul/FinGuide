const express = require('express');
const router = express.Router();
const { getTransactions, addTransaction, deleteTransaction, parseVoice } = require('../controllers/transactionController');
const { protect } = require('../middleware/authMiddleware');

router.post('/parse-voice', protect, parseVoice);
router.route('/').get(protect, getTransactions).post(protect, addTransaction);
router.route('/:id').delete(protect, deleteTransaction);

module.exports = router;
