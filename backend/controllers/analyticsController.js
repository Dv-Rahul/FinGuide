const Transaction = require('../models/Transaction');
const { createClient } = require('redis');

// Initialize Redis Client with finite reconnects to prevent console spam
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 3) {
        console.warn('Redis connection failed, continuing without cache.');
        return new Error('Max retries reached');
      }
      return Math.min(retries * 100, 3000);
    }
  }
});

redisClient.on('error', (err) => {
  // Suppress verbose ECONNREFUSED alerts after failing
  if (err.code !== 'ECONNREFUSED') console.error('Redis Client Error', err);
});
redisClient.connect().catch(() => {}); // Catch initial connect fail silently


exports.getAnalytics = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const cacheKey = `analytics:${userId}`;

    // 1. Check Redis Cache First (Return immediately if found)
    try {
      if (redisClient.isReady) {
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
          console.log('Serving analytics from Redis cache');
          return res.json(JSON.parse(cachedData));
        }
      }
    } catch (cacheError) {
      console.error('Redis cache error:', cacheError);
    }

    // Basic aggregation for spending by category
    const categorySpending = await Transaction.aggregate([
      { $match: { user: req.user._id, type: 'expense' } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } }
    ]);

    // Income vs Expense for the total
    const incomeExpense = await Transaction.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } }
    ]);

    // Monthly breakdowns for both income and expense
    const monthlyBreakdown = await Transaction.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            type: '$type'
          },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const result = { categorySpending, incomeExpense, monthlyBreakdown };

    // 2. Set Redis Cache (Expires in 10 minutes / 600 seconds)
    try {
      if (redisClient.isReady) {
        await redisClient.setEx(cacheKey, 600, JSON.stringify(result));
      }
    } catch (cacheError) {
      console.error('Redis set error:', cacheError);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
