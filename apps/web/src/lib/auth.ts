import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isVerified?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const initializeAuth = async () {
      const storedToken = localStorage.getItem('access_token');
      if (storedToken) {
        setToken(storedToken);
        try {
          const profile = await api.auth.getProfile();
          setUser(profile.user);
        } catch (error) {
          // Token might be invalid, clear it
          localStorage.removeItem('access_token');
          setToken(null);
          setUser(null);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.auth.login({ email, password });
      const { access_token, user } = response;

      localStorage.setItem('access_token', access_token);
      setToken(access_token);
      setUser(user);
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData: any) => {
    try {
      const response = await api.auth.register(userData);
      const { access_token, user } = response;

      localStorage.setItem('access_token', access_token);
      setToken(access_token);
      setUser(user);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setToken(null);
    setUser(null);
    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login';
    }
  };

  const refreshToken = async () => {
    if (!token) return;

    try {
      const response = await api.auth.refreshToken();
      const { access_token } = response;

      localStorage.setItem('access_token', access_token);
      setToken(access_token);

      // Refresh user profile
      const profile = await api.auth.getProfile();
      setUser(profile.user);
    } catch (error) {
      // Refresh failed, clear token
      localStorage.removeItem('access_token');
      setToken(null);
      setUser(null);
      throw error;
    }
  };

  const updateProfile = async (data: any) => {
    try {
      const response = await api.auth.updateProfile(data);
      setUser(response.user);
      return response.user;
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    token,
    isLoading,
    login,
    register,
    logout,
    refreshToken,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
}