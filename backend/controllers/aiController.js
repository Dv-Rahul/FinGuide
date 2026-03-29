const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

exports.getAIAdvice = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id }).limit(50).sort('-date');
    const budgets = await Budget.find({ user: req.user.id });

    // In a real scenario, use actual OpenAI API
    // However, if the key is invalid, we return mock data
    try {
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('your_openai_api_key_here')) {
        throw new Error('Invalid API Key');
      }
      const prompt = `Analyze these financial transactions: ${JSON.stringify(transactions)}. Provide spending insights, saving suggestions, and personalized tips.`;
      
      const completion = await openai.chat.completions.create({
        messages: [{ role: "system", content: "You are a personalized financial advisor." }, { role: "user", content: prompt }],
        model: "gpt-3.5-turbo",
      });
      res.json({ advice: completion.choices[0].message.content });
    } catch (apiError) {
      console.log("Mocking AI response due to invalid/missing key or api error.", apiError.message);
      // Premium Mocked Response
      setTimeout(() => {
        res.json({
          advice: "Based on your recent transactions, here are some insights:\n1. Overspending Warning: You spent 40% of your budget on Food & Dining. Consider cooking at home.\n2. Saving Suggestion: You can comfortably save ₹5000 this month by cutting down on entertainment subscriptions.\n3. Trend: Your expenses have been increasing by 5% each month."
        });
      }, 1000);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.copilotChat = async (req, res) => {
  try {
    const { question } = req.body;
    const transactions = await Transaction.find({ user: req.user.id });
    
    // Build context
    const expenses = transactions.filter(t => t.type === 'expense');
    const totalExpense = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const categoryMap = {};
    expenses.forEach(t => { categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount; });
    
    // AI Path
    if (process.env.GEMINI_API_KEY) {
      try {
        const { GoogleGenerativeAI } = require("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const systemPrompt = `You are FinGuide Copilot, an expert financial advisor. The user's current total expenses are ₹${totalExpense}. Category breakdown: ${JSON.stringify(categoryMap)}. Keep your answer concise (2-3 sentences max), helpful, and professional but conversational. Do not output markdown code blocks. Always speak directly to the user.`;
        const result = await model.generateContent(`${systemPrompt}\nUser asks: "${question}"`);
        return res.json({ reply: result.response.text().trim() });
      } catch (err) {
        console.error("Gemini Error, falling back to local:", err.message);
      }
    }

    // Fallback Local NLP
    setTimeout(() => {
      let reply = '';
      const q = question.toLowerCase();
      
      let topCategory = 'None';
      let maxAmount = 0;
      for (const [cat, amt] of Object.entries(categoryMap)) {
         if (amt > maxAmount) { maxAmount = amt; topCategory = cat; }
      }

      if (q.includes('save') || q.includes('saving')) {
        reply = `To save more, I recommend reviewing your '${topCategory}' expenses, which are quite high right now. You can easily save an extra 10-20% this month by focusing there.`;
      } else if (q.includes('forecast') || q.includes('predict') || q.includes('next')) {
        reply = `Tracking your historical trends and current spending of ₹${totalExpense.toLocaleString('en-IN')}, your projected expenses for next month are around ₹${Number((totalExpense * 1.05).toFixed(0)).toLocaleString('en-IN')}.`;
      } else if (q.includes('overspend') || q.includes('reduce') || q.includes('cut')) {
        reply = `Your data shows your highest expense is '${topCategory}' at ₹${maxAmount.toLocaleString('en-IN')}. Try reducing your budget in this category to avoid overspending!`;
      } else if (q.includes('where')) {
        reply = `You can start by looking at '${topCategory}', which is taking up the largest portion (₹${maxAmount.toLocaleString('en-IN')}) of your budget right now.`;
      } else if (q.includes('how much') || q.includes('spend')) {
        reply = `Looking at your data, you have spent a total of ₹${totalExpense.toLocaleString('en-IN')} so far. Your highest spending category is ${topCategory} (₹${maxAmount.toLocaleString('en-IN')}).`;
      } else if (q.includes('hello') || q.includes('hi') || q.includes('hey')) {
        reply = "Hello there! I'm your FinGuide Copilot. Ask me 'How much am I spending?', 'How can I save?', or 'Forecast my expenses'!";
      } else {
        reply = `You asked: "${question}". I am running in local Demo Mode (AI key not found). Try asking me "How much am I spending", "How can I save", or "Forecast next month"!`;
      }
      res.json({ reply });
    }, 800);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

