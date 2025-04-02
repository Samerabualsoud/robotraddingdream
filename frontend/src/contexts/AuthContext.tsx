import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { MT4Credentials, AccountInfo } from '../types/mt4Types';
import mt4Service from '../services/mt4Service';

interface AuthContextType {
  isAuthenticated: boolean;
  accountInfo: AccountInfo | null;
  login: (credentials: MT4Credentials) => Promise<boolean>;
  logout: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      setLoading(true);
      try {
        const storedAuth = localStorage.getItem('mt4_auth');
        if (storedAuth) {
          const authData = JSON.parse(storedAuth);
          const info = await mt4Service.getAccountInfo();
          if (info) {
            setIsAuthenticated(true);
            setAccountInfo(info);
          } else {
            // Session expired or invalid
            localStorage.removeItem('mt4_auth');
          }
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        localStorage.removeItem('mt4_auth');
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (credentials: MT4Credentials): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const success = await mt4Service.login(credentials);
      
      if (success) {
        const info = await mt4Service.getAccountInfo();
        if (info) {
          setIsAuthenticated(true);
          setAccountInfo(info);
          
          // Store auth data securely
          localStorage.setItem('mt4_auth', JSON.stringify({
            server: credentials.server,
            login: credentials.login,
            type: credentials.type,
            timestamp: new Date().getTime()
          }));
          
          return true;
        }
      }
      
      setError('Authentication failed. Please check your credentials.');
      return false;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(`Login error: ${errorMessage}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setLoading(true);
    
    try {
      await mt4Service.logout();
      setIsAuthenticated(false);
      setAccountInfo(null);
      localStorage.removeItem('mt4_auth');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    isAuthenticated,
    accountInfo,
    login,
    logout,
    loading,
    error
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
