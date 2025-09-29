export const generateGameCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const validateGameForm = (gameForm) => {
  const errors = [];

  if (!gameForm.name?.trim()) {
    errors.push('Game name is required');
  }

  if (!gameForm.code?.trim()) {
    errors.push('Game code is required');
  } else if (gameForm.code.length !== 6) {
    errors.push('Game code must be 6 characters');
  }

  if (gameForm.clueSequence.length === 0) {
    errors.push('Please assign at least one clue to the game');
  }

  return errors;
};

export const validateTeamForm = (teamForm) => {
  const errors = [];

  if (!teamForm.name?.trim()) {
    errors.push('Team name is required');
  }

  if (!teamForm.password?.trim()) {
    errors.push('Team password is required');
  }

  return errors;
};

export const validateClueForm = (clueForm) => {
  const errors = [];

  if (!clueForm.title?.trim()) {
    errors.push('Clue title is required');
  }

  if (clueForm.type === 'detour') {
    if (!clueForm.detourOptionA?.title?.trim() || !clueForm.detourOptionB?.title?.trim()) {
      errors.push('Both detour option titles are required');
    }
    if (!clueForm.detourOptionA?.description?.trim() || !clueForm.detourOptionB?.description?.trim()) {
      errors.push('Both detour option descriptions are required');
    }
  }

  if (clueForm.type === 'road-block') {
    if (!clueForm.roadblockQuestion?.trim()) {
      errors.push('Roadblock question is required');
    }
    if (!clueForm.roadblockTask?.trim()) {
      errors.push('Roadblock task is required');
    }
  }

  if (clueForm.type === 'route-info') {
    const hasContent = clueForm.content?.some(c => c.trim() !== '');
    if (!hasContent) {
      errors.push('Route info content is required');
    }
  }

  return errors;
};

export const copyToClipboard = async (text) => {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    }
  } catch (error) {
    console.warn('Failed to copy to clipboard:', error);
    return false;
  }
};

export const downloadJSON = (data, filename) => {
  try {
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.warn('Failed to download JSON:', error);
    return false;
  }
};

export const parseJSONFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        resolve(data);
      } catch (error) {
        reject(new Error('Invalid JSON file'));
      }
    };
    reader.onerror = () => reject(new Error('Error reading file'));
    reader.readAsText(file);
  });
};