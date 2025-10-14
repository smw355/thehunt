import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]/route'
import { db } from '@/db/index.js';
import { gameMembers } from '@/db/schema.js';
import { eq, and } from 'drizzle-orm';

// Update game member (e.g., assign to team, change role)
export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const memberId = parseInt(params.id)
    const { teamId, role, gameId } = await request.json();

    // Verify the requesting user is a game master for this game
    const [requesterMembership] = await db
      .select()
      .from(gameMembers)
      .where(and(
        eq(gameMembers.gameId, parseInt(gameId)),
        eq(gameMembers.userId, session.user.id),
        eq(gameMembers.role, 'game_master')
      ))
      .limit(1)

    if (!requesterMembership) {
      return Response.json({ error: 'Only game masters can update members' }, { status: 403 })
    }

    const updateData = {};
    if (teamId !== undefined) updateData.teamId = teamId ? parseInt(teamId) : null;
    if (role !== undefined) updateData.role = role;

    const [updatedMember] = await db.update(gameMembers)
      .set(updateData)
      .where(eq(gameMembers.id, memberId))
      .returning();

    return Response.json(updatedMember);
  } catch (error) {
    console.error('Error updating game member:', error)
    return Response.json({ error: 'Failed to update game member' }, { status: 500 });
  }
}
