import { requireAdmin } from '@/lib/adminAuth.js'
import { db } from '@/db/index.js'
import { clueLibraries, clues, users, libraryClues } from '@/db/schema.js'
import { eq, desc, sql, like } from 'drizzle-orm'

// Get all libraries and clues (admin only)
export async function GET(request) {
  const adminCheck = await requireAdmin()
  if (adminCheck.error) {
    return adminCheck.response
  }

  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'libraries' // 'libraries' or 'clues'
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (type === 'libraries') {
      // Get all libraries with owner info
      let query = db
        .select({
          id: clueLibraries.id,
          name: clueLibraries.name,
          description: clueLibraries.description,
          isPublic: clueLibraries.isPublic,
          createdAt: clueLibraries.createdAt,
          updatedAt: clueLibraries.updatedAt,
          userId: clueLibraries.userId,
          ownerName: users.name,
          ownerEmail: users.email,
        })
        .from(clueLibraries)
        .innerJoin(users, eq(clueLibraries.userId, users.id))

      if (search) {
        query = query.where(like(clueLibraries.name, `%${search}%`))
      }

      const libraries = await query
        .orderBy(desc(clueLibraries.createdAt))
        .limit(limit)

      // Get clue counts
      const librariesWithCounts = await Promise.all(
        libraries.map(async (library) => {
          const [count] = await db
            .select({ count: sql`count(*)` })
            .from(libraryClues)
            .where(eq(libraryClues.libraryId, library.id))

          return {
            ...library,
            clueCount: parseInt(count.count),
          }
        })
      )

      return Response.json({ libraries: librariesWithCounts })
    } else if (type === 'clues') {
      // Get all clues
      let query = db.select().from(clues)

      if (search) {
        query = query.where(like(clues.title, `%${search}%`))
      }

      const allClues = await query
        .orderBy(desc(clues.createdAt))
        .limit(limit)

      // Get usage count for each clue
      const cluesWithUsage = await Promise.all(
        allClues.map(async (clue) => {
          const [libraryCount] = await db
            .select({ count: sql`count(*)` })
            .from(libraryClues)
            .where(eq(libraryClues.clueId, clue.id))

          return {
            ...clue,
            usageCount: parseInt(libraryCount.count),
          }
        })
      )

      return Response.json({ clues: cluesWithUsage })
    } else {
      return Response.json({ error: 'Invalid type parameter' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error fetching content:', error)
    return Response.json({ error: 'Failed to fetch content' }, { status: 500 })
  }
}
