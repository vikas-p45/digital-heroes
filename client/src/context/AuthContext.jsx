import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../services/endpoints.js';
import { tokenStore } from '../services/api.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(Boolean(tokenStore.get()));

  const clear = useCallback(() => { tokenStore.clear(); setUser(null); setSubscription(null); }, []);

  const refresh = useCallback(async () => {
    if (!tokenStore.get()) return;
    try {
      const r = await authApi.me();
      setUser(r.user);
      setSubscription(r.subscription);
    } catch { /* a 401 already cleared the token via the api layer */ }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
    const onUnauthorized = () => { setUser(null); setSubscription(null); };
    window.addEventListener('dh:unauthorized', onUnauthorized);
    return () => window.removeEventListener('dh:unauthorized', onUnauthorized);
  }, [refresh]);

  const accept = (r) => { tokenStore.set(r.token); setUser(r.user); setSubscription(r.subscription); return r.user; };

  const value = useMemo(() => ({
    user, subscription, loading,
    isAdmin: user?.role === 'admin',
    hasAccess: Boolean(subscription?.hasAccess),
    login: async (body) => accept(await authApi.login(body)),
    signup: async (body) => accept(await authApi.signup(body)),
    logout: clear,
    refresh,
  }), [user, subscription, loading, clear, refresh]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
