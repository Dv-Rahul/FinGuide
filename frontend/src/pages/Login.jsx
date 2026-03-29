import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { motion } from 'framer-motion';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (error) {
      alert('Login failed: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-50 dark:bg-dark-bg">
      {/* Decorative background blur */}
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-primary-500/20 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-indigo-500/20 blur-[120px]" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 glass-card rounded-2xl z-10"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent">FinGuide</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Sign in to your premium dashboard</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2 dark:text-slate-300">Email Address</label>
            <input 
              type="email" 
              className="input-field" 
              value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 dark:text-slate-300">Password</label>
            <input 
              type="password" 
              className="input-field" 
              value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required 
            />
          </div>
          <button type="submit" className="w-full py-3 px-4 rounded-xl text-white font-medium bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 shadow-lg shadow-indigo-500/30 transform transition hover:-translate-y-0.5">
            Sign In
          </button>
        </form>
        <div className="mt-6 text-center text-sm dark:text-slate-400">
          Don't have an account? <Link to="/register" className="text-primary-600 hover:underline">Create one</Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
