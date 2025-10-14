import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]/route'
import { db } from '@/db/index.js'
import { clueLibraries, libraryClues, clues } from '@/db/schema.js'
import { eq, desc, or, and, sql } from 'drizzle-orm'

// Get all libraries (user's own + public ones)
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const showPublic = searchParams.get('public') === 'true'

    let query

    if (showPublic) {
      // Show all public libraries OR user's own libraries
      query = db
        .select()
        .from(clueLibraries)
        .where(
          or(
            eq(clueLibraries.isPublic, true),
            eq(clueLibraries.userId, session.user.id)
          )
        )
    } else {
      // Show only user's own libraries
      query = db
        .select()
        .from(clueLibraries)
        .where(eq(clueLibraries.userId, session.user.id))
    }

    const libraries = await query.orderBy(desc(clueLibraries.createdAt))

    // Get clue counts for each library
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
  } catch (error) {
    console.error('Error fetching libraries:', error)
    return Response.json({ error: 'Failed to fetch libraries' }, { status: 500 })
  }
}

// Create a new library
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, description, isPublic } = await request.json()

    if (!name || !name.trim()) {
      return Response.json({ error: 'Library name is required' }, { status: 400 })
    }

    const [newLibrary] = await db
      .insert(clueLibraries)
      .values({
        userId: session.user.id,
        name: name.trim(),
        description: description?.trim() || null,
        isPublic: isPublic || false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()

    return Response.json(newLibrary, { status: 201 })
  } catch (error) {
    console.error('Error creating library:', error)
    return Response.json({ error: 'Failed to create library' }, { status: 500 })
  }
}
