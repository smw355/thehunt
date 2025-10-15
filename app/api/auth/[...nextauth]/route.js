import NextAuth from 'next-auth'
import GitHubProvider from 'next-auth/providers/github'
import CredentialsProvider from 'next-auth/providers/credentials'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { db } from '../../../../db/database'
import { users, accounts, sessions, verificationTokens } from '../../../../db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

// Log environment variables for debugging (only log existence, not values)
console.log('NextAuth Config Check:', {
  hasGitHubClientId: !!process.env.GITHUB_CLIENT_ID,
  hasGitHubClientSecret: !!process.env.GITHUB_CLIENT_SECRET,
  hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
  hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
  nextAuthUrl: process.env.NEXTAUTH_URL,
  nodeEnv: process.env.NODE_ENV,
  vercelEnv: process.env.VERCEL_ENV,
})

// Ensure secret is defined - critical for NextAuth
if (!process.env.NEXTAUTH_SECRET) {
  console.error('CRITICAL: NEXTAUTH_SECRET is not defined!')
  console.error('Available env keys:', Object.keys(process.env).filter(k => k.includes('NEXT')))
}

export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    CredentialsProvider({
      name: 'Email and Password',
      credentials: {
        email: { label: "Email", type: "email", placeholder: "your@email.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter your email and password')
        }

        // Find user by email
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email))
          .limit(1)

        if (!user) {
          throw new Error('No user found with this email')
        }

        // Check if user has a password (might be OAuth only)
        if (!user.password) {
          throw new Error('Please sign in with the provider you used to create your account')
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

        if (!isPasswordValid) {
          throw new Error('Invalid password')
        }

        // Return user object (will be stored in JWT)
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          globalRole: user.globalRole || 'user',
        }
      }
    }),
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
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }