import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import {API_URL} from "@env"

type UserType = 'donor' | 'nonprofit' | 'dasher' | null;

interface User {
  id: string;
  auth0Id: string;
  name: string;
  email: string;
  userType: UserType;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  userType: UserType;
  login: (email: string, password: string, userType: UserType) => Promise<void>;
  logout: () => Promise<void>;
  isLoggedIn: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  userType: null,
  login: async () => {},
  logout: async () => {},
  isLoggedIn: false
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userType, setUserType] = useState<UserType>(null);

  // Check for existing auth on startup
  useEffect(() => {
    const loadUser = async () => {
      try {
        const tokenString = await SecureStore.getItemAsync('auth_tokens');
        const userString = await SecureStore.getItemAsync('user_data');
        
        if (tokenString && userString) {
          const userData = JSON.parse(userString);
          setUser(userData);
          setUserType(userData.userType);
        }
      } catch (error) {
        console.error("Failed to load authentication state:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUser();
  }, []);

  const login = async (email: string, password: string, userType: UserType) => {
    setIsLoading(true);
    
    try {
      const response = await fetch(process.env.EXPO_PUBLIC_API_URL + `/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, userType }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }
      
      // Store tokens securely
      await SecureStore.setItemAsync('auth_tokens', JSON.stringify(data.tokens));
      await SecureStore.setItemAsync('user_data', JSON.stringify(data.user));
      
      setUser(data.user);
      setUserType(data.user.userType);
      
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await SecureStore.deleteItemAsync('auth_tokens');
      await SecureStore.deleteItemAsync('user_data');
      setUser(null);
      setUserType(null);
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading,
      userType,
      login, 
      logout,
      isLoggedIn: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};