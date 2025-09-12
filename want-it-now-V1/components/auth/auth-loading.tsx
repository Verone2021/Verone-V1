'use client'

import { Loader2 } from 'lucide-react'

interface AuthLoadingProps {
  className?: string
  showText?: boolean
  message?: string
}

export function AuthLoading({ className = '', showText = true, message = 'Loading...' }: AuthLoadingProps) {
  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      <Loader2 className="h-4 w-4 animate-spin" />
      {showText && (
        <span className="text-sm text-gray-600">
          {message}
        </span>
      )}
    </div>
  )
}

export function AuthLoadingScreen({ message = 'Loading authentication...' }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="w-20 h-20 gradient-copper rounded-xl flex items-center justify-center mb-6 mx-auto modern-shadow-lg">
          <Loader2 className="h-10 w-10 animate-spin text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Want It Now</h2>
        <p className="text-base text-gray-600 max-w-sm mx-auto">
          {message}
        </p>
      </div>
    </div>
  )
}