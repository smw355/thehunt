'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { getClueTypeDisplay, getClueTypeClasses } from '@/lib/clueTypeHelpers'

export default function SubmissionReview() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [gameData, setGameData] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [statusFilter, setStatusFilter] = useState('pending')
  const [selectedSubmission, setSelectedSubmission] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    fetchData()
  }, [session, params.id, statusFilter])

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

      // Fetch submissions
      const submissionsResponse = await fetch(`/api/submissions?gameId=${params.id}&status=${statusFilter}`)
      if (submissionsResponse.ok) {
        const submissionsData = await submissionsResponse.json()
        setSubmissions(submissionsData)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async (submissionId) => {
    try {
      const response = await fetch('/api/submissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: submissionId,
          gameId: params.id,
          status: 'approved'
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to approve submission')
      }

      setSelectedSubmission(null)
      fetchData()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleReject = async (submissionId, adminComment) => {
    if (!adminComment || !adminComment.trim()) {
      setError('Please provide a reason for rejection')
      return
    }

    try {
      const response = await fetch('/api/submissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: submissionId,
          gameId: params.id,
          status: 'rejected',
          adminComment
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to reject submission')
      }

      setSelectedSubmission(null)
      fetchData()
    } catch (err) {
      setError(err.message)
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

  const pendingCount = submissions.filter(s => s.submission.status === 'pending').length

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg border-b border-purple-100 dark:border-purple-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                📝 Submission Review
              </h1>
              <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                {gameData.game?.name} • {pendingCount} pending
              </p>
            </div>
            <Link
              href={`/games/${params.id}`}
              className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
            >
              ← Back to Game
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="mb-6 border-b border-purple-200 dark:border-purple-900/50">
          <nav className="-mb-px flex space-x-8">
            {['pending', 'approved', 'rejected', 'all'].map(filter => {
              const count = filter === 'all'
                ? submissions.length
                : submissions.filter(s => s.submission.status === filter).length

              const filterEmoji = {
                pending: '⏳',
                approved: '✅',
                rejected: '❌',
                all: '📋'
              }[filter]

              return (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                    statusFilter === filter
                      ? 'border-purple-600 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-transparent text-gray-700 dark:text-gray-300 hover:text-purple-700 dark:hover:text-purple-300 hover:border-purple-300 dark:hover:border-purple-600'
                  }`}
                >
                  {filterEmoji} {filter} ({count})
                </button>
              )
            })}
          </nav>
        </div>

        {/* Submissions List */}
        <div className="grid grid-cols-1 gap-4">
          {submissions.length === 0 ? (
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl shadow-lg border border-purple-100 dark:border-purple-900/50 p-12 text-center">
              <p className="text-gray-700 dark:text-gray-300">
                No {statusFilter !== 'all' ? statusFilter : ''} submissions found
              </p>
            </div>
          ) : (
            submissions.map(({ submission, teamName }) => (
              <SubmissionCard
                key={submission.id}
                submission={submission}
                teamName={teamName}
                onView={() => setSelectedSubmission({ ...submission, teamName })}
              />
            ))
          )}
        </div>
      </main>

      {/* Submission Detail Modal */}
      {selectedSubmission && (
        <SubmissionDetailModal
          submission={selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
          onApprove={() => handleApprove(selectedSubmission.id)}
          onReject={(comment) => handleReject(selectedSubmission.id, comment)}
        />
      )}
    </div>
  )
}

function SubmissionCard({ submission, teamName, onView }) {
  const statusColors = {
    pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
    approved: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
    rejected: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
  }

  const statusEmoji = {
    pending: '⏳',
    approved: '✅',
    rejected: '❌'
  }

  return (
    <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl shadow-lg border border-purple-100 dark:border-purple-900/50 p-6 hover:shadow-xl hover:border-purple-200 dark:hover:border-purple-800 transition-all">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              👥 {teamName || 'Unknown Team'}
            </h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[submission.status]}`}>
              {statusEmoji[submission.status]} {submission.status}
            </span>
          </div>

          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
            🎯 Clue #{submission.clueIndex + 1} • {submission.clueTitle || 'Untitled'}
          </p>

          {submission.textProof && (
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 line-clamp-2">
              {submission.textProof}
            </p>
          )}

          <div className="flex items-center space-x-4 text-xs text-gray-700 dark:text-gray-300">
            <span>
              📷 {submission.photoUrls?.length || 0} media file{submission.photoUrls?.length !== 1 ? 's' : ''}
            </span>
            <span>•</span>
            <span>
              {new Date(submission.createdAt).toLocaleString()}
            </span>
          </div>

          {submission.adminComment && (
            <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-medium">Admin: </span>
                {submission.adminComment}
              </p>
            </div>
          )}
        </div>

        <button
          onClick={onView}
          className="ml-4 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-md text-sm font-medium"
        >
          👁️ View Details
        </button>
      </div>
    </div>
  )
}

function SubmissionDetailModal({ submission, onClose, onApprove, onReject }) {
  const [rejectComment, setRejectComment] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)

  const handleRejectSubmit = (e) => {
    e.preventDefault()
    onReject(rejectComment)
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-xl max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto border border-purple-100 dark:border-purple-900/50">
        <div className="sticky top-0 px-6 py-4 border-b border-purple-100 dark:border-purple-900/50 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              📝 Submission Details
            </h2>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {submission.teamName} • Clue #{submission.clueIndex + 1}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-4">
          {/* Clue Info */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              🎯 Clue
            </h3>
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              {submission.clueTitle || 'Untitled Clue'}
            </p>
          </div>

          {/* Text Proof */}
          {submission.textProof && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ✅ Proof
              </h3>
              <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                {submission.textProof}
              </p>
            </div>
          )}

          {/* Notes */}
          {submission.notes && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                📝 Notes
              </h3>
              <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                {submission.notes}
              </p>
            </div>
          )}

          {/* Detour Choice */}
          {submission.detourChoice && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                🔀 Fork Choice
              </h3>
              <p className="text-gray-900 dark:text-white">
                Path {submission.detourChoice.toUpperCase()}
              </p>
            </div>
          )}

          {/* Roadblock Player */}
          {submission.roadblockPlayer && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                🎯 Solo Challenge Player
              </h3>
              <p className="text-gray-900 dark:text-white">
                {submission.roadblockPlayer}
              </p>
            </div>
          )}

          {/* Media (Photos/Videos) */}
          {submission.photoUrls && submission.photoUrls.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                📷 Media ({submission.photoUrls.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {submission.photoUrls.map((url, index) => {
                  const isVideo = url.match(/\.(mp4|webm|ogg|mov)$/i) || url.includes('video')

                  return (
                    <a
                      key={index}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block aspect-square bg-purple-100 dark:bg-purple-900/20 rounded-lg overflow-hidden hover:opacity-90 transition-opacity border border-purple-200 dark:border-purple-800"
                    >
                      {isVideo ? (
                        <video
                          src={url}
                          className="w-full h-full object-cover"
                          controls
                          preload="metadata"
                        />
                      ) : (
                        <img
                          src={url}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </a>
                  )
                })}
              </div>
            </div>
          )}

          {/* Submission Info */}
          <div className="mb-6 text-sm text-gray-700 dark:text-gray-300">
            <p>⏰ Submitted: {new Date(submission.createdAt).toLocaleString()}</p>
            {submission.updatedAt && submission.updatedAt !== submission.createdAt && (
              <p>🔄 Updated: {new Date(submission.updatedAt).toLocaleString()}</p>
            )}
          </div>

          {/* Admin Comment (if rejected) */}
          {submission.adminComment && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <h3 className="text-sm font-medium text-red-900 dark:text-red-300 mb-2">
                ❌ Rejection Reason
              </h3>
              <p className="text-sm text-red-700 dark:text-red-400">
                {submission.adminComment}
              </p>
            </div>
          )}

          {/* Reject Form */}
          {showRejectForm && (
            <form onSubmit={handleRejectSubmit} className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <label className="block text-sm font-medium text-red-900 dark:text-red-300 mb-2">
                Reason for Rejection *
              </label>
              <textarea
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-red-300 dark:border-red-600 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
                placeholder="Explain why this submission is being rejected..."
                required
              />
              <div className="mt-3 flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium"
                >
                  ❌ Confirm Rejection
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRejectForm(false)
                    setRejectComment('')
                  }}
                  className="px-4 py-2 border border-purple-300 dark:border-purple-600 rounded-md text-sm font-medium text-purple-700 dark:text-purple-200 hover:bg-purple-50 dark:hover:bg-purple-900/30"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Actions */}
        {submission.status === 'pending' && (
          <div className="sticky bottom-0 px-6 py-4 border-t border-purple-100 dark:border-purple-900/50 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm flex gap-3">
            {!showRejectForm && (
              <>
                <button
                  onClick={() => setShowRejectForm(true)}
                  className="flex-1 px-4 py-2 border border-red-300 dark:border-red-600 rounded-md text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  ❌ Reject
                </button>
                <button
                  onClick={onApprove}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-md text-sm font-medium"
                >
                  ✅ Approve & Advance Team
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
