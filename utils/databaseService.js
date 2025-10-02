// Database service for API calls

export const gameService = {
  async getAll() {
    const response = await fetch('/api/games');
    if (!response.ok) throw new Error('Failed to fetch games');
    return response.json();
  },

  async findByCode(code) {
    const response = await fetch(`/api/games?code=${encodeURIComponent(code)}`);
    if (!response.ok) throw new Error('Failed to find game');
    return response.json();
  },

  async create(gameData) {
    const response = await fetch('/api/games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(gameData)
    });
    if (!response.ok) throw new Error('Failed to create game');
    return response.json();
  },

  async update(id, updateData) {
    const response = await fetch('/api/games', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updateData })
    });
    if (!response.ok) throw new Error('Failed to update game');
    return response.json();
  }
};

export const teamService = {
  async getByGameId(gameId) {
    const response = await fetch(`/api/teams?gameId=${gameId}`);
    if (!response.ok) throw new Error('Failed to fetch teams');
    return response.json();
  },

  async create(teamData) {
    const response = await fetch('/api/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(teamData)
    });
    if (!response.ok) throw new Error('Failed to create team');
    return response.json();
  },

  async updateProgress(id, currentClueIndex, completedClues) {
    const response = await fetch('/api/teams', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, currentClueIndex, completedClues })
    });
    if (!response.ok) throw new Error('Failed to update team progress');
    return response.json();
  },

  async update(id, updateData) {
    const response = await fetch('/api/teams', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updateData })
    });
    if (!response.ok) throw new Error('Failed to update team');
    return response.json();
  }
};

export const submissionService = {
  async getByGameId(gameId) {
    const response = await fetch(`/api/submissions?gameId=${gameId}`);
    if (!response.ok) throw new Error('Failed to fetch submissions');
    return response.json();
  },

  async create(submissionData) {
    const response = await fetch('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submissionData)
    });
    if (!response.ok) throw new Error('Failed to create submission');
    return response.json();
  },

  async updateStatus(id, status, adminComment = null) {
    const response = await fetch('/api/submissions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, adminComment })
    });
    if (!response.ok) throw new Error('Failed to update submission');
    return response.json();
  }
};

export const clueService = {
  async getAll() {
    const response = await fetch('/api/clues');
    if (!response.ok) throw new Error('Failed to fetch clues');
    return response.json();
  },

  async create(clueData) {
    const response = await fetch('/api/clues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clueData)
    });
    if (!response.ok) throw new Error('Failed to create clue');
    return response.json();
  },

  async update(id, updateData) {
    const response = await fetch('/api/clues', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updateData })
    });
    if (!response.ok) throw new Error('Failed to update clue');
    return response.json();
  },

  async import(clueData, replace = false) {
    const response = await fetch('/api/clues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clues: clueData, replace })
    });
    if (!response.ok) throw new Error('Failed to import clues');
    return response.json();
  },

  async delete(id) {
    const response = await fetch(`/api/clues/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete clue');
    return response.json();
  },

  async deleteAll() {
    const response = await fetch('/api/clues', { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete clues');
    return response.json();
  }
};