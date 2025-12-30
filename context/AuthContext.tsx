import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { USERS } from '../services/mockData';

const STORAGE_KEY = 'qbarber_auth';

interface AuthContextType {
  user: User | null;
  login: (email: string, role: UserRole) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children?: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    // Try to restore user from localStorage on initial load
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Verify the user still exists in USERS array
        const foundUser = USERS.find(u => u.id === parsed.id);
        return foundUser || null;
      }
    } catch (e) {
      console.error('Error restoring auth state:', e);
    }
    return null;
  });

  // Persist user to localStorage when it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: user.id, role: user.role }));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  const login = (email: string, role: UserRole) => {
    // Mock login logic: find user by email or fallback to role-based demo user
    let found = USERS.find(u => u.email === email);
    if (!found) {
      // For demo purposes, if email doesn't match, give a default user for that role
      found = USERS.find(u => u.role === role);
    }
    if (found) {
      setUser(found);
    }
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
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