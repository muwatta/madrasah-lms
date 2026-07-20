import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api';
import type { User } from '../types';

interface StoredSession {
  user: User;
  tokens: { access: string; refresh: string };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  isAuthenticated: boolean;
  switchAccount: (email: string) => boolean;
  getStoredSessions: () => StoredSession[];
  removeStoredSession: (email: string) => void;
}

const SESSIONS_KEY = 'lms_sessions';
const ACTIVE_EMAIL_KEY = 'lms_active_email';

function getStoredSessions(): Record<string, StoredSession> {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStoredSessions(sessions: Record<string, StoredSession>) {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const activeEmail = sessionStorage.getItem(ACTIVE_EMAIL_KEY);
    const sessions = getStoredSessions();

    if (activeEmail && sessions[activeEmail]) {
      const session = sessions[activeEmail];
      sessionStorage.setItem('access_token', session.tokens.access);
      sessionStorage.setItem('refresh_token', session.tokens.refresh);
      try {
        const response = await authAPI.getMe();
        setUser(response.data);
        sessions[activeEmail].user = response.data;
        saveStoredSessions(sessions);
      } catch {
        delete sessions[activeEmail];
        saveStoredSessions(sessions);
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('refresh_token');
        sessionStorage.removeItem(ACTIVE_EMAIL_KEY);
      }
    } else {
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('refresh_token');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email: string, password: string): Promise<User> => {
    const response = await authAPI.login(email, password);
    const { user: userData, tokens } = response.data;

    sessionStorage.setItem('access_token', tokens.access);
    sessionStorage.setItem('refresh_token', tokens.refresh);
    sessionStorage.setItem(ACTIVE_EMAIL_KEY, email);

    const sessions = getStoredSessions();
    sessions[email] = { user: userData, tokens };
    saveStoredSessions(sessions);

    setUser(userData);
    return userData;
  };

  const logout = () => {
    const activeEmail = sessionStorage.getItem(ACTIVE_EMAIL_KEY);
    if (activeEmail) {
      const sessions = getStoredSessions();
      delete sessions[activeEmail];
      saveStoredSessions(sessions);
    }
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
    sessionStorage.removeItem(ACTIVE_EMAIL_KEY);
    setUser(null);
  };

  const switchAccount = (email: string): boolean => {
    const sessions = getStoredSessions();
    if (!sessions[email]) return false;

    const session = sessions[email];
    sessionStorage.setItem('access_token', session.tokens.access);
    sessionStorage.setItem('refresh_token', session.tokens.refresh);
    sessionStorage.setItem(ACTIVE_EMAIL_KEY, email);
    setUser(session.user);
    return true;
  };

  const listStoredSessions = (): StoredSession[] => {
    const sessions = getStoredSessions();
    return Object.values(sessions);
  };

  const removeStoredSession = (email: string) => {
    const sessions = getStoredSessions();
    const activeEmail = sessionStorage.getItem(ACTIVE_EMAIL_KEY);

    if (email === activeEmail) {
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('refresh_token');
      sessionStorage.removeItem(ACTIVE_EMAIL_KEY);
      setUser(null);
    }

    delete sessions[email];
    saveStoredSessions(sessions);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
        switchAccount,
        getStoredSessions: listStoredSessions,
        removeStoredSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
