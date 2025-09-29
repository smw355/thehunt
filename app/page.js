'use client';

import React, { useState, useEffect } from 'react';
import { Camera, Check, X, Users, Plus, Edit2, Trash2, Eye, Clock, Trophy, AlertCircle, Play, Copy } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import ErrorBoundary from '../components/ErrorBoundary';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { validateGameForm, validateTeamForm, validateClueForm, copyToClipboard, downloadJSON, parseJSONFile } from '../utils/gameUtils';

// Mock data store
const initialAppState = {
  game: null, // Single active game
  clueLibrary: [], // Shared clue library
  submissions: [],
  teamStates: {}
};

function AmazingRaceApp() {
  const [view, setView] = useState('login'); // 'login', 'admin', 'team'
  const [appState, setAppState] = useLocalStorage('amazingRaceData', initialAppState);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [currentTeam, setCurrentTeam] = useState(null);
  const [adminPassword, setAdminPassword] = useState('');
  const [gameCode, setGameCode] = useState('');
  const [teamLoginName, setTeamLoginName] = useState('');
  const [teamLoginPassword, setTeamLoginPassword] = useState('');

  // Admin: Game Setup
  const [gameForm, setGameForm] = useState({ name: '', code: '', clueSequence: [] });
  const [showGameForm, setShowGameForm] = useState(false);

  // Admin: Add/Edit Team
  const [teamForm, setTeamForm] = useState({ name: '', password: '' });
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState(null);

  // Admin: Add/Edit Clue
  const [clueForm, setClueForm] = useState({ 
    type: 'route-info', 
    title: '', 
    content: ['', '', ''],
    detourOptionA: { title: '', description: '' },
    detourOptionB: { title: '', description: '' },
    roadblockQuestion: '',
    roadblockTask: ''
  });
  const [showClueForm, setShowClueForm] = useState(false);
  const [editingClueId, setEditingClueId] = useState(null);

  // Team: Detour choice
  const [selectedDetour, setSelectedDetour] = useState(null);
  
  // Team: Roadblock
  const [roadblockPlayer, setRoadblockPlayer] = useState('');
  const [roadblockRevealed, setRoadblockRevealed] = useState(false);

  // Team: Submission
  const [submissionProof, setSubmissionProof] = useState('');
  const [submissionNotes, setSubmissionNotes] = useState('');

  // Generate random game code
  const generateGameCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  // Admin Login
  const handleAdminLogin = async () => {
    setLoading(true);
    setErrors([]);

    const correctPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';

    // Simulate a brief loading delay for better UX
    setTimeout(() => {
      if (adminPassword === correctPassword) {
        setView('admin');
      } else {
        setErrors(['Invalid admin password']);
      }
      setLoading(false);
    }, 500);
  };

  // Team Login
  const handleTeamLogin = () => {
    if (!appState.game) {
      alert('No active game');
      return;
    }
    
    if (gameCode.toUpperCase() !== appState.game.code) {
      alert('Invalid game code');
      return;
    }

    const team = appState.game.teams.find(
      t => t.name === teamLoginName && t.password === teamLoginPassword
    );
    
    if (team) {
      setCurrentTeam(team);
      setView('team');
    } else {
      alert('Invalid team credentials');
    }
  };

  // Admin: Create/Edit Game
  const saveGame = () => {
    const validationErrors = validateGameForm(gameForm);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    const newGame = {
      name: gameForm.name,
      code: gameForm.code.toUpperCase(),
      clueSequence: gameForm.clueSequence,
      teams: appState.game?.teams || [],
      status: 'setup', // setup, active, completed
      createdAt: Date.now()
    };

    setAppState(prev => ({
      ...prev,
      game: newGame
    }));

    setShowGameForm(false);
    setGameForm({ name: '', code: '', clueSequence: [] });
  };

  // Admin: Start Game
  const startGame = () => {
    if (!appState.game) return;
    if (appState.game.teams.length === 0) {
      alert('Add at least one team before starting');
      return;
    }
    
    if (confirm('Start the game? Teams will be able to begin racing!')) {
      setAppState(prev => ({
        ...prev,
        game: { ...prev.game, status: 'active' }
      }));
    }
  };

  // Admin: Save Team
  const saveTeam = () => {
    if (!teamForm.name || !teamForm.password) {
      alert('Team name and password required');
      return;
    }

    if (!appState.game) {
      alert('Create a game first');
      return;
    }

    if (editingTeamId) {
      setAppState(prev => ({
        ...prev,
        game: {
          ...prev.game,
          teams: prev.game.teams.map(t => 
            t.id === editingTeamId 
              ? { ...t, ...teamForm }
              : t
          )
        }
      }));
    } else {
      const newTeam = {
        id: Date.now(),
        ...teamForm,
        currentClueIndex: 0,
        completedClues: []
      };
      
      setAppState(prev => ({
        ...prev,
        game: {
          ...prev.game,
          teams: [...prev.game.teams, newTeam]
        }
      }));
    }
    
    setShowTeamForm(false);
    setTeamForm({ name: '', password: '' });
    setEditingTeamId(null);
  };

  // Admin: Delete Team
  const deleteTeam = (teamId) => {
    if (confirm('Delete this team?')) {
      setAppState(prev => ({
        ...prev,
        game: {
          ...prev.game,
          teams: prev.game.teams.filter(t => t.id !== teamId)
        }
      }));
    }
  };

  // Admin: Save Clue to Library
  const saveClue = () => {
    if (!clueForm.title) {
      alert('Clue title required');
      return;
    }

    if (clueForm.type === 'detour' && (!clueForm.detourOptionA.title || !clueForm.detourOptionB.title)) {
      alert('Both detour options required');
      return;
    }

    if (clueForm.type === 'road-block' && (!clueForm.roadblockQuestion || !clueForm.roadblockTask)) {
      alert('Roadblock question and task required');
      return;
    }

    const clueData = {
      ...clueForm,
      content: clueForm.content.filter(c => c.trim() !== '')
    };

    if (editingClueId) {
      setAppState(prev => ({
        ...prev,
        clueLibrary: prev.clueLibrary.map(c => 
          c.id === editingClueId ? { ...c, ...clueData } : c
        )
      }));
    } else {
      const newClue = {
        id: Date.now(),
        ...clueData
      };
      setAppState(prev => ({
        ...prev,
        clueLibrary: [...prev.clueLibrary, newClue]
      }));
    }
    
    setShowClueForm(false);
    setClueForm({ 
      type: 'route-info', 
      title: '', 
      content: ['', '', ''],
      detourOptionA: { title: '', description: '' },
      detourOptionB: { title: '', description: '' },
      roadblockQuestion: '',
      roadblockTask: ''
    });
    setEditingClueId(null);
  };

  // Admin: Delete Clue
  const deleteClue = (clueId) => {
    if (confirm('Delete this clue?')) {
      setAppState(prev => ({
        ...prev,
        clueLibrary: prev.clueLibrary.filter(c => c.id !== clueId)
      }));
    }
  };

  // Admin: Export Clues
  const exportClues = () => {
    const clueData = {
      version: "1.0",
      exportDate: new Date().toISOString(),
      clues: appState.clueLibrary.map(clue => {
        const { id, ...clueWithoutId } = clue;
        return clueWithoutId;
      })
    };
    
    const dataStr = JSON.stringify(clueData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `amazing-race-clues-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Admin: Import Clues
  const importClues = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        
        if (!importedData.clues || !Array.isArray(importedData.clues)) {
          alert('Invalid file format: missing clues array');
          return;
        }

        const validClues = importedData.clues.filter(clue => {
          if (!clue.type || !clue.title) return false;
          if (clue.type === 'detour' && (!clue.detourOptionA || !clue.detourOptionB)) return false;
          if (clue.type === 'road-block' && (!clue.roadblockQuestion || !clue.roadblockTask)) return false;
          return true;
        });

        if (validClues.length === 0) {
          alert('No valid clues found in file');
          return;
        }

        const shouldReplace = confirm(
          `Found ${validClues.length} valid clues.\n\n` +
          `Click OK to REPLACE all existing clues.\n` +
          `Click Cancel to ADD to existing clues.`
        );

        const cluesWithIds = validClues.map(clue => ({
          ...clue,
          id: Date.now() + Math.random()
        }));

        setAppState(prev => ({
          ...prev,
          clueLibrary: shouldReplace ? cluesWithIds : [...prev.clueLibrary, ...cluesWithIds]
        }));

        alert(`Successfully imported ${validClues.length} clues!`);
        event.target.value = '';
      } catch (error) {
        alert('Error parsing file: ' + error.message);
      }
    };
    
    reader.readAsText(file);
  };

  // Team: Choose Detour
  const chooseDetour = (option) => {
    const teamStateKey = `${currentTeam.id}-${currentTeam.currentClueIndex}`;
    setAppState(prev => ({
      ...prev,
      teamStates: {
        ...prev.teamStates,
        [teamStateKey]: { detourChoice: option }
      }
    }));
    setSelectedDetour(option);
  };

  // Team: Assign Roadblock Player
  const assignRoadblockPlayer = () => {
    if (!roadblockPlayer.trim()) {
      alert('Please enter a team member name');
      return;
    }
    const teamStateKey = `${currentTeam.id}-${currentTeam.currentClueIndex}`;
    setAppState(prev => ({
      ...prev,
      teamStates: {
        ...prev.teamStates,
        [teamStateKey]: { roadblockPlayer: roadblockPlayer }
      }
    }));
    setRoadblockRevealed(true);
  };

  // Team: Submit Proof
  const submitProof = () => {
    if (!submissionProof.trim()) {
      alert('Please provide proof of completion');
      return;
    }

    const currentClue = getCurrentClue();
    const teamStateKey = `${currentTeam.id}-${currentTeam.currentClueIndex}`;
    const teamState = appState.teamStates[teamStateKey] || {};

    const submission = {
      id: Date.now(),
      teamId: currentTeam.id,
      teamName: currentTeam.name,
      clueIndex: currentTeam.currentClueIndex,
      clueId: appState.game.clueSequence[currentTeam.currentClueIndex],
      clueType: currentClue.type,
      detourChoice: teamState.detourChoice,
      roadblockPlayer: teamState.roadblockPlayer,
      proof: submissionProof,
      notes: submissionNotes,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };

    setAppState(prev => ({
      ...prev,
      submissions: [...prev.submissions, submission]
    }));

    setSubmissionProof('');
    setSubmissionNotes('');
    alert('Submission sent! Waiting for approval...');
  };

  // Admin: Approve Submission
  const approveSubmission = (submissionId) => {
    const submission = appState.submissions.find(s => s.id === submissionId);
    
    setAppState(prev => ({
      ...prev,
      submissions: prev.submissions.map(s =>
        s.id === submissionId ? { ...s, status: 'approved' } : s
      ),
      game: {
        ...prev.game,
        teams: prev.game.teams.map(t =>
          t.id === submission.teamId
            ? {
                ...t,
                currentClueIndex: t.currentClueIndex + 1,
                completedClues: [...t.completedClues, submission.clueId]
              }
            : t
        )
      }
    }));
  };

  // Admin: Reject Submission
  const rejectSubmission = (submissionId) => {
    setAppState(prev => ({
      ...prev,
      submissions: prev.submissions.map(s =>
        s.id === submissionId ? { ...s, status: 'rejected' } : s
      )
    }));
  };

  // Get current team's clue
  const getCurrentClue = () => {
    if (!currentTeam || !appState.game) return null;
    if (currentTeam.currentClueIndex >= appState.game.clueSequence.length) return null;
    
    const clueId = appState.game.clueSequence[currentTeam.currentClueIndex];
    return appState.clueLibrary.find(c => c.id === clueId);
  };

  // Check if team has pending submission
  const hasPendingSubmission = () => {
    return appState.submissions.some(
      s => s.teamId === currentTeam?.id && 
           s.clueIndex === currentTeam?.currentClueIndex && 
           s.status === 'pending'
    );
  };

  // Get team state for current clue
  const getCurrentTeamState = () => {
    const teamStateKey = `${currentTeam?.id}-${currentTeam?.currentClueIndex}`;
    return appState.teamStates[teamStateKey] || {};
  };

  // Copy game code to clipboard
  const copyGameCode = async () => {
    const success = await copyToClipboard(appState.game.code);
    if (success) {
      // Show a temporary success message instead of alert
      setErrors([]);
      setTimeout(() => setErrors([]), 2000);
    } else {
      setErrors(['Failed to copy game code']);
    }
  };

  // Render Clue Card
  const renderClueCard = (clue, detourChoice = null) => {
    const badgeColors = {
      'route-info': 'bg-cyan-400',
      'detour': 'bg-yellow-400',
      'road-block': 'bg-red-400'
    };

    const badgeText = {
      'route-info': 'ROUTE INFO',
      'detour': 'DETOUR',
      'road-block': 'ROAD BLOCK'
    };

    let displayContent = clue.content;
    let displayTitle = clue.title;

    if (clue.type === 'detour' && detourChoice) {
      const option = detourChoice === 'A' ? clue.detourOptionA : clue.detourOptionB;
      displayTitle = option.title;
      displayContent = [option.description];
    }

    return (
      <div className="w-full max-w-md bg-yellow-400 rounded-3xl overflow-hidden shadow-2xl">
        <div className="bg-black text-white py-8 px-6 text-center">
          <p className="text-2xl font-bold tracking-widest">THE AMAZING</p>
          <p className="text-6xl font-bold tracking-widest text-yellow-400">RACE</p>
        </div>
        <div className="p-8">
          <div className={`${badgeColors[clue.type]} text-black text-3xl font-bold text-center py-4 -mx-2 mb-6 rounded-xl`}>
            {badgeText[clue.type]}
          </div>
          <div className="bg-white rounded-xl p-8 min-h-[400px]">
            <h2 className="text-3xl font-bold text-center mb-6">{displayTitle}</h2>
            {displayContent.map((paragraph, idx) => (
              <p key={idx} className="text-lg leading-relaxed mb-4">{paragraph}</p>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // LOGIN VIEW
  if (view === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">THE AMAZING</h1>
            <h2 className="text-5xl font-bold text-yellow-500">RACE</h2>
          </div>

          {errors.length > 0 && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {errors.map((error, index) => (
                <p key={index}>{error}</p>
              ))}
            </div>
          )}

          {loading && (
            <div className="text-center mb-6">
              <LoadingSpinner size="medium" message="Processing..." />
            </div>
          )}

          <div className="space-y-6">
            <div className="border-2 border-gray-200 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-4">Admin Login</h3>
              <input
                type="password"
                placeholder="Admin Password"
                className="w-full px-4 py-2 border rounded-lg mb-4"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
              />
              <button
                onClick={handleAdminLogin}
                className="w-full bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800"
              >
                Login as Admin
              </button>
            </div>

            <div className="border-2 border-gray-200 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-4">Team Login</h3>
              <input
                type="text"
                placeholder="Game Code"
                className="w-full px-4 py-2 border rounded-lg mb-3 uppercase"
                value={gameCode}
                onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                maxLength="6"
              />
              <input
                type="text"
                placeholder="Team Name"
                className="w-full px-4 py-2 border rounded-lg mb-3"
                value={teamLoginName}
                onChange={(e) => setTeamLoginName(e.target.value)}
              />
              <input
                type="password"
                placeholder="Team Password"
                className="w-full px-4 py-2 border rounded-lg mb-4"
                value={teamLoginPassword}
                onChange={(e) => setTeamLoginPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleTeamLogin()}
              />
              <button
                onClick={handleTeamLogin}
                className="w-full bg-yellow-500 text-black py-3 rounded-lg font-bold hover:bg-yellow-600"
              >
                Login as Team
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ADMIN VIEW
  if (view === 'admin') {
    const pendingSubmissions = appState.submissions.filter(s => s.status === 'pending');

    return (
      <div className="min-h-screen bg-gray-100">
        <div className="bg-black text-white py-6 px-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-yellow-400">Game Master Control Panel</p>
          </div>
          <button
            onClick={() => setView('login')}
            className="bg-red-500 px-6 py-2 rounded-lg hover:bg-red-600"
          >
            Logout
          </button>
        </div>

        <div className="p-8">
          {/* Game Status */}
          {appState.game ? (
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-xl p-6 mb-8 shadow-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-3xl font-bold mb-2">{appState.game.name}</h2>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="bg-black text-yellow-400 px-4 py-2 rounded-lg font-mono text-2xl font-bold">
                      {appState.game.code}
                    </div>
                    <button
                      onClick={copyGameCode}
                      className="bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-100 flex items-center gap-2"
                    >
                      <Copy className="w-4 h-4" /> Copy Code
                    </button>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <span className="bg-white bg-opacity-50 px-3 py-1 rounded">
                      {appState.game.teams.length} Teams
                    </span>
                    <span className="bg-white bg-opacity-50 px-3 py-1 rounded">
                      {appState.game.clueSequence.length} Clues
                    </span>
                    <span className={`px-3 py-1 rounded font-bold ${
                      appState.game.status === 'active' ? 'bg-green-500 text-white' : 
                      appState.game.status === 'setup' ? 'bg-gray-600 text-white' :
                      'bg-blue-500 text-white'
                    }`}>
                      {appState.game.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {appState.game.status === 'setup' && (
                    <>
                      <button
                        onClick={() => {
                          setGameForm({
                            name: appState.game.name,
                            code: appState.game.code,
                            clueSequence: appState.game.clueSequence
                          });
                          setShowGameForm(true);
                        }}
                        className="bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-100"
                      >
                        Edit Game
                      </button>
                      <button
                        onClick={startGame}
                        className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 flex items-center gap-2 font-bold"
                      >
                        <Play className="w-5 h-5" /> Start Game
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl p-12 text-center mb-8 shadow">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h2 className="text-2xl font-bold mb-4">No Active Game</h2>
              <p className="text-gray-600 mb-6">Create a new game to get started</p>
              <button
                onClick={() => {
                  setGameForm({ name: '', code: generateGameCode(), clueSequence: [] });
                  setShowGameForm(true);
                }}
                className="bg-yellow-500 text-black px-8 py-3 rounded-lg font-bold hover:bg-yellow-600"
              >
                Create New Game
              </button>
            </div>
          )}

          {/* Game Setup Form */}
          {showGameForm && (
            <div className="bg-white rounded-xl p-6 shadow mb-8 border-4 border-yellow-400">
              <h3 className="text-2xl font-bold mb-6">
                {appState.game ? 'Edit Game' : 'Create New Game'}
              </h3>
              
              <label className="block text-sm font-bold mb-2">Game Name:</label>
              <input
                type="text"
                placeholder="e.g., London Adventure"
                className="w-full px-4 py-2 border rounded-lg mb-4"
                value={gameForm.name}
                onChange={(e) => setGameForm({ ...gameForm, name: e.target.value })}
              />

              <label className="block text-sm font-bold mb-2">Game Code (6 characters):</label>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="LONDON"
                  className="flex-1 px-4 py-2 border rounded-lg uppercase font-mono text-xl"
                  value={gameForm.code}
                  onChange={(e) => setGameForm({ ...gameForm, code: e.target.value.toUpperCase() })}
                  maxLength="6"
                />
                <button
                  onClick={() => setGameForm({ ...gameForm, code: generateGameCode() })}
                  className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300"
                >
                  Generate
                </button>
              </div>

              <label className="block text-sm font-bold mb-2">Select Clues (in order):</label>
              <select
                multiple
                className="w-full px-4 py-2 border rounded-lg mb-2"
                size="8"
                value={gameForm.clueSequence}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, option => parseInt(option.value));
                  setGameForm({ ...gameForm, clueSequence: selected });
                }}
              >
                {appState.clueLibrary.map(clue => (
                  <option key={clue.id} value={clue.id}>
                    [{clue.type.toUpperCase().replace('-', ' ')}] {clue.title}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-600 mb-4">Hold Ctrl/Cmd to select multiple. Order matters!</p>

              <div className="flex gap-2">
                <button
                  onClick={saveGame}
                  className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600"
                >
                  Save Game
                </button>
                <button
                  onClick={() => {
                    setShowGameForm(false);
                    setGameForm({ name: '', code: '', clueSequence: [] });
                  }}
                  className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Stats */}
          {appState.game && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl p-6 shadow">
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-8 h-8 text-blue-500" />
                  <span className="text-3xl font-bold">{appState.game.teams.length}</span>
                </div>
                <p className="text-gray-600">Teams in Game</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow">
                <div className="flex items-center justify-between mb-2">
                  <Clock className="w-8 h-8 text-yellow-500" />
                  <span className="text-3xl font-bold">{pendingSubmissions.length}</span>
                </div>
                <p className="text-gray-600">Pending Approvals</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow">
                <div className="flex items-center justify-between mb-2">
                  <Trophy className="w-8 h-8 text-green-500" />
                  <span className="text-3xl font-bold">{appState.clueLibrary.length}</span>
                </div>
                <p className="text-gray-600">Clues in Library</p>
              </div>
            </div>
          )}

          {/* Pending Submissions */}
          {pendingSubmissions.length > 0 && (
            <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-6 mb-8">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Clock className="w-6 h-6" />
                Pending Approvals
              </h2>
              <div className="space-y-4">
                {pendingSubmissions.map(sub => {
                  const clue = appState.clueLibrary.find(c => c.id === sub.clueId);
                  return (
                    <div key={sub.id} className="bg-white rounded-lg p-4 border-2 border-yellow-400">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-bold text-lg">{sub.teamName}</h3>
                          <p className="text-sm text-gray-600">Clue: {clue?.title || 'Unknown'}</p>
                          {sub.clueType === 'detour' && sub.detourChoice && (
                            <p className="text-sm text-blue-600">Detour Choice: Option {sub.detourChoice}</p>
                          )}
                          {sub.clueType === 'road-block' && sub.roadblockPlayer && (
                            <p className="text-sm text-purple-600">Roadblock Player: {sub.roadblockPlayer}</p>
                          )}
                          <p className="text-xs text-gray-500">{new Date(sub.timestamp).toLocaleString()}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => approveSubmission(sub.id)}
                            className="bg-green-500 text-white p-2 rounded-lg hover:bg-green-600"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => rejectSubmission(sub.id)}
                            className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      <div className="bg-gray-100 p-3 rounded">
                        <p className="font-semibold text-sm mb-1">Proof:</p>
                        <p className="text-sm mb-2">{sub.proof}</p>
                        {sub.notes && (
                          <>
                            <p className="font-semibold text-sm mb-1">Notes:</p>
                            <p className="text-sm">{sub.notes}</p>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Teams Section */}
          {appState.game && (
            <div className="bg-white rounded-xl p-6 shadow mb-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Teams in {appState.game.name}</h2>
                <button
                  onClick={() => setShowTeamForm(true)}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-600"
                  disabled={appState.game.status === 'active'}
                >
                  <Plus className="w-5 h-5" /> Add Team
                </button>
              </div>

              {showTeamForm && (
                <div className="mb-6 p-6 bg-gray-50 rounded-lg border-2 border-blue-400">
                  <h3 className="text-xl font-bold mb-4">{editingTeamId ? 'Edit' : 'Add'} Team</h3>
                  <input
                    type="text"
                    placeholder="Team Name"
                    className="w-full px-4 py-2 border rounded-lg mb-3"
                    value={teamForm.name}
                    onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Team Password"
                    className="w-full px-4 py-2 border rounded-lg mb-3"
                    value={teamForm.password}
                    onChange={(e) => setTeamForm({ ...teamForm, password: e.target.value })}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={saveTeam}
                      className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setShowTeamForm(false);
                        setEditingTeamId(null);
                        setTeamForm({ name: '', password: '' });
                      }}
                      className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {appState.game.teams.map(team => (
                  <div key={team.id} className="border rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-lg">{team.name}</h3>
                      <p className="text-sm text-gray-600">
                        Progress: {team.currentClueIndex} / {appState.game.clueSequence.length} clues
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {appState.game.status === 'setup' && (
                        <>
                          <button
                            onClick={() => {
                              setEditingTeamId(team.id);
                              setTeamForm({
                                name: team.name,
                                password: team.password
                              });
                              setShowTeamForm(true);
                            }}
                            className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => deleteTeam(team.id)}
                            className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {appState.game.teams.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No teams yet. Add your first team!</p>
                )}
              </div>
            </div>
          )}

          {/* Clue Library Section */}
          <div className="bg-white rounded-xl p-6 shadow">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Clue Library</h2>
              <div className="flex gap-2">
                <input
                  type="file"
                  accept=".json"
                  onChange={importClues}
                  style={{ display: 'none' }}
                  id="clue-import"
                />
                <label
                  htmlFor="clue-import"
                  className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-600 font-bold cursor-pointer"
                >
                  <Plus className="w-5 h-5" /> Import
                </label>
                <button
                  onClick={exportClues}
                  className="bg-purple-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-600 font-bold"
                  disabled={appState.clueLibrary.length === 0}
                >
                  <Eye className="w-5 h-5" /> Export
                </button>
                <button
                  onClick={() => setShowClueForm(true)}
                  className="bg-yellow-500 text-black px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-yellow-600 font-bold"
                >
                  <Plus className="w-5 h-5" /> Add Clue
                </button>
              </div>
            </div>

            {showClueForm && (
              <div className="mb-6 p-6 bg-gray-50 rounded-lg border-2 border-yellow-400 max-h-[600px] overflow-y-auto">
                <h3 className="text-xl font-bold mb-4">{editingClueId ? 'Edit' : 'Add'} Clue</h3>
                
                <label className="block text-sm font-bold mb-2">Card Type:</label>
                <select
                  className="w-full px-4 py-2 border rounded-lg mb-4"
                  value={clueForm.type}
                  onChange={(e) => setClueForm({ ...clueForm, type: e.target.value })}
                >
                  <option value="route-info">Route Info</option>
                  <option value="detour">Detour</option>
                  <option value="road-block">Road Block</option>
                </select>

                <label className="block text-sm font-bold mb-2">Title:</label>
                <input
                  type="text"
                  placeholder="Challenge Title"
                  className="w-full px-4 py-2 border rounded-lg mb-4"
                  value={clueForm.title}
                  onChange={(e) => setClueForm({ ...clueForm, title: e.target.value })}
                />

                {clueForm.type === 'route-info' && (
                  <>
                    <label className="block text-sm font-bold mb-2">Content (paragraphs):</label>
                    {clueForm.content.map((para, idx) => (
                      <textarea
                        key={idx}
                        placeholder={`Paragraph ${idx + 1}`}
                        className="w-full px-4 py-2 border rounded-lg mb-3"
                        rows="3"
                        value={para}
                        onChange={(e) => {
                          const newContent = [...clueForm.content];
                          newContent[idx] = e.target.value;
                          setClueForm({ ...clueForm, content: newContent });
                        }}
                      />
                    ))}
                    <button
                      onClick={() => setClueForm({ ...clueForm, content: [...clueForm.content, ''] })}
                      className="text-blue-500 text-sm mb-4 hover:underline"
                    >
                      + Add another paragraph
                    </button>
                  </>
                )}

                {clueForm.type === 'detour' && (
                  <>
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
                      <h4 className="font-bold mb-3">Option A</h4>
                      <input
                        type="text"
                        placeholder="Option A Title (e.g., 'Stack It')"
                        className="w-full px-4 py-2 border rounded-lg mb-2"
                        value={clueForm.detourOptionA.title}
                        onChange={(e) => setClueForm({ 
                          ...clueForm, 
                          detourOptionA: { ...clueForm.detourOptionA, title: e.target.value }
                        })}
                      />
                      <textarea
                        placeholder="Option A Description"
                        className="w-full px-4 py-2 border rounded-lg"
                        rows="4"
                        value={clueForm.detourOptionA.description}
                        onChange={(e) => setClueForm({ 
                          ...clueForm, 
                          detourOptionA: { ...clueForm.detourOptionA, description: e.target.value }
                        })}
                      />
                    </div>

                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded">
                      <h4 className="font-bold mb-3">Option B</h4>
                      <input
                        type="text"
                        placeholder="Option B Title (e.g., 'Track It')"
                        className="w-full px-4 py-2 border rounded-lg mb-2"
                        value={clueForm.detourOptionB.title}
                        onChange={(e) => setClueForm({ 
                          ...clueForm, 
                          detourOptionB: { ...clueForm.detourOptionB, title: e.target.value }
                        })}
                      />
                      <textarea
                        placeholder="Option B Description"
                        className="w-full px-4 py-2 border rounded-lg"
                        rows="4"
                        value={clueForm.detourOptionB.description}
                        onChange={(e) => setClueForm({ 
                          ...clueForm, 
                          detourOptionB: { ...clueForm.detourOptionB, description: e.target.value }
                        })}
                      />
                    </div>
                  </>
                )}

                {clueForm.type === 'road-block' && (
                  <>
                    <label className="block text-sm font-bold mb-2">Roadblock Question (cryptic):</label>
                    <input
                      type="text"
                      placeholder="e.g., Who's ready to get their hands dirty?"
                      className="w-full px-4 py-2 border rounded-lg mb-4"
                      value={clueForm.roadblockQuestion}
                      onChange={(e) => setClueForm({ ...clueForm, roadblockQuestion: e.target.value })}
                    />
                    <label className="block text-sm font-bold mb-2">Roadblock Task (revealed after player selection):</label>
                    <textarea
                      placeholder="e.g., One team member must eat 6 escargots"
                      className="w-full px-4 py-2 border rounded-lg mb-4"
                      rows="4"
                      value={clueForm.roadblockTask}
                      onChange={(e) => setClueForm({ ...clueForm, roadblockTask: e.target.value })}
                    />
                  </>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={saveClue}
                    className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600"
                  >
                    Save Clue
                  </button>
                  <button
                    onClick={() => {
                      setShowClueForm(false);
                      setEditingClueId(null);
                      setClueForm({ 
                        type: 'route-info', 
                        title: '', 
                        content: ['', '', ''],
                        detourOptionA: { title: '', description: '' },
                        detourOptionB: { title: '', description: '' },
                        roadblockQuestion: '',
                        roadblockTask: ''
                      });
                    }}
                    className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {appState.clueLibrary.map(clue => (
                <div key={clue.id} className="border rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <span className={`inline-block px-3 py-1 rounded text-xs font-bold mr-2 ${
                      clue.type === 'route-info' ? 'bg-cyan-400' :
                      clue.type === 'detour' ? 'bg-yellow-400' :
                      'bg-red-400'
                    }`}>
                      {clue.type.toUpperCase().replace('-', ' ')}
                    </span>
                    <span className="font-bold text-lg">{clue.title}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingClueId(clue.id);
                        setClueForm({
                          type: clue.type,
                          title: clue.title,
                          content: clue.content ? [...clue.content, '', '', ''].slice(0, 3) : ['', '', ''],
                          detourOptionA: clue.detourOptionA || { title: '', description: '' },
                          detourOptionB: clue.detourOptionB || { title: '', description: '' },
                          roadblockQuestion: clue.roadblockQuestion || '',
                          roadblockTask: clue.roadblockTask || ''
                        });
                        setShowClueForm(true);
                      }}
                      className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => deleteClue(clue.id)}
                      className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
              {appState.clueLibrary.length === 0 && (
                <p className="text-center text-gray-500 py-8">No clues yet. Create your first clue!</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // TEAM VIEW
  if (view === 'team') {
    const currentClue = getCurrentClue();
    const isFinished = currentTeam.currentClueIndex >= appState.game.clueSequence.length;
    const isPending = hasPendingSubmission();
    const teamState = getCurrentTeamState();

    // Update current team data
    const updatedTeam = appState.game?.teams.find(t => t.id === currentTeam.id);
    if (updatedTeam && updatedTeam.currentClueIndex !== currentTeam.currentClueIndex) {
      setCurrentTeam(updatedTeam);
      setSelectedDetour(null);
      setRoadblockPlayer('');
      setRoadblockRevealed(false);
    }

    if (appState.game?.status !== 'active') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-12 text-center shadow-2xl max-w-md">
            <Clock className="w-24 h-24 mx-auto mb-6 text-gray-400" />
            <h2 className="text-3xl font-bold mb-4">Game Not Started</h2>
            <p className="text-gray-600 mb-6">The game master hasn't started the race yet. Please wait!</p>
            <button
              onClick={() => {
                setView('login');
                setCurrentTeam(null);
              }}
              className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
            >
              Back to Login
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-400 to-yellow-600 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-black text-white rounded-2xl p-6 mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">{currentTeam.name}</h1>
              <p className="text-yellow-400">
                Clue {currentTeam.currentClueIndex + 1} of {appState.game.clueSequence.length}
              </p>
            </div>
            <button
              onClick={() => {
                setView('login');
                setCurrentTeam(null);
                setSelectedDetour(null);
                setRoadblockPlayer('');
                setRoadblockRevealed(false);
              }}
              className="bg-red-500 px-6 py-2 rounded-lg hover:bg-red-600"
            >
              Logout
            </button>
          </div>

          {isFinished ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-2xl">
              <Trophy className="w-24 h-24 mx-auto mb-6 text-yellow-500" />
              <h2 className="text-4xl font-bold mb-4">Congratulations!</h2>
              <p className="text-xl text-gray-600">You've completed all clues!</p>
              <p className="text-lg text-gray-500 mt-4">Check with the game master for your final results.</p>
            </div>
          ) : currentClue ? (
            <>
              {/* DETOUR: Show choice screen first */}
              {currentClue.type === 'detour' && !teamState.detourChoice && (
                <div className="bg-white rounded-2xl p-8 shadow-2xl mb-8">
                  <div className="text-center mb-8">
                    <div className="bg-yellow-400 text-black text-4xl font-bold py-4 px-8 rounded-xl inline-block mb-6">
                      DETOUR
                    </div>
                    <h2 className="text-3xl font-bold mb-4">{currentClue.title}</h2>
                    <p className="text-lg text-gray-600 mb-8">Choose one of the following tasks to complete:</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border-4 border-blue-400 rounded-xl p-6 hover:bg-blue-50 cursor-pointer transition"
                         onClick={() => chooseDetour('A')}>
                      <h3 className="text-2xl font-bold mb-4 text-blue-600">Option A</h3>
                      <h4 className="text-xl font-bold mb-3">{currentClue.detourOptionA.title}</h4>
                      <p className="text-gray-700">{currentClue.detourOptionA.description}</p>
                      <button className="w-full mt-6 bg-blue-500 text-white py-3 rounded-lg font-bold hover:bg-blue-600">
                        Choose Option A
                      </button>
                    </div>

                    <div className="border-4 border-green-400 rounded-xl p-6 hover:bg-green-50 cursor-pointer transition"
                         onClick={() => chooseDetour('B')}>
                      <h3 className="text-2xl font-bold mb-4 text-green-600">Option B</h3>
                      <h4 className="text-xl font-bold mb-3">{currentClue.detourOptionB.title}</h4>
                      <p className="text-gray-700">{currentClue.detourOptionB.description}</p>
                      <button className="w-full mt-6 bg-green-500 text-white py-3 rounded-lg font-bold hover:bg-green-600">
                        Choose Option B
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* DETOUR: Show chosen option as clue card */}
              {currentClue.type === 'detour' && teamState.detourChoice && (
                <div className="flex justify-center mb-8">
                  {renderClueCard(currentClue, teamState.detourChoice)}
                </div>
              )}

              {/* ROADBLOCK: Show question and player selection first */}
              {currentClue.type === 'road-block' && !roadblockRevealed && !teamState.roadblockPlayer && (
                <div className="bg-white rounded-2xl p-8 shadow-2xl mb-8">
                  <div className="text-center mb-8">
                    <div className="bg-red-400 text-black text-4xl font-bold py-4 px-8 rounded-xl inline-block mb-6">
                      ROAD BLOCK
                    </div>
                    <h2 className="text-3xl font-bold mb-4">{currentClue.title}</h2>
                    
                    <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-8 mb-8">
                      <AlertCircle className="w-16 h-16 mx-auto mb-4 text-yellow-600" />
                      <p className="text-2xl font-bold mb-4">{currentClue.roadblockQuestion}</p>
                      <p className="text-gray-600">Only ONE team member can complete this task.</p>
                    </div>

                    <div className="max-w-md mx-auto">
                      <label className="block font-bold mb-3 text-left">Who will do this Roadblock?</label>
                      <input
                        type="text"
                        placeholder="Enter team member's name"
                        className="w-full px-4 py-3 border-2 rounded-lg mb-4 text-lg"
                        value={roadblockPlayer}
                        onChange={(e) => setRoadblockPlayer(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && assignRoadblockPlayer()}
                      />
                      <button
                        onClick={assignRoadblockPlayer}
                        className="w-full bg-red-500 text-white py-4 rounded-lg text-xl font-bold hover:bg-red-600"
                      >
                        Commit to Player
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ROADBLOCK: Show task after player is committed */}
              {currentClue.type === 'road-block' && (roadblockRevealed || teamState.roadblockPlayer) && (
                <div className="mb-8">
                  <div className="bg-blue-100 border-2 border-blue-400 rounded-xl p-4 mb-4 text-center">
                    <p className="font-bold text-lg">
                      Roadblock Player: {teamState.roadblockPlayer || roadblockPlayer}
                    </p>
                  </div>
                  <div className="flex justify-center">
                    {renderClueCard({
                      type: 'road-block',
                      title: currentClue.title,
                      content: [currentClue.roadblockTask]
                    })}
                  </div>
                </div>
              )}

              {/* ROUTE INFO: Show immediately */}
              {currentClue.type === 'route-info' && (
                <div className="flex justify-center mb-8">
                  {renderClueCard(currentClue)}
                </div>
              )}

              {/* SUBMISSION FORM - Show only when ready */}
              {((currentClue.type === 'route-info') ||
                (currentClue.type === 'detour' && teamState.detourChoice) ||
                (currentClue.type === 'road-block' && (roadblockRevealed || teamState.roadblockPlayer))) && (
                <div className="bg-white rounded-2xl p-8 shadow-2xl">
                  <h2 className="text-2xl font-bold mb-6">Submit Proof of Completion</h2>
                  
                  {isPending ? (
                    <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-6 text-center">
                      <Clock className="w-16 h-16 mx-auto mb-4 text-yellow-600" />
                      <p className="text-xl font-bold mb-2">Submission Pending</p>
                      <p className="text-gray-600">Waiting for game master approval...</p>
                    </div>
                  ) : (
                    <>
                      <div className="mb-4">
                        <label className="block font-bold mb-2">Proof (describe or upload photo):</label>
                        <textarea
                          className="w-full px-4 py-3 border-2 rounded-lg"
                          rows="4"
                          placeholder="Describe your proof of completion or paste image URL..."
                          value={submissionProof}
                          onChange={(e) => setSubmissionProof(e.target.value)}
                        />
                      </div>

                      <div className="mb-6">
                        <label className="block font-bold mb-2">Additional Notes (optional):</label>
                        <textarea
                          className="w-full px-4 py-3 border-2 rounded-lg"
                          rows="2"
                          placeholder="Any additional information..."
                          value={submissionNotes}
                          onChange={(e) => setSubmissionNotes(e.target.value)}
                        />
                      </div>

                      <button
                        onClick={submitProof}
                        className="w-full bg-yellow-500 text-black py-4 rounded-lg text-xl font-bold hover:bg-yellow-600 flex items-center justify-center gap-2"
                      >
                        <Camera className="w-6 h-6" />
                        Submit for Approval
                      </button>
                    </>
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    );
  }

  return null;
}

export default function AmazingRaceAppWrapper() {
  return (
    <ErrorBoundary>
      <AmazingRaceApp />
    </ErrorBoundary>
  );
}