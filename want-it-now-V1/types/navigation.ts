import { LucideIcon } from 'lucide-react'

export type UserRole = 'super_admin' | 'admin' | 'proprietaire' | 'locataire' | 'collaborateur'

export type NavGroup = 'core' | 'gestion' | 'config'

export interface NavItem {
  id: string
  label: string
  href: string
  icon: LucideIcon
  roles: UserRole[]
  group: NavGroup
  description?: string
  orgScoped?: boolean
  disabled?: boolean
}

export interface NavSection {
  group: NavGroup
  label: string
  items: NavItem[]
}