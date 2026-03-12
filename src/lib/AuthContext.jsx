import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { appClient } from '@/api/base44Client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      setIsLoadingAuth(true);
      const currentUser = await appClient.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
    } catch {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const login = useCallback(async (email, password) => {
    setAuthError(null);
    try {
      const loggedInUser = await appClient.auth.login(email, password);
      setUser(loggedInUser);
      setIsAuthenticated(true);
      return loggedInUser;
    } catch (error) {
      setAuthError(error.message || 'Login failed');
      throw error;
    }
  }, []);

  const register = useCallback(async ({ email, password, full_name, role, gender }) => {
    setAuthError(null);
    try {
      const newUser = await appClient.auth.register({ email, password, full_name, role, gender });
      setUser(newUser);
      setIsAuthenticated(true);
      return newUser;
    } catch (error) {
      setAuthError(error.message || 'Registration failed');
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    appClient.auth.logout();
    setUser(null);
    setIsAuthenticated(false);
    setAuthError(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      authError,
      login,
      register,
      logout,
      checkSession,
    }}>
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
