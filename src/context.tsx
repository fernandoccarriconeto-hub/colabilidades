import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Group } from './types';

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  activeGroup: Group | null;
  setActiveGroup: (group: Group | null) => void;
  login: (email: string) => Promise<boolean>;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('colabilidades_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (email: string) => {
    try {
      const res = await fetch(`/api/users/${email}`);
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        localStorage.setItem('colabilidades_user', JSON.stringify(userData));
        return true;
      }
    } catch (error) {
      console.error("Login error", error);
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    setActiveGroup(null);
    localStorage.removeItem('colabilidades_user');
  };

  return (
    <AppContext.Provider value={{ user, setUser, activeGroup, setActiveGroup, login, logout }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
