import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

// Define user types to match your backend implementation
type UserType = 'donor' | 'nonprofit' | 'dasher';

interface User {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  userType: UserType;
  // other user properties
}

interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  login: (email: string, password: string, userType: UserType) => Promise<void>;
  logout: () => Promise<void>;
  isDonor: () => boolean; // Add this new method
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  
  // Check for existing session on app load
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userData = await SecureStore.getItemAsync('user');
        const token = await SecureStore.getItemAsync('token');
        
        if (userData && token) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          setIsLoggedIn(true);
        }
      } catch (error) {
        console.error('Error loading authentication data:', error);
      }
    };
    
    loadUserData();
  }, []);
  
  const login = async (email: string, password: string, userType: UserType) => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          userType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store the token securely
      await SecureStore.setItemAsync('token', data.tokens.access_token);
      
      // Store user data
      const userData = {
        id: data.user._id || data.user.id,
        name: data.user.name,
        email: data.user.email,
        userType: data.user.userType || userType,
      };
      
      await SecureStore.setItemAsync('user', JSON.stringify(userData));
      
      setUser(userData);
      setIsLoggedIn(true);
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  };
  
  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync('user');
      await SecureStore.deleteItemAsync('token');
      setUser(null);
      setIsLoggedIn(false);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };
  
  // Add new helper method to check if the current user is a donor
  const isDonor = (): boolean => {
    return isLoggedIn && user?.userType === 'donor';
  };
  
  return (
    <AuthContext.Provider value={{ 
      isLoggedIn, 
      user, 
      login, 
      logout,
      isDonor // Add the new method to the context
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};