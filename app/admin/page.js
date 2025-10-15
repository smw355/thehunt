'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState(null)
  const [recentUsers, setRecentUsers] = useState([])
  const [recentGames, setRecentGames] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [hasAccess, setHasAccess] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    async function fetchAdminData() {
      if (!session) return

      try {
        // Fetch statistics
        const statsResponse = await fetch('/api/admin/stats')
        if (statsResponse.status === 403) {
          setError('Access denied. Admin privileges required.')
          setHasAccess(false)
          setIsLoading(false)
          return
        }

        if (!statsResponse.ok) {
          throw new Error('Failed to fetch admin statistics')
        }

        const statsData = await statsResponse.json()
        setStats(statsData)
        setHasAccess(true)

        // Fetch recent users
        const usersResponse = await fetch('/api/admin/users?limit=10')
        if (usersResponse.ok) {
          const usersData = await usersResponse.json()
          setRecentUsers(usersData.users || [])
        }

        // Fetch recent games
        const gamesResponse = await fetch('/api/admin/games?limit=10')
        if (gamesResponse.ok) {
          const gamesData = await gamesResponse.json()
          setRecentGames(gamesData.games || [])
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAdminData()
  }, [session, router])

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

  if (error || !hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
        <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg border-b border-purple-100 dark:border-purple-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Admin Dashboard</h1>
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
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl shadow-lg border border-red-200 dark:border-red-800 p-6">
            <h2 className="text-lg font-semibold text-red-900 dark:text-red-300 mb-2">
              🚫 Access Denied
            </h2>
            <p className="text-red-700 dark:text-red-400">
              {error || 'You do not have permission to access the admin dashboard.'}
            </p>
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
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-md">
                Admin Access
              </span>
            </div>
            <Link
              href="/dashboard"
              className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
            >
              ← User Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={stats?.users?.total || 0}
            subtitle={`${stats?.users?.active || 0} active`}
            icon="👥"
            color="blue"
          />
          <StatCard
            title="Total Games"
            value={stats?.games?.total || 0}
            subtitle={`${stats?.games?.active || 0} active`}
            icon="🎮"
            color="green"
          />
          <StatCard
            title="Clue Libraries"
            value={stats?.content?.libraries || 0}
            subtitle="User collections"
            icon="📚"
            color="purple"
          />
          <StatCard
            title="Total Clues"
            value={stats?.content?.clues || 0}
            subtitle="In all libraries"
            icon="🔍"
            color="yellow"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link
            href="/admin/users"
            className="bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all p-6 border border-blue-400/50 transform hover:scale-[1.02]"
          >
            <div className="flex items-center">
              <div className="bg-white/20 rounded-lg p-3 mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1">👥 Manage Users</h3>
                <p className="text-sm text-blue-100">View and edit user accounts</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/games"
            className="bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all p-6 border border-purple-400/50 transform hover:scale-[1.02]"
          >
            <div className="flex items-center">
              <div className="bg-white/20 rounded-lg p-3 mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1">🎮 Manage Games</h3>
                <p className="text-sm text-purple-100">View and moderate all games</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/content"
            className="bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all p-6 border border-green-400/50 transform hover:scale-[1.02]"
          >
            <div className="flex items-center">
              <div className="bg-white/20 rounded-lg p-3 mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1">📚 Content Oversight</h3>
                <p className="text-sm text-green-100">Review libraries and clues</p>
              </div>
            </div>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Users */}
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl shadow-lg border border-purple-100 dark:border-purple-900/50">
            <div className="px-6 py-4 border-b border-purple-100 dark:border-purple-900/50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  👥 Recent Users
                </h3>
                <Link
                  href="/admin/users"
                  className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 text-sm font-medium"
                >
                  View All →
                </Link>
              </div>
            </div>
            <div className="divide-y divide-purple-100 dark:divide-purple-900/50">
              {recentUsers.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                  No users yet
                </div>
              ) : (
                recentUsers.map(user => (
                  <div key={user.id} className="px-6 py-4 hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {user.image && (
                          <img
                            src={user.image}
                            alt={user.name}
                            className="w-8 h-8 rounded-full ring-2 ring-purple-200 dark:ring-purple-800"
                          />
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.name}
                          </p>
                          <p className="text-xs text-gray-700 dark:text-gray-300">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        user.globalRole === 'admin'
                          ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                      }`}>
                        {user.globalRole}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Games */}
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl shadow-lg border border-purple-100 dark:border-purple-900/50">
            <div className="px-6 py-4 border-b border-purple-100 dark:border-purple-900/50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  🎮 Recent Games
                </h3>
                <Link
                  href="/admin/games"
                  className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 text-sm font-medium"
                >
                  View All →
                </Link>
              </div>
            </div>
            <div className="divide-y divide-purple-100 dark:divide-purple-900/50">
              {recentGames.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                  No games yet
                </div>
              ) : (
                recentGames.map(game => (
                  <div key={game.id} className="px-6 py-4 hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {game.name}
                        </p>
                        <p className="text-xs text-gray-700 dark:text-gray-300">
                          Code: <span className="font-mono font-semibold">{game.code}</span> • {game.memberCount} members
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                        game.status === 'active'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                          : game.status === 'setup'
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                      }`}>
                        {game.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function StatCard({ title, value, subtitle, icon, color }) {
  const colorClasses = {
    blue: 'bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40 border-blue-300 dark:border-blue-700/50',
    green: 'bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/40 dark:to-green-800/40 border-green-300 dark:border-green-700/50',
    purple: 'bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/40 dark:to-purple-800/40 border-purple-300 dark:border-purple-700/50',
    yellow: 'bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900/40 dark:to-yellow-800/40 border-yellow-300 dark:border-yellow-700/50',
  }

  return (
    <div className={`${colorClasses[color]} border rounded-xl p-6 shadow-lg backdrop-blur-sm`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        <span className="text-3xl font-bold text-gray-900 dark:text-white">{value}</span>
      </div>
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</h3>
      <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">{subtitle}</p>
    </div>
  )
}
