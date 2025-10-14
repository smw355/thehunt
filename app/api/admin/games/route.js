import { requireAdmin } from '@/lib/adminAuth.js'
import { db } from '@/db/index.js'
import { games, gameMembers, users } from '@/db/schema.js'
import { eq, like, desc, sql } from 'drizzle-orm'

// Get all games (admin only)
export async function GET(request) {
  const adminCheck = await requireAdmin()
  if (adminCheck.error) {
    return adminCheck.response
  }

  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = db
      .select({
        id: games.id,
        name: games.name,
        code: games.code,
        status: games.status,
        clueCount: sql`json_array_length(${games.clueSequence})`,
        createdAt: games.createdAt,
        updatedAt: games.updatedAt,
      })
      .from(games)

    // Apply filters
    if (search) {
      query = query.where(like(games.name, `%${search}%`))
    }

    if (status && ['setup', 'active', 'completed'].includes(status)) {
      query = query.where(eq(games.status, status))
    }

    // Apply pagination and ordering
    const allGames = await query
      .orderBy(desc(games.createdAt))
      .limit(limit)
      .offset(offset)

    // Get member counts for each game
    const gamesWithCounts = await Promise.all(
      allGames.map(async (game) => {
        const [memberCount] = await db
          .select({ count: sql`count(*)` })
          .from(gameMembers)
          .where(eq(gameMembers.gameId, game.id))

        const [gameMasterCount] = await db
          .select({ count: sql`count(*)` })
          .from(gameMembers)
          .where(
            sql`${gameMembers.gameId} = ${game.id} AND ${gameMembers.role} = 'game_master'`
          )

        return {
          ...game,
          memberCount: parseInt(memberCount.count),
          gameMasterCount: parseInt(gameMasterCount.count),
        }
      })
    )

    return Response.json({ games: gamesWithCounts })
  } catch (error) {
    console.error('Error fetching games:', error)
    return Response.json({ error: 'Failed to fetch games' }, { status: 500 })
  }
}

// Delete a game (admin only)
export async function DELETE(request) {
  const adminCheck = await requireAdmin()
  if (adminCheck.error) {
    return adminCheck.response
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return Response.json({ error: 'Game ID is required' }, { status: 400 })
    }

    const gameId = parseInt(id)
    if (isNaN(gameId)) {
      return Response.json({ error: 'Invalid game ID' }, { status: 400 })
    }

    const [deletedGame] = await db
      .delete(games)
      .where(eq(games.id, gameId))
      .returning()

    if (!deletedGame) {
      return Response.json({ error: 'Game not found' }, { status: 404 })
    }

    return Response.json({
      message: 'Game deleted successfully',
      deletedGame,
    })
  } catch (error) {
    console.error('Error deleting game:', error)
    return Response.json({ error: 'Failed to delete game' }, { status: 500 })
  }
}
