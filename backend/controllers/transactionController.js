const Transaction = require('../models/Transaction');
const { createClient } = require('redis');

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: { reconnectStrategy: (retries) => retries > 3 ? new Error('Max retries') : Math.min(retries * 100, 3000) }
});
redisClient.on('error', () => {});
redisClient.connect().catch(() => {});

exports.getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id }).sort('-date');
    res.json(transactions);
  } catch (error) {
    console.error('GET Error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.addTransaction = async (req, res) => {
  try {
    console.log('Add Transaction - req.body:', req.body);
    console.log('Add Transaction - req.user:', req.user ? req.user.id : 'NO USER');

    const { title, amount, type, category, date, isRecurring, recurringFrequency } = req.body;

    // Validate required fields
    if (!title || amount === undefined || amount === '' || !type || !category) {
      return res.status(400).json({ 
        message: 'Missing required fields', 
        received: { title, amount, type, category } 
      });
    }

    const transaction = await Transaction.create({
      user: req.user.id,
      title,
      amount: Number(amount),
      type,
      category,
      date: date || Date.now(),
      isRecurring: isRecurring || false,
      recurringFrequency: recurringFrequency || 'none'
    });

    if (redisClient.isReady) {
      await redisClient.del(`analytics:${req.user.id}`);
    }

    res.status(201).json(transaction);
  } catch (error) {
    console.error('POST Error:', error.message);
    console.error('POST Error Stack:', error.stack);
    res.status(500).json({ message: error.message });
  }
};

exports.deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    if (transaction.user.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });

    await Transaction.deleteOne({ _id: req.params.id });

    if (redisClient.isReady) {
      await redisClient.del(`analytics:${req.user.id}`);
    }

    res.json({ message: 'Transaction removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.parseVoice = async (req, res) => {
  try {
    const { transcript } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      console.log("No Gemini API key, using basic NLP fallback.");
      let amount = transcript.match(/\d+/);
      amount = amount ? parseInt(amount[0]) : 0;
      
      let category = 'Other';
      const tLower = transcript.toLowerCase();
      if (tLower.includes('food') || tLower.includes('lunch') || tLower.includes('mcdonald') || tLower.includes('coffee') || tLower.includes('restaurant') || tLower.includes('dinner')) category = 'Food';
      else if (tLower.includes('uber') || tLower.includes('gas') || tLower.includes('transport') || (tLower.includes('car') && !tLower.includes('insurance'))) category = 'Transport';
      else if (tLower.includes('movie') || tLower.includes('game') || tLower.includes('netflix')) category = 'Entertainment';
      else if (tLower.includes('bill') || tLower.includes('rent') || tLower.includes('internet') || tLower.includes('electric') || tLower.includes('insurance')) category = 'Bills';
      const type = (tLower.includes('earned') || tLower.includes('salary') || tLower.includes('got') || tLower.includes('paid me')) ? 'income' : 'expense';
      
      // Clean title by stripping numbers and common currency/date words
      let cleanTitle = transcript.replace(/\d+/g, '').replace(/rupees|dollars|bucks|rs/gi, '').replace(/yesterday|today|tomorrow/gi, '').trim();
      cleanTitle = cleanTitle.replace(/\s+/g, ' '); // remove multiple spaces
      cleanTitle = cleanTitle.substring(0, 30).trim() || 'New Transaction';

      // Parse date for yesterday or tomorrow natively
      let dateField = undefined;
      const today = new Date();
      if (tLower.includes('yesterday')) {
        today.setDate(today.getDate() - 1);
        dateField = today.toISOString().split('T')[0];
      } else if (tLower.includes('tomorrow')) {
        today.setDate(today.getDate() + 1);
        dateField = today.toISOString().split('T')[0];
      }

      return res.json({
        title: cleanTitle,
        amount: amount,
        category: category,
        type: type,
        date: dateField
      });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `Extract transaction details from this text: "${transcript}". 
    Return ONLY a valid JSON object with the following keys exactly and no markdown wrapping or extra text:
    - title (string, max 30 chars, a short description)
    - amount (number, just the numeric value)
    - type (string, strictly "expense" or "income", default to expense)
    - category (string, pick exactly one from ["Food", "Transport", "Entertainment", "Bills", "Salary", "Other"]. Map intelligently, e.g. "movie" -> "Entertainment")
    - date (string, date mentioned in YYYY-MM-DD format. Assume the year is ${new Date().getFullYear()} if omitted. If no date is mentioned, do not include this key)`;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    if (text.startsWith('\`\`\`json')) {
      text = text.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
    } else if (text.startsWith('\`\`\`')) {
      text = text.replace(/\`\`\`/g, '').trim();
    }
    
    const parsedData = JSON.parse(text);
    res.json(parsedData);
  } catch (error) {
    console.error('Voice Parsing Error:', error);
    res.status(500).json({ message: 'Could not parse voice data: ' + error.message });
  }
};
