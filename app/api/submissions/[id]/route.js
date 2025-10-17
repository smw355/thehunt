import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'
import { db } from '@/db/index.js'
import { submissions, gameMembers } from '@/db/schema.js'
import { eq, and } from 'drizzle-orm'

// Update a pending submission (PUT)
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const { textProof, notes, photoUrls, detourChoice, roadblockPlayer } = await request.json()

    // Get the existing submission
    const [existingSubmission] = await db
      .select()
      .from(submissions)
      .where(eq(submissions.id, parseInt(id)))
      .limit(1)

    if (!existingSubmission) {
      return Response.json({ error: 'Submission not found' }, { status: 404 })
    }

    // Only allow editing pending submissions
    if (existingSubmission.status !== 'pending') {
      return Response.json({ error: 'Can only edit pending submissions' }, { status: 400 })
    }

    // Verify user is member of the game
    const [membership] = await db
      .select()
      .from(gameMembers)
      .where(and(
        eq(gameMembers.gameId, existingSubmission.gameId),
        eq(gameMembers.userId, session.user.id)
      ))
      .limit(1)

    if (!membership) {
      return Response.json({ error: 'Access denied' }, { status: 403 })
    }

    // Update the submission
    const [updatedSubmission] = await db
      .update(submissions)
      .set({
        textProof: textProof?.trim(),
        notes: notes?.trim() || null,
        photoUrls: photoUrls || [],
        detourChoice: detourChoice || null,
        roadblockPlayer: roadblockPlayer?.trim() || null,
        updatedAt: new Date()
      })
      .where(eq(submissions.id, parseInt(id)))
      .returning()

    return Response.json(updatedSubmission)
  } catch (error) {
    console.error('Error updating submission:', error)
    return Response.json({ error: 'Failed to update submission' }, { status: 500 })
  }
}

// Delete a pending submission (DELETE)
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Get the existing submission
    const [existingSubmission] = await db
      .select()
      .from(submissions)
      .where(eq(submissions.id, parseInt(id)))
      .limit(1)

    if (!existingSubmission) {
      return Response.json({ error: 'Submission not found' }, { status: 404 })
    }

    // Only allow deleting pending submissions
    if (existingSubmission.status !== 'pending') {
      return Response.json({ error: 'Can only delete pending submissions' }, { status: 400 })
    }

    // Verify user is member of the game
    const [membership] = await db
      .select()
      .from(gameMembers)
      .where(and(
        eq(gameMembers.gameId, existingSubmission.gameId),
        eq(gameMembers.userId, session.user.id)
      ))
      .limit(1)

    if (!membership) {
      return Response.json({ error: 'Access denied' }, { status: 403 })
    }

    // Delete the submission
    await db
      .delete(submissions)
      .where(eq(submissions.id, parseInt(id)))

    return Response.json({ success: true })
  } catch (error) {
    console.error('Error deleting submission:', error)
    return Response.json({ error: 'Failed to delete submission' }, { status: 500 })
  }
}
