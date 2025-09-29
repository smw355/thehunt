'use client';

import React from 'react';
import { GameProvider, useGame } from '../context/GameContext';
import ErrorBoundary from '../components/ErrorBoundary';
import LoginView from '../components/LoginView';
import { FullPageLoader } from '../components/LoadingSpinner';

// For now, keep the original components but add loading states
function LegacyAmazingRaceApp() {
  const { view } = useGame();

  // Import the original component logic for admin and team views
  // This is a temporary measure while we refactor
  const OriginalApp = require('./page-original').default;

  if (view === 'login') {
    return <LoginView />;
  }

  // Render the original app for admin/team views with new context
  return <OriginalApp />;
}

function AmazingRaceApp() {
  const { loading } = useGame();

  if (loading) {
    return <FullPageLoader />;
  }

  return <LegacyAmazingRaceApp />;
}

export default function AmazingRaceAppWrapper() {
  return (
    <ErrorBoundary>
      <GameProvider>
        <AmazingRaceApp />
      </GameProvider>
    </ErrorBoundary>
  );
}