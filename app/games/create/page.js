'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CreateGame() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [gameName, setGameName] = useState('')
  const [gameCode, setGameCode] = useState('')
  const [isGeneratingCode, setIsGeneratingCode] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  const generateGameCode = () => {
    setIsGeneratingCode(true)
    // Generate a random 6-character code
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    setGameCode(code)
    setIsGeneratingCode(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!gameName.trim()) {
      setError('Game name is required')
      return
    }

    if (!gameCode.trim()) {
      setError('Game code is required')
      return
    }

    if (gameCode.length !== 6) {
      setError('Game code must be 6 characters')
      return
    }

    setIsCreating(true)

    try {
      const response = await fetch('/api/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: gameName,
          code: gameCode.toUpperCase(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create game')
      }

      // Redirect to the new game page
      router.push(`/games/${data.id}`)
    } catch (err) {
      setError(err.message)
      setIsCreating(false)
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
              🎮 Create New Game
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
          <form onSubmit={handleSubmit}>
            {/* Game Name */}
            <div className="mb-6">
              <label
                htmlFor="gameName"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                🎯 Game Name
              </label>
              <input
                type="text"
                id="gameName"
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                className="w-full px-4 py-2 border border-purple-300 dark:border-purple-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                placeholder="e.g., Summer Scavenger Hunt"
                disabled={isCreating}
              />
            </div>

            {/* Game Code */}
            <div className="mb-6">
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
                  className="flex-1 px-4 py-2 border border-purple-300 dark:border-purple-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white font-mono"
                  placeholder="ABC123"
                  maxLength={6}
                  disabled={isCreating}
                />
                <button
                  type="button"
                  onClick={generateGameCode}
                  disabled={isGeneratingCode || isCreating}
                  className="px-4 py-2 border border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-200 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-md font-medium transition-colors disabled:opacity-50"
                >
                  🎲 Generate
                </button>
              </div>
              <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                6 characters - players will use this code to join your game
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Info Box */}
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                🚀 <strong>Next steps:</strong> After creating your game, you'll be able to add clues from your libraries,
                create teams, and invite players.
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="flex-1 px-4 py-2 border border-purple-300 dark:border-purple-600 rounded-md shadow-sm text-sm font-medium text-purple-700 dark:text-purple-200 bg-white dark:bg-gray-700 hover:bg-purple-50 dark:hover:bg-purple-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                disabled={isCreating}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreating || !gameName.trim() || !gameCode.trim()}
                className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
              >
                {isCreating ? '🎮 Creating...' : '🎮 Create Game'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
