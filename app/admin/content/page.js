'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getClueTypeDisplay, getClueTypeClasses } from '@/lib/clueTypeHelpers'

export default function AdminContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [viewMode, setViewMode] = useState('libraries') // 'libraries' or 'clues'
  const [libraries, setLibraries] = useState([])
  const [clues, setClues] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [hasAccess, setHasAccess] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    async function fetchContent() {
      if (!session) return

      setIsLoading(true)

      try {
        let url = `/api/admin/content?type=${viewMode}`
        if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`

        const response = await fetch(url)

        if (response.status === 403) {
          setError('Access denied. Admin privileges required.')
          setHasAccess(false)
          setIsLoading(false)
          return
        }

        if (!response.ok) {
          throw new Error('Failed to fetch content')
        }

        const data = await response.json()

        if (viewMode === 'libraries') {
          setLibraries(data.libraries || [])
        } else {
          setClues(data.clues || [])
        }

        setHasAccess(true)
      } catch (err) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchContent()
  }, [session, viewMode, searchQuery])

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
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">📚 Content Oversight</h1>
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
                📚 Content Oversight
              </h1>
              <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                {viewMode === 'libraries'
                  ? `${libraries.length} ${libraries.length === 1 ? 'library' : 'libraries'}`
                  : `${clues.length} ${clues.length === 1 ? 'clue' : 'clues'}`
                }
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

        {/* Controls */}
        <div className="mb-6 flex gap-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('libraries')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-md ${
                viewMode === 'libraries'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                  : 'bg-white/70 dark:bg-gray-800/70 text-gray-700 dark:text-gray-300 border border-purple-200 dark:border-purple-800 backdrop-blur-sm hover:bg-purple-50 dark:hover:bg-purple-900/20'
              }`}
            >
              📚 Libraries
            </button>
            <button
              onClick={() => setViewMode('clues')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-md ${
                viewMode === 'clues'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'bg-white/70 dark:bg-gray-800/70 text-gray-700 dark:text-gray-300 border border-purple-200 dark:border-purple-800 backdrop-blur-sm hover:bg-purple-50 dark:hover:bg-purple-900/20'
              }`}
            >
              🔍 Clues
            </button>
          </div>

          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${viewMode}...`}
              className="w-full px-4 py-2 border border-purple-200 dark:border-purple-800 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Content Display */}
        {viewMode === 'libraries' ? (
          <LibrariesView libraries={libraries} />
        ) : (
          <CluesView clues={clues} />
        )}
      </main>
    </div>
  )
}

function LibrariesView({ libraries }) {
  if (libraries.length === 0) {
    return (
      <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl shadow-lg border border-purple-100 dark:border-purple-900/50 p-12 text-center">
        <p className="text-gray-700 dark:text-gray-300">📚 No libraries found</p>
      </div>
    )
  }

  return (
    <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl shadow-lg border border-purple-100 dark:border-purple-900/50 overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Library
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Owner
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Clues
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Visibility
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
          {libraries.map(library => (
            <tr key={library.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <td className="px-6 py-4">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {library.name}
                </div>
                {library.description && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                    {library.description}
                  </div>
                )}
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900 dark:text-white">
                  {library.ownerName}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {library.ownerEmail}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {library.clueCount}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  library.isPublic
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                }`}>
                  {library.isPublic ? 'Public' : 'Private'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {new Date(library.createdAt).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <Link
                  href={`/libraries/${library.id}`}
                  className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CluesView({ clues }) {
  if (clues.length === 0) {
    return (
      <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl shadow-lg border border-purple-100 dark:border-purple-900/50 p-12 text-center">
        <p className="text-gray-700 dark:text-gray-300">🔍 No clues found</p>
      </div>
    )
  }

  return (
    <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl shadow-lg border border-purple-100 dark:border-purple-900/50 overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Title
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Photos Required
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Used In Libraries
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Created
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {clues.map(clue => (
            <tr key={clue.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <td className="px-6 py-4">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {clue.title}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getClueTypeClasses(clue.type)}`}>
                  {getClueTypeDisplay(clue.type)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {clue.requiredPhotos || 0}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {clue.usageCount}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {new Date(clue.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
