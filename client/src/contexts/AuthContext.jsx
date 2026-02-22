import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const NO_AUTH_DEFAULTS = {
  user: null,
  loading: false,
  authEnabled: false,
  refreshUser: () => {},
  logout: () => {},
};

const AuthContext = createContext(NO_AUTH_DEFAULTS);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authEnabled, setAuthEnabled] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (res.status === 404) {
          // Endpoint doesn't exist → self-hosted mode, no auth
          setAuthEnabled(false);
          setLoading(false);
          return null;
        }
        setAuthEnabled(true);
        if (!res.ok) {
          setUser(null);
          setLoading(false);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) setUser(data);
        setLoading(false);
      })
      .catch(() => {
        setAuthEnabled(false);
        setLoading(false);
      });
  }, []);

  const refreshUser = useCallback(() => {
    if (!authEnabled) return;
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (data) setUser(data); })
      .catch(() => {});
  }, [authEnabled]);

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, authEnabled, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
