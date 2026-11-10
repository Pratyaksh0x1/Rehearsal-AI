'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import { isUserOnboarded } from '@/lib/user';

export interface AuthUser {
  id: string;
  email: string;
  username?: string | null;
  name?: string | null;
  rank: string;
  points: number;
  technicalRank?: string;
  technicalPoints?: number;
  hrRank?: string;
  hrPoints?: number;
  isOnboarded: boolean;
  onboardedAt?: Date | string | null;
  resumeText?: string | null;
  resumeUrl?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  isLoading: boolean;
  isProfileLoading: boolean;
  configError: string | null;
  signInWithGoogle: (nextPath?: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (fields: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  isProfileLoading: true,
  configError: null,
  signInWithGoogle: async () => { },
  signOut: async () => { },
  updateUser: () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [supabase, setSupabase] = useState<any>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const profileSyncIdRef = useRef(0);
  const currentUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    currentUserIdRef.current = user?.id ?? null;
  }, [user]);

  // Initialize client and check env configuration
  useEffect(() => {
    try {
      const client = createClient();
      setSupabase(client);
    } catch (err: any) {
      setConfigError(
        err?.message ||
        'Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY) are missing.'
      );
      setIsLoading(false);
    }
  }, []);

  // Sync Supabase user with database profile
  const syncProfile = async (email: string, rawUser: User, syncId: number) => {
    try {
      const res = await fetch('/api/user/profile');
      if (res.ok) {
        const data = await res.json();
        if (data.user && profileSyncIdRef.current === syncId) {
          const onboarded = isUserOnboarded({
            onboardedAt: data.user.onboardedAt,
            isOnboarded: Boolean(data.user.onboardedAt || data.user.username),
          });

          setUser({
            id: data.user.id || rawUser?.id || 'candidate_user',
            email: data.user.email || email,
            username: data.user.username || null,
            name: rawUser?.user_metadata?.full_name || data.user.username || 'Candidate',
            rank: data.user.technicalRank || data.user.rank || 'Bronze',
            points: data.user.points ?? 0,
            technicalRank: data.user.technicalRank || data.user.rank || 'Bronze',
            technicalPoints: data.user.technicalPoints ?? data.user.points ?? 0,
            hrRank: data.user.hrRank || 'Bronze',
            hrPoints: data.user.hrPoints ?? 0,
            isOnboarded: onboarded,
            onboardedAt: data.user.onboardedAt || null,
            resumeText: data.user.resumeText || null,
            resumeUrl: data.user.resumeUrl || null,
          });
          return;
        }
      }
    } catch (e) {
      console.warn('Error fetching profile during auth sync:', e);
    }

    // Default authenticated state while profile is loading/empty
    if (profileSyncIdRef.current === syncId) {
      setUser((currentUser) =>
        currentUser?.id === rawUser.id
          ? currentUser
          : {
              id: rawUser.id,
              email,
              username: rawUser.user_metadata?.username || null,
              name: rawUser.user_metadata?.full_name || 'Candidate',
              rank: 'Bronze',
              points: 0,
              technicalRank: 'Bronze',
              technicalPoints: 0,
              hrRank: 'Bronze',
              hrPoints: 0,
              isOnboarded: false,
              onboardedAt: null,
            }
      );
    }
  };

  useEffect(() => {
    if (!supabase) return;

    // Listen to Supabase Auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: string, currentSession: Session | null) => {
      // Supabase re-emits SIGNED_IN / TOKEN_REFRESHED whenever the tab regains focus.
      // For the already-signed-in user that must NOT restart the profile sync: doing so flips
      // isProfileLoading to true, AuthGate unmounts the page, and the whole screen "refreshes".
      if (
        currentSession?.user &&
        currentUserIdRef.current === currentSession.user.id &&
        (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION')
      ) {
        setSession(currentSession);
        return;
      }

      const syncId = ++profileSyncIdRef.current;
      setSession(currentSession);

      const authUser = currentSession?.user;
      const authEmail = authUser?.email;
      if (authUser && authEmail) {
        setUser((currentUser) =>
          currentUser?.id === authUser.id
            ? currentUser
            : {
                id: authUser.id,
                email: authEmail,
                username: authUser.user_metadata?.username || null,
                name: authUser.user_metadata?.full_name || 'Candidate',
                rank: 'Bronze',
                points: 0,
                technicalRank: 'Bronze',
                technicalPoints: 0,
                hrRank: 'Bronze',
                hrPoints: 0,
                isOnboarded: false,
                onboardedAt: null,
              }
        );
        setIsLoading(false);
        setIsProfileLoading(true);
        void syncProfile(authEmail, authUser, syncId).finally(() => {
          if (profileSyncIdRef.current === syncId) {
            setIsProfileLoading(false);
          }
        });
      } else {
        setUser(null);
        setIsLoading(false);
        setIsProfileLoading(false);
        if (event === 'SIGNED_OUT') {
          // If on a private route, redirect to home
          if (typeof window !== 'undefined' && window.location.pathname !== '/') {
            window.location.href = '/?auth_error=signed_out';
          }
        }
      }
    });

    return () => {
      profileSyncIdRef.current += 1;
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Supabase Google OAuth sign-in
  const signInWithGoogle = async (nextPath?: string) => {
    if (!supabase) {
      throw new Error('Supabase client is not initialized.');
    }

    const callbackUrl = new URL('/auth/callback', window.location.origin);
    if (nextPath && nextPath.startsWith('/') && !nextPath.startsWith('//')) {
      callbackUrl.searchParams.set('next', nextPath);
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl.toString(),
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      console.error('Supabase OAuth error:', error);
      throw error;
    }
  };

  // Sign out cleanly
  const signOut = async () => {
    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
    } catch (e) {
      console.warn('Sign out error:', e);
    }
    setUser(null);
    setSession(null);
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  const updateUser = (fields: Partial<AuthUser>) => {
    setUser((prev) => (prev ? { ...prev, ...fields } : null));
  };

  if (configError) {
    return (
      <div className="min-h-screen bg-bg text-text-primary flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-surface border border-danger/30 rounded-2xl p-8 shadow-xl space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mx-auto text-xl font-bold">
            !
          </div>
          <h2 className="text-xl font-bold text-white">Authentication Configuration Required</h2>
          <p className="text-sm text-zinc-400 leading-relaxed">{configError}</p>
          <div className="p-3 bg-black/50 border border-white/10 rounded-xl text-xs font-mono text-amber-300 text-left">
            NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
            <br />
            NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isProfileLoading,
        configError,
        signInWithGoogle,
        signOut,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
