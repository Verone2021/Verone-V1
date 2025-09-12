'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Home,
  Menu,
  ChevronDown,
  User,
  BarChart3,
  Shield,
  LogOut,
  Building,
  Users
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getRoleColor, getRoleLabel } from '@/lib/validations/utilisateurs'

interface HeaderMinimalProps {
  onToggleSidebar?: () => void
  className?: string
}

export function HeaderMinimal({ onToggleSidebar, className }: HeaderMinimalProps) {
  const router = useRouter()
  const { 
    profile, 
    loading, 
    isAuthenticated,
    canAccessAdmin,
    signOut 
  } = useAuth()
  
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const handleSignOut = async () => {
    const result = await signOut()
    if (result.success) {
      router.replace('/')
    }
    setUserMenuOpen(false)
  }



  return (
    <header className={cn("bg-white modern-shadow sticky top-0 z-30", className)}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          
          {/* Left: Sidebar Toggle + Logo */}
          <div className="flex items-center space-x-4">
            {/* Sidebar Toggle Button */}
            {isAuthenticated && onToggleSidebar && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleSidebar}
                className="h-8 w-8 p-0 hover:bg-gray-100"
              >
                <Menu className="h-4 w-4" />
              </Button>
            )}

            {/* Logo/Brand */}
            <Link href={isAuthenticated ? "/dashboard" : "/"} className="flex items-center space-x-3">
              <div className="w-8 h-8 gradient-copper rounded-lg flex items-center justify-center hover:shadow-lg transition-all">
                <Home className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Want It Now</h1>
              </div>
            </Link>
          </div>

          {/* Right: User Menu */}
          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              <>


                {/* User Menu */}
                <div className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center space-x-2"
                  >
                    {/* User Avatar */}
                    <div className={cn(
                      "w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-bold",
                      (profile as any)?.role === 'super_admin' ? 'gradient-copper' :
                      (profile as any)?.role === 'admin' ? 'bg-blue-500' :
                      'bg-gray-500'
                    )}>
                      {profile?.prenom?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    
                    {/* User Name - Hidden on mobile */}
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-medium text-gray-900">
                        {profile?.prenom} {profile?.nom}
                      </p>
                    </div>
                    
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                  
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                      {/* User Info Header */}
                      <div className="px-4 py-3 border-b border-gray-200">
                        <div className="flex items-center space-x-3">
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold",
                            (profile as any)?.role === 'super_admin' ? 'gradient-copper' :
                            (profile as any)?.role === 'admin' ? 'bg-blue-500' :
                            'bg-gray-500'
                          )}>
                            {profile?.prenom?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {profile?.prenom} {profile?.nom}
                            </p>
                            <Badge className={cn("text-xs", getRoleColor((profile as any)?.role || ''))}>
                              {getRoleLabel((profile as any)?.role || '')}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Quick Links */}
                      <Link href="/profile">
                        <button
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <User className="h-4 w-4 mr-2" />
                          Mon Profil
                        </button>
                      </Link>
                      

                      

                      
                      <hr className="my-1" />
                      
                      <button
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        onClick={handleSignOut}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Déconnexion
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Guest User Actions */
              <div className="flex items-center space-x-3">
                <Link href="/login">
                  <Button variant="outline" size="sm">
                    Se connecter
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="gradient-copper text-white hover:shadow-lg transition-all">
                    S'inscrire
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Click outside handler */}
      {userMenuOpen && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => setUserMenuOpen(false)}
        />
      )}
    </header>
  )
}