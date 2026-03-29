const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  category: { type: String, required: true },
  date: { type: Date, default: Date.now },
  isRecurring: { type: Boolean, default: false },
  recurringFrequency: { type: String, enum: ['monthly', 'weekly', 'yearly', 'none'], default: 'none' }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
