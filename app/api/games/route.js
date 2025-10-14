import { getServerSession } from 'next-auth/next'
import { db } from '@/db/index.js';
import { games, teams, gameMembers } from '@/db/schema.js';
import { eq } from 'drizzle-orm';

// Get all games where user is a member, or find by code
export async function GET(request) {
  try {
    const session = await getServerSession()
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (code) {
      // Find game by code (public endpoint for joining)
      const game = await db.select().from(games).where(eq(games.code, code.toUpperCase())).limit(1);
      if (game.length === 0) {
        return Response.json({ error: 'Game not found' }, { status: 404 });
      }
      return Response.json(game[0]);
    } else {
      // Get user's games - requires authentication
      if (!session || !session.user) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const userGames = await db
        .select({
          id: games.id,
          name: games.name,
          code: games.code,
          status: games.status,
          createdAt: games.createdAt,
          role: gameMembers.role,
          teamId: gameMembers.teamId,
        })
        .from(games)
        .innerJoin(gameMembers, eq(games.id, gameMembers.gameId))
        .where(eq(gameMembers.userId, session.user.id))
        .orderBy(games.createdAt);

      return Response.json({ games: userGames });
    }
  } catch (error) {
    console.error('Error fetching games:', error);
    return Response.json({ error: 'Failed to fetch games' }, { status: 500 });
  }
}

// Create a new game
export async function POST(request) {
  try {
    const session = await getServerSession()
    if (!session || !session.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, code, clueSequence } = await request.json();

    // Validate input
    if (!name || !name.trim()) {
      return Response.json({ error: 'Game name is required' }, { status: 400 });
    }

    if (!code || code.length !== 6) {
      return Response.json({ error: 'Game code must be 6 characters' }, { status: 400 });
    }

    // Check if game code already exists
    const existingGame = await db
      .select()
      .from(games)
      .where(eq(games.code, code.toUpperCase()))
      .limit(1);

    if (existingGame.length > 0) {
      return Response.json(
        { error: 'Game code already in use. Please choose a different code.' },
        { status: 409 }
      );
    }

    // Create the game
    const [newGame] = await db.insert(games).values({
      name: name.trim(),
      code: code.toUpperCase(),
      clueSequence: clueSequence || [],
      status: 'setup',
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    // Add the creator as a game master
    await db.insert(gameMembers).values({
      gameId: newGame.id,
      userId: session.user.id,
      role: 'game_master',
      status: 'active',
      joinedAt: new Date(),
    });

    return Response.json(newGame);
  } catch (error) {
    console.error('Error creating game:', error);
    return Response.json({ error: 'Failed to create game' }, { status: 500 });
  }
}

// Update game (e.g., change status)
export async function PATCH(request) {
  try {
    const { id, status, name, clueSequence } = await request.json();

    const updateData = {};
    if (status) updateData.status = status;
    if (name) updateData.name = name;
    if (clueSequence) updateData.clueSequence = clueSequence;
    updateData.updatedAt = new Date();

    const [updatedGame] = await db.update(games)
      .set(updateData)
      .where(eq(games.id, id))
      .returning();

    return Response.json(updatedGame);
  } catch (error) {
    return Response.json({ error: 'Failed to update game' }, { status: 500 });
  }
}

// Delete a specific game by ID (cascades to delete teams and submissions)
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return Response.json({ error: 'Game ID required' }, { status: 400 });
    }

    // Convert id to integer
    const gameId = parseInt(id, 10);
    if (isNaN(gameId)) {
      return Response.json({ error: 'Invalid game ID' }, { status: 400 });
    }

    // Check if game exists
    const existingGame = await db.select().from(games).where(eq(games.id, gameId)).limit(1);
    if (existingGame.length === 0) {
      return Response.json({ error: 'Game not found' }, { status: 404 });
    }

    // Delete the game (cascades to delete teams and submissions automatically)
    const [deletedGame] = await db
      .delete(games)
      .where(eq(games.id, gameId))
      .returning();

    return Response.json({
      message: 'Game deleted successfully (including all teams and submissions)',
      deletedGame
    });
  } catch (error) {
    console.error('Error deleting game:', error);
    return Response.json({ error: 'Failed to delete game' }, { status: 500 });
  }
}