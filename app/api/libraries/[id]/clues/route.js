import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]/route'
import { db } from '@/db/index.js'
import { clueLibraries, libraryClues, clues } from '@/db/schema.js'
import { eq, and } from 'drizzle-orm'

// Add a clue to a library
export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const { clueId } = await request.json()

    if (!clueId) {
      return Response.json({ error: 'Clue ID is required' }, { status: 400 })
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
      return Response.json({ error: 'Only the owner can add clues to this library' }, { status: 403 })
    }

    // Check if clue exists
    const [clue] = await db
      .select()
      .from(clues)
      .where(eq(clues.id, clueId))
      .limit(1)

    if (!clue) {
      return Response.json({ error: 'Clue not found' }, { status: 404 })
    }

    // Check if clue is already in library
    const [existing] = await db
      .select()
      .from(libraryClues)
      .where(
        and(
          eq(libraryClues.libraryId, parseInt(id)),
          eq(libraryClues.clueId, clueId)
        )
      )
      .limit(1)

    if (existing) {
      return Response.json({ error: 'Clue already in library' }, { status: 409 })
    }

    // Add clue to library
    const [newLibraryClue] = await db
      .insert(libraryClues)
      .values({
        libraryId: parseInt(id),
        clueId,
        addedAt: new Date(),
      })
      .returning()

    return Response.json(newLibraryClue, { status: 201 })
  } catch (error) {
    console.error('Error adding clue to library:', error)
    return Response.json({ error: 'Failed to add clue to library' }, { status: 500 })
  }
}

// Remove a clue from a library
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const { searchParams } = new URL(request.url)
    const clueId = searchParams.get('clueId')

    if (!clueId) {
      return Response.json({ error: 'Clue ID is required' }, { status: 400 })
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
      return Response.json({ error: 'Only the owner can remove clues from this library' }, { status: 403 })
    }

    // Remove clue from library
    const [removed] = await db
      .delete(libraryClues)
      .where(
        and(
          eq(libraryClues.libraryId, parseInt(id)),
          eq(libraryClues.clueId, parseInt(clueId))
        )
      )
      .returning()

    if (!removed) {
      return Response.json({ error: 'Clue not found in library' }, { status: 404 })
    }

    return Response.json({ message: 'Clue removed from library' })
  } catch (error) {
    console.error('Error removing clue from library:', error)
    return Response.json({ error: 'Failed to remove clue from library' }, { status: 500 })
  }
}
