import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = authService.getToken();
        const storedUser = authService.getUser();
        const storedUserType = authService.getUserType();

        if (token && storedUser) {
          setUser(storedUser);
          setUserType(storedUserType);
          
          // Verify token is still valid by fetching current user
          try {
            const response = await authService.getMe();
            if (response.data.success) {
              setUser(response.data.data);
              setUserType(response.data.data.userType);
              authService.setUser(response.data.data, response.data.data.userType);
            }
          } catch (error) {
            // Token invalid, clear auth
            authService.removeToken();
            setUser(null);
            setUserType(null);
          }
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email, password, rememberMe = false) => {
    try {
      const response = await authService.login(email, password, rememberMe);
      
      if (response.data.success) {
        const { user, token, refreshToken, linkedProfiles } = response.data.data;
        
        // Store token
        authService.setToken(token, refreshToken);
        
        // Store user data
        authService.setUser(user, user.userType || 'CLIENT');
        
        setUser(user);
        setUserType(user.userType || 'CLIENT');
        
        return { success: true, user, linkedProfiles };
      }
      
      return { success: false, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    }
  };

  const register = async (data) => {
    try {
      const response = await authService.register(data);
      
      if (response.data.success) {
        const { user, token, refreshToken } = response.data.data;
        
        // Store token
        authService.setToken(token, refreshToken);
        
        // Store user data
        authService.setUser(user, 'CLIENT');
        
        setUser(user);
        setUserType('CLIENT');
        
        return { success: true, user };
      }
      
      return { success: false, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      };
    }
  };

  const guestLogin = async () => {
    try {
      const response = await authService.guestLogin();
      
      if (response.data.success) {
        const { user, token } = response.data.data;
        
        // Store token
        authService.setToken(token);
        
        // Store user data
        authService.setUser(user, 'CLIENT');
        
        setUser(user);
        setUserType('CLIENT');
        
        return { success: true, user };
      }
      
      return { success: false, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Guest login failed'
      };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      authService.removeToken();
      setUser(null);
      setUserType(null);
      navigate('/');
    }
  };

  const updateProfile = async (data) => {
    try {
      const response = await authService.updateProfile(data);
      
      if (response.data.success) {
        const updatedUser = response.data.data;
        authService.setUser(updatedUser, updatedUser.userType || userType);
        setUser(updatedUser);
        return { success: true, user: updatedUser };
      }
      
      return { success: false, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Update failed'
      };
    }
  };

  const value = {
    user,
    userType,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    guestLogin,
    logout,
    updateProfile,
    refreshUser: async () => {
      try {
        const response = await authService.getMe();
        if (response.data.success) {
          const updatedUser = response.data.data;
          authService.setUser(updatedUser, updatedUser.userType || userType);
          setUser(updatedUser);
          setUserType(updatedUser.userType || userType);
        }
      } catch (error) {
        console.error('Error refreshing user:', error);
      }
    }
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};




