import React, { createContext, useContext, useState, useEffect } from 'react';
import { userApi, authApi } from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'donor' | 'requester' | 'admin';
  bloodGroup: string;
  contactNumber: string;
  availability?: boolean;
  rating?: number;
  location?: {
    address: string;
    latitude?: number;
    longitude?: number;
    city?: string;
    state?: string;
  };
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const checkAuth = async () => {
      try {
        // Try to get user from localStorage first (for faster UI)
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }

        // Verify with server (validates cookie)
        const response = await userApi.getProfile();
        if (response.success && response.data) {
          const userData = response.data as User;
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        }
      } catch (error) {
        // Token expired or user not authenticated
        setUser(null);
        localStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authApi.login(email, password);
      if (response.success && response.data) {
        // Server now returns { user: {...} } without tokens
        const userData = (response.data as any)?.user || response.data;
        setUser(userData as User);
        localStorage.setItem('user', JSON.stringify(userData));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: any) => {
    setIsLoading(true);
    try {
      const response = await authApi.register(data);
      if (response.success && response.data) {
        // Server now returns { user: {...} } without tokens
        const userData = (response.data as any)?.user || response.data;
        setUser(userData as User);
        localStorage.setItem('user', JSON.stringify(userData));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Call logout endpoint to clear cookies on server
      await authApi.logout();
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('user');
    }
  };

  const updateProfile = async (data: any) => {
    try {
      const response = await userApi.updateProfile(data);
      if (response.success && response.data) {
        const userData = response.data as User;
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      }
    } catch (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      logout,
      updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
