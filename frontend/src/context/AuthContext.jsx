import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = () => {
    localStorage.removeItem('userInfo');
    setUser(null);
  };

  useEffect(() => {
    const validateToken = async () => {
      const userInfo = localStorage.getItem('userInfo');
      if (userInfo) {
        const parsed = JSON.parse(userInfo);
        try {
          // Verify the token is still valid against the backend
          await axios.get('http://localhost:5001/api/auth/profile', {
            headers: { Authorization: `Bearer ${parsed.token}` }
          });
          setUser(parsed);
        } catch (err) {
          // Token is invalid or user no longer exists — clear stale session
          console.warn('Stored token is invalid, logging out:', err.response?.data?.message || err.message);
          localStorage.removeItem('userInfo');
          setUser(null);
        }
      }
      setLoading(false);
    };
    validateToken();
  }, []);

  // Global interceptor: auto-logout on any 401 response
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          console.warn('401 Unauthorized — clearing session');
          localStorage.removeItem('userInfo');
          setUser(null);
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  const login = async (email, password) => {
    const { data } = await axios.post('http://localhost:5001/api/auth/login', { email, password });
    localStorage.setItem('userInfo', JSON.stringify(data));
    setUser(data);
  };

  const register = async (name, email, password) => {
    const { data } = await axios.post('http://localhost:5001/api/auth/register', { name, email, password });
    localStorage.setItem('userInfo', JSON.stringify(data));
    setUser(data);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
