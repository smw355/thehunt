import { getServerSession } from 'next-auth/next'
import { db } from '@/db/index.js'
import { users } from '@/db/schema.js'
import { eq } from 'drizzle-orm'

/**
 * Check if the current user has admin privileges
 * @returns {Promise<{isAdmin: boolean, user: object|null}>}
 */
export async function checkAdminAccess() {
  const session = await getServerSession()

  if (!session || !session.user) {
    return { isAdmin: false, user: null }
  }

  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1)

    if (!user) {
      return { isAdmin: false, user: null }
    }

    return {
      isAdmin: user.globalRole === 'admin',
      user
    }
  } catch (error) {
    console.error('Error checking admin access:', error)
    return { isAdmin: false, user: null }
  }
}

/**
 * Middleware for API routes that require admin access
 * Returns error response if user is not an admin
 */
export async function requireAdmin() {
  const { isAdmin, user } = await checkAdminAccess()

  if (!isAdmin) {
    return {
      error: true,
      response: Response.json(
        { error: 'Access denied. Admin privileges required.' },
        { status: 403 }
      )
    }
  }

  return { error: false, user }
}
