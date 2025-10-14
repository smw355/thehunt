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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!session || !gameData) {
    return null
  }

  const pendingCount = submissions.filter(s => s.submission.status === 'pending').length

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Submission Review
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {gameData.game?.name} • {pendingCount} pending
              </p>
            </div>
            <Link
              href={`/games/${params.id}`}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
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
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {['pending', 'approved', 'rejected', 'all'].map(filter => {
              const count = filter === 'all'
                ? submissions.length
                : submissions.filter(s => s.submission.status === filter).length

              return (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                    statusFilter === filter
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  {filter} ({count})
                </button>
              )
            })}
          </nav>
        </div>

        {/* Submissions List */}
        <div className="grid grid-cols-1 gap-4">
          {submissions.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
              <p className="text-gray-500 dark:text-gray-400">
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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {teamName || 'Unknown Team'}
            </h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[submission.status]}`}>
              {submission.status}
            </span>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Clue #{submission.clueIndex + 1} • {submission.clueTitle || 'Untitled'}
          </p>

          {submission.textProof && (
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 line-clamp-2">
              {submission.textProof}
            </p>
          )}

          <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
            <span>
              {submission.photoUrls?.length || 0} photo{submission.photoUrls?.length !== 1 ? 's' : ''}
            </span>
            <span>•</span>
            <span>
              {new Date(submission.createdAt).toLocaleString()}
            </span>
          </div>

          {submission.adminComment && (
            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-medium">Admin: </span>
                {submission.adminComment}
              </p>
            </div>
          )}
        </div>

        <button
          onClick={onView}
          className="ml-4 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-md text-sm font-medium"
        >
          View Details
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Submission Details
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
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
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              Clue
            </h3>
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              {submission.clueTitle || 'Untitled Clue'}
            </p>
          </div>

          {/* Text Proof */}
          {submission.textProof && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Proof
              </h3>
              <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                {submission.textProof}
              </p>
            </div>
          )}

          {/* Notes */}
          {submission.notes && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Notes
              </h3>
              <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                {submission.notes}
              </p>
            </div>
          )}

          {/* Detour Choice */}
          {submission.detourChoice && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Fork Choice
              </h3>
              <p className="text-gray-900 dark:text-white">
                Path {submission.detourChoice.toUpperCase()}
              </p>
            </div>
          )}

          {/* Roadblock Player */}
          {submission.roadblockPlayer && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Solo Challenge Player
              </h3>
              <p className="text-gray-900 dark:text-white">
                {submission.roadblockPlayer}
              </p>
            </div>
          )}

          {/* Photos */}
          {submission.photoUrls && submission.photoUrls.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                Photos ({submission.photoUrls.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {submission.photoUrls.map((url, index) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden hover:opacity-90 transition-opacity"
                  >
                    <img
                      src={url}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Submission Info */}
          <div className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            <p>Submitted: {new Date(submission.createdAt).toLocaleString()}</p>
            {submission.updatedAt && submission.updatedAt !== submission.createdAt && (
              <p>Updated: {new Date(submission.updatedAt).toLocaleString()}</p>
            )}
          </div>

          {/* Admin Comment (if rejected) */}
          {submission.adminComment && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <h3 className="text-sm font-medium text-red-900 dark:text-red-300 mb-2">
                Rejection Reason
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
                  Confirm Rejection
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRejectForm(false)
                    setRejectComment('')
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Actions */}
        {submission.status === 'pending' && (
          <div className="sticky bottom-0 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex gap-3">
            {!showRejectForm && (
              <>
                <button
                  onClick={() => setShowRejectForm(true)}
                  className="flex-1 px-4 py-2 border border-red-300 dark:border-red-600 rounded-md text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  Reject
                </button>
                <button
                  onClick={onApprove}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium"
                >
                  Approve & Advance Team
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
