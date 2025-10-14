import { getServerSession } from 'next-auth/next'
import { db } from '@/db/index.js'
import { games, gameMembers, teams, users } from '@/db/schema.js'
import { eq, and } from 'drizzle-orm'

// Get a specific game by ID
export async function GET(request, { params }) {
  try {
    const session = await getServerSession()
    if (!session || !session.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Check if user is a member of this game
    const userMembership = await db
      .select()
      .from(gameMembers)
      .where(
        and(
          eq(gameMembers.gameId, parseInt(id)),
          eq(gameMembers.userId, session.user.id)
        )
      )
      .limit(1)

    if (userMembership.length === 0) {
      return Response.json({ error: 'Access denied. You are not a member of this game.' }, { status: 403 })
    }

    // Get game details
    const [game] = await db
      .select()
      .from(games)
      .where(eq(games.id, parseInt(id)))
      .limit(1)

    if (!game) {
      return Response.json({ error: 'Game not found' }, { status: 404 })
    }

    // Get all members of the game with user details
    const members = await db
      .select({
        id: gameMembers.id,
        userId: gameMembers.userId,
        role: gameMembers.role,
        status: gameMembers.status,
        teamId: gameMembers.teamId,
        joinedAt: gameMembers.joinedAt,
        userName: users.name,
        userEmail: users.email,
        userImage: users.image,
      })
      .from(gameMembers)
      .innerJoin(users, eq(gameMembers.userId, users.id))
      .where(eq(gameMembers.gameId, parseInt(id)))

    // Get all teams
    const gameTeams = await db
      .select()
      .from(teams)
      .where(eq(teams.gameId, parseInt(id)))

    return Response.json({
      game,
      userRole: userMembership[0].role,
      userTeamId: userMembership[0].teamId,
      members,
      teams: gameTeams,
    })
  } catch (error) {
    console.error('Error fetching game:', error)
    return Response.json({ error: 'Failed to fetch game' }, { status: 500 })
  }
}

// Update a specific game (game masters only)
export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession()
    if (!session || !session.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Check if user is a game master for this game
    const userMembership = await db
      .select()
      .from(gameMembers)
      .where(
        and(
          eq(gameMembers.gameId, parseInt(id)),
          eq(gameMembers.userId, session.user.id),
          eq(gameMembers.role, 'game_master')
        )
      )
      .limit(1)

    if (userMembership.length === 0) {
      return Response.json({ error: 'Access denied. Only game masters can update games.' }, { status: 403 })
    }

    const { status, name, clueSequence } = await request.json()

    const updateData = {}
    if (status) updateData.status = status
    if (name) updateData.name = name
    if (clueSequence !== undefined) updateData.clueSequence = clueSequence
    updateData.updatedAt = new Date()

    const [updatedGame] = await db
      .update(games)
      .set(updateData)
      .where(eq(games.id, parseInt(id)))
      .returning()

    return Response.json(updatedGame)
  } catch (error) {
    console.error('Error updating game:', error)
    return Response.json({ error: 'Failed to update game' }, { status: 500 })
  }
}
