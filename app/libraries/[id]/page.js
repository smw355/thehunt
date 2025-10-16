'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import ClueCreationModal from '@/components/ClueCreationModal'
import { getClueTypeDisplay, getClueTypeClasses, dbTypeToJson } from '@/lib/clueTypeHelpers'

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
  const [showImportModal, setShowImportModal] = useState(false)
  const [importData, setImportData] = useState(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importResults, setImportResults] = useState(null)
  const [expandedClues, setExpandedClues] = useState(new Set())
  const [editingClue, setEditingClue] = useState(null)

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

  const toggleExpandClue = (clueId) => {
    const newExpanded = new Set(expandedClues)
    if (newExpanded.has(clueId)) {
      newExpanded.delete(clueId)
    } else {
      newExpanded.add(clueId)
    }
    setExpandedClues(newExpanded)
  }

  const handleEditClue = (clue) => {
    setEditingClue(clue)
  }

  const handleMoveClueUp = async (index) => {
    if (index === 0) return

    const newClues = [...clues]
    const temp = newClues[index]
    newClues[index] = newClues[index - 1]
    newClues[index - 1] = temp

    // Update order in database
    await updateClueOrder(newClues)
  }

  const handleMoveClueDown = async (index) => {
    if (index === clues.length - 1) return

    const newClues = [...clues]
    const temp = newClues[index]
    newClues[index] = newClues[index + 1]
    newClues[index + 1] = temp

    // Update order in database
    await updateClueOrder(newClues)
  }

  const updateClueOrder = async (newClues) => {
    try {
      const clueOrders = newClues.map((clueItem, index) => ({
        libraryClueId: clueItem.id,
        order: index
      }))

      const response = await fetch(`/api/libraries/${params.id}/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clueOrders })
      })

      if (!response.ok) {
        throw new Error('Failed to update clue order')
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

  const handleSaveClueEdit = async () => {
    if (!editingClue) return

    try {
      const response = await fetch(`/api/clues/${editingClue.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingClue)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update clue')
      }

      // Refresh library data
      const refreshResponse = await fetch(`/api/libraries/${params.id}`)
      if (refreshResponse.ok) {
        const data = await refreshResponse.json()
        setLibraryData(data)
      }

      setEditingClue(null)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleImportClick = () => {
    // Trigger file input
    document.getElementById('import-file-input').click()
  }

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('File too large. Maximum size is 5MB.')
      return
    }

    try {
      const text = await file.text()
      const data = JSON.parse(text)

      // Validate JSON structure
      if (!data.clues || !Array.isArray(data.clues)) {
        throw new Error('Invalid JSON format: missing "clues" array')
      }

      if (data.clues.length === 0) {
        throw new Error('No clues found in file')
      }

      setImportData(data)
      setShowImportModal(true)
      setError('')
    } catch (err) {
      setError(`Failed to read file: ${err.message}`)
    }

    // Reset file input
    e.target.value = ''
  }

  const handleConfirmImport = async () => {
    if (!importData) return

    setIsImporting(true)
    setError('')

    try {
      const response = await fetch(`/api/libraries/${params.id}/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clues: importData.clues })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to import clues')
      }

      const results = await response.json()
      setImportResults(results)

      // If all imported successfully, refresh and close
      if (results.failed === 0) {
        const refreshResponse = await fetch(`/api/libraries/${params.id}`)
        if (refreshResponse.ok) {
          const data = await refreshResponse.json()
          setLibraryData(data)
        }

        // Close modal after short delay to show success
        setTimeout(() => {
          setShowImportModal(false)
          setImportData(null)
          setImportResults(null)
        }, 2000)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setIsImporting(false)
    }
  }

  const handleExportJSON = () => {
    const exportData = {
      version: "2.0",
      exportDate: new Date().toISOString(),
      library: {
        name: library.name,
        description: library.description || '',
        isPublic: library.isPublic
      },
      clues: clues.map(({ clue }) => {
        const baseClue = {
          type: dbTypeToJson(clue.type),
          title: clue.title,
          requiredPhotos: clue.requiredPhotos || 0
        }

        // Add type-specific fields with user-friendly names
        if (clue.type === 'route-info') {
          baseClue.content = clue.content || []
        } else if (clue.type === 'detour') {
          baseClue.optionA = clue.detourOptionA || { title: '', description: '' }
          baseClue.optionB = clue.detourOptionB || { title: '', description: '' }
        } else if (clue.type === 'road-block') {
          baseClue.question = clue.roadblockQuestion || ''
          baseClue.task = clue.roadblockTask || ''
        }

        return baseClue
      })
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const filename = `${library.name.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
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

  if (error && !libraryData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
        <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg border-b border-purple-100 dark:border-purple-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Error</h1>
              <Link
                href="/libraries"
                className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 text-sm font-medium"
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg border-b border-purple-100 dark:border-purple-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3">
                {isEditing ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="text-2xl font-bold px-2 py-1 border border-purple-300 dark:border-purple-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500"
                  />
                ) : (
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    📚 {library?.name}
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
                  className="mt-2 w-full max-w-2xl px-2 py-1 border border-purple-300 dark:border-purple-600 rounded-md bg-white dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-300 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Library description..."
                />
              ) : (
                library?.description && (
                  <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
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
                    className="px-4 py-2 border border-purple-300 dark:border-purple-600 rounded-md text-sm font-medium text-purple-700 dark:text-purple-200 hover:bg-purple-50 dark:hover:bg-purple-900/30"
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={isSaving || !editName.trim()}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-md text-sm font-medium disabled:opacity-50"
                  >
                    {isSaving ? 'Saving... ✨' : 'Save ✨'}
                  </button>
                </>
              ) : (
                <>
                  {isOwner && (
                    <>
                      <input
                        type="file"
                        id="import-file-input"
                        accept=".json"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <button
                        onClick={handleImportClick}
                        className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        title="Import from JSON"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                      </button>
                      <button
                        onClick={handleExportJSON}
                        className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        title="Export as JSON"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
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
                    className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 text-sm font-medium"
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
                  className="rounded border-purple-300 dark:border-purple-600 text-purple-600 focus:ring-purple-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Make this library public 🌍
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
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl shadow-lg border border-purple-100 dark:border-purple-900/50">
          <div className="px-6 py-4 border-b border-purple-100 dark:border-purple-900/50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                🎯 Clues ({clues.length})
              </h3>
              {isOwner && (
                <button
                  className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 text-sm font-medium"
                  onClick={() => setShowClueModal(true)}
                >
                  + Add Clue ✨
                </button>
              )}
            </div>
          </div>

          {clues.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <svg className="mx-auto h-12 w-12 text-purple-400 dark:text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <h3 className="mt-4 text-sm font-medium bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">No clues yet 🔍</h3>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                {isOwner
                  ? 'Get started by adding your first clue to this library.'
                  : 'This library is empty.'}
              </p>
              {isOwner && (
                <button
                  onClick={() => setShowClueModal(true)}
                  className="mt-6 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                >
                  Add First Clue ✨
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-purple-100 dark:divide-purple-900/30">
              {clues.map(({ id, clue, addedAt, order }, index) => (
                <div key={id} className="px-6 py-4 hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-colors">
                  <div className="flex items-start justify-between">
                    {isOwner && (
                      <div className="flex flex-col mr-3">
                        <button
                          onClick={() => handleMoveClueUp(index)}
                          disabled={index === 0}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-20 disabled:cursor-not-allowed"
                          title="Move up"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <span className="text-xs text-gray-500 dark:text-gray-400 text-center my-0.5">{index + 1}</span>
                        <button
                          onClick={() => handleMoveClueDown(index)}
                          disabled={index === clues.length - 1}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-20 disabled:cursor-not-allowed"
                          title="Move down"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                    )}
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
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                          {Array.isArray(clue.content) && clue.content.length > 0 && (
                            <div>
                              {expandedClues.has(clue.id) ? (
                                <div className="space-y-2">
                                  {clue.content.map((paragraph, idx) => (
                                    <p key={idx}>{paragraph}</p>
                                  ))}
                                </div>
                              ) : (
                                <p className="line-clamp-2">{clue.content[0]}</p>
                              )}
                              {clue.content.length > 1 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    toggleExpandClue(clue.id)
                                  }}
                                  className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 mt-1"
                                >
                                  {expandedClues.has(clue.id) ? '▲ Show less' : `▼ Show all ${clue.content.length} paragraphs`}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      {clue.type === 'detour' && (
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                          <p>Option A: {clue.detourOptionA?.title}</p>
                          <p>Option B: {clue.detourOptionB?.title}</p>
                        </div>
                      )}
                      {clue.type === 'road-block' && clue.roadblockQuestion && (
                        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                          {clue.roadblockQuestion}
                        </p>
                      )}
                      {clue.requiredPhotos > 0 && (
                        <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                          📷 Requires {clue.requiredPhotos} {clue.requiredPhotos === 1 ? 'photo' : 'photos'}
                        </p>
                      )}
                    </div>
                    {isOwner && (
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => handleEditClue(clue)}
                          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                          title="Edit clue"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleRemoveClue(clue.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                          title="Remove from library"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-xl shadow-2xl border border-purple-200 dark:border-purple-900/50 max-w-md w-full p-6">
            <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
              Delete Library?
            </h2>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-6">
              Are you sure you want to delete "{library?.name}"? This action cannot be undone.
              The clues themselves will not be deleted, only removed from this library.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-purple-300 dark:border-purple-600 rounded-md text-sm font-medium text-purple-700 dark:text-purple-200 hover:bg-purple-50 dark:hover:bg-purple-900/30"
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

      {/* Import Preview Modal */}
      {showImportModal && importData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-xl shadow-2xl border border-purple-200 dark:border-purple-900/50 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-purple-100 dark:border-purple-900/50 sticky top-0 bg-white/90 dark:bg-gray-800/90">
              <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                📦 Import Clues from JSON
              </h2>
            </div>

            <div className="px-6 py-4">
              {!importResults ? (
                <>
                  <div className="mb-4">
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                      Found <strong>{importData.clues.length}</strong> clue{importData.clues.length !== 1 ? 's' : ''} in file:
                    </p>

                    {/* Clue type counts */}
                    <div className="flex gap-3 mb-4">
                      {(() => {
                        const counts = {
                          waypoint: 0,
                          fork: 0,
                          solo: 0
                        }
                        importData.clues.forEach(clue => {
                          if (counts[clue.type] !== undefined) {
                            counts[clue.type]++
                          }
                        })
                        return (
                          <>
                            {counts.waypoint > 0 && (
                              <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                                📍 {counts.waypoint} Waypoint{counts.waypoint !== 1 ? 's' : ''}
                              </span>
                            )}
                            {counts.fork > 0 && (
                              <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
                                🔀 {counts.fork} Fork{counts.fork !== 1 ? 's' : ''}
                              </span>
                            )}
                            {counts.solo > 0 && (
                              <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
                                🎯 {counts.solo} Solo{counts.solo !== 1 ? ' challenges' : ' challenge'}
                              </span>
                            )}
                          </>
                        )
                      })()}
                    </div>

                    {/* List of clues */}
                    <div className="bg-purple-50/50 dark:bg-purple-900/10 rounded-lg p-4 border border-purple-200 dark:border-purple-800 max-h-60 overflow-y-auto">
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Clues to import:</p>
                      <ul className="space-y-1">
                        {importData.clues.map((clue, index) => (
                          <li key={index} className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <span className="text-purple-600 dark:text-purple-400">{index + 1}.</span>
                            <span className="flex-1">{clue.title}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {clue.type === 'waypoint' ? '📍' : clue.type === 'fork' ? '🔀' : '🎯'}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                    These clues will be <strong>added</strong> to "{library?.name}"
                  </p>
                </>
              ) : (
                <>
                  {/* Import results */}
                  {importResults.failed === 0 ? (
                    <div className="text-center py-6">
                      <div className="text-5xl mb-3">✅</div>
                      <h3 className="text-lg font-semibold text-green-600 dark:text-green-400 mb-2">
                        Success!
                      </h3>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Imported {importResults.imported} clue{importResults.imported !== 1 ? 's' : ''} successfully
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                        <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-2">
                          Partial Import: {importResults.imported} succeeded, {importResults.failed} failed
                        </p>
                      </div>

                      {importResults.errors.length > 0 && (
                        <div className="max-h-60 overflow-y-auto">
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Errors:</p>
                          <ul className="space-y-2">
                            {importResults.errors.map((err, index) => (
                              <li key={index} className="text-xs bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-2">
                                <span className="font-medium text-red-800 dark:text-red-300">
                                  Clue {err.clueIndex}: {err.title}
                                </span>
                                <p className="text-red-600 dark:text-red-400 mt-1">{err.error}</p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="px-6 py-4 border-t border-purple-100 dark:border-purple-900/50 flex gap-3">
              {!importResults || importResults.failed > 0 ? (
                <>
                  <button
                    onClick={() => {
                      setShowImportModal(false)
                      setImportData(null)
                      setImportResults(null)
                    }}
                    className="flex-1 px-4 py-2 border border-purple-300 dark:border-purple-600 rounded-md text-sm font-medium text-purple-700 dark:text-purple-200 hover:bg-purple-50 dark:hover:bg-purple-900/30"
                    disabled={isImporting}
                  >
                    {importResults ? 'Close' : 'Cancel'}
                  </button>
                  {!importResults && (
                    <button
                      onClick={handleConfirmImport}
                      disabled={isImporting}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-md text-sm font-medium disabled:opacity-50"
                    >
                      {isImporting ? 'Importing... ⏳' : `Import ${importData.clues.length} Clue${importData.clues.length !== 1 ? 's' : ''}`}
                    </button>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Edit Clue Modal */}
      {editingClue && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-xl shadow-2xl border border-purple-200 dark:border-purple-900/50 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-purple-100 dark:border-purple-900/50 sticky top-0 bg-white/90 dark:bg-gray-800/90">
              <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                ✏️ Edit Clue
              </h2>
            </div>

            <div className="px-6 py-4 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={editingClue.title}
                  onChange={(e) => setEditingClue({ ...editingClue, title: e.target.value })}
                  className="w-full px-3 py-2 border border-purple-300 dark:border-purple-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              {/* Type Display */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type
                </label>
                <span className={`px-3 py-1 rounded text-sm font-medium ${getClueTypeClasses(editingClue.type)}`}>
                  {getClueTypeDisplay(editingClue.type)}
                </span>
              </div>

              {/* Required Photos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Required Photos
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={editingClue.requiredPhotos || 0}
                  onChange={(e) => setEditingClue({ ...editingClue, requiredPhotos: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-purple-300 dark:border-purple-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              {/* Type-specific fields */}
              {editingClue.type === 'route-info' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Content (one paragraph per line)
                  </label>
                  <textarea
                    rows={6}
                    value={Array.isArray(editingClue.content) ? editingClue.content.join('\n') : ''}
                    onChange={(e) => setEditingClue({
                      ...editingClue,
                      content: e.target.value.split('\n').filter(line => line.trim())
                    })}
                    className="w-full px-3 py-2 border border-purple-300 dark:border-purple-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Enter each paragraph on a new line"
                  />
                </div>
              )}

              {editingClue.type === 'detour' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Option A - Title
                    </label>
                    <input
                      type="text"
                      value={editingClue.detourOptionA?.title || ''}
                      onChange={(e) => setEditingClue({
                        ...editingClue,
                        detourOptionA: {
                          ...editingClue.detourOptionA,
                          title: e.target.value
                        }
                      })}
                      className="w-full px-3 py-2 border border-purple-300 dark:border-purple-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Option A - Description
                    </label>
                    <textarea
                      rows={3}
                      value={editingClue.detourOptionA?.description || ''}
                      onChange={(e) => setEditingClue({
                        ...editingClue,
                        detourOptionA: {
                          ...editingClue.detourOptionA,
                          description: e.target.value
                        }
                      })}
                      className="w-full px-3 py-2 border border-purple-300 dark:border-purple-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Option B - Title
                    </label>
                    <input
                      type="text"
                      value={editingClue.detourOptionB?.title || ''}
                      onChange={(e) => setEditingClue({
                        ...editingClue,
                        detourOptionB: {
                          ...editingClue.detourOptionB,
                          title: e.target.value
                        }
                      })}
                      className="w-full px-3 py-2 border border-purple-300 dark:border-purple-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Option B - Description
                    </label>
                    <textarea
                      rows={3}
                      value={editingClue.detourOptionB?.description || ''}
                      onChange={(e) => setEditingClue({
                        ...editingClue,
                        detourOptionB: {
                          ...editingClue.detourOptionB,
                          description: e.target.value
                        }
                      })}
                      className="w-full px-3 py-2 border border-purple-300 dark:border-purple-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </>
              )}

              {editingClue.type === 'road-block' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Question
                    </label>
                    <textarea
                      rows={3}
                      value={editingClue.roadblockQuestion || ''}
                      onChange={(e) => setEditingClue({ ...editingClue, roadblockQuestion: e.target.value })}
                      className="w-full px-3 py-2 border border-purple-300 dark:border-purple-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Task (optional)
                    </label>
                    <textarea
                      rows={3}
                      value={editingClue.roadblockTask || ''}
                      onChange={(e) => setEditingClue({ ...editingClue, roadblockTask: e.target.value })}
                      className="w-full px-3 py-2 border border-purple-300 dark:border-purple-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="px-6 py-4 border-t border-purple-100 dark:border-purple-900/50 flex gap-3">
              <button
                onClick={() => setEditingClue(null)}
                className="flex-1 px-4 py-2 border border-purple-300 dark:border-purple-600 rounded-md text-sm font-medium text-purple-700 dark:text-purple-200 hover:bg-purple-50 dark:hover:bg-purple-900/30"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveClueEdit}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-md text-sm font-medium"
              >
                Save Changes ✨
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
