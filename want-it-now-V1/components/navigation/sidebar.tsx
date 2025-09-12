'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  getNavigationGroups,
  isNavigationItemActive,
  type NavigationGroup,
  type NavigationItem
} from './nav-config'
import {
  ChevronLeft,
  ChevronRight,
  Home,
  LogOut,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getRoleColor, getRoleLabel } from '@/lib/validations/utilisateurs'

interface SidebarProps {
  isOpen: boolean
  onClose?: () => void
  onToggleCollapse?: () => void
  isCollapsed?: boolean
  className?: string
}

export function Sidebar({ 
  isOpen, 
  onClose, 
  onToggleCollapse,
  isCollapsed = false,
  className 
}: SidebarProps) {
  const pathname = usePathname()
  const { 
    profile, 
    isSuperAdmin, 
    isAdmin, 
    canAccessAdmin,
    signOut 
  } = useAuth()

  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Get navigation groups based on user role and permissions
  const navigationGroups = getNavigationGroups(
    (profile as any)?.role,
    isSuperAdmin,
    isAdmin,
    canAccessAdmin
  )

  const handleSignOut = async () => {
    const result = await signOut()
    if (result.success) {
      onClose?.()
    }
  }

  const handleItemClick = () => {
    if (isMobile) {
      onClose?.()
    }
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header - Minimal */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {/* Toggle/Close buttons */}
        <div className="flex items-center space-x-2">
          {!isMobile && onToggleCollapse && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              className="h-8 w-8 p-0"
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          )}
          
          {isMobile && onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>



      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="space-y-6">
          {navigationGroups.map((group) => (
            <div key={group.id}>
              {!isCollapsed && (
                <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  {group.title}
                </h3>
              )}
              
              <div className="space-y-1 px-2">
                {group.items.map((item) => {
                  const IconComponent = item.icon
                  const isActive = isNavigationItemActive(item.href, pathname || '')
                  
                  return (
                    <Link key={item.id} href={item.href} onClick={handleItemClick}>
                      <div
                        className={cn(
                          "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                          isActive
                            ? "bg-brand-copper text-white shadow-md"
                            : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                        )}
                      >
                        <IconComponent className={cn(
                          "h-4 w-4 flex-shrink-0",
                          isCollapsed ? "mx-auto" : "mr-3"
                        )} />
                        
                        {!isCollapsed && (
                          <div className="flex-1 min-w-0">
                            <span className="truncate">{item.title}</span>
                            {item.description && !isActive && (
                              <p className="text-xs text-gray-500 truncate mt-0.5">
                                {item.description}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>


    </div>
  )

  // Mobile overlay
  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={onClose}
          />
        )}
        
        {/* Mobile Sidebar */}
        <div
          className={cn(
            "fixed left-0 top-0 h-full w-80 bg-white modern-shadow-lg z-50 transform transition-transform duration-300 md:hidden",
            isOpen ? "translate-x-0" : "-translate-x-full",
            className
          )}
        >
          <SidebarContent />
        </div>
      </>
    )
  }

  // Desktop sidebar
  return (
    <div
      className={cn(
        "hidden md:flex flex-col bg-white modern-shadow-lg border-r border-gray-200 transition-all duration-300",
        isCollapsed ? "w-16" : "w-80",
        className
      )}
    >
      <SidebarContent />
    </div>
  )
}