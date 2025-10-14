/**
 * Helper functions for clue type display names
 * Maps database types to user-friendly names
 */

export function getClueTypeDisplay(type) {
  const typeMap = {
    'route-info': 'Waypoint',
    'detour': 'Fork',
    'road-block': 'Solo'
  }
  return typeMap[type] || type
}

export function getClueTypeColor(type) {
  const colorMap = {
    'route-info': 'blue',
    'detour': 'yellow',
    'road-block': 'red'
  }
  return colorMap[type] || 'gray'
}

export function getClueTypeClasses(type) {
  const classMap = {
    'route-info': 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
    'detour': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
    'road-block': 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
  }
  return classMap[type] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
}
