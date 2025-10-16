import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../auth/[...nextauth]/route'
import { db } from '@/db/index.js'
import { clueLibraries, libraryClues } from '@/db/schema.js'
import { eq } from 'drizzle-orm'

// Update clue order in a library
export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const { clueOrders } = await request.json()

    // clueOrders should be an array of { libraryClueId, order }
    if (!Array.isArray(clueOrders)) {
      return Response.json({ error: 'clueOrders must be an array' }, { status: 400 })
    }

    // Get library
    const [library] = await db
      .select()
      .from(clueLibraries)
      .where(eq(clueLibraries.id, parseInt(id)))
      .limit(1)

    if (!library) {
      return Response.json({ error: 'Library not found' }, { status: 404 })
    }

    // Check ownership
    if (library.userId !== session.user.id) {
      return Response.json({ error: 'Only the owner can reorder clues' }, { status: 403 })
    }

    // Update each clue's order
    const updatePromises = clueOrders.map(({ libraryClueId, order }) =>
      db
        .update(libraryClues)
        .set({ order })
        .where(eq(libraryClues.id, libraryClueId))
    )

    await Promise.all(updatePromises)

    return Response.json({ message: 'Clue order updated successfully' })
  } catch (error) {
    console.error('Error reordering clues:', error)
    return Response.json({ error: 'Failed to reorder clues' }, { status: 500 })
  }
}
