'use client'

import {
  BarChart3,
  User,
  Users,
  Building2,
  FileText,
  CalendarDays,
  type LucideIcon
} from 'lucide-react'

export interface NavigationItem {
  id: string
  title: string
  href: string
  icon: LucideIcon
  roles?: string[]
  description?: string
  group: 'principal' | 'parametres' | 'compte'
  adminOnly?: boolean
  superAdminOnly?: boolean
}

export interface NavigationGroup {
  id: string
  title: string
  items: NavigationItem[]
}

// Single source of truth for all navigation items - SIDEBAR ONLY
export const NAVIGATION_ITEMS: NavigationItem[] = [
  // Principal - Dashboard seulement
  {
    id: 'dashboard',
    title: 'Dashboard',
    href: '/dashboard',
    icon: BarChart3,
    group: 'principal',
    description: 'Tableau de bord'
  },
  // Propriétaires - Gestion des propriétaires
  {
    id: 'proprietaires',
    title: 'Propriétaires',
    href: '/proprietaires',
    icon: Users,
    group: 'principal',
    description: 'Gestion des propriétaires',
    roles: ['admin', 'super_admin']
  },
  // Propriétés - Gestion des propriétés immobilières
  {
    id: 'proprietes',
    title: 'Propriétés',
    href: '/proprietes',
    icon: Building2,
    group: 'principal',
    description: 'Gestion des propriétés immobilières',
    roles: ['admin', 'super_admin']
  },
  // Contrats - Gestion des contrats de location
  {
    id: 'contrats',
    title: 'Contrats',
    href: '/contrats',
    icon: FileText,
    group: 'principal',
    description: 'Gestion des contrats de location',
    roles: ['admin', 'super_admin']
  },
  // Réservations - Gestion des réservations
  {
    id: 'reservations',
    title: 'Réservations',
    href: '/reservations',
    icon: CalendarDays,
    group: 'principal',
    description: 'Gestion des réservations et disponibilités',
    roles: ['admin', 'super_admin']
  },
]

// Group navigation items by category
export const getNavigationGroups = (
  userRole?: string,
  isSuperAdmin = false,
  isAdmin = false,
  canAccessAdmin = false
): NavigationGroup[] => {
  
  // Filter items based on user permissions
  const filterItems = (items: NavigationItem[]): NavigationItem[] => {
    return items.filter(item => {
      // Super admin only items
      if (item.superAdminOnly && !isSuperAdmin) {
        return false
      }
      
      // Admin only items (includes super admin)
      if (item.adminOnly && !canAccessAdmin) {
        return false
      }
      
      // Role-specific items
      if (item.roles && item.roles.length > 0) {
        return userRole && item.roles.includes(userRole)
      }
      
      return true
    })
  }
  
  const filteredItems = filterItems(NAVIGATION_ITEMS)
  
  // Group items by category - only Principal group now
  const groups: NavigationGroup[] = [
    {
      id: 'principal',
      title: 'Principal',
      items: filteredItems.filter(item => item.group === 'principal')
    }
  ]
  
  // Only return groups that have items
  return groups.filter(group => group.items.length > 0)
}

// Quick access items for header user menu - REMOVED ADMIN LINKS (access via profile now)
export const getQuickAccessItems = (
  userRole?: string,
  isSuperAdmin = false,
  canAccessAdmin = false
): NavigationItem[] => {
  const quickItems: NavigationItem[] = [
    {
      id: 'profile-quick',
      title: 'Mon Profil',
      href: '/profile',
      icon: User,
      group: 'principal'
    }
  ]
  
  // Add proprietaires quick access for authorized users
  if (userRole && ['admin', 'super_admin'].includes(userRole)) {
    quickItems.push({
      id: 'proprietaires-quick',
      title: 'Propriétaires',
      href: '/proprietaires',
      icon: Users,
      group: 'principal',
      description: 'Accès rapide aux propriétaires'
    })
  }

  // Add proprietes quick access for authorized users
  if (userRole && ['admin', 'super_admin'].includes(userRole)) {
    quickItems.push({
      id: 'proprietes-quick',
      title: 'Propriétés',
      href: '/proprietes',
      icon: Building2,
      group: 'principal',
      description: 'Accès rapide aux propriétés'
    })
  }

  // Add contrats quick access for authorized users
  if (userRole && ['admin', 'super_admin'].includes(userRole)) {
    quickItems.push({
      id: 'contrats-quick',
      title: 'Contrats',
      href: '/contrats',
      icon: FileText,
      group: 'principal',
      description: 'Accès rapide aux contrats'
    })
  }

  // Add reservations quick access for authorized users
  if (userRole && ['admin', 'super_admin'].includes(userRole)) {
    quickItems.push({
      id: 'reservations-quick',
      title: 'Réservations',
      href: '/reservations',
      icon: CalendarDays,
      group: 'principal',
      description: 'Accès rapide aux réservations'
    })
  }
  
  // Administration access is now through profile pages only
  // Removed direct header link to maintain clean UX
  
  return quickItems
}

// Navigation helpers
export const isNavigationItemActive = (href: string, currentPath: string): boolean => {
  if (href === '/') {
    return currentPath === '/'
  }
  return currentPath.startsWith(href)
}

export const getNavigationItemById = (id: string): NavigationItem | undefined => {
  return NAVIGATION_ITEMS.find(item => item.id === id)
}