import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db, isDatabaseConfigured } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const authOptions: NextAuthOptions = {
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    // Fallback/Demo provider enabled when Google OAuth credentials are pending
    CredentialsProvider({
      id: 'demo-login',
      name: 'Demo Account',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'candidate@example.com' },
        name: { label: 'Name', type: 'text', placeholder: 'Alex Turner' },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        return {
          id: 'demo-user-1',
          email: credentials.email,
          name: credentials.name || 'Candidate',
          image: '/mascot.svg',
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;

      if (isDatabaseConfigured() && db) {
        try {
          const existing = await db
            .select()
            .from(users)
            .where(eq(users.email, user.email))
            .limit(1);

          if (existing.length === 0) {
            // New user: will be directed to /onboarding
            await db.insert(users).values({
              id: user.id || `user_${Date.now()}`,
              email: user.email,
              googleId: account?.providerAccountId || null,
              username: null, // Set during onboarding
              rank: 'Bronze',
              points: 0,
            });
          }
        } catch (err) {
          console.error('Error during user DB check in signIn:', err);
        }
      }
      return true;
    },

    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }

      if (trigger === 'update' && session) {
        token.username = session.username;
        token.rank = session.rank;
        token.points = session.points;
      }

      // Fetch latest user data from DB if configured
      if (token.email && isDatabaseConfigured() && db) {
        try {
          const existing = await db
            .select()
            .from(users)
            .where(eq(users.email, token.email as string))
            .limit(1);

          if (existing.length > 0) {
            token.id = existing[0].id;
            token.username = existing[0].username;
            token.rank = existing[0].rank;
            token.points = existing[0].points;
            token.isOnboarded = Boolean(existing[0].username);
          }
        } catch (err) {
          console.error('Error in jwt callback fetching user:', err);
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).username = token.username || null;
        (session.user as any).rank = token.rank || 'Bronze';
        (session.user as any).points = token.points ?? 0;
        (session.user as any).isOnboarded = token.isOnboarded ?? false;
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
  },
  secret: process.env.NEXTAUTH_SECRET || 'rehearsal-ai-master-secret-key-32chars',
};

