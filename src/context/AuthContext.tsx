import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { User, UserRole } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────
interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string, role?: UserRole) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    role: UserRole,
    fullName: string
  ) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('fetchUser error:', error.message);
      return;
    }
    setUser(data as User);
  }, []);

  const refreshUser = useCallback(async () => {
    const { data: { session: s } } = await supabase.auth.getSession();
    if (s?.user) await fetchUser(s.user.id);
  }, [fetchUser]);

  // Bootstrap auth state
  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data: { session: s } }: { data: { session: Session | null } }) => {
      if (!mounted) return;
      setSession(s);
      if (s?.user) await fetchUser(s.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, s: Session | null) => {
        if (!mounted) return;
        setSession(s);
        if (s?.user) {
          void fetchUser(s.user.id);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUser]);

  // ─── Actions ──────────────────────────────────────────────────────────────
  const signIn = async (email: string, password: string, role?: UserRole) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);

    const signedUserId = data.user?.id;
    if (!signedUserId || !role) return;

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', signedUserId)
      .single();

    if (profileError) throw new Error(profileError.message);

    // Keep admin role immutable through public login role switch.
    if (profile.role !== 'admin' && profile.role !== role) {
      const { error: roleUpdateError } = await supabase
        .from('users')
        .update({ role })
        .eq('id', signedUserId);
      if (roleUpdateError) throw new Error(roleUpdateError.message);
    }

    await fetchUser(signedUserId);
  };

  const signUp = async (
    email: string,
    password: string,
    role: UserRole,
    fullName: string
  ) => {
    const emailRedirectTo = typeof window !== 'undefined'
      ? `${window.location.origin}/verify-email?email=${encodeURIComponent(email)}`
      : undefined;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo,
        data: { role, full_name: fullName },
      },
    });
    if (error) throw new Error(error.message);
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{ session, user, loading, signIn, signUp, signOut, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
