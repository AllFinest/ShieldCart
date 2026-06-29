/**
 * Authentication Context
 *
 * Provides global authentication state to the entire React app.
 * - Tracks whether the user is authenticated
 * - Hydrates the current user from the API on app start
 * - Provides login/logout functions
 *
 * Components access auth state via useAuth() hook.
 */

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { API_ENDPOINTS } from '../utils/constants';
import { fetchCsrfToken, default as api } from '../services/api';

const AuthContext = createContext(null);

function getInitialAuthState() {
  const token = localStorage.getItem('accessToken');
  if (!token) return { user: null, isAuthenticated: false };

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp * 1000 > Date.now()) {
      let trust = null;
      try {
        trust = JSON.parse(localStorage.getItem('sessionTrust') || 'null');
      } catch {
        trust = null;
      }
      return {
        user: { id: payload.userId, email: payload.email, role: payload.role },
        trust,
        isAuthenticated: true,
      };
    }
  } catch {
    // Invalid token
  }

  localStorage.removeItem('accessToken');
  localStorage.removeItem('sessionTrust');
  return { user: null, isAuthenticated: false };
}

function clearStoredSession() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('csrfToken');
  localStorage.removeItem('sessionTrust');
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState(getInitialAuthState);
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('accessToken')));

  useEffect(() => {
    fetchCsrfToken();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const hydrateCurrentUser = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const response = await api.get(API_ENDPOINTS.AUTH.ME);
        const user = response.data.data;
        const trust = user.trust || JSON.parse(localStorage.getItem('sessionTrust') || 'null');

        if (isMounted) {
          setAuthState({
            user,
            trust,
            isAuthenticated: true,
          });
        }
      } catch (error) {
        const status = error.response?.status;

        if (status === 401 || status === 403 || status === 404) {
          clearStoredSession();
        }

        if (isMounted) {
          setAuthState({ user: null, isAuthenticated: false });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    hydrateCurrentUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback((accessToken, userData, trust = null) => {
    localStorage.setItem('accessToken', accessToken);
    if (trust) {
      localStorage.setItem('sessionTrust', JSON.stringify(trust));
    } else {
      localStorage.removeItem('sessionTrust');
    }
    setAuthState({ user: userData, trust, isAuthenticated: true });
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout failed', error);
    } finally {
      clearStoredSession();
      setAuthState({ user: null, trust: null, isAuthenticated: false });
      setLoading(false);
      window.location.href = '/login';
    }
  }, []);

  const value = {
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    trust: authState.trust || null,
    loading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
