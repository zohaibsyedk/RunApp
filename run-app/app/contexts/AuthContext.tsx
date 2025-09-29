import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Redirect } from "expo-router";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (tokens: { accessToken: string; refreshToken: string; athleteData: any }) => Promise<void>;
  logout: () => Promise<void>;
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
  getAthleteData: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  console.log("Authenticated? ", isAuthenticated);
  // Check for existing authentication on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const accessToken = await SecureStore.getItemAsync('accessToken');
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      const athleteData = await SecureStore.getItemAsync('athleteData');
      
      if (accessToken && refreshToken) {
        // TODO: Validate token with backend
        setIsAuthenticated(true);
        setShowLoginModal(false);
      } else {
        setIsAuthenticated(false);
        setShowLoginModal(true);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
      setShowLoginModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (tokens: { accessToken: string; refreshToken: string; athleteData: string }) => {
    try {
      // Ensure tokens are strings and not empty
      if (!tokens.accessToken || !tokens.refreshToken || !tokens.athleteData) {
        throw new Error('Invalid tokens provided');
      }
      
      if (typeof tokens.accessToken !== 'string' || typeof tokens.refreshToken !== 'string' || typeof tokens.athleteData !== 'string') {
        throw new Error('Tokens must be strings');
      }
      
      await SecureStore.setItemAsync('accessToken', tokens.accessToken);
      await SecureStore.setItemAsync('refreshToken', tokens.refreshToken);
      await SecureStore.setItemAsync('athleteData', tokens.athleteData);
      setIsAuthenticated(true);
      setShowLoginModal(false);
    } catch (error) {
      console.error('Error saving tokens:', error);
      throw error;
    }
  };

  const logout = async () => {
    console.log("logout");
    try {
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      await SecureStore.deleteItemAsync('athleteData');
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error removing tokens:', error);
    }
    console.log(isAuthenticated);
  };

  const getAthleteData = async () => {
    try {
      const data = await SecureStore.getItemAsync('athleteData');
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting athlete data:', error);
      return null;
    }
  };

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    login,
    logout,
    showLoginModal,
    setShowLoginModal,
    getAthleteData,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
