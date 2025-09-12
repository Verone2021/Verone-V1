// =============================================================================
// DATABASE-FIRST TYPES - ARCHITECTURE UNIFIÉE
// =============================================================================

/**
 * Base pour toutes les entités avec champs système
 */
export interface BaseEntity {
  id: string
  created_at: string
  updated_at: string
}

/**
 * Base pour entités liées à une organisation
 */
export interface OrganisationScopedEntity extends BaseEntity {
  organisation_id: string
}

// =============================================================================
// ENTITÉS CORE
// =============================================================================

/**
 * Organisation - Entité complète DB
 */
export interface Organisation extends BaseEntity {
  nom: string
  pays: string
  description?: string
  adresse_siege?: string
  telephone?: string
  email?: string
  site_web?: string
  is_active: boolean
}

/**
 * Utilisateur - Entité complète DB  
 */
export interface Utilisateur extends BaseEntity {
  nom: string
  prenom: string
  email: string
  telephone?: string
  role: 'super_admin' | 'admin' | 'proprietaire'
  is_active: boolean
  last_login?: string
  preferences?: Record<string, any>
}

/**
 * Rôle utilisateur-organisation
 */
export interface UserRole extends BaseEntity {
  user_id: string
  organisation_id: string
  role: 'super_admin' | 'admin' | 'proprietaire'
  created_by: string
}

// =============================================================================
// TYPES ENRICHIS POUR L'INTERFACE
// =============================================================================

/**
 * Utilisateur avec assignations
 */
export interface UtilisateurWithRoles extends Utilisateur {
  user_roles?: (UserRole & {
    organisation?: Pick<Organisation, 'id' | 'nom' | 'pays'>
  })[]
}

// =============================================================================
// FORMATS DE RÉSULTATS API
// =============================================================================

/**
 * Format standard MCP pour toutes les actions server
 */
export interface ActionResult<T = any> {
  ok: boolean
  data?: T
  error?: string
  message?: string // Optionnel pour compatibilité
}

/**
 * Résultat paginé
 */
export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

// =============================================================================
// TYPES POUR FORMULAIRES (Validation)
// =============================================================================

/**
 * Types partiels pour création (sans champs système)
 */
export type CreateOrganisationData = Omit<Organisation, keyof BaseEntity>
export type CreateUtilisateurData = Omit<Utilisateur, keyof BaseEntity>

/**
 * Types partiels pour mise à jour (avec ID obligatoire)
 */
export type UpdateOrganisationData = Partial<CreateOrganisationData> & { id: string }
export type UpdateUtilisateurData = Partial<CreateUtilisateurData> & { id: string }

// =============================================================================
// TYPES POUR FILTRAGE ET RECHERCHE
// =============================================================================

export interface OrganisationFilters {
  search?: string
  pays?: string
  is_active?: boolean
  offset: number
  limit: number
}

export interface UtilisateurFilters {
  search?: string
  role?: Utilisateur['role']
  organisation_id?: string
  is_active?: boolean
  offset: number
  limit: number
}