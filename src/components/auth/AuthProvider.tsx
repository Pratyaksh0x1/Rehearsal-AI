'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

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
  resumeText?: string | null;
  resumeUrl?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithDemo: (name?: string, email?: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (fields: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  signInWithGoogle: async () => {},
  signInWithDemo: async () => {},
  signOut: async () => {},
  updateUser: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sync Supabase user with database profile
  const syncProfile = async (email: string, rawUser?: User) => {
    try {
      const res = await fetch('/api/user/profile');
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
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
            isOnboarded: Boolean(data.user.username && data.user.resumeText),
            resumeText: data.user.resumeText,
            resumeUrl: data.user.resumeUrl,
          });
          return;
        }
      }
    } catch (e) {
      console.warn('Error fetching profile during auth sync:', e);
    }

    // Fallback user state
    setUser({
      id: rawUser?.id || 'demo_user',
      email: email,
      username: rawUser?.user_metadata?.username || null,
      name: rawUser?.user_metadata?.full_name || 'Candidate',
      rank: 'Bronze',
      points: 0,
      technicalRank: 'Bronze',
      technicalPoints: 0,
      hrRank: 'Bronze',
      hrPoints: 0,
      isOnboarded: false,
    });
  };

  useEffect(() => {
    // 1. Check local demo session if stored
    const storedDemo = localStorage.getItem('rehearsal-demo-user');
    if (storedDemo) {
      try {
        const parsed = JSON.parse(storedDemo);
        setUser(parsed);
        setIsLoading(false);
      } catch (e) {
        localStorage.removeItem('rehearsal-demo-user');
      }
    }

    // 2. Listen to Supabase Auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      setSession(currentSession);
      if (currentSession?.user?.email) {
        await syncProfile(currentSession.user.email, currentSession.user);
      } else if (!localStorage.getItem('rehearsal-demo-user')) {
        setUser(null);
      }
      setIsLoading(false);
    });

    // 3. Initial check
    supabase.auth.getSession().then(({ data: { session: initSession } }) => {
      if (initSession?.user?.email) {
        setSession(initSession);
        syncProfile(initSession.user.email, initSession.user).finally(() =>
          setIsLoading(false)
        );
      } else if (!storedDemo) {
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Supabase Google OAuth sign-in
  const signInWithGoogle = async () => {
    const hasKeys =
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('sample-project');

    if (!hasKeys) {
      // Graceful fallback to demo mode if keys not yet configured
      await signInWithDemo();
      return;
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
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

  // 1-Click demo test sign in
  const signInWithDemo = async (
    name: string = 'Alex Turner',
    email: string = 'alex.turner@example.com'
  ) => {
    const demoUser: AuthUser = {
      id: `demo_${Date.now()}`,
      email,
      name,
      username: name.toLowerCase().replace(/\s+/g, '_'),
      rank: 'Bronze',
      points: 150,
      isOnboarded: true,
      resumeText: `Experienced Full Stack Engineer with 3+ years designing React, Next.js, and Postgres architectures.`,
    };
    localStorage.setItem('rehearsal-demo-user', JSON.stringify(demoUser));
    setUser(demoUser);
  };

  // Sign out
  const signOut = async () => {
    localStorage.removeItem('rehearsal-demo-user');
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    window.location.href = '/';
  };

  const updateUser = (fields: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...fields };
      if (localStorage.getItem('rehearsal-demo-user')) {
        localStorage.setItem('rehearsal-demo-user', JSON.stringify(updated));
      }
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        signInWithGoogle,
        signInWithDemo,
        signOut,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
