'use client'

import { useSession, signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAdminAccess } from '@/hooks/useAdminAccess'

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [userGames, setUserGames] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const { isAdmin } = useAdminAccess()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    async function fetchGames() {
      if (!session) return

      try {
        const response = await fetch('/api/games')
        if (response.ok) {
          const data = await response.json()
          setUserGames(data.games || [])
        }
      } catch (error) {
        console.error('Error fetching games:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchGames()
  }, [session])

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
        <div className="animate-pulse">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-6">
                <div className="h-8 bg-gradient-to-r from-blue-200 to-purple-200 dark:from-blue-900/50 dark:to-purple-900/50 rounded w-32"></div>
                <div className="h-10 bg-gradient-to-r from-purple-200 to-pink-200 dark:from-purple-900/50 dark:to-pink-900/50 rounded w-24"></div>
              </div>
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="h-6 bg-gradient-to-r from-blue-200 to-purple-200 dark:from-blue-900/50 dark:to-purple-900/50 rounded w-48 mb-4"></div>
            <div className="h-4 bg-gradient-to-r from-purple-200 to-pink-200 dark:from-purple-900/50 dark:to-pink-900/50 rounded w-96 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl shadow-lg p-6">
                  <div className="h-6 bg-gradient-to-r from-blue-200 to-purple-200 dark:from-blue-900/50 dark:to-purple-900/50 rounded w-full mb-4"></div>
                  <div className="h-4 bg-gradient-to-r from-purple-200 to-pink-200 dark:from-purple-900/50 dark:to-pink-900/50 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                The Hunt
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              {isAdmin && (
                <Link
                  href="/admin"
                  className="text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex items-center space-x-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Admin</span>
                </Link>
              )}

              <div className="flex items-center space-x-2">
                {session.user.image && (
                  <img
                    src={session.user.image}
                    alt={session.user.name}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {session.user.name}
                </span>
              </div>

              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-all shadow-md hover:shadow-lg"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl shadow-lg p-8 border border-purple-100 dark:border-purple-900/50">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Welcome back, {session.user.name?.split(' ')[0]}! 👋
          </h2>
          <p className="text-gray-700 dark:text-gray-300">
            Ready for your next adventure? Manage treasure hunts, craft clever clues, and track your epic quests!
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link
            href="/games/create"
            className="bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl shadow-lg hover:shadow-2xl transition-all p-6 border border-blue-400/50 transform hover:scale-105"
          >
            <div className="flex items-center">
              <div className="bg-white/20 rounded-lg p-3 mr-4 backdrop-blur-sm">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Create Game 🎮</h3>
                <p className="text-sm text-blue-100">Start a new treasure hunt</p>
              </div>
            </div>
          </Link>

          <Link
            href="/libraries"
            className="bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl shadow-lg hover:shadow-2xl transition-all p-6 border border-purple-400/50 transform hover:scale-105"
          >
            <div className="flex items-center">
              <div className="bg-white/20 rounded-lg p-3 mr-4 backdrop-blur-sm">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Clue Libraries 📚</h3>
                <p className="text-sm text-purple-100">Manage your clue collections</p>
              </div>
            </div>
          </Link>

          <Link
            href="/games/join"
            className="bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-xl shadow-lg hover:shadow-2xl transition-all p-6 border border-green-400/50 transform hover:scale-105"
          >
            <div className="flex items-center">
              <div className="bg-white/20 rounded-lg p-3 mr-4 backdrop-blur-sm">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Join Game 🚀</h3>
                <p className="text-sm text-green-100">Enter a game code to play</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Games Section */}
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl shadow-lg border border-purple-100 dark:border-purple-900/50">
          <div className="px-6 py-4 border-b border-purple-200 dark:border-purple-800/50">
            <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Your Games 🎯</h3>
          </div>

          {userGames.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
              <h3 className="mt-4 text-sm font-medium text-gray-900 dark:text-white">No games yet</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Get started by creating your first treasure hunt game or joining an existing one.
              </p>
              <div className="mt-6 flex justify-center space-x-3">
                <Link
                  href="/games/create"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Create Game
                </Link>
                <Link
                  href="/games/join"
                  className="inline-flex items-center px-4 py-2 border border-purple-300 dark:border-purple-600 shadow-sm text-sm font-medium rounded-md text-purple-700 dark:text-purple-200 bg-white dark:bg-gray-700 hover:bg-purple-50 dark:hover:bg-purple-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Join Game
                </Link>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {userGames.map(game => (
                <div key={game.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">{game.name}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Code: <span className="font-mono">{game.code}</span> • {' '}
                        <span className="capitalize">{game.role?.replace('_', ' ')}</span> • {' '}
                        <span className="capitalize">{game.status}</span>
                      </p>
                    </div>
                    <Link
                      href={`/games/${game.id}`}
                      className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 text-sm font-medium"
                    >
                      View →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}