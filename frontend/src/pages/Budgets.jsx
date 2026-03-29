import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = ['Food', 'Transport', 'Entertainment', 'Utilities', 'Bills', 'Salary', 'Other'];

const Budgets = () => {
  const { user } = useContext(AuthContext);
  const [budgets, setBudgets] = useState([]);
  const [spent, setSpent] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newLimit, setNewLimit] = useState('');

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const fetchBudgetsAndSpent = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      
      const budgetsRes = await axios.get('http://localhost:5001/api/budgets', config);
      const bData = budgetsRes.data.filter(b => b.month === currentMonth && b.year === currentYear);
      setBudgets(bData);

      const txRes = await axios.get('http://localhost:5001/api/transactions', config);
      const txs = txRes.data.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear && t.type === 'expense';
      });

      const spentMap = {};
      txs.forEach(t => {
        if (spentMap[t.category] !== undefined || CATEGORIES.includes(t.category)) {
          spentMap[t.category] = (spentMap[t.category] || 0) + t.amount;
        } else {
          spentMap['Other'] = (spentMap['Other'] || 0) + t.amount;
        }
      });
      setSpent(spentMap);

    } catch (e) { console.error('Error fetching budgets', e); }
  };

  useEffect(() => {
    if (user) fetchBudgetsAndSpent();
  }, [user]);

  const handleEditLimit = (category) => {
    const existing = budgets.find(b => b.category === category);
    setEditingCategory(category);
    setNewLimit(existing ? existing.limit : '');
    setShowModal(true);
  };

  const saveBudget = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.post('http://localhost:5001/api/budgets', {
        category: editingCategory,
        limit: Number(newLimit),
        month: currentMonth,
        year: currentYear
      }, config);
      setShowModal(false);
      fetchBudgetsAndSpent();
    } catch (e) { alert('Error saving budget'); }
  };

  const displayCategories = ['Food', 'Transport', 'Entertainment', 'Utilities', 'Bills', 'Other'];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold dark:text-white mb-2">Budgets</h2>
        <p className="text-slate-500 dark:text-slate-400">Manage your monthly spending limits</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {displayCategories.map((cat, idx) => {
          const b = budgets.find(budget => budget.category === cat);
          // Default limits for missing budgets to resemble the screenshot
          const defaultLimit = cat === 'Food' ? 500 : cat === 'Transport' ? 200 : cat === 'Entertainment' ? 150 : cat === 'Utilities' ? 300 : 0;
          const limit = b ? b.limit : defaultLimit;
          const spentAmount = spent[cat] || 0;
          
          let percentSpent = limit > 0 ? (spentAmount / limit) * 100 : 0;
          if (percentSpent > 100) percentSpent = 100;
          const percentRemaining = limit > 0 ? Math.max(0, 100 - Math.round(percentSpent)) : 0;
          
          return (
            <motion.div 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: idx * 0.1 }}
              key={cat} 
              className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold dark:text-white pb-1">{cat}</h3>
                  <p className="text-slate-400 text-sm font-medium">Monthly Budget</p>
                </div>
                <div className="text-right">
                  <h3 className="text-xl font-bold dark:text-white pb-1">₹{spentAmount.toLocaleString('en-IN')}</h3>
                  <p className="text-slate-400 text-sm font-medium">of ₹{limit.toLocaleString('en-IN')}</p>
                </div>
              </div>
              
              <div className="h-3 w-full bg-slate-100 dark:bg-slate-700/50 rounded-full mb-6 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${percentSpent >= 90 ? 'bg-red-500' : percentSpent >= 75 ? 'bg-amber-500' : 'bg-indigo-500'}`} 
                  style={{ width: `${percentSpent}%` }}
                ></div>
              </div>
              
              <div className="flex justify-between items-center text-sm font-semibold">
                <span className="text-slate-500 dark:text-slate-400">{percentRemaining}% remaining</span>
                <button 
                  onClick={() => handleEditLimit(cat)} 
                  className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                >
                  Edit Limit
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }} 
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                <h3 className="text-xl font-bold dark:text-white">Edit Limit for {editingCategory}</h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-2xl">&times;</button>
              </div>
              <form onSubmit={saveBudget} className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block dark:text-slate-300">New Monthly Limit (₹)</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 dark:text-white outline-none transition" 
                    value={newLimit} 
                    onChange={e => setNewLimit(e.target.value)} 
                    required 
                    min="1"
                  />
                </div>
                <button type="submit" className="w-full mt-4 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-indigo-500/20 font-semibold transition">
                  Save Changes
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Budgets;
