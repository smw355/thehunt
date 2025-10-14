import { requireAdmin } from '@/lib/adminAuth.js'
import { db } from '@/db/index.js'
import { users, games, gameMembers, clueLibraries, clues } from '@/db/schema.js'
import { sql, count, eq, gte } from 'drizzle-orm'

// Get platform statistics (admin only)
export async function GET(request) {
  const adminCheck = await requireAdmin()
  if (adminCheck.error) {
    return adminCheck.response
  }

  try {
    // Get total counts
    const [totalUsers] = await db
      .select({ count: count() })
      .from(users)

    const [totalGames] = await db
      .select({ count: count() })
      .from(games)

    const [activeGames] = await db
      .select({ count: count() })
      .from(games)
      .where(eq(games.status, 'active'))

    const [totalLibraries] = await db
      .select({ count: count() })
      .from(clueLibraries)

    const [totalClues] = await db
      .select({ count: count() })
      .from(clues)

    // Get recent activity (users who were active in last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [activeUsers] = await db
      .select({ count: count() })
      .from(users)
      .where(gte(users.lastActive, thirtyDaysAgo))

    // Get admin count
    const [adminCount] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.globalRole, 'admin'))

    return Response.json({
      users: {
        total: totalUsers.count,
        active: activeUsers.count,
        admins: adminCount.count,
      },
      games: {
        total: totalGames.count,
        active: activeGames.count,
      },
      content: {
        libraries: totalLibraries.count,
        clues: totalClues.count,
      },
    })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return Response.json({ error: 'Failed to fetch statistics' }, { status: 500 })
  }
}
