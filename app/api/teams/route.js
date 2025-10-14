import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]/route'
import { db } from '@/db/index.js';
import { teams, gameMembers } from '@/db/schema.js';
import { eq, and } from 'drizzle-orm';

// Get teams for a specific game
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('gameId');

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

    const gameTeams = await db.select().from(teams).where(eq(teams.gameId, parseInt(gameId)));
    return Response.json(gameTeams);
  } catch (error) {
    console.error('Error fetching teams:', error)
    return Response.json({ error: 'Failed to fetch teams' }, { status: 500 });
  }
}

// Create a new team
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { gameId, name, password } = await request.json();

    if (!name || !name.trim()) {
      return Response.json({ error: 'Team name is required' }, { status: 400 })
    }

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
      return Response.json({ error: 'Only game masters can create teams' }, { status: 403 })
    }

    const [newTeam] = await db.insert(teams).values({
      gameId: parseInt(gameId),
      name: name.trim(),
      password: password?.trim() || null,
      currentClueIndex: 0,
      completedClues: []
    }).returning();

    return Response.json(newTeam, { status: 201 });
  } catch (error) {
    console.error('Error creating team:', error)
    return Response.json({ error: 'Failed to create team' }, { status: 500 });
  }
}

// Update team (name/password or progress)
export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, gameId, name, password, currentClueIndex, completedClues } = await request.json();

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
      return Response.json({ error: 'Only game masters can update teams' }, { status: 403 })
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (password !== undefined) updateData.password = password?.trim() || null;
    if (currentClueIndex !== undefined) updateData.currentClueIndex = currentClueIndex;
    if (completedClues !== undefined) updateData.completedClues = completedClues;

    const [updatedTeam] = await db.update(teams)
      .set(updateData)
      .where(eq(teams.id, parseInt(id)))
      .returning();

    return Response.json(updatedTeam);
  } catch (error) {
    console.error('Error updating team:', error)
    return Response.json({ error: 'Failed to update team' }, { status: 500 });
  }
}

// Delete a team
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const gameId = searchParams.get('gameId');

    if (!id || !gameId) {
      return Response.json({ error: 'Team ID and Game ID are required' }, { status: 400 });
    }

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
      return Response.json({ error: 'Only game masters can delete teams' }, { status: 403 })
    }

    await db.delete(teams).where(eq(teams.id, parseInt(id)));

    return Response.json({ message: 'Team deleted successfully' });
  } catch (error) {
    console.error('Error deleting team:', error)
    return Response.json({ error: 'Failed to delete team' }, { status: 500 });
  }
}