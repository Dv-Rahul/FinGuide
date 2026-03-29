import { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Send, Bot, User as UserIcon, Loader2, Sparkles, TrendingUp, AlertTriangle } from 'lucide-react';

const AIAdvisor = () => {
  const { user } = useContext(AuthContext);
  const [advice, setAdvice] = useState('');
  const [loadingAdvice, setLoadingAdvice] = useState(true);
  
  const [chat, setChat] = useState([]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    const fetchAdvice = async () => {
      try {
        const { data } = await axios.get('http://localhost:5001/api/ai/advice', { headers: { Authorization: `Bearer ${user.token}` } });
        setAdvice(data.advice);
      } catch (error) { setAdvice('Could not load AI insights at the moment. Please ensure your API keys are configured correctly or try later.'); }
      setLoadingAdvice(false);
    };
    fetchAdvice();
  }, [user]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [chat, chatLoading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const userMessage = { role: 'user', content: input };
    setChat(prev => [...prev, userMessage]);
    setInput('');
    setChatLoading(true);

    try {
      const { data } = await axios.post('http://localhost:5001/api/ai/chat', { question: userMessage.content }, { headers: { Authorization: `Bearer ${user.token}` } });
      setChat(prev => [...prev, { role: 'ai', content: data.reply }]);
    } catch (e) {
      setChat(prev => [...prev, { role: 'ai', content: 'Connection error answering your query.' }]);
    }
    setChatLoading(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
      {/* Financial Health & Insights */}
      <div className="lg:col-span-1 space-y-6 flex flex-col h-full overflow-y-auto">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="shrink-0 glass-card rounded-2xl p-6 bg-gradient-to-br from-indigo-500 to-purple-600 text-white relative overflow-hidden">
           <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
           <div className="flex items-center"><span className="p-2 bg-white/20 rounded-lg mr-3 shadow-inner"><Sparkles size={20} /></span><h3 className="font-bold text-lg">Financial Overview</h3></div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="min-h-0 glass-card rounded-2xl p-6 flex-1 flex flex-col pointer-events-auto">
          <div className="flex items-center mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
             <span className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 mr-3"><TrendingUp size={16} /></span>
             <h3 className="font-bold dark:text-white">AI General Advice</h3>
          </div>
          <div className="flex-1 overflow-y-auto text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-4">
             {loadingAdvice ? (
               <div className="flex flex-col items-center justify-center py-10 opacity-50"><Loader2 className="animate-spin mb-2" size={24}/> Analyzing your finances...</div>
             ) : (
                advice.split('\n').filter(Boolean).map((p, i) => (
                  <p key={i} className="flex gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                    <span>{p.replace(/^\d+\.\s*/, '')}</span>
                  </p>
                ))
             )}
          </div>
        </motion.div>
      </div>

      {/* Copilot Chat Interface */}
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="lg:col-span-2 glass-card rounded-2xl flex flex-col h-full border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md flex items-center">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary-500 to-indigo-600 flex items-center justify-center mr-4 shadow-md shadow-primary-500/20">
              <Bot className="text-white" size={20} />
            </div>
            <div>
              <h2 className="font-bold text-lg dark:text-white leading-tight">FinGuide Copilot</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Your personal AI wealth manager</p>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6" ref={scrollRef}>
           <div className="flex justify-start">
             <div className="bg-slate-100 dark:bg-slate-800/80 rounded-2xl rounded-tl-sm px-5 py-3 text-sm text-slate-800 dark:text-slate-200 max-w-[85%] sm:max-w-md shadow-sm border border-slate-200/50 dark:border-slate-700/50">
               Hello {user?.name}! I'm here to answer questions about your finances, analyze your spending habits, and suggest ways to reach your goals. Ask me anything!
             </div>
           </div>
           
           {chat.map((msg, i) => (
             <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
               {msg.role === 'ai' && <div className="w-8 h-8 rounded-full bg-indigo-500 flex-shrink-0 flex items-center justify-center mr-2 shadow-sm text-white"><Bot size={14}/></div>}
               <div className={`px-5 py-3.5 text-sm rounded-2xl max-w-[85%] sm:max-w-md shadow-sm ${msg.role === 'user' ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white rounded-tr-sm' : 'bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 rounded-tl-sm border border-slate-200/50 dark:border-slate-700/50 leading-relaxed'}`}>
                 {msg.content}
               </div>
               {msg.role === 'user' && <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0 flex items-center justify-center ml-2 shadow-sm text-slate-500 dark:text-slate-400"><UserIcon size={14}/></div>}
             </motion.div>
           ))}
           {chatLoading && (
             <div className="flex justify-start">
               <div className="w-8 h-8 rounded-full bg-indigo-500 flex-shrink-0 flex items-center justify-center mr-2"><Bot size={14} className="text-white"/></div>
               <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-tl-sm px-5 py-3.5 flex items-center space-x-2">
                 <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div><div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div><div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
               </div>
             </div>
           )}
        </div>

        <div className="p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-100 dark:border-slate-800">
          <form onSubmit={handleSend} className="flex relative">
            <input 
              type="text" 
              className="w-full pl-5 pr-14 py-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 dark:focus:ring-indigo-500 focus:outline-none transition dark:text-white shadow-inner"
              placeholder="Ask about your expenses, trends, etc..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" disabled={chatLoading} className="absolute right-2 top-2 bottom-2 aspect-square flex items-center justify-center bg-primary-100 text-primary-600 hover:bg-primary-600 hover:text-white dark:bg-indigo-900/50 dark:text-indigo-400 dark:hover:bg-indigo-600 dark:hover:text-white rounded-lg transition-colors disabled:opacity-50">
              <Send size={18} />
            </button>
          </form>
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 hide-scrollbar">
            {[
              'Where am I overspending?', 
              'Forecast next month expenses', 
              'How to save ₹5000?',
              'How much did I spend in total?',
              'What is my highest spending category?',
              'Where can I reduce my spending?',
              'Am I overspending this month?',
              'Can you predict my expenses?',
              'How to save money on groceries?',
              'Forecast my transport budget',
              'How much more can I save?',
              'Where should I cut expenses?',
              'How much am I spending on Food?'
            ].map(q => (
              <button key={q} type="button" onClick={() => {setInput(q);}} className="text-xs whitespace-nowrap px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition">
                {q}
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AIAdvisor;
