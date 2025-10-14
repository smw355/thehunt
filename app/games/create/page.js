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
              Create New Game
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
          <form onSubmit={handleSubmit}>
            {/* Game Name */}
            <div className="mb-6">
              <label
                htmlFor="gameName"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Game Name
              </label>
              <input
                type="text"
                id="gameName"
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
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
                Game Code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="gameCode"
                  value={gameCode}
                  onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white font-mono"
                  placeholder="ABC123"
                  maxLength={6}
                  disabled={isCreating}
                />
                <button
                  type="button"
                  onClick={generateGameCode}
                  disabled={isGeneratingCode || isCreating}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md font-medium transition-colors disabled:opacity-50"
                >
                  Generate
                </button>
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
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
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <p className="text-sm text-blue-600 dark:text-blue-400">
                After creating your game, you'll be able to add clues from your libraries,
                create teams, and invite players.
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
                disabled={isCreating}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreating || !gameName.trim() || !gameCode.trim()}
                className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
              >
                {isCreating ? 'Creating...' : 'Create Game'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
