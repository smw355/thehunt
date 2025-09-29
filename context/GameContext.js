'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

const GameContext = createContext();

const initialAppState = {
  game: null,
  clueLibrary: [],
  submissions: [],
  teamStates: {}
};

export function GameProvider({ children }) {
  const [appState, setAppState] = useLocalStorage('theRaceData', initialAppState);
  const [view, setView] = useState('login');
  const [currentTeam, setCurrentTeam] = useState(null);
  const [loading, setLoading] = useState(false);

  // Auto-save functionality
  useEffect(() => {
    const saveInterval = setInterval(() => {
      // Trigger a save by updating localStorage
      setAppState(currentState => ({ ...currentState }));
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(saveInterval);
  }, [setAppState]);

  const value = {
    appState,
    setAppState,
    view,
    setView,
    currentTeam,
    setCurrentTeam,
    loading,
    setLoading,
    resetGame: () => setAppState(initialAppState)
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}