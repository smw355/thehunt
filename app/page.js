import { isFeatureEnabled } from '../lib/feature-flags'
import LandingPage from './landing-page'
import LegacyApp from './legacy/page'

export default function HomePage() {
  // Use feature flags to determine which app to show
  const multiUserEnabled = isFeatureEnabled('MULTI_USER_AUTH')

  if (multiUserEnabled) {
    return <LandingPage />
  }

  // Fallback to legacy app
  return <LegacyApp />
}