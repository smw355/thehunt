'use client'

import { useSession, signIn } from 'next-auth/react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { isFeatureEnabled } from '../lib/feature-flags'

export default function LandingPage() {
  const { data: session, status } = useSession()
  const [multiUserEnabled, setMultiUserEnabled] = useState(false)

  useEffect(() => {
    // Check feature flags on client side
    setMultiUserEnabled(isFeatureEnabled('MULTI_USER_AUTH'))
  }, [])

  // If user is already authenticated and multi-user is enabled, redirect to dashboard
  useEffect(() => {
    if (session && multiUserEnabled) {
      window.location.href = '/dashboard'
    }
  }, [session, multiUserEnabled])

  const handleGetStarted = () => {
    if (multiUserEnabled) {
      signIn(undefined, { callbackUrl: '/dashboard' })
    } else {
      // Use legacy login system
      window.location.href = '/legacy'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 dark:from-primary/10 dark:to-secondary/10">
      {/* Header */}
      <header className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                🏹 The Hunt
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              {multiUserEnabled ? (
                <>
                  {status === 'loading' ? (
                    <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-10 w-20 rounded"></div>
                  ) : session ? (
                    <Link
                      href="/dashboard"
                      className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Dashboard
                    </Link>
                  ) : (
                    <>
                      <button
                        onClick={() => signIn()}
                        className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 text-sm font-medium"
                      >
                        Sign In
                      </button>
                      <button
                        onClick={() => signIn()}
                        className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                      >
                        Get Started
                      </button>
                    </>
                  )}
                </>
              ) : (
                <Link
                  href="/legacy"
                  className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Enter Game
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Create Epic{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
              Treasure Hunts
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
            Design interactive photo-enabled treasure hunts with clues, team management,
            and real-time submission tracking. Perfect for corporate events, education,
            and community adventures.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleGetStarted}
              className="bg-primary hover:bg-primary-dark text-white px-8 py-4 rounded-lg text-lg font-semibold shadow-lg transition-all transform hover:scale-105"
            >
              {multiUserEnabled ? 'Start Creating' : 'Enter Game'}
            </button>
            <Link
              href="#features"
              className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
            >
              Learn More
            </Link>
          </div>

          {multiUserEnabled && (
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              Sign in with Google or GitHub to get started
            </p>
          )}
        </div>

        {/* Features Grid */}
        <div id="features" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="bg-primary/10 rounded-lg p-3 w-fit mb-4">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Photo Challenges</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Multi-photo requirements with exact count validation. Teams upload 1-10 photos per challenge with dual camera/gallery options.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="bg-secondary/10 rounded-lg p-3 w-fit mb-4">
              <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Team Management</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {multiUserEnabled
                ? 'Create games, invite players, and manage teams with role-based permissions and real-time progress tracking.'
                : 'Multi-team support with real-time progress tracking and admin feedback system.'
              }
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="bg-accent-green/10 rounded-lg p-3 w-fit mb-4">
              <svg className="w-6 h-6 text-accent-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Smart Clue System</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Three challenge types: Waypoints (info), Forks (choice), and Solo (individual).
              {multiUserEnabled ? ' Personal clue libraries and sharing.' : ' Import/export clue libraries.'}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="bg-accent-cyan/10 rounded-lg p-3 w-fit mb-4">
              <svg className="w-6 h-6 text-accent-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Mobile Optimized</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Touch-optimized interface with camera API integration, image compression, and responsive design for all screen sizes.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="bg-accent-yellow/10 rounded-lg p-3 w-fit mb-4">
              <svg className="w-6 h-6 text-accent-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Admin Feedback</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Photo gallery reviews with mandatory feedback for rejections. Teams see rejection history with specific guidance.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="bg-accent-orange/10 rounded-lg p-3 w-fit mb-4">
              <svg className="w-6 h-6 text-accent-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">One-Click Deploy</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Deploy to Vercel in minutes with PostgreSQL database and Blob storage. Professional hosting with zero configuration.
            </p>
          </div>
        </div>

        {/* Perfect For Section */}
        <div className="text-center mb-16">
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Perfect For</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              '🏢 Corporate Events',
              '🎓 Education',
              '🏘️ Community',
              '👨‍👩‍👧‍👦 Family Fun',
              '🏕️ Youth Groups',
              '💼 Conferences',
              '🏛️ Museums',
              '🎉 Celebrations'
            ].map((item, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-8 md:p-12 text-center text-white">
          <h3 className="text-3xl md:text-4xl font-bold mb-4">Ready to Start Your Hunt?</h3>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            {multiUserEnabled
              ? 'Sign up today and create your first treasure hunt adventure. Join thousands of game masters creating memorable experiences.'
              : 'Create engaging photo-based treasure hunts with professional-grade tools and real-time team management.'
            }
          </p>
          <button
            onClick={handleGetStarted}
            className="bg-white text-primary hover:bg-gray-100 px-8 py-4 rounded-lg text-lg font-semibold shadow-lg transition-all transform hover:scale-105"
          >
            {multiUserEnabled ? 'Create Free Account' : 'Get Started'}
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            © 2024 The Hunt. Create memorable treasure hunt adventures.
          </p>
          {multiUserEnabled && (
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Multi-user platform in beta. More features coming soon!
            </p>
          )}
        </div>
      </footer>
    </div>
  )
}