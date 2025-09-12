// Types pour la nouvelle architecture multi-organisation user_roles

export interface UserRole {
  id: string
  user_id: string
  organisation_id: string
  role: 'super_admin' | 'admin' | 'utilisateur'
  created_at: string
  updated_at: string
  created_by?: string
  updated_by?: string
}

export interface UserOrganisationAssignment {
  id: string
  user_id: string
  organisation_id: string
  relationship_type: 'proprietaire' | 'locataire' | 'prestataire'
  metadata: Record<string, any>
  created_at: string
  updated_at: string
  created_by?: string
  updated_by?: string
}

export interface UserPropertyAssignment {
  id: string
  user_id: string
  propriete_id: string
  assignment_type: 'proprietaire' | 'prestataire' | 'locataire'
  assignment_details: Record<string, any>
  created_at: string
  updated_at: string
  created_by?: string
  updated_by?: string
}

// Types pour les requêtes et réponses
export interface UserWithRoles {
  id: string
  nom: string
  prenom: string
  email: string
  telephone?: string
  created_at: string
  updated_at: string
  roles: Array<{
    organisation_id: string
    organisation_nom: string
    role: string
  }>
  business_assignments: Array<{
    organisation_id: string
    organisation_nom: string
    relationship_type: string
    metadata: Record<string, any>
  }>
}

export interface CreateUserRoleData {
  user_id: string
  organisation_id: string
  role: 'super_admin' | 'admin' | 'utilisateur'
}

export interface CreateUserAssignmentData {
  user_id: string
  organisation_id: string
  relationship_type: 'proprietaire' | 'locataire' | 'prestataire'
  metadata?: Record<string, any>
}

// Types pour les hooks et contextes
export interface UserRoleContext {
  userRoles: UserRole[]
  userAssignments: UserOrganisationAssignment[]
  isLoading: boolean
  error: string | null
  hasRole: (organisationId: string, role: string) => boolean
  hasAssignment: (organisationId: string, relationshipType: string) => boolean
  isSuperAdmin: boolean
  adminOrganisations: string[]
  assignedOrganisations: string[]
}

// Types pour les filtres et recherches
export interface UserRoleFilters {
  organisation_id?: string
  role?: string
  user_id?: string
}

export interface UserAssignmentFilters {
  organisation_id?: string
  relationship_type?: string
  user_id?: string
}

// Enums pour validation stricte
export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin', 
  UTILISATEUR: 'utilisateur'
} as const

export const RELATIONSHIP_TYPES = {
  PROPRIETAIRE: 'proprietaire',
  LOCATAIRE: 'locataire',
  PRESTATAIRE: 'prestataire'
} as const

export const ASSIGNMENT_TYPES = {
  PROPRIETAIRE: 'proprietaire',
  PRESTATAIRE: 'prestataire',
  LOCATAIRE: 'locataire'
} as const

export type UserRoleType = typeof USER_ROLES[keyof typeof USER_ROLES]
export type RelationshipType = typeof RELATIONSHIP_TYPES[keyof typeof RELATIONSHIP_TYPES]  
export type AssignmentType = typeof ASSIGNMENT_TYPES[keyof typeof ASSIGNMENT_TYPES]