import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';
import { authEvents } from '../services/api';
import { showToast } from '../utils/toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
    
    // Subscribe to auth events
    const unsubscribe = authEvents.subscribe((event) => {
      if (event === 'unauthorized') {
        forceLogout();
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');
      
      if (storedUser === 'undefined' || !storedUser) {
        await AsyncStorage.removeItem('user');
      } else if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const forceLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      setToken(null);
      setUser(null);
      // Show session expired message
      showToast.error('Session expired. Please login to continue.');
    } catch (error) {
      console.error('Error during force logout:', error);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      const authToken = response.data.token;
      const userData = response.data.data?.user;
      
      // Check if user is verified
      if (userData && !userData.isEmailVerified) {
        return { 
          success: false, 
          error: 'Please verify your email address before signing in. Check your inbox for a verification email.',
          requiresVerification: true
        };
      }
      
      await AsyncStorage.setItem('token', authToken);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      
      setToken(authToken);
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      
      // Check if the error message indicates email verification is required
      if (errorMessage.toLowerCase().includes('verify your email') || 
          errorMessage.toLowerCase().includes('email verification') ||
          errorMessage.toLowerCase().includes('please verify')) {
        
        // Automatically resend verification email
        try {
          await authAPI.resendVerification(email);
        } catch (resendError) {
          console.error('Failed to auto-resend verification email:', resendError);
        }
        
        return { 
          success: false, 
          error: errorMessage,
          requiresVerification: true
        };
      }
      
      return { 
        success: false, 
        error: errorMessage
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      
      // Store the email for verification message
      await AsyncStorage.setItem('pendingVerificationEmail', userData.email);
      
      return { 
        success: true, 
        data: response.data,
        message: 'Registration successful! Please check your email to verify your account before signing in.'
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Registration failed' 
      };
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    AsyncStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const clearPendingVerification = async () => {
    try {
      await AsyncStorage.removeItem('pendingVerificationEmail');
    } catch (error) {
      console.error('Error clearing pending verification:', error);
    }
  };

  const getPendingVerificationEmail = async () => {
    try {
      return await AsyncStorage.getItem('pendingVerificationEmail');
    } catch (error) {
      console.error('Error getting pending verification email:', error);
      return null;
    }
  };

  const resendVerification = async (email) => {
    try {
      const response = await authAPI.resendVerification(email);
      return { success: true, message: 'Verification email sent successfully!' };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to resend verification email' 
      };
    }
  };

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated: !!token,
    login,
    register,
    logout,
    forceLogout,
    updateUser,
    clearPendingVerification,
    getPendingVerificationEmail,
    resendVerification,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 