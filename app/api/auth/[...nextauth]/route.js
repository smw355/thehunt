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
    async session({ session, user }) {
      // Add user ID and global role to session
      if (session?.user && user) {
        session.user.id = user.id;
        session.user.globalRole = user.globalRole || 'user';
      }
      return session;
    },
  },
  session: {
    strategy: 'database',
  },
  debug: true,
})

export { handler as GET, handler as POST }