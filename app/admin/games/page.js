'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminGames() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [games, setGames] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [hasAccess, setHasAccess] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [deletingGameId, setDeletingGameId] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [gameToDelete, setGameToDelete] = useState(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    async function fetchGames() {
      if (!session) return

      try {
        let url = '/api/admin/games?limit=100'
        if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`
        if (statusFilter) url += `&status=${statusFilter}`

        const response = await fetch(url)

        if (response.status === 403) {
          setError('Access denied. Admin privileges required.')
          setHasAccess(false)
          setIsLoading(false)
          return
        }

        if (!response.ok) {
          throw new Error('Failed to fetch games')
        }

        const data = await response.json()
        setGames(data.games || [])
        setHasAccess(true)
      } catch (err) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchGames()
  }, [session, searchQuery, statusFilter])

  const handleDeleteGame = async () => {
    if (!gameToDelete) return

    setDeletingGameId(gameToDelete.id)
    setError('')

    try {
      const response = await fetch(`/api/admin/games?id=${gameToDelete.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete game')
      }

      // Remove from local state
      setGames(games.filter(g => g.id !== gameToDelete.id))
      setShowDeleteConfirm(false)
      setGameToDelete(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setDeletingGameId(null)
    }
  }

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

  if (error && !hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
        <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg border-b border-purple-100 dark:border-purple-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">🎮 Games Management</h1>
              <Link
                href="/admin"
                className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 text-sm font-medium"
              >
                ← Admin Dashboard
              </Link>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl shadow-lg border border-red-200 dark:border-red-800 p-6">
            <h2 className="text-lg font-semibold text-red-900 dark:text-red-300 mb-2">
              🚫 Access Denied
            </h2>
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg border-b border-purple-100 dark:border-purple-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                🎮 Games Management
              </h1>
              <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                {games.length} {games.length === 1 ? 'game' : 'games'}
              </p>
            </div>
            <Link
              href="/admin"
              className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 text-sm font-medium"
            >
              ← Admin Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && hasAccess && (
          <div className="mb-6 p-4 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl shadow-lg border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by game name..."
              className="w-full px-4 py-2 border border-purple-200 dark:border-purple-800 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm text-gray-900 dark:text-white"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-purple-200 dark:border-purple-800 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm text-gray-900 dark:text-white"
          >
            <option value="">All Statuses</option>
            <option value="setup">Setup</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Games Table */}
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl shadow-lg border border-purple-100 dark:border-purple-900/50 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Game
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Members
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Clues
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {games.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No games found
                  </td>
                </tr>
              ) : (
                games.map(game => (
                  <tr key={game.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {game.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        ID: {game.id}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono font-semibold text-gray-900 dark:text-white">
                        {game.code}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${
                        game.status === 'active'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                          : game.status === 'setup'
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                      }`}>
                        {game.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {game.memberCount} ({game.gameMasterCount} GM)
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {game.clueCount || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(game.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      <Link
                        href={`/games/${game.id}`}
                        className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => {
                          setGameToDelete(game)
                          setShowDeleteConfirm(true)
                        }}
                        disabled={deletingGameId === game.id}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 disabled:opacity-50"
                      >
                        {deletingGameId === game.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl shadow-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <strong className="text-blue-600 dark:text-blue-400">⚠️ Note:</strong> Deleting a game will permanently remove all associated data including teams, submissions, and member records. This action cannot be undone.
          </p>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && gameToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-xl shadow-2xl border border-purple-200 dark:border-purple-800 max-w-md w-full p-6">
            <h2 className="text-xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent mb-4">
              🗑️ Delete Game?
            </h2>
            <div className="mb-6">
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                Are you sure you want to delete the following game?
              </p>
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {gameToDelete.name}
                </p>
                <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">
                  Code: {gameToDelete.code} • {gameToDelete.memberCount} members • {gameToDelete.clueCount || 0} clues
                </p>
              </div>
              <p className="text-sm text-red-600 dark:text-red-400 mt-3 font-medium">
                ⚠️ This action cannot be undone. All game data will be permanently deleted.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setGameToDelete(null)
                }}
                className="flex-1 px-4 py-2 border border-purple-300 dark:border-purple-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                disabled={deletingGameId === gameToDelete.id}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteGame}
                disabled={deletingGameId === gameToDelete.id}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 shadow-lg"
              >
                {deletingGameId === gameToDelete.id ? 'Deleting...' : 'Delete Game'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
