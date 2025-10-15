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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg border-b border-purple-100 dark:border-purple-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              🚀 Join Game
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
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl shadow-lg border border-purple-100 dark:border-purple-900/50 p-6">
          {/* Search Form */}
          <form onSubmit={handleSearchGame} className="mb-6">
            <label
              htmlFor="gameCode"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              🔑 Game Code
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                id="gameCode"
                value={gameCode}
                onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                className="flex-1 px-4 py-2 border border-purple-300 dark:border-purple-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white font-mono text-lg"
                placeholder="ABC123"
                maxLength={6}
                disabled={isSearching || isJoining}
              />
              <button
                type="submit"
                disabled={isSearching || isJoining || !gameCode.trim() || gameCode.length !== 6}
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-md font-medium transition-colors disabled:opacity-50"
              >
                {isSearching ? '🔍 Searching...' : '🔍 Find Game'}
              </button>
            </div>
            <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
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
            <div className="border-t border-purple-200 dark:border-purple-700 pt-6">
              <h2 className="text-lg font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
                🎉 Game Found!
              </h2>

              <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20 rounded-lg p-4 mb-6 border border-purple-200 dark:border-purple-800">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">🎮 Game Name</p>
                    <p className="text-base font-medium text-gray-900 dark:text-white">
                      {gameDetails.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">🔑 Game Code</p>
                    <p className="text-base font-mono font-medium text-gray-900 dark:text-white">
                      {gameDetails.code}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">📊 Status</p>
                    <p className="text-base font-medium text-gray-900 dark:text-white capitalize">
                      {gameDetails.status}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">🎯 Clues</p>
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
                  className="flex-1 px-4 py-2 border border-purple-300 dark:border-purple-600 rounded-md shadow-sm text-sm font-medium text-purple-700 dark:text-purple-200 bg-white dark:bg-gray-700 hover:bg-purple-50 dark:hover:bg-purple-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                  disabled={isJoining}
                >
                  🔍 Search Again
                </button>
                <button
                  type="button"
                  onClick={handleJoinGame}
                  disabled={isJoining}
                  className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                >
                  {isJoining ? '🚀 Joining...' : '🚀 Join as Player'}
                </button>
              </div>
            </div>
          )}

          {/* Info Box */}
          {!gameDetails && (
            <div className="p-4 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                🎯 <strong>What happens next:</strong> After joining, you'll be able to see the game details and wait for the game master
                to assign you to a team before the game starts.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
