'use client';

import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { LoadingSpinner } from './LoadingSpinner';

export default function LoginView() {
  const { appState, setView, setCurrentTeam, loading, setLoading } = useGame();
  const [adminPassword, setAdminPassword] = useState('');
  const [gameCode, setGameCode] = useState('');
  const [teamLoginName, setTeamLoginName] = useState('');
  const [teamLoginPassword, setTeamLoginPassword] = useState('');
  const [error, setError] = useState('');

  const validateInput = (value, type) => {
    if (!value.trim()) return false;
    if (type === 'gameCode' && value.length !== 6) return false;
    return true;
  };

  const handleAdminLogin = async () => {
    if (!validateInput(adminPassword, 'password')) {
      setError('Please enter a password');
      return;
    }

    setLoading(true);
    setError('');

    // Simulate loading delay for better UX
    setTimeout(() => {
      const correctPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';
      if (adminPassword === correctPassword) {
        setView('admin');
      } else {
        setError('Invalid admin password');
      }
      setLoading(false);
    }, 800);
  };

  const handleTeamLogin = async () => {
    setError('');

    if (!validateInput(gameCode, 'gameCode')) {
      setError('Game code must be 6 characters');
      return;
    }
    if (!validateInput(teamLoginName, 'text')) {
      setError('Please enter team name');
      return;
    }
    if (!validateInput(teamLoginPassword, 'password')) {
      setError('Please enter team password');
      return;
    }

    if (!appState.game) {
      setError('No active game found');
      return;
    }

    if (gameCode.toUpperCase() !== appState.game.code) {
      setError('Invalid game code');
      return;
    }

    setLoading(true);

    // Simulate loading delay
    setTimeout(() => {
      const team = appState.game.teams.find(
        t => t.name === teamLoginName && t.password === teamLoginPassword
      );

      if (team) {
        setCurrentTeam(team);
        setView('team');
      } else {
        setError('Invalid team credentials');
      }
      setLoading(false);
    }, 800);
  };

  if (loading) {
    return <LoadingSpinner size="large" message="Logging in..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">THE AMAZING</h1>
          <h2 className="text-5xl font-bold text-yellow-500">RACE</h2>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div className="border-2 border-gray-200 rounded-xl p-6">
            <h3 className="text-xl font-bold mb-4">Admin Login</h3>
            <input
              type="password"
              placeholder="Admin Password"
              className="w-full px-4 py-2 border rounded-lg mb-4 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
              disabled={loading}
            />
            <button
              onClick={handleAdminLogin}
              disabled={loading}
              className="w-full bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? <LoadingSpinner size="small" message="" /> : 'Login as Admin'}
            </button>
          </div>

          <div className="border-2 border-gray-200 rounded-xl p-6">
            <h3 className="text-xl font-bold mb-4">Team Login</h3>
            <input
              type="text"
              placeholder="Game Code (6 letters)"
              className="w-full px-4 py-2 border rounded-lg mb-3 uppercase focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              value={gameCode}
              onChange={(e) => setGameCode(e.target.value.toUpperCase())}
              maxLength="6"
              disabled={loading}
            />
            <input
              type="text"
              placeholder="Team Name"
              className="w-full px-4 py-2 border rounded-lg mb-3 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              value={teamLoginName}
              onChange={(e) => setTeamLoginName(e.target.value)}
              disabled={loading}
            />
            <input
              type="password"
              placeholder="Team Password"
              className="w-full px-4 py-2 border rounded-lg mb-4 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              value={teamLoginPassword}
              onChange={(e) => setTeamLoginPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleTeamLogin()}
              disabled={loading}
            />
            <button
              onClick={handleTeamLogin}
              disabled={loading}
              className="w-full bg-yellow-500 text-black py-3 rounded-lg font-bold hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? <LoadingSpinner size="small" message="" /> : 'Login as Team'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}