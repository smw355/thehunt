import { db } from '@/db/index.js';
import { games, teams } from '@/db/schema.js';
import { eq } from 'drizzle-orm';

// Get all games or find by code
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (code) {
      // Find game by code
      const game = await db.select().from(games).where(eq(games.code, code.toUpperCase())).limit(1);
      if (game.length === 0) {
        return Response.json({ error: 'Game not found' }, { status: 404 });
      }
      return Response.json(game[0]);
    } else {
      // Get all games
      const allGames = await db.select().from(games);
      return Response.json(allGames);
    }
  } catch (error) {
    return Response.json({ error: 'Failed to fetch games' }, { status: 500 });
  }
}

// Create a new game
export async function POST(request) {
  try {
    const { name, code, clueSequence } = await request.json();

    const [newGame] = await db.insert(games).values({
      name,
      code,
      clueSequence,
      status: 'setup'
    }).returning();

    return Response.json(newGame);
  } catch (error) {
    return Response.json({ error: 'Failed to create game' }, { status: 500 });
  }
}