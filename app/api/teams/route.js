import { db } from '@/db/index.js';
import { teams } from '@/db/schema.js';
import { eq } from 'drizzle-orm';

// Get teams for a specific game
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('gameId');

    if (!gameId) {
      return Response.json({ error: 'gameId is required' }, { status: 400 });
    }

    const gameTeams = await db.select().from(teams).where(eq(teams.gameId, parseInt(gameId)));
    return Response.json(gameTeams);
  } catch (error) {
    return Response.json({ error: 'Failed to fetch teams' }, { status: 500 });
  }
}

// Create a new team
export async function POST(request) {
  try {
    const { gameId, name, password } = await request.json();

    const [newTeam] = await db.insert(teams).values({
      gameId,
      name,
      password,
      currentClueIndex: 0,
      completedClues: []
    }).returning();

    return Response.json(newTeam);
  } catch (error) {
    return Response.json({ error: 'Failed to create team' }, { status: 500 });
  }
}

// Update team (name/password or progress)
export async function PATCH(request) {
  try {
    const { id, name, password, currentClueIndex, completedClues } = await request.json();

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (password !== undefined) updateData.password = password;
    if (currentClueIndex !== undefined) updateData.currentClueIndex = currentClueIndex;
    if (completedClues !== undefined) updateData.completedClues = completedClues;

    const [updatedTeam] = await db.update(teams)
      .set(updateData)
      .where(eq(teams.id, id))
      .returning();

    return Response.json(updatedTeam);
  } catch (error) {
    return Response.json({ error: 'Failed to update team' }, { status: 500 });
  }
}