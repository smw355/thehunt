import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { db } from '../../../../db/database'

const handler = NextAuth({
  adapter: DrizzleAdapter(db),
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user, account }) {
      // On sign in, add user ID and role to token
      if (user) {
        token.id = user.id;
        token.globalRole = user.globalRole || 'user';
      }
      return token;
    },
    async session({ session, token }) {
      // Add user ID and role from token to session
      if (token) {
        session.user.id = token.id;
        session.user.globalRole = token.globalRole;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
  },
  debug: true,
})

export { handler as GET, handler as POST }