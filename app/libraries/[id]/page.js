'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import ClueCreationModal from '@/components/ClueCreationModal'
import { getClueTypeDisplay, getClueTypeClasses } from '@/lib/clueTypeHelpers'

export default function LibraryDetail() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [libraryData, setLibraryData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editPublic, setEditPublic] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showClueModal, setShowClueModal] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    async function fetchLibraryData() {
      if (!session || !params.id) return

      try {
        const response = await fetch(`/api/libraries/${params.id}`)

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to load library')
        }

        const data = await response.json()
        setLibraryData(data)
        setEditName(data.library.name)
        setEditDescription(data.library.description || '')
        setEditPublic(data.library.isPublic)
      } catch (err) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLibraryData()
  }, [session, params.id])

  const handleSaveEdit = async () => {
    setIsSaving(true)
    setError('')

    try {
      const response = await fetch(`/api/libraries/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          description: editDescription,
          isPublic: editPublic,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update library')
      }

      const updatedLibrary = await response.json()
      setLibraryData(prev => ({ ...prev, library: updatedLibrary }))
      setIsEditing(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      const response = await fetch(`/api/libraries/${params.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete library')
      }

      router.push('/libraries')
    } catch (err) {
      setError(err.message)
      setIsDeleting(false)
    }
  }

  const handleRemoveClue = async (clueId) => {
    try {
      const response = await fetch(`/api/libraries/${params.id}/clues?clueId=${clueId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to remove clue')
      }

      // Refresh library data
      const refreshResponse = await fetch(`/api/libraries/${params.id}`)
      if (refreshResponse.ok) {
        const data = await refreshResponse.json()
        setLibraryData(data)
      }
    } catch (err) {
      setError(err.message)
    }
  }

  const handleClueCreated = async (newClue) => {
    // Refresh library data to show the new clue
    const refreshResponse = await fetch(`/api/libraries/${params.id}`)
    if (refreshResponse.ok) {
      const data = await refreshResponse.json()
      setLibraryData(data)
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

  if (error && !libraryData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <header className="bg-white dark:bg-gray-800 shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Error</h1>
              <Link
                href="/libraries"
                className="text-primary hover:text-primary-dark text-sm font-medium"
              >
                ← Back to Libraries
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

  const library = libraryData?.library
  const clues = libraryData?.clues || []
  const isOwner = libraryData?.isOwner

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3">
                {isEditing ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="text-2xl font-bold px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                ) : (
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {library?.name}
                  </h1>
                )}
                {library?.isPublic && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                    Public
                  </span>
                )}
                {!isOwner && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                    Read Only
                  </span>
                )}
              </div>
              {isEditing ? (
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={2}
                  className="mt-2 w-full max-w-2xl px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm text-gray-600 dark:text-gray-400"
                  placeholder="Library description..."
                />
              ) : (
                library?.description && (
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {library.description}
                  </p>
                )
              )}
            </div>
            <div className="flex items-center space-x-2">
              {isEditing ? (
                <>
                  <button
                    onClick={() => {
                      setIsEditing(false)
                      setEditName(library.name)
                      setEditDescription(library.description || '')
                      setEditPublic(library.isPublic)
                      setError('')
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={isSaving || !editName.trim()}
                    className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-md text-sm font-medium disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                </>
              ) : (
                <>
                  {isOwner && (
                    <>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </>
                  )}
                  <Link
                    href="/libraries"
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm font-medium"
                  >
                    ← Libraries
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Edit Options */}
          {isEditing && (
            <div className="mt-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={editPublic}
                  onChange={(e) => setEditPublic(e.target.checked)}
                  className="rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Make this library public
                </span>
              </label>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && libraryData && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Clues Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Clues ({clues.length})
              </h3>
              {isOwner && (
                <button
                  className="text-primary hover:text-primary-dark text-sm font-medium"
                  onClick={() => setShowClueModal(true)}
                >
                  + Add Clue
                </button>
              )}
            </div>
          </div>

          {clues.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <h3 className="mt-4 text-sm font-medium text-gray-900 dark:text-white">No clues yet</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {isOwner
                  ? 'Get started by adding your first clue to this library.'
                  : 'This library is empty.'}
              </p>
              {isOwner && (
                <button
                  onClick={() => setShowClueModal(true)}
                  className="mt-6 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark"
                >
                  Add First Clue
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {clues.map(({ id, clue, addedAt }) => (
                <div key={id} className="px-6 py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          {clue.title}
                        </h4>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getClueTypeClasses(clue.type)}`}>
                          {getClueTypeDisplay(clue.type)}
                        </span>
                      </div>
                      {clue.type === 'route-info' && clue.content && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {Array.isArray(clue.content) && clue.content.length > 0 && (
                            <p className="line-clamp-2">{clue.content[0]}</p>
                          )}
                        </div>
                      )}
                      {clue.type === 'detour' && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          <p>Option A: {clue.detourOptionA?.title}</p>
                          <p>Option B: {clue.detourOptionB?.title}</p>
                        </div>
                      )}
                      {clue.type === 'road-block' && clue.roadblockQuestion && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {clue.roadblockQuestion}
                        </p>
                      )}
                      {clue.requiredPhotos > 0 && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          📷 Requires {clue.requiredPhotos} {clue.requiredPhotos === 1 ? 'photo' : 'photos'}
                        </p>
                      )}
                    </div>
                    {isOwner && (
                      <button
                        onClick={() => handleRemoveClue(clue.id)}
                        className="ml-4 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                        title="Remove from library"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Delete Library?
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete "{library?.name}"? This action cannot be undone.
              The clues themselves will not be deleted, only removed from this library.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete Library'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clue Creation Modal */}
      <ClueCreationModal
        isOpen={showClueModal}
        onClose={() => setShowClueModal(false)}
        onClueCreated={handleClueCreated}
        libraryId={params.id}
      />
    </div>
  )
}
