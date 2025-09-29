'use client';

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h1 className="text-2xl font-bold mb-4">Oops! Something went wrong</h1>
            <p className="text-gray-600 mb-6">
              The Race app encountered an error. Don't worry, your progress might still be saved!
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-red-600 flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="w-5 h-5" />
              Reload App
            </button>
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer font-semibold text-gray-700">
                  Error Details (Dev Mode)
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {this.state.error?.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;