'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function JoinGame() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [gameCode, setGameCode] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [gameDetails, setGameDetails] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  const handleSearchGame = async (e) => {
    e.preventDefault()
    setError('')
    setGameDetails(null)

    if (!gameCode.trim() || gameCode.length !== 6) {
      setError('Please enter a valid 6-character game code')
      return
    }

    setIsSearching(true)

    try {
      const response = await fetch(`/api/games?code=${gameCode.toUpperCase()}`)

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Game not found. Please check the code and try again.')
        }
        throw new Error('Failed to find game')
      }

      const game = await response.json()
      setGameDetails(game)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSearching(false)
    }
  }

  const handleJoinGame = async () => {
    if (!gameDetails) return

    setIsJoining(true)
    setError('')

    try {
      const response = await fetch('/api/game-members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId: gameDetails.id,
          role: 'player',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join game')
      }

      // Redirect to the game page
      router.push(`/games/${gameDetails.id}`)
    } catch (err) {
      setError(err.message)
      setIsJoining(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Join Game
            </h1>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          {/* Search Form */}
          <form onSubmit={handleSearchGame} className="mb-6">
            <label
              htmlFor="gameCode"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Game Code
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                id="gameCode"
                value={gameCode}
                onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white font-mono text-lg"
                placeholder="ABC123"
                maxLength={6}
                disabled={isSearching || isJoining}
              />
              <button
                type="submit"
                disabled={isSearching || isJoining || !gameCode.trim() || gameCode.length !== 6}
                className="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-md font-medium transition-colors disabled:opacity-50"
              >
                {isSearching ? 'Searching...' : 'Find Game'}
              </button>
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Enter the 6-character code provided by the game master
            </p>
          </form>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Game Details */}
          {gameDetails && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Game Found!
              </h2>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Game Name</p>
                    <p className="text-base font-medium text-gray-900 dark:text-white">
                      {gameDetails.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Game Code</p>
                    <p className="text-base font-mono font-medium text-gray-900 dark:text-white">
                      {gameDetails.code}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                    <p className="text-base font-medium text-gray-900 dark:text-white capitalize">
                      {gameDetails.status}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Clues</p>
                    <p className="text-base font-medium text-gray-900 dark:text-white">
                      {gameDetails.clueSequence?.length || 0} clues
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setGameDetails(null)
                    setGameCode('')
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
                  disabled={isJoining}
                >
                  Search Again
                </button>
                <button
                  type="button"
                  onClick={handleJoinGame}
                  disabled={isJoining}
                  className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
                >
                  {isJoining ? 'Joining...' : 'Join as Player'}
                </button>
              </div>
            </div>
          )}

          {/* Info Box */}
          {!gameDetails && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <p className="text-sm text-blue-600 dark:text-blue-400">
                After joining, you'll be able to see the game details and wait for the game master
                to assign you to a team before the game starts.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
