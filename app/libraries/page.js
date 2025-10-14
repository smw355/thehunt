'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Libraries() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [libraries, setLibraries] = useState([])
  const [showPublic, setShowPublic] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newLibraryName, setNewLibraryName] = useState('')
  const [newLibraryDescription, setNewLibraryDescription] = useState('')
  const [newLibraryPublic, setNewLibraryPublic] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    async function fetchLibraries() {
      if (!session) return

      try {
        const url = showPublic ? '/api/libraries?public=true' : '/api/libraries'
        const response = await fetch(url)

        if (response.ok) {
          const data = await response.json()
          setLibraries(data.libraries || [])
        }
      } catch (error) {
        console.error('Error fetching libraries:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLibraries()
  }, [session, showPublic])

  const handleCreateLibrary = async (e) => {
    e.preventDefault()
    setError('')

    if (!newLibraryName.trim()) {
      setError('Library name is required')
      return
    }

    setIsCreating(true)

    try {
      const response = await fetch('/api/libraries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newLibraryName,
          description: newLibraryDescription,
          isPublic: newLibraryPublic,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create library')
      }

      const newLibrary = await response.json()

      // Refresh libraries list
      const url = showPublic ? '/api/libraries?public=true' : '/api/libraries'
      const refreshResponse = await fetch(url)
      if (refreshResponse.ok) {
        const data = await refreshResponse.json()
        setLibraries(data.libraries || [])
      }

      // Reset form and close modal
      setNewLibraryName('')
      setNewLibraryDescription('')
      setNewLibraryPublic(false)
      setShowCreateModal(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsCreating(false)
    }
  }

  if (status === 'loading' || isLoading) {
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
              Clue Libraries
            </h1>
            <Link
              href="/dashboard"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              ← Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowPublic(false)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                !showPublic
                  ? 'bg-primary text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
              }`}
            >
              My Libraries
            </button>
            <button
              onClick={() => setShowPublic(true)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                showPublic
                  ? 'bg-primary text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
              }`}
            >
              Browse Public
            </button>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New Library
          </button>
        </div>

        {/* Libraries Grid */}
        {libraries.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="mt-4 text-sm font-medium text-gray-900 dark:text-white">
              {showPublic ? 'No public libraries yet' : 'No libraries yet'}
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {showPublic
                ? 'Check back later or create your own library.'
                : 'Get started by creating your first clue library.'}
            </p>
            {!showPublic && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-6 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark"
              >
                Create Library
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {libraries.map(library => (
              <Link
                key={library.id}
                href={`/libraries/${library.id}`}
                className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow p-6 border border-gray-200 dark:border-gray-700 hover:border-primary dark:hover:border-primary"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {library.name}
                  </h3>
                  {library.isPublic && (
                    <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                      Public
                    </span>
                  )}
                </div>
                {library.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {library.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span>{library.clueCount} {library.clueCount === 1 ? 'clue' : 'clues'}</span>
                  <span className="text-primary hover:text-primary-dark font-medium">
                    View →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Create Library Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Create New Library
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setError('')
                  setNewLibraryName('')
                  setNewLibraryDescription('')
                  setNewLibraryPublic(false)
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <form onSubmit={handleCreateLibrary}>
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Library Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={newLibraryName}
                  onChange={(e) => setNewLibraryName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
                  placeholder="My Clue Collection"
                  disabled={isCreating}
                  required
                />
              </div>

              <div className="mb-4">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description (optional)
                </label>
                <textarea
                  id="description"
                  value={newLibraryDescription}
                  onChange={(e) => setNewLibraryDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
                  placeholder="A collection of clues for..."
                  disabled={isCreating}
                />
              </div>

              <div className="mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newLibraryPublic}
                    onChange={(e) => setNewLibraryPublic(e.target.checked)}
                    className="rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary"
                    disabled={isCreating}
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Make this library public
                  </span>
                </label>
                <p className="ml-6 mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Public libraries can be viewed by all users
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false)
                    setError('')
                    setNewLibraryName('')
                    setNewLibraryDescription('')
                    setNewLibraryPublic(false)
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                  disabled={isCreating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !newLibraryName.trim()}
                  className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark disabled:opacity-50"
                >
                  {isCreating ? 'Creating...' : 'Create Library'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
