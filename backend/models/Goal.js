const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  targetAmount: { type: Number, required: true },
  currentAmount: { type: Number, default: 0 },
  deadline: { type: Date, required: true },
  status: { type: String, enum: ['on-track', 'at-risk', 'completed'], default: 'on-track' }
}, { timestamps: true });

module.exports = mongoose.model('Goal', goalSchema);
