'use client'

import { useAuth } from '@/hooks/use-auth'
import { AuthLoadingScreen } from './auth-loading'
import { AuthErrorScreen } from './auth-error'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  requireRoles?: string[]
  requireAdmin?: boolean
  redirectTo?: string
  fallback?: React.ReactNode
}

export function AuthGuard({ 
  children, 
  requireAuth = false,
  requireRoles = [],
  requireAdmin = false,
  redirectTo = '/login',
  fallback 
}: AuthGuardProps) {
  const { 
    isAuthenticated, 
    isSuperAdmin, 
    isAdmin, 
    profile, 
    userRoles,
    loading,
    error
  } = useAuth()
  const router = useRouter()

  // Show loading screen during initialization
  if (loading) {
    return <AuthLoadingScreen />
  }

  // Show error screen if there's an auth error
  if (error) {
    return <AuthErrorScreen error={{ message: error, recoverable: true }} />
  }

  // Redirect if authentication is required but user is not authenticated
  useEffect(() => {
    if (requireAuth && !isAuthenticated && !loading) {
      router.push(redirectTo)
    }
  }, [requireAuth, isAuthenticated, loading, router, redirectTo])

  // Don't render children if auth is required but not authenticated
  if (requireAuth && !isAuthenticated) {
    return fallback || <AuthLoadingScreen />
  }

  // Check admin requirement
  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You need admin privileges to access this page.</p>
          <button 
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  // Check role requirements
  if (requireRoles.length > 0) {
    const hasRequiredRole = requireRoles.some(role => {
      // Check profile role (legacy)
      if ((profile as any)?.role === role) return true
      
      // Check user roles (new architecture)
      return userRoles.some(userRole => userRole.role === role)
    })

    if (!hasRequiredRole) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">
              You need one of the following roles: {requireRoles.join(', ')}
            </p>
            <button 
              onClick={() => router.back()}
              className="text-blue-600 hover:text-blue-800"
            >
              Go Back
            </button>
          </div>
        </div>
      )
    }
  }

  return <>{children}</>
}

// Convenience components for common use cases
export function RequireAuth({ children, redirectTo }: { children: React.ReactNode; redirectTo?: string }) {
  return (
    <AuthGuard requireAuth redirectTo={redirectTo}>
      {children}
    </AuthGuard>
  )
}

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requireAuth requireAdmin>
      {children}
    </AuthGuard>
  )
}

export function RequireRoles({ roles, children }: { roles: string[]; children: React.ReactNode }) {
  return (
    <AuthGuard requireAuth requireRoles={roles}>
      {children}
    </AuthGuard>
  )
}