import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import {
  getStoredCurrentUser,
  setStoredCurrentUser,
  clearSettingsCache,
} from '../services/storageService';
import { api, ApiError, setAuthToken, getAuthToken } from '../services/api';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  role: UserRole | null;
  isLoading: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string; user?: User }>;
  register: (input: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
  }) => Promise<{ success: boolean; error?: string; user?: User }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => getStoredCurrentUser<User>());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      const token = getAuthToken();
      if (!token) {
        setCurrentUser(null);
        setStoredCurrentUser(null);
        setIsLoading(false);
        return;
      }

      try {
        const user = await api.get<User>('/auth/me');
        setCurrentUser(user);
        setStoredCurrentUser(user);
      } catch {
        setAuthToken(null);
        setCurrentUser(null);
        setStoredCurrentUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    void bootstrap();
  }, []);

  useEffect(() => {
    setStoredCurrentUser(currentUser);
  }, [currentUser]);

  const applyAuth = (user: User, token: string) => {
    setAuthToken(token);
    setCurrentUser(user);
    setStoredCurrentUser(user);
    clearSettingsCache();
  };

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string; user?: User }> => {
    try {
      const data = await api.post<{ user: User; token: string }>('/auth/login', {
        email: email.trim().toLowerCase(),
        password: password.trim(),
      });
      applyAuth(data.user, data.token);
      return { success: true, user: data.user };
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : 'Unable to sign in. Please check your credentials and try again.';
      return { success: false, error: message };
    }
  };

  const register = async (input: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
  }): Promise<{ success: boolean; error?: string; user?: User }> => {
    try {
      const data = await api.post<{ user: User; token: string }>('/auth/register', {
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        password: input.password.trim(),
        role: input.role,
      });
      applyAuth(data.user, data.token);
      return { success: true, user: data.user };
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : 'Unable to create account. Please try again.';
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      if (getAuthToken()) {
        await api.post('/auth/logout');
      }
    } catch {
      // ignore logout network errors
    } finally {
      setAuthToken(null);
      setCurrentUser(null);
      setStoredCurrentUser(null);
      clearSettingsCache();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        role: currentUser?.role || null,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
