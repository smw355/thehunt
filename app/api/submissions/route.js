import { db } from '@/db/index.js';
import { submissions } from '@/db/schema.js';
import { eq, and } from 'drizzle-orm';

// Get submissions for a specific game
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('gameId');

    if (!gameId) {
      return Response.json({ error: 'gameId is required' }, { status: 400 });
    }

    const gameSubmissions = await db.select().from(submissions).where(eq(submissions.gameId, parseInt(gameId)));
    return Response.json(gameSubmissions);
  } catch (error) {
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

// Update submission status
export async function PATCH(request) {
  try {
    const { id, status, adminComment } = await request.json();

    const [updatedSubmission] = await db.update(submissions)
      .set({
        status,
        adminComment,
        updatedAt: new Date()
      })
      .where(eq(submissions.id, id))
      .returning();

    return Response.json(updatedSubmission);
  } catch (error) {
    return Response.json({ error: 'Failed to update submission' }, { status: 500 });
  }
}