'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const getErrorDetails = (error) => {
    switch (error) {
      case 'Configuration':
        return {
          title: 'Server Configuration Error',
          description: 'There is a problem with the server configuration. Please contact support.',
          emoji: '⚙️'
        }
      case 'AccessDenied':
        return {
          title: 'Access Denied',
          description: 'You do not have permission to sign in. Please contact an administrator.',
          emoji: '🚫'
        }
      case 'Verification':
        return {
          title: 'Unable to Verify',
          description: 'The verification token has expired or has already been used. Please try signing in again.',
          emoji: '⏰'
        }
      case 'Default':
      default:
        return {
          title: 'Authentication Error',
          description: 'An error occurred during authentication. Please try again.',
          emoji: '❌'
        }
    }
  }

  const errorDetails = getErrorDetails(error)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-8 rounded-xl shadow-2xl border border-purple-100 dark:border-purple-900/50">
        <div className="text-center">
          <div className="mx-auto h-20 w-20 flex items-center justify-center text-6xl mb-4">
            {errorDetails.emoji}
          </div>

          <h2 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-2">
            {errorDetails.title}
          </h2>

          <p className="text-gray-700 dark:text-gray-300 mb-8">
            {errorDetails.description}
          </p>

          <div className="space-y-4">
            <Link
              href="/auth/signin"
              className="w-full inline-flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all"
            >
              Try Again
            </Link>

            <Link
              href="/"
              className="w-full inline-flex justify-center py-3 px-4 border border-purple-300 dark:border-purple-600 rounded-md shadow-sm text-sm font-medium text-purple-700 dark:text-purple-200 bg-white dark:bg-gray-700 hover:bg-purple-50 dark:hover:bg-purple-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all"
            >
              Return Home
            </Link>
          </div>

          {error && (
            <div className="mt-8 p-4 bg-gray-100/80 dark:bg-gray-700/50 rounded-md backdrop-blur-sm">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Error code: {error}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AuthError() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
        <div className="animate-pulse">
          <div className="h-8 w-8 bg-gradient-to-r from-blue-300 to-purple-300 dark:from-blue-700 dark:to-purple-700 rounded-full mx-auto mb-4"></div>
          <div className="h-4 w-32 bg-gradient-to-r from-purple-300 to-pink-300 dark:from-purple-700 dark:to-pink-700 rounded mx-auto"></div>
        </div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  )
}
