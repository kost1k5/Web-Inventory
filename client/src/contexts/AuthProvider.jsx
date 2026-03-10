import { useState, useEffect } from 'react';
import { AuthContext } from './AuthContext';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://web-inventory.onrender.com/api';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Текущее состояние сессии запрашивается при старте приложения и после OAuth redirect.
  const checkAuth = async () => {
    try {
      const response = await fetch(`${BASE_URL}/auth/me`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Logout разрывает серверную сессию и синхронизирует локальный auth-state.
  const logout = async () => {
    try {
      const response = await fetch(`${BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        setUser(null);
      }
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, checkAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
