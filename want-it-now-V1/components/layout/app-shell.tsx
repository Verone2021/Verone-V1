'use client'

import { ReactNode, useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { HeaderMinimal } from '@/components/navigation/header-minimal'
import { Sidebar } from '@/components/navigation/sidebar'
import { cn } from '@/lib/utils'

interface AppShellProps {
  children: ReactNode
  className?: string
  background?: 'gray' | 'white'
  requireAuth?: boolean
}

export function AppShell({ 
  children, 
  className = '',
  background = 'gray',
  requireAuth = false
}: AppShellProps) {
  const { isAuthenticated } = useAuth()
  
  // Sidebar state management
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      
      // Auto-close sidebar on mobile when switching to desktop
      if (!mobile && sidebarOpen) {
        setSidebarOpen(false)
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [sidebarOpen, sidebarCollapsed])

  // Handle escape key for mobile sidebar
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && sidebarOpen && isMobile) {
        setSidebarOpen(false)
      }
    }
    
    if (sidebarOpen && isMobile) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [sidebarOpen, isMobile])

  // Background styling
  const bgClass = background === 'gray' ? 'bg-gray-50' : 'bg-white'

  // Layout classes
  const layoutClasses = cn(
    'min-h-screen flex flex-col',
    bgClass
  )

  // Main content classes - adjust padding based on sidebar state
  const mainClasses = cn(
    'flex-1 transition-all duration-300',
    // Desktop sidebar spacing
    !isMobile && isAuthenticated && !sidebarCollapsed && 'md:pl-80',
    !isMobile && isAuthenticated && sidebarCollapsed && 'md:pl-16',
    className
  )

  const handleToggleSidebar = () => {
    if (isMobile) {
      setSidebarOpen(!sidebarOpen)
    } else {
      setSidebarCollapsed(!sidebarCollapsed)
    }
  }

  const handleCloseSidebar = () => {
    setSidebarOpen(false)
  }

  // If requireAuth is true and user is not authenticated, don't show the app shell
  if (requireAuth && !isAuthenticated) {
    return (
      <div className={layoutClasses}>
        <HeaderMinimal />
        <main className={cn('flex-1', className)}>
          {children}
        </main>
      </div>
    )
  }

  return (
    <div className={layoutClasses}>
      {/* Header */}
      <HeaderMinimal 
        onToggleSidebar={isAuthenticated ? handleToggleSidebar : undefined}
      />

      {/* Layout Container */}
      <div className="flex flex-1 relative">
        {/* Sidebar - Only show when authenticated */}
        {isAuthenticated && (
          <Sidebar
            isOpen={sidebarOpen}
            onClose={handleCloseSidebar}
            onToggleCollapse={!isMobile ? () => setSidebarCollapsed(!sidebarCollapsed) : undefined}
            isCollapsed={sidebarCollapsed}
            className={cn(
              // Desktop positioning
              !isMobile && "fixed left-0 top-16 h-[calc(100vh-4rem)] z-20"
            )}
          />
        )}

        {/* Main Content */}
        <main className={mainClasses}>
          {children}
        </main>
      </div>

      {/* Mobile sidebar backdrop - portal to prevent z-index issues */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={handleCloseSidebar}
        />
      )}
    </div>
  )
}

// Convenience wrapper for authenticated pages
export function AuthenticatedAppShell({ 
  children, 
  ...props 
}: Omit<AppShellProps, 'requireAuth'>) {
  return (
    <AppShell requireAuth={true} {...props}>
      {children}
    </AppShell>
  )
}

// Convenience wrapper for public pages
export function PublicAppShell({ 
  children, 
  ...props 
}: Omit<AppShellProps, 'requireAuth'>) {
  return (
    <AppShell requireAuth={false} {...props}>
      {children}
    </AppShell>
  )
}