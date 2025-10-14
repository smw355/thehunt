import { getServerSession } from 'next-auth/next'
import { db } from '@/db/index.js';
import { submissions, gameMembers, teams, users } from '@/db/schema.js';
import { eq, and } from 'drizzle-orm';

// Get submissions for a specific game
export async function GET(request) {
  try {
    const session = await getServerSession()
    if (!session || !session.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('gameId');
    const status = searchParams.get('status'); // optional filter

    if (!gameId) {
      return Response.json({ error: 'gameId is required' }, { status: 400 });
    }

    // Verify user is a member of this game
    const [membership] = await db
      .select()
      .from(gameMembers)
      .where(and(
        eq(gameMembers.gameId, parseInt(gameId)),
        eq(gameMembers.userId, session.user.id)
      ))
      .limit(1)

    if (!membership) {
      return Response.json({ error: 'Access denied' }, { status: 403 })
    }

    // Build query
    let query = db
      .select({
        submission: submissions,
        teamName: teams.name,
      })
      .from(submissions)
      .leftJoin(teams, eq(submissions.teamId, teams.id))
      .where(eq(submissions.gameId, parseInt(gameId)))

    const gameSubmissions = await query

    // Filter by status if provided
    let filteredSubmissions = gameSubmissions
    if (status && status !== 'all') {
      filteredSubmissions = gameSubmissions.filter(s => s.submission.status === status)
    }

    return Response.json(filteredSubmissions);
  } catch (error) {
    console.error('Error fetching submissions:', error)
    return Response.json({ error: 'Failed to fetch submissions' }, { status: 500 });
  }
}

// Create a new submission
export async function POST(request) {
  try {
    const submissionData = await request.json();

    const [newSubmission] = await db.insert(submissions).values({
      ...submissionData,
      status: 'pending'
    }).returning();

    return Response.json(newSubmission);
  } catch (error) {
    return Response.json({ error: 'Failed to create submission' }, { status: 500 });
  }
}

// Update submission status (approve/reject)
export async function PATCH(request) {
  try {
    const session = await getServerSession()
    if (!session || !session.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, gameId, status, adminComment } = await request.json();

    // Verify user is a game master for this game
    const [membership] = await db
      .select()
      .from(gameMembers)
      .where(and(
        eq(gameMembers.gameId, parseInt(gameId)),
        eq(gameMembers.userId, session.user.id),
        eq(gameMembers.role, 'game_master')
      ))
      .limit(1)

    if (!membership) {
      return Response.json({ error: 'Only game masters can review submissions' }, { status: 403 })
    }

    // Validate rejection has comment
    if (status === 'rejected' && (!adminComment || !adminComment.trim())) {
      return Response.json({ error: 'Admin comment is required for rejections' }, { status: 400 })
    }

    const [updatedSubmission] = await db.update(submissions)
      .set({
        status,
        adminComment: adminComment?.trim() || null,
        updatedAt: new Date()
      })
      .where(eq(submissions.id, parseInt(id)))
      .returning();

    // If approved, advance the team to next clue
    if (status === 'approved' && updatedSubmission.teamId) {
      const [team] = await db.select().from(teams).where(eq(teams.id, updatedSubmission.teamId)).limit(1)

      if (team) {
        await db.update(teams)
          .set({
            currentClueIndex: team.currentClueIndex + 1,
            completedClues: [...(team.completedClues || []), updatedSubmission.clueIndex]
          })
          .where(eq(teams.id, team.id))
      }
    }

    return Response.json(updatedSubmission);
  } catch (error) {
    console.error('Error updating submission:', error)
    return Response.json({ error: 'Failed to update submission' }, { status: 500 });
  }
}