import { getServerSession } from 'next-auth/next'
import { db } from '@/db/index.js'
import { gameMembers, games } from '@/db/schema.js'
import { eq, and } from 'drizzle-orm'

// Join a game as a player
export async function POST(request) {
  try {
    const session = await getServerSession()
    if (!session || !session.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { gameId, role } = await request.json()

    // Validate input
    if (!gameId) {
      return Response.json({ error: 'Game ID is required' }, { status: 400 })
    }

    if (role && !['game_master', 'player'].includes(role)) {
      return Response.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Check if game exists
    const game = await db
      .select()
      .from(games)
      .where(eq(games.id, gameId))
      .limit(1)

    if (game.length === 0) {
      return Response.json({ error: 'Game not found' }, { status: 404 })
    }

    // Check if user is already a member
    const existingMember = await db
      .select()
      .from(gameMembers)
      .where(
        and(
          eq(gameMembers.gameId, gameId),
          eq(gameMembers.userId, session.user.id)
        )
      )
      .limit(1)

    if (existingMember.length > 0) {
      return Response.json(
        { error: 'You are already a member of this game' },
        { status: 409 }
      )
    }

    // Add user as a game member
    const [newMember] = await db
      .insert(gameMembers)
      .values({
        gameId,
        userId: session.user.id,
        role: role || 'player',
        status: 'active',
        joinedAt: new Date(),
      })
      .returning()

    return Response.json(newMember, { status: 201 })
  } catch (error) {
    console.error('Error joining game:', error)
    return Response.json({ error: 'Failed to join game' }, { status: 500 })
  }
}

// Get all members of a game (requires game membership)
export async function GET(request) {
  try {
    const session = await getServerSession()
    if (!session || !session.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const gameId = searchParams.get('gameId')

    if (!gameId) {
      return Response.json({ error: 'Game ID is required' }, { status: 400 })
    }

    // Check if user is a member of the game
    const userMembership = await db
      .select()
      .from(gameMembers)
      .where(
        and(
          eq(gameMembers.gameId, parseInt(gameId)),
          eq(gameMembers.userId, session.user.id)
        )
      )
      .limit(1)

    if (userMembership.length === 0) {
      return Response.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get all members of the game
    const members = await db
      .select()
      .from(gameMembers)
      .where(eq(gameMembers.gameId, parseInt(gameId)))

    return Response.json({ members })
  } catch (error) {
    console.error('Error fetching game members:', error)
    return Response.json({ error: 'Failed to fetch game members' }, { status: 500 })
  }
}
