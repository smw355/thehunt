'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { getClueTypeDisplay } from '@/lib/clueTypeHelpers'
import PlayerGameView from '@/components/PlayerGameView'

export default function GameDetail() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [gameData, setGameData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  const fetchGameData = async () => {
    if (!session || !params.id) return

    try {
      const response = await fetch(`/api/games/${params.id}`)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to load game')
      }

      const data = await response.json()
      setGameData(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchGameData()
  }, [session, params.id])

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
        <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg border-b border-purple-100 dark:border-purple-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Error</h1>
              <Link
                href="/dashboard"
                className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 text-sm font-medium"
              >
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        </main>
      </div>
    )
  }

  const isGameMaster = gameData?.userRole === 'game_master'
  const game = gameData?.game

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg border-b border-purple-100 dark:border-purple-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  🎮 {game?.name}
                </h1>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  game?.status === 'active' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                  game?.status === 'setup' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                  'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                }`}>
                  {game?.status === 'active' ? '🏆 ' : game?.status === 'setup' ? '⚙️ ' : ''}{game?.status}
                </span>
                {isGameMaster && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                    🎯 Game Master
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                Game Code: <span className="font-mono font-semibold">{game?.code}</span>
              </p>
            </div>
            <Link
              href="/dashboard"
              className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
            >
              ← Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isGameMaster ? (
          <GameMasterView gameData={gameData} />
        ) : (
          <PlayerView gameData={gameData} onRefresh={fetchGameData} />
        )}
      </main>
    </div>
  )
}

function GameMasterView({ gameData }) {
  const { game, members, teams } = gameData
  const [isStarting, setIsStarting] = useState(false)
  const [advancingTeam, setAdvancingTeam] = useState(null)
  const [pendingSubmissions, setPendingSubmissions] = useState({})
  const router = useRouter()

  // Fetch pending submissions for each team
  useEffect(() => {
    async function fetchPendingSubmissions() {
      if (game.status !== 'active') return

      try {
        const response = await fetch(`/api/submissions?gameId=${game.id}&status=pending`)
        if (response.ok) {
          const submissions = await response.json()
          // Count submissions by team
          const counts = {}
          submissions.forEach(({ submission }) => {
            counts[submission.teamId] = (counts[submission.teamId] || 0) + 1
          })
          setPendingSubmissions(counts)
        }
      } catch (error) {
        console.error('Error fetching submissions:', error)
      }
    }

    fetchPendingSubmissions()
    // Poll every 30 seconds for updates
    const interval = setInterval(fetchPendingSubmissions, 30000)
    return () => clearInterval(interval)
  }, [game.id, game.status])

  const handleStartGame = async () => {
    setIsStarting(true)
    try {
      const response = await fetch(`/api/games/${game.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' }),
      })

      if (response.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error('Error starting game:', error)
    } finally {
      setIsStarting(false)
    }
  }

  const handleAdvanceTeam = async (team) => {
    if (!confirm(`Advance ${team.name} to the next clue? This will mark their current clue as completed.`)) {
      return
    }

    setAdvancingTeam(team.id)
    try {
      const currentClueIndex = team.currentClueIndex || 0
      const nextClueIndex = currentClueIndex + 1
      const currentClueId = game.clueSequence[currentClueIndex]?.id || currentClueIndex
      const newCompletedClues = [...(team.completedClues || []), currentClueId]

      const response = await fetch('/api/teams', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: team.id,
          gameId: game.id,
          currentClueIndex: nextClueIndex,
          completedClues: newCompletedClues
        }),
      })

      if (response.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error('Error advancing team:', error)
      alert('Failed to advance team')
    } finally {
      setAdvancingTeam(null)
    }
  }

  const gameMasters = members.filter(m => m.role === 'game_master')
  const players = members.filter(m => m.role === 'player')
  const unassignedPlayers = players.filter(p => !p.teamId)

  return (
    <div className="space-y-6">
      {/* Submission Review - Always visible for active games */}
      {game.status === 'active' && (
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl shadow-lg border border-purple-100 dark:border-purple-900/50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                📝 Submission Review
              </h2>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Review and approve team submissions as they complete clues
              </p>
            </div>
            <Link
              href={`/games/${game.id}/submissions`}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-md text-sm font-medium"
            >
              📝 Review Submissions
            </Link>
          </div>
        </div>
      )}

      {/* Game Controls */}
      {game.status === 'setup' && (
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl shadow-lg border border-purple-100 dark:border-purple-900/50 p-6">
          <h2 className="text-lg font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            ⚙️ Game Setup
          </h2>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
            Your game is in setup mode. Add clues, create teams, and assign players before starting.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/games/${game.id}/clues`}
              className="px-4 py-2 bg-white dark:bg-gray-700 border border-purple-300 dark:border-purple-600 rounded-md text-sm font-medium text-purple-700 dark:text-purple-200 hover:bg-purple-50 dark:hover:bg-purple-900/30"
            >
              🎯 Manage Clues
            </Link>
            <Link
              href={`/games/${game.id}/teams`}
              className="px-4 py-2 bg-white dark:bg-gray-700 border border-purple-300 dark:border-purple-600 rounded-md text-sm font-medium text-purple-700 dark:text-purple-200 hover:bg-purple-50 dark:hover:bg-purple-900/30"
            >
              👥 Manage Teams
            </Link>
            <Link
              href={`/games/${game.id}/victory-settings`}
              className="px-4 py-2 bg-white dark:bg-gray-700 border border-purple-300 dark:border-purple-600 rounded-md text-sm font-medium text-purple-700 dark:text-purple-200 hover:bg-purple-50 dark:hover:bg-purple-900/30"
            >
              🏆 Victory Page
            </Link>
            <button
              onClick={handleStartGame}
              disabled={isStarting || players.length === 0 || teams.length === 0}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isStarting ? 'Starting...' : '🏆 Start Game'}
            </button>
          </div>
          {(players.length === 0 || teams.length === 0) && (
            <p className="mt-3 text-xs text-gray-700 dark:text-gray-300">
              You need at least one player and one team to start the game.
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Teams */}
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl shadow-lg border border-purple-100 dark:border-purple-900/50">
          <div className="px-6 py-4 border-b border-purple-100 dark:border-purple-900/50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                👥 Teams ({teams.length})
              </h3>
              <Link
                href={`/games/${game.id}/teams`}
                className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 text-sm font-medium"
              >
                Manage →
              </Link>
            </div>
          </div>
          <div className="p-6">
            {teams.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-700 dark:text-gray-300 text-sm mb-4">
                  No teams created yet
                </p>
                <Link
                  href={`/games/${game.id}/teams`}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                >
                  Create First Team
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {teams.map(team => {
                  const teamMembers = members.filter(m => m.teamId === team.id)
                  const currentClueIndex = team.currentClueIndex || 0
                  const totalClues = game.clueSequence?.length || 0
                  const isComplete = currentClueIndex >= totalClues
                  const canAdvance = game.status === 'active' && !isComplete
                  const pendingCount = pendingSubmissions[team.id] || 0

                  return (
                    <div
                      key={team.id}
                      className="border border-purple-100 dark:border-purple-900/50 rounded-lg p-4 hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {team.name}
                            </h4>
                            {pendingCount > 0 && (
                              <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-xs rounded-full animate-pulse">
                                📝 {pendingCount} pending
                              </span>
                            )}
                            {isComplete && (
                              <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs rounded-full">
                                ✓ Complete
                              </span>
                            )}
                          </div>
                          {game.status === 'active' && (
                            <p className="text-xs text-gray-700 dark:text-gray-300">
                              Progress: {currentClueIndex} / {totalClues} clues
                              {!isComplete && ` • On clue #${currentClueIndex + 1}`}
                            </p>
                          )}
                          <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">
                            {teamMembers.length} {teamMembers.length === 1 ? 'player' : 'players'}
                          </p>
                        </div>
                        {canAdvance && (
                          <button
                            onClick={() => handleAdvanceTeam(team)}
                            disabled={advancingTeam === team.id}
                            className="ml-3 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-md text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                            title="Manually advance team to next clue"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>{advancingTeam === team.id ? 'Advancing...' : 'Advance'}</span>
                          </button>
                        )}
                      </div>
                      {teamMembers.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {teamMembers.map(member => (
                            <div
                              key={member.id}
                              className="flex items-center space-x-2 bg-purple-50 dark:bg-purple-900/20 rounded px-2 py-1"
                            >
                              {member.userImage && (
                                <img
                                  src={member.userImage}
                                  alt={member.userName}
                                  className="w-5 h-5 rounded-full"
                                />
                              )}
                              <span className="text-xs text-gray-700 dark:text-gray-300">
                                {member.userName}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Players */}
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl shadow-lg border border-purple-100 dark:border-purple-900/50">
          <div className="px-6 py-4 border-b border-purple-100 dark:border-purple-900/50">
            <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              👥 Players ({players.length})
            </h3>
          </div>
          <div className="p-6">
            {players.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">
                  No players have joined yet
                </p>
                <p className="text-xs text-gray-700 dark:text-gray-300">
                  Share game code <span className="font-mono font-semibold">{game.code}</span> with players
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {unassignedPlayers.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Unassigned ({unassignedPlayers.length})
                    </p>
                    {unassignedPlayers.map(player => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between py-2 px-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md mb-2"
                      >
                        <div className="flex items-center space-x-2">
                          {player.userImage && (
                            <img
                              src={player.userImage}
                              alt={player.userName}
                              className="w-6 h-6 rounded-full"
                            />
                          )}
                          <span className="text-sm text-gray-900 dark:text-white">
                            {player.userName}
                          </span>
                        </div>
                        <Link
                          href={`/games/${game.id}/teams`}
                          className="text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                        >
                          Assign →
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
                <div>
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                    All Players
                  </p>
                  {players.map(player => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between py-2"
                    >
                      <div className="flex items-center space-x-2">
                        {player.userImage && (
                          <img
                            src={player.userImage}
                            alt={player.userName}
                            className="w-6 h-6 rounded-full"
                          />
                        )}
                        <span className="text-sm text-gray-900 dark:text-white">
                          {player.userName}
                        </span>
                      </div>
                      {player.teamId && (
                        <span className="text-xs text-gray-700 dark:text-gray-300">
                          {teams.find(t => t.id === player.teamId)?.name}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Clues Section */}
      <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl shadow-lg border border-purple-100 dark:border-purple-900/50">
        <div className="px-6 py-4 border-b border-purple-100 dark:border-purple-900/50">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              🎯 Clues ({game.clueSequence?.length || 0})
            </h3>
            <Link
              href={`/games/${game.id}/clues`}
              className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 text-sm font-medium"
            >
              Manage →
            </Link>
          </div>
        </div>
        <div className="p-6">
          {(!game.clueSequence || game.clueSequence.length === 0) ? (
            <div className="text-center py-8">
              <p className="text-gray-700 dark:text-gray-300 text-sm mb-4">
                No clues added yet
              </p>
              <Link
                href={`/games/${game.id}/clues`}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                Add Clues
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {game.clueSequence.map((clue, index) => {
                // Handle both formats: direct clue object or nested {clue: {...}}
                const clueData = clue.clue || clue
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 px-3 bg-purple-50 dark:bg-purple-900/20 rounded-md hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                  >
                    <div className="flex-1">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {index + 1}. {clueData.title || 'Untitled Clue'}
                      </span>
                      {clueData.requiredPhotos > 0 && (
                        <span className="ml-2 text-xs text-purple-600 dark:text-purple-400">
                          📷 {clueData.requiredPhotos}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-700 dark:text-gray-300">
                      {clueData.type ? getClueTypeDisplay(clueData.type) : 'Unknown'}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Game Masters */}
      {gameMasters.length > 1 && (
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl shadow-lg border border-purple-100 dark:border-purple-900/50">
          <div className="px-6 py-4 border-b border-purple-100 dark:border-purple-900/50">
            <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              🎯 Game Masters ({gameMasters.length})
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-2">
              {gameMasters.map(gm => (
                <div key={gm.id} className="flex items-center space-x-2 py-2">
                  {gm.userImage && (
                    <img
                      src={gm.userImage}
                      alt={gm.userName}
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <span className="text-sm text-gray-900 dark:text-white">
                    {gm.userName}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PlayerView({ gameData, onRefresh }) {
  const { game, members, teams, userTeamId } = gameData
  const userTeam = teams.find(t => t.id === userTeamId)
  const teamMembers = userTeamId ? members.filter(m => m.teamId === userTeamId) : []

  return (
    <div className="space-y-6">
      {/* Player Status */}
      {game.status === 'setup' && (
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl shadow-lg border border-purple-100 dark:border-purple-900/50 p-6">
          <h2 className="text-lg font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            ⚙️ Game Setup in Progress
          </h2>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            The game master is still setting up the game. You'll be notified when the game starts.
          </p>
        </div>
      )}

      {/* Team Assignment */}
      {!userTeamId ? (
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl shadow-lg border border-yellow-200 dark:border-yellow-800 p-6">
          <h2 className="text-lg font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            ⏳ Waiting for Team Assignment
          </h2>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            You haven't been assigned to a team yet. The game master will assign you to a team soon.
          </p>
        </div>
      ) : (
        <>
          {/* Team Info Card */}
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl shadow-lg border border-purple-100 dark:border-purple-900/50">
            <div className="px-6 py-4 border-b border-purple-100 dark:border-purple-900/50">
              <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                👥 Your Team
              </h3>
            </div>
            <div className="p-6">
              <h4 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">{userTeam.name}</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">Team Members:</p>
              <div className="space-y-2">
                {teamMembers.map(member => (
                  <div key={member.id} className="flex items-center space-x-3 py-2">
                    {member.userImage && (
                      <img
                        src={member.userImage}
                        alt={member.userName}
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    <span className="text-sm text-gray-900 dark:text-white">
                      {member.userName}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Active Game View */}
          {game.status === 'active' && (
            <PlayerGameView
              gameData={gameData}
              teamData={userTeam}
              onRefresh={onRefresh}
            />
          )}

          {game.status === 'setup' && (
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl shadow-lg border border-purple-100 dark:border-purple-900/50 p-8 text-center">
              <p className="text-gray-700 dark:text-gray-300">
                Game hasn't started yet. Waiting for game master to start the game.
              </p>
            </div>
          )}
        </>
      )}

      {/* Game Info */}
      <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl shadow-lg border border-purple-100 dark:border-purple-900/50">
        <div className="px-6 py-4 border-b border-purple-100 dark:border-purple-900/50">
          <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            🎮 Game Information
          </h3>
        </div>
        <div className="p-6">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-700 dark:text-gray-300">Game Code</dt>
              <dd className="mt-1 text-sm font-mono font-semibold text-gray-900 dark:text-white">
                {game.code}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</dt>
              <dd className="mt-1 text-sm font-semibold text-gray-900 dark:text-white capitalize">
                {game.status}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Clues</dt>
              <dd className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                {game.clueSequence?.length || 0}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Teams</dt>
              <dd className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                {teams.length}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}
