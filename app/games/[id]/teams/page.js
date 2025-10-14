'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function TeamManagement() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [gameData, setGameData] = useState(null)
  const [teams, setTeams] = useState([])
  const [members, setMembers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingTeam, setEditingTeam] = useState(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    fetchData()
  }, [session, params.id])

  async function fetchData() {
    if (!session || !params.id) return

    setIsLoading(true)
    try {
      // Fetch game data
      const gameResponse = await fetch(`/api/games/${params.id}`)
      if (!gameResponse.ok) throw new Error('Failed to load game')
      const game = await gameResponse.json()

      // Check if user is game master
      if (game.userRole !== 'game_master') {
        router.push(`/games/${params.id}`)
        return
      }

      setGameData(game)

      // Fetch teams
      const teamsResponse = await fetch(`/api/teams?gameId=${params.id}`)
      if (teamsResponse.ok) {
        const teamsData = await teamsResponse.json()
        setTeams(teamsData)
      }

      // Get members from game data
      setMembers(game.members || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateTeam = async (name, password) => {
    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: params.id,
          name,
          password
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create team')
      }

      setShowCreateModal(false)
      fetchData()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleUpdateTeam = async (teamId, name, password) => {
    try {
      const response = await fetch('/api/teams', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: teamId,
          gameId: params.id,
          name,
          password
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update team')
      }

      setEditingTeam(null)
      fetchData()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDeleteTeam = async (teamId) => {
    if (!confirm('Are you sure you want to delete this team? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/teams?id=${teamId}&gameId=${params.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete team')
      }

      fetchData()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleAssignPlayer = async (memberId, teamId) => {
    try {
      const response = await fetch(`/api/game-members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: params.id,
          teamId: teamId || null
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to assign player')
      }

      fetchData()
    } catch (err) {
      setError(err.message)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!session || !gameData) {
    return null
  }

  const players = members.filter(m => m.role === 'player')
  const unassignedPlayers = players.filter(p => !p.teamId)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Team Management
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {gameData.game?.name}
              </p>
            </div>
            <Link
              href={`/games/${params.id}`}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              ← Back to Game
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Teams List */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Teams ({teams.length})
                </h2>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-md text-sm font-medium"
                >
                  Create Team
                </button>
              </div>

              <div className="p-6">
                {teams.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      No teams created yet
                    </p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-md text-sm font-medium"
                    >
                      Create First Team
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {teams.map(team => (
                      <TeamCard
                        key={team.id}
                        team={team}
                        members={members.filter(m => m.teamId === team.id)}
                        onEdit={() => setEditingTeam(team)}
                        onDelete={() => handleDeleteTeam(team.id)}
                        onUnassignPlayer={(memberId) => handleAssignPlayer(memberId, null)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Unassigned Players */}
          <div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Unassigned Players
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {unassignedPlayers.length} player{unassignedPlayers.length !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="p-6">
                {unassignedPlayers.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                    All players assigned
                  </p>
                ) : (
                  <div className="space-y-2">
                    {unassignedPlayers.map(player => (
                      <div
                        key={player.id}
                        className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md"
                      >
                        <div className="flex items-center space-x-3 mb-2">
                          {player.userImage && (
                            <img
                              src={player.userImage}
                              alt={player.userName}
                              className="w-8 h-8 rounded-full"
                            />
                          )}
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {player.userName}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {player.userEmail}
                            </p>
                          </div>
                        </div>
                        <select
                          onChange={(e) => handleAssignPlayer(player.id, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-white"
                          defaultValue=""
                        >
                          <option value="" disabled>Assign to team...</option>
                          {teams.map(team => (
                            <option key={team.id} value={team.id}>
                              {team.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Create/Edit Team Modal */}
      {(showCreateModal || editingTeam) && (
        <TeamModal
          team={editingTeam}
          onClose={() => {
            setShowCreateModal(false)
            setEditingTeam(null)
          }}
          onSave={(name, password) => {
            if (editingTeam) {
              handleUpdateTeam(editingTeam.id, name, password)
            } else {
              handleCreateTeam(name, password)
            }
          }}
        />
      )}
    </div>
  )
}

function TeamCard({ team, members, onEdit, onDelete, onUnassignPlayer }) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {team.name}
          </h3>
          {team.password && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Password: <span className="font-mono">{team.password}</span>
            </p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onEdit}
            className="text-sm text-primary hover:text-primary-dark font-medium"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
          >
            Delete
          </button>
        </div>
      </div>

      {members.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
          No players assigned
        </p>
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
            Team Members ({members.length})
          </p>
          {members.map(member => (
            <div
              key={member.id}
              className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700/50 rounded"
            >
              <div className="flex items-center space-x-2">
                {member.userImage && (
                  <img
                    src={member.userImage}
                    alt={member.userName}
                    className="w-6 h-6 rounded-full"
                  />
                )}
                <span className="text-sm text-gray-900 dark:text-white">
                  {member.userName}
                </span>
              </div>
              <button
                onClick={() => onUnassignPlayer(member.id)}
                className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function TeamModal({ team, onClose, onSave }) {
  const [name, setName] = useState(team?.name || '')
  const [password, setPassword] = useState(team?.password || '')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    onSave(name, password)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {team ? 'Edit Team' : 'Create New Team'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4">
          <div className="mb-4">
            <label htmlFor="teamName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Team Name *
            </label>
            <input
              type="text"
              id="teamName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
              placeholder="Enter team name"
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="teamPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Team Password (Optional)
            </label>
            <input
              type="text"
              id="teamPassword"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
              placeholder="Leave blank for no password"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Players will need this password to join the team in legacy mode
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-md text-sm font-medium disabled:opacity-50"
            >
              {team ? 'Update Team' : 'Create Team'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
