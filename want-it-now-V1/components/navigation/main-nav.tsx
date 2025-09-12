'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Home,
  Users,
  Building,
  Building2,
  LogIn,
  UserPlus,
  LogOut,
  User,
  Settings,
  Shield,
  BarChart3,
  PlusCircle,
  Menu,
  X,
  ChevronDown
} from 'lucide-react'
import { getRoleColor, getRoleLabel } from '@/lib/validations/utilisateurs'

interface NavigationItem {
  title: string
  href: string
  icon: any
  roles?: string[]
  description?: string
}

export function MainNavigation() {
  const router = useRouter()
  const { 
    user, 
    profile, 
    loading, 
    isAuthenticated, 
    isSuperAdmin, 
    isAdmin, 
    canAccessAdmin,
    signOut 
  } = useAuth()
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const handleSignOut = async () => {
    // La redirection est maintenant gérée directement dans signOut() 
    // pour éviter la race condition avec le middleware
    const result = await signOut()
    
    // Fermer les menus même en cas d'erreur
    setUserMenuOpen(false)
    setMobileMenuOpen(false)
    
    // Note: Pas de router.replace('/') - la redirection est faite dans signOut()
    // via window.location.href pour contourner le middleware
  }

  // Navigation items based on roles
  const getNavigationItems = (): NavigationItem[] => {
    const baseItems: NavigationItem[] = [
      {
        title: 'Accueil',
        href: '/',
        icon: Home
      }
    ]

    if (!isAuthenticated) {
      return baseItems
    }

    const authenticatedItems: NavigationItem[] = [
      {
        title: 'Dashboard',
        href: '/dashboard',
        icon: BarChart3,
        description: 'Tableau de bord principal'
      },
      {
        title: 'Mon Profil',
        href: '/profile',
        icon: User,
        description: 'Gérer mes informations'
      }
    ]

    // Admin navigation simplified - access via profiles only  
    // Super Admin items - core business functions only
    if (isSuperAdmin) {
      authenticatedItems.push(
        {
          title: 'Organisations',
          href: '/organisations',
          icon: Building,
          roles: ['super_admin'],
          description: 'Gestion des organisations'
        },
        {
          title: 'Utilisateurs',
          href: '/utilisateurs',
          icon: Users,
          roles: ['super_admin'],
          description: 'Gestion des utilisateurs'
        }
      )
    }
    
    // Admin items - business functions only (user management via profile)
    else if (isAdmin) {
      authenticatedItems.push(
        {
          title: 'Organisation',
          href: '/organisations',
          icon: Building,
          roles: ['admin'],
          description: 'Gérer mon organisation'
        }
      )
    }

    // Business navigation - Propriétaires et Propriétés
    if (canAccessAdmin) {
      authenticatedItems.push(
        {
          title: 'Propriétaires',
          href: '/proprietaires',
          icon: Users,
          roles: ['admin', 'super_admin', 'proprietaire'],
          description: 'Gestion des propriétaires'
        },
        {
          title: 'Propriétés',
          href: '/proprietes',
          icon: Building2,
          roles: ['admin', 'super_admin', 'proprietaire'],
          description: 'Gestion des propriétés immobilières'
        }
      )
    }

    // Role-specific items for business relationships
    if ((profile as any)?.role === 'locataire') {
      authenticatedItems.push(
        {
          title: 'Mes Demandes',
          href: '/demandes',
          icon: PlusCircle,
          roles: ['locataire'],
          description: 'Demandes de maintenance'
        },
        {
          title: 'Mon Logement',
          href: '/logement',
          icon: Home,
          roles: ['locataire'],
          description: 'Informations logement'
        }
      )
    }
    
    if ((profile as any)?.role === 'prestataire') {
      authenticatedItems.push({
        title: 'Mes Interventions',
        href: '/interventions',
        icon: BarChart3,
        roles: ['prestataire'],
        description: 'Planifier mes interventions'
      })
    }

    return [...baseItems, ...authenticatedItems]
  }

  const navigationItems = getNavigationItems()

  return (
    <header className="bg-white modern-shadow sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 gradient-copper rounded-lg flex items-center justify-center hover:shadow-lg transition-all">
                <Home className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Want It Now</h1>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item, index) => {
              const IconComponent = item.icon
              return (
                <Link key={index} href={item.href}>
                  <Button
                    variant="ghost"
                    className="flex items-center space-x-2 hover:bg-gray-100 text-gray-700 hover:text-gray-900"
                  >
                    <IconComponent className="h-4 w-4" />
                    <span className="hidden lg:block">{item.title}</span>
                  </Button>
                </Link>
              )
            })}
            
            {/* More dropdown if needed */}
            {navigationItems.length > 5 && (
              <div className="relative">
                {/* This could be expanded to a dropdown menu */}
                <Button variant="ghost" className="text-gray-700">
                  Plus
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </nav>

          {/* User Section */}
          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                {/* User Info - Desktop */}
                <div className="hidden md:flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {profile?.prenom} {profile?.nom}
                    </p>
                    <div className="flex items-center justify-end">
                      <Badge className={getRoleColor((profile as any)?.role || '')}>
                        {getRoleLabel((profile as any)?.role || '')}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                {/* User Menu */}
                <div className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center space-x-2"
                  >
                    <User className="h-4 w-4" />
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                  
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                      <Link href="/profile">
                        <button
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <User className="h-4 w-4 mr-2" />
                          Mon Profil
                        </button>
                      </Link>
                      
                      <Link href="/dashboard">
                        <button
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <BarChart3 className="h-4 w-4 mr-2" />
                          Dashboard
                        </button>
                      </Link>
                      
                      {/* Business quick access for authorized roles */}
                      {canAccessAdmin && (
                        <>
                          <Link href="/proprietaires">
                            <button
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              <Users className="h-4 w-4 mr-2" />
                              Propriétaires
                            </button>
                          </Link>
                          
                          <Link href="/proprietes">
                            <button
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              <Building2 className="h-4 w-4 mr-2" />
                              Propriétés
                            </button>
                          </Link>
                        </>
                      )}
                      
                      {/* Administration access removed - now via profile page */}
                      
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
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-3">
                <Link href="/login">
                  <Button variant="outline" size="sm">
                    <LogIn className="mr-2 h-4 w-4" />
                    Se connecter
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="bg-gradient-to-br from-brand-copper to-secondary-copper text-white hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                    <UserPlus className="mr-2 h-4 w-4" />
                    S'inscrire
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <nav className="space-y-2">
              {navigationItems.map((item, index) => {
                const IconComponent = item.icon
                return (
                  <Link key={index} href={item.href}>
                    <button
                      className="flex items-center w-full px-3 py-2 text-left text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <IconComponent className="h-4 w-4 mr-3" />
                      <div>
                        <p className="font-medium">{item.title}</p>
                        {item.description && (
                          <p className="text-sm text-gray-500">{item.description}</p>
                        )}
                      </div>
                    </button>
                  </Link>
                )
              })}
              
              {/* Mobile Auth Buttons */}
              {!isAuthenticated && (
                <div className="pt-4 space-y-2">
                  <Link href="/login">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <LogIn className="mr-2 h-4 w-4" />
                      Se connecter
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button 
                      className="w-full justify-start bg-gradient-to-br from-brand-copper to-secondary-copper text-white"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      S'inscrire
                    </Button>
                  </Link>
                </div>
              )}
              
              {/* Mobile User Info */}
              {isAuthenticated && profile && (
                <div className="pt-4 px-3 border-t border-gray-200">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 gradient-copper rounded-lg flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {profile.prenom} {profile.nom}
                      </p>
                      <Badge className={getRoleColor((profile as any)?.role || '')}>
                        {getRoleLabel((profile as any)?.role || '')}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
                    onClick={handleSignOut}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Déconnexion
                  </Button>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}