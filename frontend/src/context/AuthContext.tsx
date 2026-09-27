import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

interface UserContextType {
  user: any | null;
  organization: any | null;
  profile: any | null;
  hierarchyNode: any | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  demoAccounts: any[];
}

const AuthContext = createContext<UserContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [organization, setOrganization] = useState<any | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [hierarchyNode, setHierarchyNode] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('talentos_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [demoAccounts, setDemoAccounts] = useState<any[]>([]);

  const fetchSession = async () => {
    try {
      if (!token) {
        setIsLoading(false);
        return;
      }
      const data = await api.auth.getMe();
      setUser(data.user);
      setOrganization(data.user.organization);
      setProfile(data.user.profile);
      setHierarchyNode(data.user.hierarchyNode);
    } catch (err) {
      console.warn('Failed to restore session, logging out.');
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDemoAccounts = async () => {
    try {
      const data = await api.auth.getDemoAccounts();
      setDemoAccounts(data.demoAccounts || []);
    } catch (e) {
      console.warn('Failed to load demo accounts', e);
    }
  };

  useEffect(() => {
    fetchSession();
    fetchDemoAccounts();
  }, [token]);

  const login = async (email: string, password = 'password123') => {
    setIsLoading(true);
    try {
      const res = await api.auth.login({ email, password });
      localStorage.setItem('talentos_token', res.token);
      setToken(res.token);
      setUser(res.user);
      setOrganization({
        id: res.user.organizationId,
        name: res.user.organizationName,
        type: res.user.organizationType,
      });
      setProfile(res.user.profile);
      setHierarchyNode(res.user.hierarchyNode);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('talentos_token');
    setToken(null);
    setUser(null);
    setOrganization(null);
    setProfile(null);
    setHierarchyNode(null);
  };

  const refreshUser = async () => {
    await fetchSession();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        profile,
        hierarchyNode,
        token,
        isLoading,
        login,
        logout,
        refreshUser,
        demoAccounts,
      }}
    >
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
