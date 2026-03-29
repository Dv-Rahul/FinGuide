import { useState, useContext } from 'react';
import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, IndianRupee, BrainCircuit, Target, Settings, Menu, X, LogOut, Sun, Moon, FileText, PieChart } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { ThemeContext } from '../../context/ThemeContext';
import CopilotChat from '../CopilotChat';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);

  if (!user) return <Navigate to="/login" replace />;

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Transactions', path: '/transactions', icon: IndianRupee },
    { name: 'AI Advisor', path: '/ai-advisor', icon: BrainCircuit },
    { name: 'Reports', path: '/reports', icon: FileText },
    { name: 'Budgets', path: '/budgets', icon: PieChart },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#0f172a]">
      {/* Sidebar */}
      <AnimatePresence>
        <motion.aside
          initial={{ x: -300 }}
          animate={{ x: 0 }}
          exit={{ x: -300 }}
          className="w-64 flex-shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1e293b] flex flex-col hidden md:flex"
        >
          <div className="p-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-500 to-indigo-500 bg-clip-text text-transparent">FinGuide</h1>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/50 dark:text-primary-400'
                      : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
                  }`
                }
              >
                <item.icon className="mr-3 h-5 w-5" />
                <span className="font-medium">{item.name}</span>
              </NavLink>
            ))}
          </nav>
          <div className="p-4 border-t border-slate-200 dark:border-slate-800">
            <button onClick={logout} className="flex w-full items-center px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-red-500 transition-colors">
              <LogOut className="mr-3 h-5 w-5" /> Logout
            </button>
          </div>
        </motion.aside>
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-20 lg:h-24 px-8 border-b border-transparent flex items-center justify-between z-10 bg-white/50 dark:bg-dark-bg/50 backdrop-blur-lg">
           <h2 className="text-xl font-bold dark:text-white">Welcome back, {user?.name} 👋</h2>
           <div className="flex items-center space-x-4">
             <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition">
               {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
             </button>
             <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-primary-500 to-indigo-500 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/30">
                {user?.name?.charAt(0)}
             </div>
           </div>
        </header>
        <main className="flex-1 overflow-auto p-4 lg:p-8 relative">
          <Outlet />
        </main>
        
        {/* FinGuide Copilot Chatbot */}
        <CopilotChat />
      </div>
    </div>
  );
};

export default DashboardLayout;
