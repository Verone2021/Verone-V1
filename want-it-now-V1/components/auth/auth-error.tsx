'use client'

import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
// Type AuthError défini localement car non exporté du nouveau provider
type AuthError = {
  message: string
  recoverable?: boolean
}

interface AuthErrorProps {
  error: AuthError
  onRetry?: () => void
  className?: string
}

export function AuthErrorDisplay({ error, onRetry, className = '' }: AuthErrorProps) {
  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start space-x-3">
        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800">
            Authentication Error
          </h3>
          <p className="text-sm text-red-700 mt-1">
            {error.message}
          </p>
          {error.recoverable && onRetry && (
            <Button 
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="mt-3 text-red-700 border-red-300 hover:bg-red-100"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export function AuthErrorScreen({ error, onRetry }: { error: AuthError; onRetry?: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Authentication Error</h2>
        </div>
        
        <AuthErrorDisplay 
          error={error} 
          onRetry={onRetry}
          className="w-full"
        />
        
        {!error.recoverable && (
          <div className="text-center mt-6">
            <Button 
              variant="outline"
              onClick={() => window.location.href = '/login'}
            >
              Go to Login
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}