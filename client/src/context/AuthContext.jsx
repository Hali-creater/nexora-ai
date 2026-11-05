import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [puterUser, setPuterUser] = useState(null);
  const [puterStatus, setPuterStatus] = useState('checking'); // 'checking' | 'logged_in' | 'logged_out' | 'unavailable'

  // Initialize NEXORA session
  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (e) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Initialize Puter official SDK session check
  const checkPuterSession = async () => {
    if (typeof window !== 'undefined' && window.puter) {
      try {
        if (window.puter.auth?.isSignedIn && window.puter.auth.isSignedIn()) {
          const pUser = await window.puter.auth.getUser();
          setPuterUser(pUser);
          setPuterStatus('logged_in');
        } else {
          setPuterUser(null);
          setPuterStatus('logged_out');
        }
      } catch (err) {
        console.warn('Puter auth check:', err);
        setPuterStatus('logged_out');
      }
    } else {
      setPuterStatus('unavailable');
    }
  };

  useEffect(() => {
    checkAuth();
    // Allow Puter script to load if asynchronous
    const timer = setTimeout(checkPuterSession, 800);
    return () => clearTimeout(timer);
  }, []);

  const login = async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    setUser(data.user);
    return data.user;
  };

  const register = async (name, email, password) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
      credentials: 'include'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (_) {}
    setUser(null);
  };

  // Puter SDK Auth Trigger
  const signInWithPuter = async () => {
    if (window.puter?.auth?.signIn) {
      try {
        await window.puter.auth.signIn();
        const pUser = await window.puter.auth.getUser();
        setPuterUser(pUser);
        setPuterStatus('logged_in');
        return pUser;
      } catch (e) {
        console.error('Puter sign in error:', e);
        throw e;
      }
    } else {
      throw new Error('Puter SDK is not available in this environment.');
    }
  };

  const signOutPuter = async () => {
    if (window.puter?.auth?.signOut) {
      await window.puter.auth.signOut();
      setPuterUser(null);
      setPuterStatus('logged_out');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        checkAuth,
        puterUser,
        puterStatus,
        signInWithPuter,
        signOutPuter
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
