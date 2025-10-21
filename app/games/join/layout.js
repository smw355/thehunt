// This will be used for metadata generation
async function fetchGameByCode(code) {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'https://therace-xi.vercel.app'
    const response = await fetch(`${baseUrl}/api/games?code=${code}`, {
      cache: 'no-store'
    })
    if (response.ok) {
      return await response.json()
    }
  } catch (error) {
    console.error('Error fetching game for metadata:', error)
  }
  return null
}

export async function generateMetadata({ searchParams }) {
  const code = searchParams?.code

  if (code) {
    const game = await fetchGameByCode(code.toUpperCase())

    if (game) {
      const clueCount = game.clueSequence?.length || 0
      const playerCount = game.memberCount || 0

      return {
        title: `Join ${game.name} - The Hunt`,
        description: `You've been invited to join ${game.name}! Click to join this exciting treasure hunt with ${clueCount} challenge${clueCount !== 1 ? 's' : ''}.${playerCount > 0 ? ` ${playerCount} player${playerCount !== 1 ? 's' : ''} already joined.` : ''}`,
        openGraph: {
          title: `🎮 Join ${game.name}`,
          description: `You're invited to compete in this treasure hunt! ${clueCount} challenge${clueCount !== 1 ? 's' : ''} await${clueCount === 1 ? 's' : ''}.${playerCount > 0 ? ` ${playerCount} player${playerCount !== 1 ? 's' : ''} ready to race.` : ''}`,
          images: [
            {
              url: '/og-image.png',
              width: 1200,
              height: 630,
              alt: `Join ${game.name} - The Hunt`,
            }
          ],
          type: 'website',
        },
        twitter: {
          card: 'summary_large_image',
          title: `🎮 Join ${game.name}`,
          description: `You're invited! ${clueCount} challenges • Code: ${game.code}`,
          images: ['/og-image.png'],
        },
      }
    }
  }

  return {
    title: 'Join Game - The Hunt',
    description: 'Enter your game code to join an exciting treasure hunt competition.',
    openGraph: {
      title: '🚀 Join a Hunt',
      description: 'Enter your game code to join an exciting treasure hunt competition.',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: 'Join Game - The Hunt',
        }
      ],
    },
  }
}

export default function JoinLayout({ children }) {
  return children
}
