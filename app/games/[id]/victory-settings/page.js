'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function VictoryPageSettings() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [gameData, setGameData] = useState(null)
  const [settings, setSettings] = useState({
    firstPlace: {
      title: 'Congratulations! 🏆',
      message: 'You finished in 1st place!',
      backgroundColor: '#10b981', // green
      textColor: '#ffffff',
      showConfetti: true
    },
    secondPlace: {
      title: 'Great Job! 🥈',
      message: 'You finished in 2nd place!',
      backgroundColor: '#6366f1', // indigo
      textColor: '#ffffff',
      showConfetti: false
    },
    thirdPlace: {
      title: 'Well Done! 🥉',
      message: 'You finished in 3rd place!',
      backgroundColor: '#f59e0b', // amber
      textColor: '#ffffff',
      showConfetti: false
    },
    otherPlace: {
      title: 'Congratulations! 🎉',
      message: 'You completed the challenge!',
      backgroundColor: '#8b5cf6', // purple
      textColor: '#ffffff',
      showConfetti: false
    }
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('firstPlace')

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
      const gameResponse = await fetch(`/api/games/${params.id}`)
      if (!gameResponse.ok) throw new Error('Failed to load game')
      const game = await gameResponse.json()

      if (game.userRole !== 'game_master') {
        router.push(`/games/${params.id}`)
        return
      }

      setGameData(game)

      // Load existing settings if they exist
      if (game.game?.victoryPageSettings) {
        setSettings(prev => ({
          ...prev,
          ...game.game.victoryPageSettings
        }))
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError('')

    try {
      const response = await fetch(`/api/games/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          victoryPageSettings: settings
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save settings')
      }

      alert('Victory page settings saved successfully!')
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const updateSetting = (place, field, value) => {
    setSettings(prev => ({
      ...prev,
      [place]: {
        ...prev[place],
        [field]: value
      }
    }))
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

  const tabs = [
    { id: 'firstPlace', label: '🏆 1st Place', emoji: '🏆' },
    { id: 'secondPlace', label: '🥈 2nd Place', emoji: '🥈' },
    { id: 'thirdPlace', label: '🥉 3rd Place', emoji: '🥉' },
    { id: 'otherPlace', label: '🎉 Other', emoji: '🎉' }
  ]

  const currentSettings = settings[activeTab]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg border-b border-purple-100 dark:border-purple-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                🏆 Victory Page Settings
              </h1>
              <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                {gameData.game?.name}
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

        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl shadow-lg border border-purple-100 dark:border-purple-900/50">
          {/* Tabs */}
          <div className="border-b border-purple-200 dark:border-purple-900/50">
            <nav className="-mb-px flex space-x-8 px-6">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                      : 'border-transparent text-gray-700 dark:text-gray-300 hover:text-purple-700 dark:hover:text-purple-300 hover:border-purple-300 dark:hover:border-purple-600'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Editor */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Edit {tabs.find(t => t.id === activeTab)?.label}
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={currentSettings.title}
                    onChange={(e) => updateSetting(activeTab, 'title', e.target.value)}
                    className="w-full px-3 py-2 border border-purple-300 dark:border-purple-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Message
                  </label>
                  <textarea
                    value={currentSettings.message}
                    onChange={(e) => updateSetting(activeTab, 'message', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-purple-300 dark:border-purple-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter congratulations message"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Background Color
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={currentSettings.backgroundColor}
                      onChange={(e) => updateSetting(activeTab, 'backgroundColor', e.target.value)}
                      className="h-10 w-20 rounded border border-purple-300 dark:border-purple-600"
                    />
                    <input
                      type="text"
                      value={currentSettings.backgroundColor}
                      onChange={(e) => updateSetting(activeTab, 'backgroundColor', e.target.value)}
                      className="flex-1 px-3 py-2 border border-purple-300 dark:border-purple-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
                      placeholder="#000000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Text Color
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={currentSettings.textColor}
                      onChange={(e) => updateSetting(activeTab, 'textColor', e.target.value)}
                      className="h-10 w-20 rounded border border-purple-300 dark:border-purple-600"
                    />
                    <input
                      type="text"
                      value={currentSettings.textColor}
                      onChange={(e) => updateSetting(activeTab, 'textColor', e.target.value)}
                      className="flex-1 px-3 py-2 border border-purple-300 dark:border-purple-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
                      placeholder="#ffffff"
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="showConfetti"
                    checked={currentSettings.showConfetti}
                    onChange={(e) => updateSetting(activeTab, 'showConfetti', e.target.checked)}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label htmlFor="showConfetti" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Show confetti animation
                  </label>
                </div>
              </div>

              {/* Preview */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Preview
                </h3>
                <div
                  className="rounded-xl shadow-2xl p-8 min-h-[400px] flex flex-col items-center justify-center text-center"
                  style={{
                    backgroundColor: currentSettings.backgroundColor,
                    color: currentSettings.textColor
                  }}
                >
                  {currentSettings.showConfetti && (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                      <div className="text-4xl animate-bounce">🎊 🎉 🎊</div>
                    </div>
                  )}
                  <div className="relative z-10">
                    <h2 className="text-4xl font-bold mb-4">
                      {currentSettings.title}
                    </h2>
                    <p className="text-xl mb-8 whitespace-pre-wrap">
                      {currentSettings.message}
                    </p>
                    <div className="inline-block px-6 py-3 bg-white/20 backdrop-blur-sm rounded-lg">
                      <p className="text-sm font-semibold">Team Name</p>
                      <p className="text-3xl font-bold mt-1">Sample Team</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="px-6 py-4 border-t border-purple-100 dark:border-purple-900/50 flex justify-end">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : '💾 Save Settings'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
