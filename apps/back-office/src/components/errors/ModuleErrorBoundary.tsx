'use client';

import { useEffect } from 'react';

import { AlertCircle, RotateCcw, Home } from 'lucide-react';

interface ModuleErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
  moduleName: string;
}

export function ModuleErrorBoundary({
  error,
  reset,
  moduleName,
}: ModuleErrorBoundaryProps) {
  useEffect(() => {
    console.error(`[${moduleName}] Error boundary triggered:`, error);
  }, [error, moduleName]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 border border-gray-200">
        <div className="flex items-center justify-center w-14 h-14 bg-red-100 rounded-full mx-auto mb-4">
          <AlertCircle className="h-7 w-7 text-red-600" />
        </div>

        <h2 className="text-lg font-bold text-gray-900 text-center mb-2">
          Erreur dans {moduleName}
        </h2>

        <p className="text-gray-600 text-center text-sm mb-6">
          Une erreur est survenue dans ce module. Les autres sections de
          l&apos;application restent fonctionnelles.
        </p>

        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 p-3 bg-gray-100 rounded text-sm">
            <p className="font-medium text-gray-700 mb-1">Erreur :</p>
            <p className="text-gray-600 break-words text-xs">{error.message}</p>
            {error.digest && (
              <p className="text-gray-500 mt-1 text-xs">
                Digest: {error.digest}
              </p>
            )}
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={reset}
            className="w-full bg-black text-white py-2.5 px-4 rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center space-x-2"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Recharger le module</span>
          </button>

          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.href = '/dashboard';
              }
            }}
            className="w-full bg-gray-100 text-gray-700 py-2.5 px-4 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
          >
            <Home className="h-4 w-4" />
            <span>Retour au Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
}
