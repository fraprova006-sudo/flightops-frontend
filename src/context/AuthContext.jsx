// frontend/src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('fo_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Recupera profilo utente dal token (decode locale)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp * 1000 > Date.now()) {
          setUser(JSON.parse(localStorage.getItem('fo_user')));
        } else {
          logout();
        }
      } catch {
        logout();
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const res = await apiClient.post('/auth/login', { username, password });
    const { token: newToken, user: newUser } = res.data;
    localStorage.setItem('fo_token', newToken);
    localStorage.setItem('fo_user', JSON.stringify(newUser));
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    setToken(newToken);
    setUser(newUser);
    return newUser;
  };

  const logout = async () => {
    if (user?.id) {
      await apiClient.post('/auth/logout', { userId: user.id }).catch(() => {});
    }
    localStorage.removeItem('fo_token');
    localStorage.removeItem('fo_user');
    delete apiClient.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);