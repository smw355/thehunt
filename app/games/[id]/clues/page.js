'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { getClueTypeDisplay, getClueTypeClasses } from '@/lib/clueTypeHelpers'

export default function ClueSequenceEditor() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [gameData, setGameData] = useState(null)
  const [clueSequence, setClueSequence] = useState([])
  const [libraries, setLibraries] = useState([])
  const [selectedLibrary, setSelectedLibrary] = useState(null)
  const [availableClues, setAvailableClues] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    fetchData()
  }, [session, params.id])

  async function fetchData() {
    if (!session || !params.id) return

    setIsLoading(true)
    try {
      // Fetch game data
      const gameResponse = await fetch(`/api/games/${params.id}`)
      if (!gameResponse.ok) throw new Error('Failed to load game')
      const game = await gameResponse.json()

      // Check if user is game master
      if (game.userRole !== 'game_master') {
        router.push(`/games/${params.id}`)
        return
      }

      setGameData(game)
      const sequence = game.game?.clueSequence || []
      // Flatten the clue structure - handle both nested and flat structures
      const flattenedSequence = sequence.map(item => {
        // If the item has a nested 'clue' property, flatten it
        if (item.clue) {
          return {
            ...item.clue,
            sequenceId: item.id,
            addedAt: item.addedAt
          }
        }
        // Otherwise, the item is already flat (direct clue data)
        return item
      })
      console.log('Loaded clue sequence:', sequence)
      console.log('Flattened sequence:', flattenedSequence)
      setClueSequence(flattenedSequence)

      // Fetch user's libraries
      const librariesResponse = await fetch('/api/libraries')
      if (librariesResponse.ok) {
        const librariesData = await librariesResponse.json()
        setLibraries(librariesData.libraries || [])
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  async function fetchLibraryClues(libraryId) {
    try {
      const response = await fetch(`/api/libraries/${libraryId}`)
      if (!response.ok) throw new Error('Failed to load library')
      const data = await response.json()
      // Check if clues have nested structure and flatten if needed, preserving order
      const clues = (data.clues || []).map(item => {
        // If the clue has a nested 'clue' property, flatten it
        if (item.clue) {
          return { ...item.clue, libraryClueId: item.id, order: item.order }
        }
        return item
      })
      console.log('Library clues:', clues)
      setAvailableClues(clues)
      setSelectedLibrary(libraryId)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleAddClue = (clue) => {
    const newSequence = [...clueSequence, clue]
    setClueSequence(newSequence)
  }

  const handleAddAllClues = () => {
    if (availableClues.length === 0) return
    // Sort clues by their order property if available
    const sortedClues = [...availableClues].sort((a, b) => {
      const orderA = a.order ?? 0
      const orderB = b.order ?? 0
      return orderA - orderB
    })
    const newSequence = [...clueSequence, ...sortedClues]
    setClueSequence(newSequence)
  }

  const handleRemoveClue = (index) => {
    const newSequence = clueSequence.filter((_, i) => i !== index)
    setClueSequence(newSequence)
  }

  const handleMoveUp = (index) => {
    if (index === 0) return
    const newSequence = [...clueSequence]
    const temp = newSequence[index]
    newSequence[index] = newSequence[index - 1]
    newSequence[index - 1] = temp
    setClueSequence(newSequence)
  }

  const handleMoveDown = (index) => {
    if (index === clueSequence.length - 1) return
    const newSequence = [...clueSequence]
    const temp = newSequence[index]
    newSequence[index] = newSequence[index + 1]
    newSequence[index + 1] = temp
    setClueSequence(newSequence)
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError('')

    try {
      const response = await fetch(`/api/games/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clueSequence
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save clue sequence')
      }

      // Success feedback
      alert('Clue sequence saved successfully!')
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!session || !gameData) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg border-b border-purple-100 dark:border-purple-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                🎯 Clue Sequence Editor
              </h1>
              <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                {gameData.game?.name} • {clueSequence.length} clues
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-md text-sm font-medium disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : '💾 Save Sequence'}
              </button>
              <Link
                href={`/games/${params.id}`}
                className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
              >
                ← Back to Game
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current Sequence */}
          <div className="lg:col-span-2">
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl shadow-lg border border-purple-100 dark:border-purple-900/50">
              <div className="px-6 py-4 border-b border-purple-100 dark:border-purple-900/50">
                <h2 className="text-lg font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Current Sequence ({clueSequence.length})
                </h2>
              </div>

              <div className="p-6">
                {clueSequence.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-700 dark:text-gray-300 mb-2">
                      No clues in sequence yet
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Select a library and add clues to get started
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {clueSequence.map((clue, index) => (
                      <div
                        key={index}
                        className="flex items-start space-x-3 p-4 bg-purple-50/80 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors border border-purple-200 dark:border-purple-800"
                      >
                        <div className="flex flex-col space-y-1">
                          <button
                            onClick={() => handleMoveUp(index)}
                            disabled={index === 0}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-30"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleMoveDown(index)}
                            disabled={index === clueSequence.length - 1}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-30"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                                {index + 1}.
                              </span>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {clue.title}
                              </span>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getClueTypeClasses(clue.type)}`}>
                                {getClueTypeDisplay(clue.type)}
                              </span>
                            </div>
                            <button
                              onClick={() => handleRemoveClue(index)}
                              className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                          {clue.requiredPhotos > 0 && (
                            <p className="text-xs text-gray-700 dark:text-gray-300">
                              📷 Requires {clue.requiredPhotos} photo{clue.requiredPhotos !== 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Add Clues from Library */}
          <div>
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl shadow-lg border border-purple-100 dark:border-purple-900/50">
              <div className="px-6 py-4 border-b border-purple-100 dark:border-purple-900/50">
                <h2 className="text-lg font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  ➕ Add Clues
                </h2>
              </div>

              <div className="p-6">
                {/* Library Selector */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Library
                  </label>
                  <select
                    value={selectedLibrary || ''}
                    onChange={(e) => fetchLibraryClues(e.target.value)}
                    className="w-full px-3 py-2 border border-purple-300 dark:border-purple-600 rounded-md dark:bg-gray-700 dark:text-white focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="">Choose a library...</option>
                    {libraries.map(lib => (
                      <option key={lib.id} value={lib.id}>
                        {lib.name} ({lib.clueCount} clues)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Available Clues */}
                {selectedLibrary && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Available Clues ({availableClues.length})
                      </p>
                      {availableClues.length > 0 && (
                        <button
                          onClick={handleAddAllClues}
                          className="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded text-xs font-medium"
                        >
                          ➕ Add All
                        </button>
                      )}
                    </div>
                    {availableClues.length === 0 ? (
                      <p className="text-sm text-gray-700 dark:text-gray-300 text-center py-4">
                        No clues in this library
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {availableClues.map(clue => (
                          <div
                            key={clue.id}
                            className="p-3 bg-white/90 dark:bg-gray-700/50 border border-purple-200 dark:border-purple-900/50 rounded-md hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                                  {clue.title}
                                </p>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${getClueTypeClasses(clue.type)}`}>
                                  {getClueTypeDisplay(clue.type)}
                                </span>
                              </div>
                              <button
                                onClick={() => handleAddClue(clue)}
                                className="ml-2 px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded text-xs font-medium"
                              >
                                Add
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {!selectedLibrary && (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Select a library to view available clues
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-4 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl shadow-lg border border-purple-100 dark:border-purple-900/50 p-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                ⚡ Quick Actions
              </h3>
              <div className="space-y-2">
                <Link
                  href="/libraries"
                  className="block w-full px-4 py-2 text-center border border-purple-300 dark:border-purple-600 rounded-md text-sm font-medium text-purple-700 dark:text-purple-200 hover:bg-purple-50 dark:hover:bg-purple-900/30"
                >
                  📚 Manage Libraries
                </Link>
                <button
                  onClick={() => setClueSequence([])}
                  disabled={clueSequence.length === 0}
                  className="block w-full px-4 py-2 text-center border border-red-300 dark:border-red-600 rounded-md text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                >
                  🗑️ Clear All Clues
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
