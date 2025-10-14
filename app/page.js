import LandingPage from './landing-page'

export default function HomePage() {
  // New multi-user app is now the primary production app
  // Legacy app is still available at /legacy for backwards compatibility
  return <LandingPage />
}