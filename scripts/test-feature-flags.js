// Test script for feature flags
import { isFeatureEnabled, getEnabledFeatures, FEATURE_FLAGS } from '../lib/feature-flags-core.js'

console.log('🏁 Testing Feature Flags System:')
console.log('')

// Test environment detection
console.log('Environment:', process.env.NODE_ENV || 'development')

// Test individual flags
console.log('Individual Flag Tests:')
console.log('- MULTI_USER_AUTH:', isFeatureEnabled('MULTI_USER_AUTH'))
console.log('- OAUTH_LOGIN:', isFeatureEnabled('OAUTH_LOGIN'))
console.log('- USER_DASHBOARD:', isFeatureEnabled('USER_DASHBOARD'))
console.log('- PERSONAL_LIBRARIES:', isFeatureEnabled('PERSONAL_LIBRARIES'))
console.log('- GAME_INVITATIONS:', isFeatureEnabled('GAME_INVITATIONS'))

console.log('')
console.log('All Enabled Features:')
console.log(getEnabledFeatures())

console.log('')
console.log('Raw Environment Variables:')
console.log('- FEATURE_MULTI_USER_AUTH:', process.env.FEATURE_MULTI_USER_AUTH)
console.log('- FEATURE_OAUTH_LOGIN:', process.env.FEATURE_OAUTH_LOGIN)
console.log('- FEATURE_USER_DASHBOARD:', process.env.FEATURE_USER_DASHBOARD)

console.log('')
console.log('✅ Feature flag system test completed')