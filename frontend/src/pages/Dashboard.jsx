import { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, Sparkles } from 'lucide-react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import Expenses3DView from '../components/Expenses3DView';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState({ categorySpending: [], incomeExpense: [] });
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const res = await axios.get('http://localhost:5001/api/analytics', config);
        setData(res.data);
        
        const txRes = await axios.get('http://localhost:5001/api/transactions', config);
        setTransactions(txRes.data);
      } catch (e) { console.error("Could not fetch dashboard analytics", e); }
    };
    fetchData();
  }, [user]);

  const pieData = data.categorySpending.map(item => ({ name: item._id, value: item.total }));
  
  const [showAllTime, setShowAllTime] = useState(false);

  const totalIncome = data.incomeExpense.find(i => i._id === 'income')?.total || 0;
  const totalExpense = data.incomeExpense.find(i => i._id === 'expense')?.total || 0;
  const currentBalance = totalIncome - totalExpense;

  const actualMonthlyExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => {
    const d = new Date(t.date);
    if (d.getMonth() === new Date().getMonth() && d.getFullYear() === new Date().getFullYear()) {
      return acc + t.amount;
    }
    return acc;
  }, 0);

  // Prepare dynamic trend data for the last 6 months
  const trendData = [];
  const currentDate = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    trendData.push({ name: d.toLocaleString('default', { month: 'short' }), expense: 0 });
  }

  transactions.forEach(t => {
    if (t.type === 'expense') {
      const d = new Date(t.date);
      const mName = d.toLocaleString('default', { month: 'short' });
      const monthObj = trendData.find(m => m.name === mName);
      if (monthObj) monthObj.expense += t.amount;
    }
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Balance</p>
              <h3 className="text-3xl font-bold mt-2 dark:text-white">₹{currentBalance.toLocaleString('en-IN')}</h3>
            </div>
            <div className="p-3 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-600"><Wallet size={24} /></div>
          </div>
          <div className="mt-4 flex items-center text-sm font-medium text-emerald-500">
            <TrendingUp size={16} className="mr-1" /> +12.5% from last month
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-2xl p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{showAllTime ? 'All-Time Expense' : 'This Month Expense'}</p>
              <h3 className="text-3xl font-bold mt-2 dark:text-white">₹{(showAllTime ? totalExpense : actualMonthlyExpense).toLocaleString('en-IN') || '0'}</h3>
            </div>
            <button onClick={() => setShowAllTime(!showAllTime)} className="p-3 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-500 hover:bg-red-200 dark:hover:bg-red-900/50 transition" title="Click to toggle All-Time / Monthly"><ArrowDownRight size={24} /></button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card flex flex-col justify-center rounded-2xl p-6 bg-gradient-to-br from-indigo-500 to-primary-600 text-white border-0">
          <div className="flex items-center mb-2"><Sparkles className="mr-2 h-5 w-5 text-indigo-200" /> <span className="font-medium text-indigo-50">AI Insight</span></div>
          <p className="text-lg font-semibold leading-snug">"You are spending 15% less on Food this month! Keep up the good work."</p>
        </motion.div>
      </div>

      {/* 3D Visualization Universe */}
      {pieData.length > 0 && (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="h-[500px] w-full rounded-2xl shadow-indigo-500/10 shadow-2xl overflow-hidden glass-card">
          <Expenses3DView data={pieData} />
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }} className="glass-card rounded-2xl p-6 h-[400px]">
          <h3 className="text-lg font-semibold mb-6 dark:text-white">Expense Breakdown</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius={80} outerRadius={120} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400">No data available</div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }} className="glass-card rounded-2xl p-6 h-[400px]">
          <h3 className="text-lg font-semibold mb-6 dark:text-white">Cash Flow Trend</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} dy={10} />
              <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} dx={-10} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
                itemStyle={{ color: '#3b82f6', fontWeight: 'bold' }}
              />
              <Line type="monotone" dataKey="expense" stroke="#3b82f6" strokeWidth={4} dot={{ r: 5, fill: '#fff', strokeWidth: 2 }} activeDot={{ r: 8, strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
