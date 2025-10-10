import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { db } from '../db/database'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'

export const authOptions = {
  // Configuration is defined in the API route
}

export async function getSession() {
  return await getServerSession(authOptions)
}

export async function getCurrentUser() {
  const session = await getSession()

  if (!session?.user?.email) {
    return null
  }

  try {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1)

    return user[0] || null
  } catch (error) {
    console.error('Error fetching current user:', error)
    return null
  }
}

export async function requireAuth() {
  const session = await getSession()

  if (!session) {
    redirect('/auth/signin')
  }

  return session
}

export async function requireGlobalAdmin() {
  const user = await getCurrentUser()

  if (!user || user.globalRole !== 'admin') {
    redirect('/unauthorized')
  }

  return user
}