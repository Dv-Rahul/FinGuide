const Budget = require('../models/Budget');

exports.getBudgets = async (req, res) => {
  try {
    const budgets = await Budget.find({ user: req.user.id });
    res.json(budgets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addOrUpdateBudget = async (req, res) => {
  try {
    const { category, limit, month, year } = req.body;
    let budget = await Budget.findOne({ user: req.user.id, category, month, year });
    if (budget) {
      budget.limit = limit;
      await budget.save();
    } else {
      budget = await Budget.create({ user: req.user.id, category, limit, month, year });
    }
    res.json(budget);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
