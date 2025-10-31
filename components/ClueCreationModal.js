'use client'

import { useState } from 'react'

export default function ClueCreationModal({ isOpen, onClose, onClueCreated, libraryId = null }) {
  const [clueType, setClueType] = useState('route-info')
  const [title, setTitle] = useState('')
  const [requiredPhotos, setRequiredPhotos] = useState(0)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState('')

  // Route Info fields
  const [routeInfoContent, setRouteInfoContent] = useState([''])

  // Detour fields
  const [detourOptionA, setDetourOptionA] = useState({ title: '', description: '' })
  const [detourOptionB, setDetourOptionB] = useState({ title: '', description: '' })

  // Road Block fields
  const [roadblockQuestion, setRoadblockQuestion] = useState('')
  const [roadblockTask, setRoadblockTask] = useState('')

  // Snapshot fields
  const [snapshotImage, setSnapshotImage] = useState(null)
  const [snapshotImagePreview, setSnapshotImagePreview] = useState(null)
  const [snapshotDescription, setSnapshotDescription] = useState('')
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  const resetForm = () => {
    setClueType('route-info')
    setTitle('')
    setRequiredPhotos(0)
    setRouteInfoContent([''])
    setDetourOptionA({ title: '', description: '' })
    setDetourOptionB({ title: '', description: '' })
    setRoadblockQuestion('')
    setRoadblockTask('')
    setSnapshotImage(null)
    setSnapshotImagePreview(null)
    setSnapshotDescription('')
    setError('')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const addRouteInfoLine = () => {
    setRouteInfoContent([...routeInfoContent, ''])
  }

  const updateRouteInfoLine = (index, value) => {
    const newContent = [...routeInfoContent]
    newContent[index] = value
    setRouteInfoContent(newContent)
  }

  const removeRouteInfoLine = (index) => {
    if (routeInfoContent.length > 1) {
      setRouteInfoContent(routeInfoContent.filter((_, i) => i !== index))
    }
  }

  const handleSnapshotImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image file too large. Maximum size is 5MB.')
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.')
      return
    }

    setSnapshotImage(file)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setSnapshotImagePreview(reader.result)
    }
    reader.readAsDataURL(file)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!title.trim()) {
      setError('Title is required')
      return
    }

    // Type-specific validation
    if (clueType === 'route-info') {
      const filteredContent = routeInfoContent.filter(line => line.trim())
      if (filteredContent.length === 0) {
        setError('At least one content line is required for Waypoint challenges')
        return
      }
    }

    if (clueType === 'detour') {
      if (!detourOptionA.title.trim() || !detourOptionB.title.trim()) {
        setError('Both Fork option titles are required')
        return
      }
    }

    if (clueType === 'road-block') {
      if (!roadblockQuestion.trim()) {
        setError('Solo challenge question is required')
        return
      }
    }

    if (clueType === 'snapshot') {
      if (!snapshotImage) {
        setError('Reference image is required for Snapshot clues')
        return
      }
      if (!snapshotDescription.trim()) {
        setError('Description is required for Snapshot clues')
        return
      }
    }

    setIsCreating(true)

    try {
      let snapshotImageUrl = null

      // Upload snapshot image first if present
      if (clueType === 'snapshot' && snapshotImage) {
        setIsUploadingImage(true)
        const formData = new FormData()
        formData.append('file', snapshotImage)
        formData.append('uploadType', 'reference')

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload reference image')
        }

        const uploadData = await uploadResponse.json()
        snapshotImageUrl = uploadData.url
        setIsUploadingImage(false)
      }

      const clueData = {
        type: clueType,
        title: title.trim(),
        requiredPhotos: parseInt(requiredPhotos) || 0,
        libraryId,
      }

      if (clueType === 'route-info') {
        clueData.content = routeInfoContent.filter(line => line.trim())
      }

      if (clueType === 'detour') {
        clueData.detourOptionA = {
          title: detourOptionA.title.trim(),
          description: detourOptionA.description.trim(),
        }
        clueData.detourOptionB = {
          title: detourOptionB.title.trim(),
          description: detourOptionB.description.trim(),
        }
      }

      if (clueType === 'road-block') {
        clueData.roadblockQuestion = roadblockQuestion.trim()
        clueData.roadblockTask = roadblockTask.trim()
      }

      if (clueType === 'snapshot') {
        clueData.snapshotImageUrl = snapshotImageUrl
        clueData.snapshotDescription = snapshotDescription.trim()
      }

      const response = await fetch('/api/clues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clueData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create clue')
      }

      const newClue = await response.json()

      resetForm()
      onClueCreated(newClue)
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setIsCreating(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-xl shadow-2xl border border-purple-200 dark:border-purple-900/50 max-w-2xl w-full my-8">
        <div className="px-6 py-4 border-b border-purple-100 dark:border-purple-900/50 flex items-center justify-between">
          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Create New Clue ✨
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Clue Type */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Challenge Type 🎯
            </label>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <button
                type="button"
                onClick={() => setClueType('route-info')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  clueType === 'route-info'
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                    : 'bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm text-gray-700 dark:text-gray-300 border border-purple-100 dark:border-purple-900/50 hover:bg-purple-50 dark:hover:bg-purple-900/30'
                }`}
              >
                📍 Waypoint
              </button>
              <button
                type="button"
                onClick={() => setClueType('detour')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  clueType === 'detour'
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg'
                    : 'bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm text-gray-700 dark:text-gray-300 border border-purple-100 dark:border-purple-900/50 hover:bg-purple-50 dark:hover:bg-purple-900/30'
                }`}
              >
                🔀 Fork
              </button>
              <button
                type="button"
                onClick={() => setClueType('road-block')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  clueType === 'road-block'
                    ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg'
                    : 'bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm text-gray-700 dark:text-gray-300 border border-purple-100 dark:border-purple-900/50 hover:bg-purple-50 dark:hover:bg-purple-900/30'
                }`}
              >
                🎯 Solo
              </button>
              <button
                type="button"
                onClick={() => setClueType('snapshot')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  clueType === 'snapshot'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                    : 'bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm text-gray-700 dark:text-gray-300 border border-purple-100 dark:border-purple-900/50 hover:bg-purple-50 dark:hover:bg-purple-900/30'
                }`}
              >
                📸 Snapshot
              </button>
            </div>
          </div>

          {/* Title */}
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-purple-300 dark:border-purple-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter clue title"
              required
            />
          </div>

          {/* Waypoint Fields */}
          {clueType === 'route-info' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                📍 Waypoint Instructions *
              </label>
              {routeInfoContent.map((line, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={line}
                    onChange={(e) => updateRouteInfoLine(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-purple-300 dark:border-purple-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                    placeholder={`Line ${index + 1}`}
                  />
                  {routeInfoContent.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRouteInfoLine(index)}
                      className="px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addRouteInfoLine}
                className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium"
              >
                + Add Line
              </button>
            </div>
          )}

          {/* Fork Fields */}
          {clueType === 'detour' && (
            <div className="mb-4 space-y-4">
              <div className="border border-purple-200 dark:border-purple-900/50 rounded-lg p-4 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">🅰️ Path A *</h3>
                <input
                  type="text"
                  value={detourOptionA.title}
                  onChange={(e) => setDetourOptionA({ ...detourOptionA, title: e.target.value })}
                  className="w-full px-3 py-2 border border-purple-300 dark:border-purple-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white mb-2"
                  placeholder="Option A title"
                  required
                />
                <textarea
                  value={detourOptionA.description}
                  onChange={(e) => setDetourOptionA({ ...detourOptionA, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-purple-300 dark:border-purple-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Option A description"
                />
              </div>
              <div className="border border-purple-200 dark:border-purple-900/50 rounded-lg p-4 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">🅱️ Path B *</h3>
                <input
                  type="text"
                  value={detourOptionB.title}
                  onChange={(e) => setDetourOptionB({ ...detourOptionB, title: e.target.value })}
                  className="w-full px-3 py-2 border border-purple-300 dark:border-purple-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white mb-2"
                  placeholder="Option B title"
                  required
                />
                <textarea
                  value={detourOptionB.description}
                  onChange={(e) => setDetourOptionB({ ...detourOptionB, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-purple-300 dark:border-purple-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Option B description"
                />
              </div>
            </div>
          )}

          {/* Solo Challenge Fields */}
          {clueType === 'road-block' && (
            <div className="mb-4 space-y-4">
              <div>
                <label htmlFor="roadblockQuestion" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  🎯 Team Member Selection Question *
                </label>
                <textarea
                  id="roadblockQuestion"
                  value={roadblockQuestion}
                  onChange={(e) => setRoadblockQuestion(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-purple-300 dark:border-purple-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Who has the best memory for details?"
                  required
                />
                <p className="mt-1 text-xs text-gray-700 dark:text-gray-300">
                  This question is asked before revealing the task (like the TV show!)
                </p>
              </div>
              <div>
                <label htmlFor="roadblockTask" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Solo Task Description *
                </label>
                <textarea
                  id="roadblockTask"
                  value={roadblockTask}
                  onChange={(e) => setRoadblockTask(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-purple-300 dark:border-purple-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Describe what the selected team member must do alone"
                />
              </div>
            </div>
          )}

          {/* Snapshot Fields */}
          {clueType === 'snapshot' && (
            <div className="mb-4 space-y-4">
              <div>
                <label htmlFor="snapshotImage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  📸 Reference Photo *
                </label>
                <input
                  type="file"
                  id="snapshotImage"
                  accept="image/*"
                  onChange={handleSnapshotImageChange}
                  className="w-full px-3 py-2 border border-purple-300 dark:border-purple-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 dark:file:bg-purple-900/30 dark:file:text-purple-300"
                  required
                />
                <p className="mt-1 text-xs text-gray-700 dark:text-gray-300">
                  Upload the reference image that teams must find and photograph (Max 5MB)
                </p>
                {snapshotImagePreview && (
                  <div className="mt-3 relative">
                    <img
                      src={snapshotImagePreview}
                      alt="Reference preview"
                      className="max-w-full h-auto max-h-60 rounded-lg border border-purple-200 dark:border-purple-800"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setSnapshotImage(null)
                        setSnapshotImagePreview(null)
                      }}
                      className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
              <div>
                <label htmlFor="snapshotDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description / Hints *
                </label>
                <textarea
                  id="snapshotDescription"
                  value={snapshotDescription}
                  onChange={(e) => setSnapshotDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-purple-300 dark:border-purple-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Describe what teams should look for and any hints about the location"
                  required
                />
                <p className="mt-1 text-xs text-gray-700 dark:text-gray-300">
                  Provide context and clues to help teams find this object or location
                </p>
              </div>
            </div>
          )}

          {/* Required Photos */}
          <div className="mb-4">
            <label htmlFor="requiredPhotos" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              📷 Required Photos
            </label>
            <input
              type="number"
              id="requiredPhotos"
              value={requiredPhotos}
              onChange={(e) => setRequiredPhotos(e.target.value)}
              min="0"
              max="10"
              className="w-full px-3 py-2 border border-purple-300 dark:border-purple-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
            />
            <p className="mt-1 text-xs text-gray-700 dark:text-gray-300">
              Number of photos players must upload to complete this clue (0-10)
            </p>
          </div>
        </form>

        <div className="px-6 py-4 border-t border-purple-100 dark:border-purple-900/50 flex gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 px-4 py-2 border border-purple-300 dark:border-purple-600 rounded-md text-sm font-medium text-purple-700 dark:text-purple-200 hover:bg-purple-50 dark:hover:bg-purple-900/30"
            disabled={isCreating}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isCreating || !title.trim()}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-md text-sm font-medium disabled:opacity-50"
          >
            {isUploadingImage ? 'Uploading Image... 📤' : isCreating ? 'Creating... ✨' : 'Create Clue ✨'}
          </button>
        </div>
      </div>
    </div>
  )
}
