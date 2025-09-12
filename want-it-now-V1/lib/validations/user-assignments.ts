import { z } from 'zod'

// Schema pour assigner des organisations à un utilisateur
export const assignOrganisationsSchema = z.object({
  userId: z.string().uuid('ID utilisateur invalide'),
  organisationIds: z.array(z.string().uuid('ID organisation invalide'))
    .min(1, 'Au moins une organisation doit être sélectionnée'),
})

// Schema pour supprimer une assignation
export const removeAssignmentSchema = z.object({
  userId: z.string().uuid('ID utilisateur invalide'),
  organisationId: z.string().uuid('ID organisation invalide'),
})

// Types dérivés des schemas
export type AssignOrganisationsInput = z.infer<typeof assignOrganisationsSchema>
export type RemoveAssignmentInput = z.infer<typeof removeAssignmentSchema>

// Type pour représenter une assignation utilisateur-organisation
export interface UserAssignment {
  user_id: string
  organisation_id: string
  role: string
  created_at: string
  updated_at: string
  created_by: string
  user: {
    id: string
    nom: string | null
    prenom: string | null
    email: string
  }
  organisation: {
    id: string
    nom: string
    pays: string
    is_active: boolean
  }
}

// Type pour les statistiques d'assignation
export interface AssignmentStats {
  total_users: number
  total_organisations: number
  total_assignments: number
  users_with_multiple_orgs: number
  organisations_with_admins: number
}

// Messages d'erreur
export const USER_ASSIGNMENT_ERRORS = {
  UNAUTHORIZED: 'Vous n\'avez pas les permissions pour effectuer cette action',
  USER_NOT_FOUND: 'Utilisateur non trouvé',
  ORGANISATION_NOT_FOUND: 'Organisation non trouvée',
  ASSIGNMENT_EXISTS: 'Cette assignation existe déjà',
  ASSIGNMENT_NOT_FOUND: 'Assignation non trouvée',
  INVALID_ROLE: 'Seuls les administrateurs peuvent être assignés à des organisations',
  CANNOT_ASSIGN_SUPER_ADMIN: 'Les super administrateurs n\'ont pas besoin d\'assignations d\'organisations',
  ORGANISATION_INACTIVE: 'Impossible d\'assigner une organisation inactive',
  INVALID_DATA: 'Données de formulaire invalides',
} as const