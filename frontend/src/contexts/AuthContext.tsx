import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMe = async () => {
      const token = localStorage.getItem('transitops_token');
      if (token) {
        try {
          const response = await api.get('/auth/me');
          if (response.data?.success) {
            setUser(response.data.data);
          } else {
            localStorage.removeItem('transitops_token');
          }
        } catch (error) {
          localStorage.removeItem('transitops_token');
        }
      }
      setLoading(false);
    };

    fetchMe();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data?.success) {
      const { token, user: userData } = response.data.data;
      localStorage.setItem('transitops_token', token);
      setUser(userData);
    } else {
      throw new Error(response.data?.message || 'Authentication failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('transitops_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
