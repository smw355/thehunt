'use client'

import { useEffect, useState } from 'react'

export default function VictoryPage({ teamName, place, totalTeams, victorySettings }) {
  const [showConfetti, setShowConfetti] = useState(false)

  // Determine which settings to use based on place
  const getSettings = () => {
    if (!victorySettings) {
      // Default settings if none configured
      const defaults = {
        firstPlace: {
          title: 'Congratulations! 🏆',
          message: 'You finished in 1st place!',
          backgroundColor: '#10b981',
          textColor: '#ffffff',
          showConfetti: true
        },
        secondPlace: {
          title: 'Great Job! 🥈',
          message: 'You finished in 2nd place!',
          backgroundColor: '#6366f1',
          textColor: '#ffffff',
          showConfetti: false
        },
        thirdPlace: {
          title: 'Well Done! 🥉',
          message: 'You finished in 3rd place!',
          backgroundColor: '#f59e0b',
          textColor: '#ffffff',
          showConfetti: false
        },
        otherPlace: {
          title: 'Congratulations! 🎉',
          message: 'You completed the challenge!',
          backgroundColor: '#8b5cf6',
          textColor: '#ffffff',
          showConfetti: false
        }
      }

      if (place === 1) return defaults.firstPlace
      if (place === 2) return defaults.secondPlace
      if (place === 3) return defaults.thirdPlace
      return defaults.otherPlace
    }

    if (place === 1) return victorySettings.firstPlace
    if (place === 2) return victorySettings.secondPlace
    if (place === 3) return victorySettings.thirdPlace
    return victorySettings.otherPlace
  }

  const settings = getSettings()

  useEffect(() => {
    if (settings.showConfetti) {
      setShowConfetti(true)
    }
  }, [settings.showConfetti])

  // Generate confetti elements
  const confettiColors = ['#fbbf24', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6', '#10b981']
  const confettiElements = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 3,
    duration: 3 + Math.random() * 2,
    color: confettiColors[Math.floor(Math.random() * confettiColors.length)]
  }))

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        backgroundColor: settings.backgroundColor,
        color: settings.textColor
      }}
    >
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {confettiElements.map((confetti) => (
            <div
              key={confetti.id}
              className="absolute w-2 h-2 animate-fall"
              style={{
                left: `${confetti.left}%`,
                top: '-20px',
                backgroundColor: confetti.color,
                animationDelay: `${confetti.delay}s`,
                animationDuration: `${confetti.duration}s`,
                transform: 'rotate(45deg)'
              }}
            />
          ))}
        </div>
      )}

      {/* Main Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl">
        <div className="mb-8 animate-bounce-slow">
          {place === 1 && <div className="text-9xl mb-4">🏆</div>}
          {place === 2 && <div className="text-9xl mb-4">🥈</div>}
          {place === 3 && <div className="text-9xl mb-4">🥉</div>}
          {place > 3 && <div className="text-9xl mb-4">🎉</div>}
        </div>

        <h1 className="text-6xl md:text-8xl font-extrabold mb-8 drop-shadow-2xl">
          {settings.title}
        </h1>

        <div className="mb-8">
          <div className="inline-block bg-white/20 backdrop-blur-sm rounded-2xl px-8 py-6 shadow-2xl border-2 border-white/30">
            <p className="text-2xl md:text-3xl font-bold mb-2">{teamName}</p>
            <p className="text-4xl md:text-6xl font-extrabold">
              {place === 1 ? '1st' : place === 2 ? '2nd' : place === 3 ? '3rd' : `${place}th`} Place
            </p>
            {totalTeams > 1 && (
              <p className="text-lg md:text-xl mt-2 opacity-90">
                out of {totalTeams} {totalTeams === 1 ? 'team' : 'teams'}
              </p>
            )}
          </div>
        </div>

        <p className="text-2xl md:text-4xl mb-12 whitespace-pre-wrap max-w-2xl mx-auto leading-relaxed drop-shadow-lg">
          {settings.message}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="px-8 py-4 bg-white/30 hover:bg-white/40 backdrop-blur-sm rounded-xl text-lg font-semibold transition-all hover:scale-105 shadow-xl border-2 border-white/40"
          >
            Return to Dashboard
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fall {
          0% {
            transform: translateY(-20px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-fall {
          animation: fall linear infinite;
        }
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
