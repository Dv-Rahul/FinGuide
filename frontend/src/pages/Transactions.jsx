import { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Trash2, Filter, Mic, Loader2, Camera } from 'lucide-react';
import { format } from 'date-fns';
import Tesseract from 'tesseract.js';

const Transactions = () => {
  const { user } = useContext(AuthContext);
  const [transactions, setTransactions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', amount: '', type: 'expense', category: 'Food', date: new Date().toISOString().split('T')[0] });
  const [isListening, setIsListening] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [isScanningReceipt, setIsScanningReceipt] = useState(false);
  const fileInputRef = useRef(null);

  const handleReceiptScan = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsScanningReceipt(true);
    try {
      const result = await Tesseract.recognize(file, 'eng');
      const text = result.data.text;
      
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2);
      const title = lines.length > 0 ? lines[0].substring(0, 30) : 'Scanned Receipt';
      
      const amountMatches = text.match(/\d+\.\d{2}/g);
      let amount = 0;
      if (amountMatches) {
        const amounts = amountMatches.map(Number);
        amount = Math.max(...amounts);
      }

      setForm({
        title,
        amount: amount || '',
        type: 'expense',
        category: 'Food',
        date: new Date().toISOString().split('T')[0]
      });
      setShowModal(true);
    } catch (err) {
      console.error('OCR Error:', err);
      alert('Failed to scan the receipt. Please try checking the image clarity.');
    } finally {
      setIsScanningReceipt(false);
      e.target.value = null;
    }
  };

  const startVoiceRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser doesn't support Voice Recognition. Please use Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      setIsListening(false);
      setIsProcessingVoice(true);
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data } = await axios.post('http://localhost:5001/api/transactions/parse-voice', { transcript }, config);
        
        setForm({
          title: data.title || transcript.substring(0, 30),
          amount: data.amount || 0,
          type: data.type || 'expense',
          category: data.category || 'Other',
          date: data.date || new Date().toISOString().split('T')[0]
        });
        setShowModal(true);
      } catch (e) {
        console.error('Voice parsing error', e);
        alert('Failed to process. Make sure you mention an amount!');
      } finally {
        setIsProcessingVoice(false);
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const fetchTransactions = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get('http://localhost:5001/api/transactions', config);
      setTransactions(data);
    } catch (e) { console.error('Error fetching transactions', e); }
  };

  useEffect(() => { fetchTransactions(); }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` } };
      await axios.post('http://localhost:5001/api/transactions', form, config);
      fetchTransactions();
      setShowModal(false);
      setForm({ title: '', amount: '', type: 'expense', category: 'Food', date: new Date().toISOString().split('T')[0] });
    } catch (e) {
      console.error('Add transaction error:', e.response?.data || e.message);
      alert('Error adding transaction: ' + (e.response?.data?.message || e.message));
    }
  };

  const deleteTx = async (id) => {
    if (!window.confirm('Delete this transaction?')) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.delete(`http://localhost:5001/api/transactions/${id}`, config);
      fetchTransactions();
    } catch (e) { alert('Error deleting transaction'); }
  };

  return (
    <div className="space-y-6 relative h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold dark:text-white">Transactions</h2>
          <p className="text-slate-500 dark:text-slate-400">Track and manage your daily expenses</p>
        </div>
        <div className="flex gap-3">
          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleReceiptScan} className="hidden" />
          <button 
            onClick={() => fileInputRef.current?.click()} 
            disabled={isScanningReceipt}
            className={`flex items-center justify-center p-3 rounded-xl shadow-lg transition ${isScanningReceipt ? 'bg-indigo-500 text-white animate-pulse shadow-indigo-500/30' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500'}`}
            title="Scan Receipt (Local Native AI)"
          >
            {isScanningReceipt ? <Loader2 size={20} className="animate-spin" /> : <Camera size={20} />}
          </button>
          <button 
            onClick={startVoiceRecognition} 
            disabled={isListening || isProcessingVoice}
            className={`flex items-center justify-center p-3 rounded-xl shadow-lg transition ${isListening ? 'bg-red-500 text-white animate-pulse shadow-red-500/30' : isProcessingVoice ? 'bg-indigo-500 text-white shadow-indigo-500/30' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-primary-500 dark:hover:border-primary-500'}`}
            title="Log with Voice"
          >
            {isProcessingVoice ? <Loader2 size={20} className="animate-spin" /> : <Mic size={20} />}
          </button>
          <button onClick={() => setShowModal(true)} className="flex items-center px-4 py-2 bg-gradient-to-r from-primary-600 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-indigo-500/30 transition shadow-primary-500/20">
            <Plus size={20} className="mr-2" /> Add New
          </button>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl overflow-hidden flex-1 flex flex-col">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
           <div className="relative w-full max-w-sm">
             <Search size={18} className="absolute left-3 top-2.5 text-slate-400" />
             <input type="text" placeholder="Search transactions..." className="w-full pl-10 pr-4 py-2 rounded-lg border-0 bg-white dark:bg-slate-900 shadow-sm focus:ring-2 focus:ring-primary-500 dark:text-white transition" />
           </div>
           <button className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
             <Filter size={20} />
           </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-sm">
                <th className="p-4 font-medium">Transaction</th>
                <th className="p-4 font-medium">Category</th>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 text-right font-medium">Amount</th>
                <th className="p-4 text-center font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {transactions.length === 0 ? (
                  <tr><td colSpan="5" className="p-8 text-center text-slate-500">No transactions found. Add one!</td></tr>
                ) : transactions.map((t, idx) => (
                  <motion.tr initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ delay: idx * 0.05 }} key={t._id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition group">
                    <td className="p-4 font-medium dark:text-slate-200">{t.title}</td>
                    <td className="p-4"><span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full text-xs font-medium">{t.category}</span></td>
                    <td className="p-4 text-slate-500 text-sm">{format(new Date(t.date), 'MMM dd, yyyy')}</td>
                    <td className={`p-4 text-right font-bold ${t.type === 'income' ? 'text-emerald-500' : 'text-slate-800 dark:text-white'}`}>
                      {t.type === 'income' ? '+' : '-'}₹{t.amount}
                    </td>
                    <td className="p-4 text-center">
                      <button onClick={() => deleteTx(t._id)} className="text-slate-400 hover:text-red-500 transition opacity-0 group-hover:opacity-100"><Trash2 size={18} /></button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Modal Overlay */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                <h3 className="text-xl font-bold dark:text-white">Add Transaction</h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">&times;</button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div><label className="text-sm font-medium mb-1 block dark:text-slate-300">Title</label><input type="text" className="input-field" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required/></div>
                <div><label className="text-sm font-medium mb-1 block dark:text-slate-300">Amount (₹)</label><input type="number" className="input-field" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required/></div>
                <div><label className="text-sm font-medium mb-1 block dark:text-slate-300">Date</label><input type="date" className="input-field" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required/></div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block dark:text-slate-300">Type</label>
                    <select className="input-field" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                      <option value="expense">Expense</option><option value="income">Income</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block dark:text-slate-300">Category</label>
                    <select className="input-field" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                      <option value="Food">Food</option><option value="Transport">Transport</option><option value="Entertainment">Entertainment</option><option value="Bills">Bills</option><option value="Salary">Salary</option><option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="w-full mt-4 py-3 bg-gradient-to-r from-primary-600 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-indigo-500/20 font-medium">Save Transaction</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Transactions;
