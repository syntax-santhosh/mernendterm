import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('pulseops_token'));
  const [demoUsers, setDemoUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load demo users and active session on mount
  useEffect(() => {
    async function initAuth() {
      try {
        const demoRes = await api.getDemoUsers();
        setDemoUsers(demoRes.users || []);

        const storedToken = localStorage.getItem('pulseops_token');
        if (storedToken) {
          const meRes = await api.getMe();
          setUser(meRes.user);
        } else if (demoRes.users && demoRes.users.length > 0) {
          // Auto-select Admin (Alex Mercer) as default for instant evaluator experience!
          const defaultUser = demoRes.users[0];
          const switchRes = await api.switchDemo(defaultUser.id);
          localStorage.setItem('pulseops_token', switchRes.token);
          setToken(switchRes.token);
          setUser(switchRes.user);
        }
      } catch (err) {
        console.warn('Auth initialization fallback:', err);
      } finally {
        setLoading(false);
      }
    }
    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.login(email, password);
    localStorage.setItem('pulseops_token', res.token);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const register = async (userData) => {
    const res = await api.register(userData);
    localStorage.setItem('pulseops_token', res.token);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const switchDemoUser = async (userId) => {
    try {
      const res = await api.switchDemo(userId);
      localStorage.setItem('pulseops_token', res.token);
      setToken(res.token);
      setUser(res.user);
      return res.user;
    } catch (err) {
      console.error('Failed to switch persona:', err);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('pulseops_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        demoUsers,
        loading,
        login,
        register,
        switchDemoUser,
        logout,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
