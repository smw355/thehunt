import { requireAdmin } from '@/lib/adminAuth.js'
import { db } from '@/db/index.js'
import { users } from '@/db/schema.js'
import { eq, like, or, desc } from 'drizzle-orm'

// Get all users with filtering and pagination (admin only)
export async function GET(request) {
  const adminCheck = await requireAdmin()
  if (adminCheck.error) {
    return adminCheck.response
  }

  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const role = searchParams.get('role')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = db.select().from(users)

    // Apply filters
    if (search) {
      query = query.where(
        or(
          like(users.name, `%${search}%`),
          like(users.email, `%${search}%`)
        )
      )
    }

    if (role && ['admin', 'user'].includes(role)) {
      query = query.where(eq(users.globalRole, role))
    }

    // Apply pagination and ordering
    const allUsers = await query
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset)

    return Response.json({ users: allUsers })
  } catch (error) {
    console.error('Error fetching users:', error)
    return Response.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

// Update user role (admin only)
export async function PATCH(request) {
  const adminCheck = await requireAdmin()
  if (adminCheck.error) {
    return adminCheck.response
  }

  try {
    const { userId, globalRole } = await request.json()

    if (!userId) {
      return Response.json({ error: 'User ID is required' }, { status: 400 })
    }

    if (!globalRole || !['admin', 'user'].includes(globalRole)) {
      return Response.json({ error: 'Invalid role. Must be "admin" or "user"' }, { status: 400 })
    }

    // Prevent removing the last admin
    if (globalRole === 'user') {
      const [adminCount] = await db
        .select({ count: sql`count(*)` })
        .from(users)
        .where(eq(users.globalRole, 'admin'))

      if (parseInt(adminCount.count) <= 1) {
        const [targetUser] = await db
          .select()
          .from(users)
          .where(eq(users.id, userId))
          .limit(1)

        if (targetUser?.globalRole === 'admin') {
          return Response.json(
            { error: 'Cannot remove the last admin. Promote another user to admin first.' },
            { status: 400 }
          )
        }
      }
    }

    const [updatedUser] = await db
      .update(users)
      .set({ globalRole })
      .where(eq(users.id, userId))
      .returning()

    if (!updatedUser) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    return Response.json(updatedUser)
  } catch (error) {
    console.error('Error updating user:', error)
    return Response.json({ error: 'Failed to update user' }, { status: 500 })
  }
}
