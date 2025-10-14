import { isFeatureEnabled } from '../lib/feature-flags-core'
import LandingPage from './landing-page'
import LegacyApp from './legacy/page'

export default function HomePage() {
  // Use feature flags to determine which app to show
  const multiUserEnabled = isFeatureEnabled('MULTI_USER_AUTH')

  // Debug logging for feature flags (visible in server logs)
  console.log('🏁 Multi-user feature flag:', multiUserEnabled)
  console.log('🏁 Environment:', process.env.NODE_ENV)
  console.log('🏁 NEXT_PUBLIC_FEATURE_MULTI_USER_AUTH:', process.env.NEXT_PUBLIC_FEATURE_MULTI_USER_AUTH)

  if (multiUserEnabled) {
    return <LandingPage />
  }

  // Fallback to legacy app
  return <LegacyApp />
}