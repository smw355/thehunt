import { getServerSession } from 'next-auth/next'
import { db } from '@/db/index.js'
import { clueLibraries, libraryClues, clues } from '@/db/schema.js'
import { eq, and } from 'drizzle-orm'

// Get a specific library with its clues
export async function GET(request, { params }) {
  try {
    const session = await getServerSession()
    if (!session || !session.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Get library
    const [library] = await db
      .select()
      .from(clueLibraries)
      .where(eq(clueLibraries.id, parseInt(id)))
      .limit(1)

    if (!library) {
      return Response.json({ error: 'Library not found' }, { status: 404 })
    }

    // Check access: user must own the library OR it must be public
    if (library.userId !== session.user.id && !library.isPublic) {
      return Response.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get all clues in this library
    const libraryCluesList = await db
      .select({
        id: libraryClues.id,
        clueId: libraryClues.clueId,
        addedAt: libraryClues.addedAt,
        clue: clues,
      })
      .from(libraryClues)
      .innerJoin(clues, eq(libraryClues.clueId, clues.id))
      .where(eq(libraryClues.libraryId, parseInt(id)))

    return Response.json({
      library,
      clues: libraryCluesList,
      isOwner: library.userId === session.user.id,
    })
  } catch (error) {
    console.error('Error fetching library:', error)
    return Response.json({ error: 'Failed to fetch library' }, { status: 500 })
  }
}

// Update library (owner only)
export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession()
    if (!session || !session.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const { name, description, isPublic } = await request.json()

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
      return Response.json({ error: 'Only the owner can edit this library' }, { status: 403 })
    }

    const updateData = {}
    if (name !== undefined) updateData.name = name.trim()
    if (description !== undefined) updateData.description = description?.trim() || null
    if (isPublic !== undefined) updateData.isPublic = isPublic
    updateData.updatedAt = new Date()

    const [updatedLibrary] = await db
      .update(clueLibraries)
      .set(updateData)
      .where(eq(clueLibraries.id, parseInt(id)))
      .returning()

    return Response.json(updatedLibrary)
  } catch (error) {
    console.error('Error updating library:', error)
    return Response.json({ error: 'Failed to update library' }, { status: 500 })
  }
}

// Delete library (owner only)
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession()
    if (!session || !session.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

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
      return Response.json({ error: 'Only the owner can delete this library' }, { status: 403 })
    }

    // Delete library (cascades to delete library_clues entries)
    const [deletedLibrary] = await db
      .delete(clueLibraries)
      .where(eq(clueLibraries.id, parseInt(id)))
      .returning()

    return Response.json({
      message: 'Library deleted successfully',
      deletedLibrary,
    })
  } catch (error) {
    console.error('Error deleting library:', error)
    return Response.json({ error: 'Failed to delete library' }, { status: 500 })
  }
}
