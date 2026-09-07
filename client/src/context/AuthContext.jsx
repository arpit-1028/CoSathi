import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('cosathi_token'));
  const [loading, setLoading] = useState(true);

  // Initialize session by verifying JWT with backend
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('cosathi_token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.user);
            setProfile(res.data.profile);
          } else {
            logout();
          }
        } catch (err) {
          console.warn('[Auth] Session token invalid or expired. Logging out.');
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (identifier, password) => {
    try {
      const res = await api.post('/auth/login', { identifier, password });
      if (res.data.success) {
        const { token: jwtToken, user: userData, profile: profileData } = res.data;
        setToken(jwtToken);
        setUser(userData);
        setProfile(profileData);
        localStorage.setItem('cosathi_token', jwtToken);
        localStorage.setItem('cosathi_user', JSON.stringify(userData));
        return { success: true, user: userData };
      }
      return { success: false, message: res.data.message };
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Please check credentials.';
      return { success: false, message };
    }
  };

  const register = async (formData) => {
    try {
      const res = await api.post('/auth/register', formData);
      if (res.data.success) {
        const { token: jwtToken, user: userData, profile: profileData } = res.data;
        setToken(jwtToken);
        setUser(userData);
        setProfile(profileData);
        localStorage.setItem('cosathi_token', jwtToken);
        localStorage.setItem('cosathi_user', JSON.stringify(userData));
        return { success: true, user: userData };
      }
      return { success: false, message: res.data.message };
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed.';
      return { success: false, message };
    }
  };

  const logout = () => {
    setUser(null);
    setProfile(null);
    setToken(null);
    localStorage.removeItem('cosathi_token');
    localStorage.removeItem('cosathi_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        token,
        role: user?.role || null,
        loading,
        login,
        register,
        logout,
        isAuthenticated: Boolean(token && user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
