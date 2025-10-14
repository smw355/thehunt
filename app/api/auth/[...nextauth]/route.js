import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { db } from '../../../../db/database'
import { users, accounts, sessions, verificationTokens } from '../../../../db/schema'

// Log environment variables for debugging (only log existence, not values)
console.log('NextAuth Config Check:', {
  hasGitHubClientId: !!process.env.GITHUB_CLIENT_ID,
  hasGitHubClientSecret: !!process.env.GITHUB_CLIENT_SECRET,
  hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
  hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
  nextAuthUrl: process.env.NEXTAUTH_URL,
})

const handler = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      authorization: {
        params: {
          scope: 'read:user user:email',
        },
      },
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('Sign in callback - account:', account);
      console.log('Sign in callback - profile:', profile);
      console.log('Sign in callback - NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
      return true;
    },
    async jwt({ token, user, account }) {
      try {
        // On sign in, add user ID and role to token
        if (user) {
          console.log('JWT callback - user:', user);
          token.id = user.id;
          token.globalRole = user.globalRole || 'user';
        }
        return token;
      } catch (error) {
        console.error('JWT callback error:', error);
        throw error;
      }
    },
    async session({ session, token }) {
      try {
        // Add user ID and role from token to session
        if (token) {
          console.log('Session callback - token:', token);
          session.user.id = token.id;
          session.user.globalRole = token.globalRole;
        }
        return session;
      } catch (error) {
        console.error('Session callback error:', error);
        throw error;
      }
    },
  },
  session: {
    strategy: 'jwt',
  },
  debug: true,
  logger: {
    error(code, ...message) {
      console.error('NextAuth Error:', code, message);
    },
    warn(code, ...message) {
      console.warn('NextAuth Warning:', code, message);
    },
    debug(code, ...message) {
      console.log('NextAuth Debug:', code, message);
    },
  },
  events: {
    async signIn(message) {
      console.log('Sign in event:', message);
    },
    async createUser(message) {
      console.log('User created:', message);
    },
  },
})

export { handler as GET, handler as POST }