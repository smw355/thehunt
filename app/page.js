'use client';

import React, { useState, useEffect } from 'react';
import { Camera, Check, X, Users, Plus, Edit2, Trash2, Eye, Clock, Trophy, AlertCircle, Play, Copy } from 'lucide-react';
import ErrorBoundary from '../components/ErrorBoundary';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { validateGameForm, validateTeamForm, validateClueForm, copyToClipboard, downloadJSON, parseJSONFile } from '../utils/gameUtils';
import PhotoUpload from '../components/PhotoUpload';
import { gameService, teamService, submissionService, clueService } from '../utils/databaseService';

// App state for database integration
const initialAppState = {
  game: null, // Current active game
  teams: [], // Teams for current game
  clueLibrary: [], // Shared clue library
  submissions: [],
  teamStates: {}
};

function AmazingRaceApp() {
  const [view, setView] = useState('login'); // 'login', 'admin', 'team'
  const [appState, setAppState] = useState(initialAppState);
  const [dataLoaded, setDataLoaded] = useState(false);
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
    roadblockTask: '',
    requiredPhotos: 0
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
  const [submissionPhotos, setSubmissionPhotos] = useState([]);

  // Admin: Comments for rejections
  const [adminComments, setAdminComments] = useState({});
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentingSubmissionId, setCommentingSubmissionId] = useState(null);
  const [currentAdminComment, setCurrentAdminComment] = useState('');

  // Generate random game code
  const generateGameCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem('theRaceSession');
    setView('login');
    setCurrentTeam(null);
    setSelectedDetour(null);
    setRoadblockPlayer('');
    setRoadblockRevealed(false);
  };

  // Load data from database
  const loadClueLibrary = async () => {
    try {
      const clues = await clueService.getAll();
      setAppState(prev => ({ ...prev, clueLibrary: clues }));
    } catch (error) {
      console.error('Failed to load clue library:', error);
      setErrors(prev => [...prev, 'Failed to load clue library']);
    }
  };

  const loadGameData = async () => {
    try {
      if (!appState.game) return;

      const [teams, submissions] = await Promise.all([
        teamService.getByGameId(appState.game.id),
        submissionService.getByGameId(appState.game.id)
      ]);

      setAppState(prev => ({
        ...prev,
        teams,
        submissions
      }));
    } catch (error) {
      console.error('Failed to load game data:', error);
      setErrors(prev => [...prev, 'Failed to load game data']);
    }
  };

  // Initial data load and session restoration
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      await loadClueLibrary();

      // Try to restore session
      const savedSession = localStorage.getItem('theRaceSession');
      if (savedSession) {
        try {
          const session = JSON.parse(savedSession);
          if (session.view && session.currentTeam && session.gameCode) {
            // Restore team session
            const game = await gameService.findByCode(session.gameCode);
            const teams = await teamService.getByGameId(game.id);
            const submissions = await submissionService.getByGameId(game.id);

            const team = teams.find(t => t.id === session.currentTeam.id);
            if (team) {
              setCurrentTeam(team);
              setAppState(prev => ({
                ...prev,
                game,
                teams,
                submissions
              }));
              setView(session.view);
              setGameCode(session.gameCode);
            }
          } else if (session.view === 'admin') {
            // Try to restore admin session
            setView('admin');
            // Load games for admin
            const games = await gameService.getAll();
            if (games.length > 0) {
              const latestGame = games[games.length - 1];
              const [teams, submissions] = await Promise.all([
                teamService.getByGameId(latestGame.id),
                submissionService.getByGameId(latestGame.id)
              ]);

              setAppState(prev => ({
                ...prev,
                game: latestGame,
                teams,
                submissions
              }));
            }
          }
        } catch (error) {
          console.error('Failed to restore session:', error);
          localStorage.removeItem('theRaceSession');
        }
      }

      setDataLoaded(true);
      setLoading(false);
    };

    initializeData();
  }, []);

  // Load game-specific data when game changes
  useEffect(() => {
    if (appState.game) {
      loadGameData();
    }
  }, [appState.game]);

  // Auto-refresh data every 10 seconds for real-time updates
  useEffect(() => {
    if (!appState.game) return;

    const interval = setInterval(() => {
      loadGameData();
    }, 10000); // 10 seconds

    // Clear interval on cleanup
    return () => clearInterval(interval);
  }, [appState.game]);

  // Admin Login
  const handleAdminLogin = async () => {
    setLoading(true);
    setErrors([]);

    const correctPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';

    if (adminPassword === correctPassword) {
      try {
        // Load all games to see if there are any existing ones
        const games = await gameService.getAll();

        // If there's a game, load the most recent one
        if (games.length > 0) {
          const latestGame = games[games.length - 1];
          const [teams, submissions] = await Promise.all([
            teamService.getByGameId(latestGame.id),
            submissionService.getByGameId(latestGame.id)
          ]);

          setAppState(prev => ({
            ...prev,
            game: latestGame,
            teams,
            submissions
          }));
        }

        setView('admin');

        // Save admin session
        localStorage.setItem('theRaceSession', JSON.stringify({
          view: 'admin'
        }));
      } catch (error) {
        console.error('Failed to load admin data:', error);
        setErrors(['Failed to load game data']);
        setLoading(false);
        return;
      }
    } else {
      setErrors(['Invalid admin password']);
    }
    setLoading(false);
  };

  // Team Login
  const handleTeamLogin = async () => {
    setLoading(true);
    setErrors([]);

    try {
      // Find game by code
      const game = await gameService.findByCode(gameCode);

      // Get teams for this game
      const teams = await teamService.getByGameId(game.id);

      // Find matching team
      const team = teams.find(
        t => t.name === teamLoginName && t.password === teamLoginPassword
      );

      if (team) {
        setCurrentTeam(team);

        // Load submissions for this game
        const submissions = await submissionService.getByGameId(game.id);

        setAppState(prev => ({
          ...prev,
          game,
          teams,
          submissions
        }));
        setView('team');

        // Save session for persistence
        localStorage.setItem('theRaceSession', JSON.stringify({
          view: 'team',
          currentTeam: team,
          gameCode
        }));
      } else {
        setErrors(['Invalid team credentials']);
      }
    } catch (error) {
      console.error('Team login failed:', error);
      setErrors(['Invalid game code or team credentials']);
    } finally {
      setLoading(false);
    }
  };

  // Admin: Create/Edit Game
  const saveGame = async () => {
    const validationErrors = validateGameForm(gameForm);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Validate that all selected clues exist in the library
    const invalidClues = gameForm.clueSequence.filter(clueId =>
      !appState.clueLibrary.find(c => c.id === clueId)
    );

    if (invalidClues.length > 0) {
      setErrors(['Some selected clues are no longer available. Please refresh and try again.']);
      return;
    }

    if (gameForm.clueSequence.length === 0) {
      setErrors(['Please select at least one clue for the game.']);
      return;
    }

    setLoading(true);
    try {
      const gameData = {
        name: gameForm.name,
        code: gameForm.code.toUpperCase(),
        clueSequence: gameForm.clueSequence
      };

      let updatedGame;
      if (appState.game && appState.game.id) {
        // Update existing game
        updatedGame = await gameService.update(appState.game.id, gameData);
      } else {
        // Create new game
        updatedGame = await gameService.create(gameData);
      }

      setAppState(prev => ({
        ...prev,
        game: updatedGame,
        teams: appState.game ? prev.teams : [] // Keep existing teams if editing
      }));

      setShowGameForm(false);
      setGameForm({ name: '', code: '', clueSequence: [] });
      setErrors([]);
    } catch (error) {
      console.error('Failed to save game:', error);
      setErrors(['Failed to save game']);
    } finally {
      setLoading(false);
    }
  };

  // Admin: Start Game
  const startGame = async () => {
    if (!appState.game) return;
    if (appState.teams.length === 0) {
      alert('Add at least one team before starting');
      return;
    }

    if (confirm('Start the game? Teams will be able to begin racing!')) {
      setLoading(true);
      try {
        const updatedGame = await gameService.update(appState.game.id, { status: 'active' });

        setAppState(prev => ({
          ...prev,
          game: updatedGame
        }));
      } catch (error) {
        console.error('Failed to start game:', error);
        setErrors(['Failed to start game']);
      } finally {
        setLoading(false);
      }
    }
  };

  // Admin: Save Team
  const saveTeam = async () => {
    if (!teamForm.name || !teamForm.password) {
      alert('Team name and password required');
      return;
    }

    if (!appState.game) {
      alert('Create a game first');
      return;
    }

    setLoading(true);
    try {
      if (editingTeamId) {
        // Update existing team
        const updateData = {
          name: teamForm.name,
          password: teamForm.password
        };

        const updatedTeam = await teamService.update(editingTeamId, updateData);

        setAppState(prev => ({
          ...prev,
          teams: prev.teams.map(team =>
            team.id === editingTeamId ? updatedTeam : team
          )
        }));
      } else {
        const teamData = {
          gameId: appState.game.id,
          name: teamForm.name,
          password: teamForm.password
        };

        const newTeam = await teamService.create(teamData);

        setAppState(prev => ({
          ...prev,
          teams: [...prev.teams, newTeam]
        }));
      }

      setShowTeamForm(false);
      setTeamForm({ name: '', password: '' });
      setEditingTeamId(null);
      setErrors([]);
    } catch (error) {
      console.error('Failed to save team:', error);
      setErrors(['Failed to save team']);
    } finally {
      setLoading(false);
    }
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
  const saveClue = async () => {
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

    setLoading(true);
    try {
      if (editingClueId) {
        // Update existing clue in database
        const updatedClue = await clueService.update(editingClueId, clueData);

        setAppState(prev => ({
          ...prev,
          clueLibrary: prev.clueLibrary.map(c =>
            c.id === editingClueId ? updatedClue : c
          )
        }));
      } else {
        // Create new clue in database
        const newClue = await clueService.create(clueData);

        setAppState(prev => ({
          ...prev,
          clueLibrary: [...prev.clueLibrary, newClue]
        }));
      }
    } catch (error) {
      console.error('Error saving clue:', error);
      alert('Failed to save clue. Please try again.');
      return;
    } finally {
      setLoading(false);
    }

    setShowClueForm(false);
    setClueForm({
      type: 'route-info',
      title: '',
      content: ['', '', ''],
      detourOptionA: { title: '', description: '' },
      detourOptionB: { title: '', description: '' },
      roadblockQuestion: '',
      roadblockTask: '',
      requiredPhotos: 0
    });
    setEditingClueId(null);
  };

  // Admin: Delete Clue
  const deleteClue = async (clueId) => {
    if (confirm('Delete this clue?')) {
      setLoading(true);
      try {
        await clueService.delete(clueId);

        setAppState(prev => ({
          ...prev,
          clueLibrary: prev.clueLibrary.filter(c => c.id !== clueId)
        }));
      } catch (error) {
        console.error('Error deleting clue:', error);

        // Handle specific error cases
        if (error.message.includes('submissions')) {
          alert('Cannot delete this clue because teams have submitted photos for it. Please reject or approve all submissions for this clue first, then try deleting again.');
        } else if (error.message.includes('not found')) {
          alert('Clue not found. It may have already been deleted.');
        } else {
          alert('Failed to delete clue. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    }
  };

  // Admin: Delete Game (cascades to delete all teams and submissions)
  const deleteGame = async (gameId) => {
    if (confirm('⚠️ DELETE ENTIRE GAME?\n\nThis will permanently delete:\n• The game\n• All teams\n• All submissions\n\nThis cannot be undone. Are you sure?')) {
      setLoading(true);
      try {
        await gameService.delete(gameId);

        // Clear the current game from state since it's deleted
        setAppState(prev => ({
          ...prev,
          game: null,
          teams: [],
          submissions: []
        }));

        alert('Game deleted successfully! All related data has been removed.');
      } catch (error) {
        console.error('Error deleting game:', error);

        if (error.message.includes('not found')) {
          alert('Game not found. It may have already been deleted.');
        } else {
          alert('Failed to delete game. Please try again.');
        }
      } finally {
        setLoading(false);
      }
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
    link.download = `the-race-clues-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Admin: Import Clues
  const importClues = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        setLoading(true);
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

        // Prepare clues for database (remove the temporary IDs)
        const cluesForDatabase = validClues.map(clue => {
          const dbClue = {
            type: clue.type,
            title: clue.title
          };

          // Handle different clue types
          if (clue.type === 'route-info') {
            dbClue.content = JSON.stringify(clue.content);
          } else if (clue.type === 'detour') {
            dbClue.detourOptionA = JSON.stringify(clue.detourOptionA);
            dbClue.detourOptionB = JSON.stringify(clue.detourOptionB);
          } else if (clue.type === 'road-block') {
            dbClue.roadblockQuestion = clue.roadblockQuestion;
            dbClue.roadblockTask = clue.roadblockTask;
          }

          return dbClue;
        });

        // Import to database
        await clueService.import(cluesForDatabase, shouldReplace);

        // Refresh clue library from database
        await loadClueLibrary();

        alert(`Successfully imported ${validClues.length} clues!`);
        event.target.value = '';
      } catch (error) {
        console.error('Import error:', error);
        alert('Error importing clues: ' + error.message);
      } finally {
        setLoading(false);
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
  const submitProof = async () => {
    const currentClue = getCurrentClue();
    const requiredPhotos = currentClue.clue?.requiredPhotos || 0;

    // Validation for required photos
    if (requiredPhotos > 0) {
      if (submissionPhotos.length < requiredPhotos) {
        setErrors([`This challenge requires exactly ${requiredPhotos} photo${requiredPhotos > 1 ? 's' : ''}. You have uploaded ${submissionPhotos.length}.`]);
        return;
      }
      if (submissionPhotos.length > requiredPhotos) {
        setErrors([`This challenge requires exactly ${requiredPhotos} photo${requiredPhotos > 1 ? 's' : ''}. Please remove ${submissionPhotos.length - requiredPhotos} photo${submissionPhotos.length - requiredPhotos > 1 ? 's' : ''}.`]);
        return;
      }
    } else {
      // No photo requirements - original validation
      if (!submissionProof.trim() && submissionPhotos.length === 0) {
        setErrors(['Please provide proof of completion (photo or text)']);
        return;
      }
    }

    setLoading(true);
    try {
      const currentClue = getCurrentClue();
      const teamStateKey = `${currentTeam.id}-${currentTeam.currentClueIndex}`;
      const teamState = appState.teamStates[teamStateKey] || {};

      const submissionData = {
        teamId: currentTeam.id,
        gameId: appState.game.id,
        clueId: appState.game.clueSequence[currentTeam.currentClueIndex],
        clueIndex: currentTeam.currentClueIndex,
        clueType: currentClue.type,
        detourChoice: teamState.detourChoice || null,
        roadblockPlayer: teamState.roadblockPlayer || null,
        textProof: submissionProof,
        notes: submissionNotes,
        photos: submissionPhotos
      };

      const newSubmission = await submissionService.create(submissionData);

      setAppState(prev => ({
        ...prev,
        submissions: [...prev.submissions, newSubmission]
      }));

      setSubmissionProof('');
      setSubmissionNotes('');
      setSubmissionPhotos([]);
      setErrors(['Submission sent! Waiting for approval...']);
      setTimeout(() => setErrors([]), 3000);
    } catch (error) {
      console.error('Failed to submit proof:', error);
      setErrors(['Failed to submit proof. Please try again.']);
    } finally {
      setLoading(false);
    }
  };

  // Admin: Approve Submission
  const approveSubmission = async (submissionId) => {
    setLoading(true);
    try {
      const submission = appState.submissions.find(s => s.id === submissionId);
      const team = appState.teams.find(t => t.id === submission.teamId);

      // Update submission status
      await submissionService.updateStatus(submissionId, 'approved');

      // Update team progress
      const newClueIndex = team.currentClueIndex + 1;
      const newCompletedClues = [...team.completedClues, submission.clueId];
      await teamService.updateProgress(team.id, newClueIndex, newCompletedClues);

      // Update local state
      setAppState(prev => ({
        ...prev,
        submissions: prev.submissions.map(s =>
          s.id === submissionId ? { ...s, status: 'approved' } : s
        ),
        teams: prev.teams.map(t =>
          t.id === submission.teamId
            ? {
                ...t,
                currentClueIndex: newClueIndex,
                completedClues: newCompletedClues
              }
            : t
        )
      }));
    } catch (error) {
      console.error('Failed to approve submission:', error);
      setErrors(['Failed to approve submission']);
    } finally {
      setLoading(false);
    }
  };

  // Admin: Reject Submission with Comment
  const openRejectModal = (submissionId) => {
    setCommentingSubmissionId(submissionId);
    setCurrentAdminComment('');
    setShowCommentModal(true);
  };

  const rejectSubmissionWithComment = async () => {
    if (!currentAdminComment.trim()) {
      setErrors(['Please provide a comment explaining why this submission was rejected']);
      return;
    }

    setLoading(true);
    try {
      // Update submission status with comment
      await submissionService.updateStatus(commentingSubmissionId, 'rejected', currentAdminComment);

      // Update local state
      setAppState(prev => ({
        ...prev,
        submissions: prev.submissions.map(s =>
          s.id === commentingSubmissionId
            ? { ...s, status: 'rejected', adminComment: currentAdminComment }
            : s
        )
      }));

      setShowCommentModal(false);
      setCommentingSubmissionId(null);
      setCurrentAdminComment('');
      setErrors([]);
    } catch (error) {
      console.error('Failed to reject submission:', error);
      setErrors(['Failed to reject submission']);
    } finally {
      setLoading(false);
    }
  };

  const cancelRejectComment = () => {
    setShowCommentModal(false);
    setCommentingSubmissionId(null);
    setCurrentAdminComment('');
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

  // Get rejected submissions for current clue with admin feedback
  const getRejectedSubmissions = () => {
    return appState.submissions.filter(
      s => s.teamId === currentTeam?.id &&
           s.clueIndex === currentTeam?.currentClueIndex &&
           s.status === 'rejected'
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
          <p className="text-6xl font-bold tracking-widest text-yellow-400">THE RACE</p>
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
            <h1 className="text-5xl font-bold text-yellow-500">THE RACE</h1>
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
            onClick={handleLogout}
            className="bg-red-500 px-2 sm:px-6 py-1 sm:py-2 text-sm sm:text-base rounded-lg hover:bg-red-600"
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
                      {appState.teams.length} Teams
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
                <div className="flex gap-2 flex-wrap">
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
                        className="bg-white text-black px-2 sm:px-4 py-1 sm:py-2 text-sm sm:text-base rounded-lg hover:bg-gray-100"
                      >
                        Edit Game
                      </button>
                      <button
                        onClick={startGame}
                        className="bg-green-500 text-white px-2 sm:px-6 py-1 sm:py-2 text-sm sm:text-base rounded-lg hover:bg-green-600 flex items-center gap-1 sm:gap-2 font-bold"
                      >
                        <Play className="w-4 h-4 sm:w-5 sm:h-5" /> <span className="hidden sm:inline">Start Game</span><span className="sm:hidden">Start</span>
                      </button>
                    </>
                  )}

                  {appState.game.status === 'active' && (
                    <>
                      <button
                        onClick={async () => {
                          if (confirm('Pause the game? Teams will see "Game Not Started" until you resume.')) {
                            const updatedGame = await gameService.update(appState.game.id, { status: 'setup' });
                            setAppState(prev => ({ ...prev, game: updatedGame }));
                          }
                        }}
                        className="bg-yellow-500 text-black px-2 sm:px-6 py-1 sm:py-2 text-sm sm:text-base rounded-lg hover:bg-yellow-600 flex items-center gap-1 sm:gap-2"
                      >
                        ⏸️ <span className="hidden sm:inline">Pause Game</span><span className="sm:hidden">Pause</span>
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm('End the game? This will mark it as completed.')) {
                            const updatedGame = await gameService.update(appState.game.id, { status: 'completed' });
                            setAppState(prev => ({ ...prev, game: updatedGame }));
                          }
                        }}
                        className="bg-red-500 text-white px-2 sm:px-6 py-1 sm:py-2 text-sm sm:text-base rounded-lg hover:bg-red-600 flex items-center gap-1 sm:gap-2"
                      >
                        🏁 <span className="hidden sm:inline">End Game</span><span className="sm:hidden">End</span>
                      </button>
                    </>
                  )}

                  {appState.game.status === 'completed' && (
                    <>
                      <button
                        onClick={() => {
                          setGameForm({ name: '', code: generateGameCode(), clueSequence: [] });
                          setShowGameForm(true);
                        }}
                        className="bg-green-500 text-white px-2 sm:px-6 py-1 sm:py-2 text-sm sm:text-base rounded-lg hover:bg-green-600 flex items-center gap-1 sm:gap-2 font-bold"
                      >
                        <Plus className="w-4 h-4 sm:w-5 sm:h-5" /> <span className="hidden sm:inline">Start New Game</span><span className="sm:hidden">New Game</span>
                      </button>
                      <button
                        onClick={() => deleteGame(appState.game.id)}
                        className="bg-red-600 text-white px-2 sm:px-6 py-1 sm:py-2 text-sm sm:text-base rounded-lg hover:bg-red-700 flex items-center gap-1 sm:gap-2"
                      >
                        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" /> <span className="hidden sm:inline">Delete Game</span><span className="sm:hidden">Delete</span>
                      </button>
                    </>
                  )}
                  {(appState.game.status === 'completed' || appState.game.status === 'setup') && (
                    <button
                      onClick={async () => {
                        if (confirm('Reset game and all team progress? This cannot be undone!')) {
                          // Reset all teams to starting position
                          const resetPromises = appState.teams.map(team =>
                            teamService.updateProgress(team.id, 0, [])
                          );
                          await Promise.all(resetPromises);

                          // Set game back to setup
                          const updatedGame = await gameService.update(appState.game.id, { status: 'setup' });

                          // Reload game data
                          const [teams, submissions] = await Promise.all([
                            teamService.getByGameId(appState.game.id),
                            submissionService.getByGameId(appState.game.id)
                          ]);

                          setAppState(prev => ({
                            ...prev,
                            game: updatedGame,
                            teams,
                            submissions
                          }));
                        }
                      }}
                      className="bg-orange-500 text-white px-2 sm:px-6 py-1 sm:py-2 text-sm sm:text-base rounded-lg hover:bg-orange-600 flex items-center gap-1 sm:gap-2"
                    >
                      🔄 <span className="hidden sm:inline">Reset Game</span><span className="sm:hidden">Reset</span>
                    </button>
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
                className="bg-yellow-500 text-black px-4 sm:px-8 py-2 sm:py-3 text-base sm:text-lg rounded-lg font-bold hover:bg-yellow-600"
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

              <label className="block text-sm font-bold mb-2">Select Clues for Game:</label>

              {/* Available Clues */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold mb-2 text-gray-700">Available Clues (click to add):</h4>
                <div className="border rounded-lg p-2 max-h-40 overflow-y-auto bg-gray-50">
                  {appState.clueLibrary.filter(clue => !gameForm.clueSequence.includes(clue.id)).map(clue => (
                    <div
                      key={clue.id}
                      onClick={() => {
                        setGameForm({
                          ...gameForm,
                          clueSequence: [...gameForm.clueSequence, clue.id]
                        });
                      }}
                      className="p-2 mb-2 bg-white rounded border cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{clue.title}</span>
                        <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                          {clue.type.toUpperCase().replace('-', ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                  {appState.clueLibrary.filter(clue => !gameForm.clueSequence.includes(clue.id)).length === 0 && (
                    <div className="text-gray-500 text-center py-4">All clues have been added to the game</div>
                  )}
                </div>
              </div>

              {/* Selected Clues */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold mb-2 text-gray-700">Game Clues (in race order):</h4>
                <div className="border rounded-lg p-2 min-h-20 bg-yellow-50">
                  {gameForm.clueSequence.map((clueId, index) => {
                    const clue = appState.clueLibrary.find(c => c.id === clueId);
                    if (!clue) return null;
                    return (
                      <div
                        key={`${clueId}-${index}`}
                        className="p-2 mb-2 bg-white rounded border shadow-sm"
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="bg-yellow-500 text-black px-2 py-1 rounded text-xs font-bold">
                              #{index + 1}
                            </span>
                            <span className="font-medium">{clue.title}</span>
                            <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                              {clue.type.toUpperCase().replace('-', ' ')}
                            </span>
                          </div>
                          <div className="flex gap-1">
                            {/* Move Up */}
                            {index > 0 && (
                              <button
                                onClick={() => {
                                  const newSequence = [...gameForm.clueSequence];
                                  [newSequence[index], newSequence[index - 1]] = [newSequence[index - 1], newSequence[index]];
                                  setGameForm({ ...gameForm, clueSequence: newSequence });
                                }}
                                className="text-blue-600 hover:text-blue-800 px-2 py-1 text-xs"
                                title="Move Up"
                              >
                                ↑
                              </button>
                            )}
                            {/* Move Down */}
                            {index < gameForm.clueSequence.length - 1 && (
                              <button
                                onClick={() => {
                                  const newSequence = [...gameForm.clueSequence];
                                  [newSequence[index], newSequence[index + 1]] = [newSequence[index + 1], newSequence[index]];
                                  setGameForm({ ...gameForm, clueSequence: newSequence });
                                }}
                                className="text-blue-600 hover:text-blue-800 px-2 py-1 text-xs"
                                title="Move Down"
                              >
                                ↓
                              </button>
                            )}
                            {/* Remove */}
                            <button
                              onClick={() => {
                                setGameForm({
                                  ...gameForm,
                                  clueSequence: gameForm.clueSequence.filter((_, i) => i !== index)
                                });
                              }}
                              className="text-red-600 hover:text-red-800 px-2 py-1 text-xs"
                              title="Remove"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {gameForm.clueSequence.length === 0 && (
                    <div className="text-gray-500 text-center py-4">No clues selected. Click clues above to add them.</div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={saveGame}
                  className="bg-green-500 text-white px-2 sm:px-6 py-1 sm:py-2 text-sm sm:text-base rounded-lg hover:bg-green-600"
                >
                  Save Game
                </button>
                <button
                  onClick={() => {
                    setShowGameForm(false);
                    setGameForm({ name: '', code: '', clueSequence: [] });
                  }}
                  className="bg-gray-500 text-white px-2 sm:px-6 py-1 sm:py-2 text-sm sm:text-base rounded-lg hover:bg-gray-600"
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
                  <span className="text-3xl font-bold">{appState.teams.length}</span>
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
                  const team = appState.teams.find(t => t.id === sub.teamId);
                  return (
                    <div key={sub.id} className="bg-white rounded-lg p-6 border-2 border-yellow-400 shadow-lg">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-bold text-xl text-blue-600">
                            {team?.name || 'Unknown Team'}
                          </h3>
                          <p className="text-sm text-gray-600 mb-1">Clue: {clue?.title || 'Unknown'}</p>
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
                            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center gap-2 font-semibold"
                          >
                            <Check className="w-5 h-5" />
                            Approve
                          </button>
                          <button
                            onClick={() => openRejectModal(sub.id)}
                            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 flex items-center gap-2 font-semibold"
                          >
                            <X className="w-5 h-5" />
                            Reject
                          </button>
                        </div>
                      </div>

                      {/* Photo Gallery */}
                      {sub.photos && sub.photos.length > 0 && (
                        <div className="mb-4">
                          <p className="font-semibold text-sm mb-3">📸 Photos/Videos ({sub.photos.length}):</p>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {sub.photos.map((photo, idx) => (
                              <div key={idx} className="relative group">
                                {photo.type.startsWith('image/') ? (
                                  <img
                                    src={photo.url}
                                    alt={`Submission ${idx + 1}`}
                                    className="w-full h-32 object-cover rounded-lg border cursor-pointer hover:shadow-lg transition-shadow"
                                    onClick={() => window.open(photo.url, '_blank')}
                                  />
                                ) : (
                                  <div className="w-full h-32 bg-gray-200 rounded-lg border flex items-center justify-center cursor-pointer hover:shadow-lg transition-shadow"
                                       onClick={() => window.open(photo.url, '_blank')}>
                                    <div className="text-center">
                                      <Play className="w-8 h-8 mx-auto mb-1 text-gray-600" />
                                      <span className="text-xs text-gray-600">Video</span>
                                    </div>
                                  </div>
                                )}
                                <div className="absolute bottom-1 left-1 right-1 bg-black bg-opacity-75 text-white text-xs p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                  <div className="truncate">{photo.originalName}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Text Proof */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        {sub.textProof && (
                          <>
                            <p className="font-semibold text-sm mb-2">📝 Text Proof:</p>
                            <p className="text-sm mb-3 bg-white p-3 rounded border">{sub.textProof}</p>
                          </>
                        )}
                        {sub.notes && (
                          <>
                            <p className="font-semibold text-sm mb-2">💭 Additional Notes:</p>
                            <p className="text-sm bg-white p-3 rounded border">{sub.notes}</p>
                          </>
                        )}
                        {!sub.textProof && !sub.notes && sub.photos?.length > 0 && (
                          <p className="text-sm text-gray-600 italic">No text proof provided - photos only</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Admin Comment Modal */}
          {showCommentModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
                <h3 className="text-xl font-bold mb-4 text-red-600">Reject Submission</h3>
                <p className="text-gray-600 mb-4">
                  Please provide a comment explaining why this submission is being rejected. This will help the team understand what they need to fix.
                </p>

                <textarea
                  className="w-full px-4 py-3 border-2 rounded-lg mb-4 focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  rows="4"
                  placeholder="e.g., Photo is too blurry, wrong location, task not completed properly..."
                  value={currentAdminComment}
                  onChange={(e) => setCurrentAdminComment(e.target.value)}
                />

                <div className="flex gap-2">
                  <button
                    onClick={rejectSubmissionWithComment}
                    className="flex-1 bg-red-500 text-white py-3 rounded-lg font-bold hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!currentAdminComment.trim()}
                  >
                    Reject with Comment
                  </button>
                  <button
                    onClick={cancelRejectComment}
                    className="flex-1 bg-gray-500 text-white py-3 rounded-lg font-bold hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
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
                      className="bg-green-500 text-white px-2 sm:px-6 py-1 sm:py-2 text-sm sm:text-base rounded-lg hover:bg-green-600"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setShowTeamForm(false);
                        setEditingTeamId(null);
                        setTeamForm({ name: '', password: '' });
                      }}
                      className="bg-gray-500 text-white px-2 sm:px-6 py-1 sm:py-2 text-sm sm:text-base rounded-lg hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {appState.teams.map(team => (
                  <div key={team.id} className="border rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-lg">{team.name}</h3>
                      <p className="text-sm text-gray-600">
                        Progress: {team.currentClueIndex} / {appState.game.clueSequence.length} clues
                      </p>
                    </div>
                    <div className="flex gap-2">
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
                        title="Edit Team"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => deleteTeam(team.id)}
                        className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600"
                        title="Delete Team"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm(`Reset ${team.name} to the beginning? This will clear their progress.`)) {
                            await teamService.updateProgress(team.id, 0, []);
                            // Reload teams to show updated progress
                            const teams = await teamService.getByGameId(appState.game.id);
                            setAppState(prev => ({ ...prev, teams }));
                          }
                        }}
                        className="bg-orange-500 text-white p-2 rounded-lg hover:bg-orange-600"
                        title="Reset Team Progress"
                      >
                        🔄
                      </button>
                      {team.currentClueIndex < appState.game.clueSequence.length && (
                        <button
                          onClick={async () => {
                            const currentClueIndex = team.currentClueIndex;
                            const nextClueIndex = currentClueIndex + 1;
                            const clueId = appState.game.clueSequence[currentClueIndex];

                            if (confirm(`Mark current clue as completed for ${team.name}? This will advance them to the next clue.`)) {
                              // Mark current clue as completed and advance to next
                              const newCompletedClues = [...(team.completedClues || []), clueId];
                              await teamService.updateProgress(team.id, nextClueIndex, newCompletedClues);

                              // Reload teams to show updated progress
                              const teams = await teamService.getByGameId(appState.game.id);
                              setAppState(prev => ({ ...prev, teams }));
                            }
                          }}
                          className="bg-green-500 text-white p-2 rounded-lg hover:bg-green-600"
                          title="Mark Current Clue as Complete"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {appState.teams.length === 0 && (
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

                {/* Photo Requirements - applies to all clue types */}
                <label className="block text-sm font-bold mb-2">Required Photos:</label>
                <div className="mb-4">
                  <input
                    type="number"
                    min="0"
                    max="10"
                    placeholder="Number of photos teams must submit"
                    className="w-full px-4 py-2 border rounded-lg"
                    value={clueForm.requiredPhotos}
                    onChange={(e) => setClueForm({ ...clueForm, requiredPhotos: parseInt(e.target.value) || 0 })}
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    {clueForm.requiredPhotos === 0 ?
                      "Teams can submit text proof or photos (optional)" :
                      `Teams must submit exactly ${clueForm.requiredPhotos} photo${clueForm.requiredPhotos > 1 ? 's' : ''} to complete this challenge`
                    }
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={saveClue}
                    className="bg-green-500 text-white px-2 sm:px-6 py-1 sm:py-2 text-sm sm:text-base rounded-lg hover:bg-green-600"
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
                        roadblockTask: '',
                        requiredPhotos: 0
                      });
                    }}
                    className="bg-gray-500 text-white px-2 sm:px-6 py-1 sm:py-2 text-sm sm:text-base rounded-lg hover:bg-gray-600"
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
    const rejectedSubmissions = getRejectedSubmissions();
    const teamState = getCurrentTeamState();


    // Update current team data
    const updatedTeam = appState.teams.find(t => t.id === currentTeam.id);
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
              onClick={handleLogout}
              className="bg-gray-500 text-white px-2 sm:px-6 py-1 sm:py-2 text-sm sm:text-base rounded-lg hover:bg-gray-600"
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
              onClick={handleLogout}
              className="bg-red-500 px-2 sm:px-6 py-1 sm:py-2 text-sm sm:text-base rounded-lg hover:bg-red-600"
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

              {/* REJECTED SUBMISSIONS WITH ADMIN FEEDBACK */}
              {rejectedSubmissions.length > 0 && (
                <div className="bg-red-50 border-2 border-red-400 rounded-2xl p-6 mb-8 shadow-lg">
                  <h2 className="text-2xl font-bold mb-4 text-red-600 flex items-center gap-2">
                    <AlertCircle className="w-6 h-6" />
                    Previous Submissions Rejected
                  </h2>
                  <p className="text-red-700 mb-4">
                    The game master has reviewed your previous submissions and provided feedback. Please address the issues below and try again.
                  </p>

                  <div className="space-y-4">
                    {rejectedSubmissions.map((rejection, idx) => (
                      <div key={rejection.id} className="bg-white rounded-lg p-4 border border-red-300">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-bold text-lg text-red-600">
                            Attempt #{rejectedSubmissions.length - idx}
                          </h4>
                          <span className="text-xs text-gray-500">
                            {new Date(rejection.timestamp).toLocaleString()}
                          </span>
                        </div>

                        {rejection.adminComment && (
                          <div className="bg-red-100 p-3 rounded-lg mb-3">
                            <p className="font-semibold text-red-700 mb-1">📝 Game Master Feedback:</p>
                            <p className="text-red-800">{rejection.adminComment}</p>
                          </div>
                        )}

                        <details className="text-sm">
                          <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                            View Your Original Submission
                          </summary>
                          <div className="mt-2 p-3 bg-gray-50 rounded border">
                            {rejection.photos && rejection.photos.length > 0 && (
                              <div className="mb-2">
                                <p className="font-semibold mb-1">Photos:</p>
                                <div className="grid grid-cols-3 gap-2">
                                  {rejection.photos.map((photo, photoIdx) => (
                                    <img
                                      key={photoIdx}
                                      src={photo.preview || photo.url}
                                      alt={`Rejected submission ${photoIdx + 1}`}
                                      className="w-full h-16 object-cover rounded cursor-pointer"
                                      onClick={() => window.open(photo.url, '_blank')}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                            {rejection.proof && (
                              <div className="mb-2">
                                <p className="font-semibold">Text Proof:</p>
                                <p>{rejection.proof}</p>
                              </div>
                            )}
                            {rejection.notes && (
                              <div>
                                <p className="font-semibold">Notes:</p>
                                <p>{rejection.notes}</p>
                              </div>
                            )}
                          </div>
                        </details>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 p-3 bg-yellow-100 rounded-lg">
                    <p className="text-yellow-800 text-sm">
                      💡 <strong>Tip:</strong> Read the feedback carefully and make sure to address all the issues mentioned before submitting again.
                    </p>
                  </div>
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
                      {/* Photo Upload Component */}
                      <PhotoUpload
                        teamId={currentTeam.id.toString()}
                        clueId={appState.game.clueSequence[currentTeam.currentClueIndex].toString()}
                        onPhotosChange={setSubmissionPhotos}
                        disabled={loading}
                        requiredPhotos={getCurrentClue().clue?.requiredPhotos || 0}
                        clueTitle={getCurrentClue().clue?.title || ''}
                      />

                      <div className="mb-4">
                        <label className="block font-bold mb-2">Text Description (optional):</label>
                        <textarea
                          className="w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                          rows="3"
                          placeholder="Describe what you did to complete this challenge..."
                          value={submissionProof}
                          onChange={(e) => setSubmissionProof(e.target.value)}
                          disabled={loading}
                        />
                      </div>

                      <div className="mb-6">
                        <label className="block font-bold mb-2">Additional Notes (optional):</label>
                        <textarea
                          className="w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                          rows="2"
                          placeholder="Any extra details or comments..."
                          value={submissionNotes}
                          onChange={(e) => setSubmissionNotes(e.target.value)}
                          disabled={loading}
                        />
                      </div>

                      <button
                        onClick={submitProof}
                        disabled={loading}
                        className="w-full bg-yellow-500 text-black py-4 rounded-lg text-xl font-bold hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                      >
                        {loading ? (
                          <LoadingSpinner size="small" message="Submitting..." />
                        ) : (
                          <>
                            <Camera className="w-6 h-6" />
                            Submit for Approval
                          </>
                        )}
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