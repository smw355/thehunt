'use client'

import { useState, useEffect } from 'react'
import PhotoUpload from './PhotoUpload'
import { getClueTypeDisplay, getClueTypeClasses } from '@/lib/clueTypeHelpers'
import VictoryPage from './VictoryPage'

export default function PlayerGameView({ gameData, teamData, onRefresh }) {
  const [currentClue, setCurrentClue] = useState(null)
  const [submission, setSubmission] = useState({
    textProof: '',
    notes: '',
    photoUrls: [],
    detourChoice: null,
    roadblockPlayer: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [detourSelected, setDetourSelected] = useState(false)
  const [roadblockAssigned, setRoadblockAssigned] = useState(false)
  const [pendingSubmission, setPendingSubmission] = useState(null)
  const [isEditing, setIsEditing] = useState(false)

  const game = gameData.game
  const team = teamData
  const clueSequence = game.clueSequence || []
  const currentClueIndex = team.currentClueIndex || 0

  useEffect(() => {
    if (clueSequence[currentClueIndex]) {
      setCurrentClue(clueSequence[currentClueIndex])
    }
  }, [currentClueIndex, clueSequence])

  // Check if there's a pending submission
  useEffect(() => {
    checkPendingSubmission()
    // Poll every 10 seconds to check for updates
    const interval = setInterval(checkPendingSubmission, 10000)
    return () => clearInterval(interval)
  }, [currentClueIndex])

  async function checkPendingSubmission() {
    try {
      const response = await fetch(`/api/submissions?gameId=${game.id}`)
      if (response.ok) {
        const submissions = await response.json()
        const pending = submissions.find(
          s => s.submission.teamId === team.id &&
               s.submission.clueIndex === currentClueIndex &&
               s.submission.status === 'pending'
        )

        if (pending) {
          setPendingSubmission(pending.submission)
          // Populate form with pending submission data for editing
          if (!isEditing) {
            setSubmission({
              textProof: pending.submission.textProof || '',
              notes: pending.submission.notes || '',
              photoUrls: pending.submission.photoUrls || [],
              detourChoice: pending.submission.detourChoice,
              roadblockPlayer: pending.submission.roadblockPlayer || ''
            })
            if (pending.submission.detourChoice) setDetourSelected(true)
            if (pending.submission.roadblockPlayer) setRoadblockAssigned(true)
          }
        } else {
          setPendingSubmission(null)
        }
      }
    } catch (err) {
      console.error('Error checking submissions:', err)
    }
  }

  const handleCancelSubmission = async () => {
    if (!confirm('Are you sure you want to cancel this submission? You will need to resubmit.')) {
      return
    }

    try {
      const response = await fetch(`/api/submissions/${pendingSubmission.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setPendingSubmission(null)
        setSubmission({
          textProof: '',
          notes: '',
          photoUrls: [],
          detourChoice: null,
          roadblockPlayer: ''
        })
        setDetourSelected(false)
        setRoadblockAssigned(false)
        setIsEditing(false)
        onRefresh()
      } else {
        throw new Error('Failed to cancel submission')
      }
    } catch (err) {
      setError(err.message)
    }
  }

  const handleUpdateSubmission = async (e) => {
    e.preventDefault()
    setError('')

    // Same validations as initial submit
    if (currentClue.type === 'detour' && !submission.detourChoice) {
      setError('Please select a path (A or B)')
      return
    }

    if (currentClue.type === 'road-block' && !submission.roadblockPlayer.trim()) {
      setError('Please enter the player name for this solo challenge')
      return
    }

    if (currentClue.requiredPhotos > 0 && submission.photoUrls.length !== currentClue.requiredPhotos) {
      setError(`This clue requires exactly ${currentClue.requiredPhotos} photo${currentClue.requiredPhotos > 1 ? 's' : ''}`)
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/submissions/${pendingSubmission.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textProof: submission.textProof.trim(),
          notes: submission.notes.trim(),
          photoUrls: submission.photoUrls,
          detourChoice: submission.detourChoice,
          roadblockPlayer: submission.roadblockPlayer.trim()
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update submission')
      }

      setIsEditing(false)
      await checkPendingSubmission()
      onRefresh()
      alert('Submission updated successfully!')
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePhotosChange = (photos) => {
    setSubmission(prev => ({
      ...prev,
      photoUrls: photos.map(p => p.url)
    }))
  }

  const handleDetourChoice = (choice) => {
    setSubmission(prev => ({
      ...prev,
      detourChoice: choice
    }))
    setDetourSelected(true)
  }

  const handleRoadblockAssignment = (playerName) => {
    setSubmission(prev => ({
      ...prev,
      roadblockPlayer: playerName
    }))
    setRoadblockAssigned(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validate based on clue type
    if (currentClue.type === 'detour' && !submission.detourChoice) {
      setError('Please select a path (A or B)')
      return
    }

    if (currentClue.type === 'road-block' && !submission.roadblockPlayer.trim()) {
      setError('Please enter the player name for this solo challenge')
      return
    }

    if (currentClue.requiredPhotos > 0 && submission.photoUrls.length !== currentClue.requiredPhotos) {
      setError(`This clue requires exactly ${currentClue.requiredPhotos} photo${currentClue.requiredPhotos > 1 ? 's' : ''}`)
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: game.id,
          teamId: team.id,
          clueIndex: currentClueIndex,
          clueTitle: currentClue.title,
          textProof: submission.textProof.trim(),
          notes: submission.notes.trim(),
          photoUrls: submission.photoUrls,
          detourChoice: submission.detourChoice,
          roadblockPlayer: submission.roadblockPlayer.trim()
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit')
      }

      // Reset form
      setSubmission({
        textProof: '',
        notes: '',
        photoUrls: [],
        detourChoice: null,
        roadblockPlayer: ''
      })
      setDetourSelected(false)
      setRoadblockAssigned(false)

      // Refresh game data
      onRefresh()

      alert('Submission sent! Waiting for game master approval.')
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Game completed
  if (currentClueIndex >= clueSequence.length) {
    // Calculate team's place
    const allTeams = gameData.teams || []
    const completedTeams = allTeams
      .filter(t => (t.currentClueIndex || 0) >= clueSequence.length)
      .sort((a, b) => {
        // Earliest completion (lowest clueIndex update time) wins
        // For now, we'll use the order they appear in the array
        // In a real implementation, you'd want to track completion timestamps
        return allTeams.indexOf(a) - allTeams.indexOf(b)
      })

    const teamPlace = completedTeams.findIndex(t => t.id === team.id) + 1
    const totalCompletedTeams = completedTeams.length

    return (
      <VictoryPage
        teamName={team.name}
        place={teamPlace}
        totalTeams={totalCompletedTeams}
        victorySettings={game.victoryPageSettings}
      />
    )
  }

  // No clues in game yet
  if (!currentClue) {
    return (
      <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl shadow-lg border border-purple-100 dark:border-purple-900/50 p-8 text-center">
        <p className="text-gray-700 dark:text-gray-300">
          ⏳ Waiting for game master to add clues...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl shadow-lg border border-purple-100 dark:border-purple-900/50 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            📍 Clue {currentClueIndex + 1} of {clueSequence.length}
          </span>
          <span className={`px-2 py-1 rounded text-xs font-medium ${getClueTypeClasses(currentClue.type)}`}>
            {getClueTypeDisplay(currentClue.type)}
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
            style={{ width: `${((currentClueIndex) / clueSequence.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Current Clue */}
      <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl shadow-lg border border-purple-100 dark:border-purple-900/50">
        <div className="px-6 py-4 border-b border-purple-100 dark:border-purple-900/50">
          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            {currentClue.title}
          </h2>
        </div>

        <div className="p-6">
          {/* Waypoint Type */}
          {currentClue.type === 'route-info' && (
            <div className="mb-6">
              <div className="prose dark:prose-invert max-w-none">
                {currentClue.content && currentClue.content.map((line, index) => (
                  <p key={index} className="text-gray-900 dark:text-white mb-2">
                    {line}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Fork Type */}
          {currentClue.type === 'detour' && (
            <div className="mb-6">
              {!detourSelected ? (
                <div className="space-y-4">
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    Choose one path to complete:
                  </p>

                  <button
                    onClick={() => handleDetourChoice('a')}
                    className="w-full p-4 border-2 border-yellow-300 dark:border-yellow-600 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/20 text-left transition-colors"
                  >
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
                      🅰️ Path A: {currentClue.detourOptionA?.title}
                    </h3>
                    {currentClue.detourOptionA?.description && (
                      <p className="text-gray-700 dark:text-gray-300">
                        {currentClue.detourOptionA.description}
                      </p>
                    )}
                  </button>

                  <button
                    onClick={() => handleDetourChoice('b')}
                    className="w-full p-4 border-2 border-yellow-300 dark:border-yellow-600 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/20 text-left transition-colors"
                  >
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
                      🅱️ Path B: {currentClue.detourOptionB?.title}
                    </h3>
                    {currentClue.detourOptionB?.description && (
                      <p className="text-gray-700 dark:text-gray-300">
                        {currentClue.detourOptionB.description}
                      </p>
                    )}
                  </button>
                </div>
              ) : (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
                    Path {submission.detourChoice.toUpperCase()}: {
                      submission.detourChoice === 'a'
                        ? currentClue.detourOptionA?.title
                        : currentClue.detourOptionB?.title
                    }
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    {submission.detourChoice === 'a'
                      ? currentClue.detourOptionA?.description
                      : currentClue.detourOptionB?.description}
                  </p>
                  <button
                    onClick={() => {
                      setDetourSelected(false)
                      setSubmission(prev => ({ ...prev, detourChoice: null }))
                    }}
                    className="mt-3 text-sm text-yellow-700 dark:text-yellow-400 hover:underline"
                  >
                    Change path selection
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Solo Challenge Type */}
          {currentClue.type === 'road-block' && (
            <div className="mb-6">
              {!roadblockAssigned ? (
                <div className="space-y-4">
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2">
                      Team Selection Required
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 mb-3">
                      {currentClue.roadblockQuestion}
                    </p>
                    <input
                      type="text"
                      value={submission.roadblockPlayer}
                      onChange={(e) => setSubmission(prev => ({ ...prev, roadblockPlayer: e.target.value }))}
                      className="w-full px-3 py-2 border border-purple-300 dark:border-purple-600 rounded-md dark:bg-gray-700 dark:text-white mb-3 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Enter player name"
                    />
                    <button
                      onClick={() => {
                        if (submission.roadblockPlayer.trim()) {
                          setRoadblockAssigned(true)
                        }
                      }}
                      disabled={!submission.roadblockPlayer.trim()}
                      className="w-full px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-md font-medium disabled:opacity-50"
                    >
                      🎯 Assign to {submission.roadblockPlayer || 'Player'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-900 dark:text-red-300 mb-2">
                      <strong>{submission.roadblockPlayer}</strong> must complete this challenge:
                    </p>
                    {currentClue.roadblockTask && (
                      <p className="text-gray-700 dark:text-gray-300">
                        {currentClue.roadblockTask}
                      </p>
                    )}
                    <button
                      onClick={() => {
                        setRoadblockAssigned(false)
                      }}
                      className="mt-3 text-sm text-red-700 dark:text-red-400 hover:underline"
                      >
                      Change player assignment
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Pending Submission View */}
          {pendingSubmission && !isEditing && (currentClue.type === 'route-info' || detourSelected || roadblockAssigned) && (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-600 rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <div className="animate-pulse flex items-center">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        ⏳ Awaiting Review
                      </h3>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                  Your submission has been sent to the game master for approval. You'll automatically advance to the next clue once it's approved.
                </p>

                <div className="space-y-3 bg-white dark:bg-gray-800 p-4 rounded-md">
                  {pendingSubmission.detourChoice && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Selected Path
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {pendingSubmission.detourChoice === 'a' ? '🅰️ Path A' : '🅱️ Path B'}: {
                          pendingSubmission.detourChoice === 'a'
                            ? currentClue.detourOptionA?.title
                            : currentClue.detourOptionB?.title
                        }
                      </p>
                    </div>
                  )}

                  {pendingSubmission.roadblockPlayer && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Assigned Player
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {pendingSubmission.roadblockPlayer}
                      </p>
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Your Answer
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                      {pendingSubmission.textProof}
                    </p>
                  </div>

                  {pendingSubmission.notes && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Additional Notes
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                        {pendingSubmission.notes}
                      </p>
                    </div>
                  )}

                  {pendingSubmission.photoUrls && pendingSubmission.photoUrls.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Photos ({pendingSubmission.photoUrls.length})
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {pendingSubmission.photoUrls.map((url, idx) => (
                          <img
                            key={idx}
                            src={url}
                            alt={`Submission photo ${idx + 1}`}
                            className="rounded-md w-full h-32 object-cover border border-gray-200 dark:border-gray-700"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
                  >
                    ✏️ Edit Submission
                  </button>
                  <button
                    onClick={handleCancelSubmission}
                    className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm font-medium transition-colors"
                  >
                    🗑️ Cancel Submission
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Submission Form (shown after choices made OR when editing) */}
          {(!pendingSubmission || isEditing) && (currentClue.type === 'route-info' || detourSelected || roadblockAssigned) && (
            <form onSubmit={pendingSubmission && isEditing ? handleUpdateSubmission : handleSubmit}>
              {isEditing && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                  <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                    ✏️ Editing your submission
                  </p>
                </div>
              )}

              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <div className="mb-4">
                <label htmlFor="textProof" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  📝 Proof / Answer *
                </label>
                <textarea
                  id="textProof"
                  value={submission.textProof}
                  onChange={(e) => setSubmission(prev => ({ ...prev, textProof: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-purple-300 dark:border-purple-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Describe what you found or provide the answer..."
                  required
                />
              </div>

              <div className="mb-4">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  💭 Additional Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  value={submission.notes}
                  onChange={(e) => setSubmission(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-purple-300 dark:border-purple-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Any additional information..."
                />
              </div>

              <PhotoUpload
                teamId={team.id}
                clueId={currentClue.id}
                onPhotosChange={handlePhotosChange}
                requiredPhotos={currentClue.requiredPhotos || 0}
                clueTitle={currentClue.title}
                disabled={isSubmitting}
              />

              <div className="flex gap-2">
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false)
                      checkPendingSubmission()
                    }}
                    className="flex-1 px-4 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-md text-lg font-medium"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting || !submission.textProof.trim()}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-md text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? '⏳ Submitting...' : isEditing ? '💾 Update Submission' : '✅ Submit for Review'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
