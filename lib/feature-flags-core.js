// Core feature flag logic (server-safe, no JSX)

export const FEATURE_FLAGS = {
  // Multi-user authentication system
  MULTI_USER_AUTH: process.env.FEATURE_MULTI_USER_AUTH === 'true',

  // OAuth provider login
  OAUTH_LOGIN: process.env.FEATURE_OAUTH_LOGIN === 'true',

  // User dashboard and profiles
  USER_DASHBOARD: process.env.FEATURE_USER_DASHBOARD === 'true',

  // Personal clue libraries
  PERSONAL_LIBRARIES: process.env.FEATURE_PERSONAL_LIBRARIES === 'true',

  // Game invitations system
  GAME_INVITATIONS: process.env.FEATURE_GAME_INVITATIONS === 'true',

  // Public game marketplace (future feature)
  GAME_MARKETPLACE: process.env.FEATURE_GAME_MARKETPLACE === 'true',

  // Advanced role-based permissions
  ADVANCED_PERMISSIONS: process.env.FEATURE_ADVANCED_PERMISSIONS === 'true',

  // New user onboarding flow
  USER_ONBOARDING: process.env.FEATURE_USER_ONBOARDING === 'true',
}

// Default feature flag values for development
const DEVELOPMENT_DEFAULTS = {
  MULTI_USER_AUTH: true,
  OAUTH_LOGIN: true,
  USER_DASHBOARD: true,
  PERSONAL_LIBRARIES: false,
  GAME_INVITATIONS: false,
  GAME_MARKETPLACE: false,
  ADVANCED_PERMISSIONS: false,
  USER_ONBOARDING: true,
}

// Helper function to check if a feature is enabled
export function isFeatureEnabled(featureName) {
  const envValue = FEATURE_FLAGS[featureName]

  // If environment variable is set, use that value
  if (envValue !== undefined) {
    return envValue
  }

  // Otherwise use development defaults
  if (process.env.NODE_ENV === 'development') {
    return DEVELOPMENT_DEFAULTS[featureName] || false
  }

  // Production defaults to false for all features
  return false
}

// Helper function to get all enabled features
export function getEnabledFeatures() {
  const enabled = {}

  Object.keys(FEATURE_FLAGS).forEach(feature => {
    enabled[feature] = isFeatureEnabled(feature)
  })

  return enabled
}

// Debugging helper - logs all feature flags in development
if (process.env.NODE_ENV === 'development') {
  console.log('🏁 Feature Flags Status:', getEnabledFeatures())
}