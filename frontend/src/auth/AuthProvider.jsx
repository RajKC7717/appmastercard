import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  currentSession,
  homeForRole,
  login as loginRequest,
  logout as logoutRequest,
  signup as signupRequest,
} from './authApi.js';

const AuthContext = createContext(null);

/**
 * The signed-in session, shared by all three role apps.
 *
 * The session is read synchronously from storage on first render rather
 * than fetched in an effect. That matters: an async read would flash the
 * sign-in screen for a fraction of a second on every reload of an already
 * authenticated console, which reads as being logged out.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => currentSession());
  const [busy, setBusy] = useState(false);

  const signIn = useCallback(async (credentials) => {
    setBusy(true);
    try {
      const { data } = await loginRequest(credentials);
      setUser(data.user);
      return { ok: true, user: data.user };
    } catch (error) {
      return { ok: false, error: error.message, code: error.code };
    } finally {
      setBusy(false);
    }
  }, []);

  const signUp = useCallback(async (details) => {
    setBusy(true);
    try {
      const { data } = await signupRequest(details);
      setUser(data.user);
      return { ok: true, user: data.user };
    } catch (error) {
      return { ok: false, error: error.message, code: error.code, field: error.field };
    } finally {
      setBusy(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    await logoutRequest();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      busy,
      signIn,
      signUp,
      signOut,
      isSignedIn: Boolean(user),
      home: user ? homeForRole(user.role) : '/login',
    }),
    [user, busy, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
