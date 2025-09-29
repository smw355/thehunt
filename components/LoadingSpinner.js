import React from 'react';

export function LoadingSpinner({ size = 'medium', message = 'Loading...' }) {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  return (
    <div className="flex items-center justify-center gap-3">
      <div className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-gray-300 border-t-yellow-500`}></div>
      {message && <span className="text-gray-600">{message}</span>}
    </div>
  );
}

export function FullPageLoader({ message = 'Loading Amazing Race...' }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">THE AMAZING</h1>
          <h2 className="text-4xl font-bold text-yellow-500">RACE</h2>
        </div>
        <LoadingSpinner size="large" message={message} />
      </div>
    </div>
  );
}