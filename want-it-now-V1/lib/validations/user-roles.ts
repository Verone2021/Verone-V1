import { z } from 'zod'
import { USER_ROLES, RELATIONSHIP_TYPES, ASSIGNMENT_TYPES } from '@/types/user-roles'

// Schema pour user_roles
export const userRoleSchema = z.object({
  user_id: z.string().uuid('ID utilisateur invalide'),
  organisation_id: z.string().uuid('ID organisation invalide'),
  role: z.enum(['super_admin', 'admin', 'utilisateur'], {
    message: 'Rôle invalide. Doit être: super_admin, admin ou utilisateur'
  })
})

export const createUserRoleSchema = userRoleSchema

export const updateUserRoleSchema = z.object({
  role: z.enum(['super_admin', 'admin', 'utilisateur'], {
    message: 'Rôle invalide. Doit être: super_admin, admin ou utilisateur'
  }).optional()
})

// Schema pour user_organisation_assignments  
export const userOrganisationAssignmentSchema = z.object({
  user_id: z.string().uuid('ID utilisateur invalide'),
  organisation_id: z.string().uuid('ID organisation invalide'),
  relationship_type: z.enum(['locataire', 'prestataire'], {
    message: 'Type de relation invalide. Doit être: locataire ou prestataire'
  }),
  metadata: z.record(z.string(), z.any()).optional().default({})
})

export const createUserAssignmentSchema = userOrganisationAssignmentSchema

export const updateUserAssignmentSchema = z.object({
  relationship_type: z.enum(['locataire', 'prestataire'], {
    message: 'Type de relation invalide. Doit être: locataire ou prestataire'
  }).optional(),
  metadata: z.record(z.string(), z.any()).optional()
}).refine((data) => Object.keys(data).length > 0, {
  message: 'Au moins un champ doit être modifié'
})

// Schema pour user_property_assignments
export const userPropertyAssignmentSchema = z.object({
  user_id: z.string().uuid('ID utilisateur invalide'),
  propriete_id: z.string().uuid('ID propriété invalide'),
  assignment_type: z.enum(['locataire', 'prestataire'], {
    message: 'Type d\'assignation invalide. Doit être: locataire ou prestataire'
  }),
  assignment_details: z.record(z.string(), z.any()).optional().default({})
})

export const createUserPropertyAssignmentSchema = userPropertyAssignmentSchema

// Suppression des schémas dupliqués - on garde uniquement la version correcte plus bas

// Schema pour création utilisateur multi-rôle (nouveau système)
export const createUserWithRolesSchema = z.object({
  // Champs utilisateur de base
  prenom: z.string()
    .min(2, 'Le prénom doit contenir au moins 2 caractères')
    .max(100, 'Le prénom ne peut pas dépasser 100 caractères')
    .trim(),
  nom: z.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères')
    .trim(),
  email: z.string()
    .email('Format d\'email invalide')
    .max(255, 'L\'email ne peut pas dépasser 255 caractères'),
  telephone: z.string()
    .max(20, 'Le téléphone ne peut pas dépasser 20 caractères')
    .regex(/^[\d\s\+\-\(\)]*$/, 'Format de téléphone invalide')
    .optional(),
  
  // Rôle principal
  role: z.enum(['super_admin', 'admin', 'locataire', 'collaborateur'], {
    message: 'Rôle invalide. Choisissez parmi: super_admin, admin, locataire, collaborateur'
  }),
  
  // Assignations conditionnelles par rôle
  organisations: z.array(z.string().uuid('ID organisation invalide')).optional(),
  proprietes: z.array(z.string().uuid('ID propriété invalide')).optional(),
  reservations: z.array(z.string().uuid('ID réservation invalide')).optional(),
  proprietes_assignees: z.array(z.string().uuid('ID propriété assignée invalide')).optional(),
}).refine((data) => {
  // Validation conditionnelle selon le rôle
  switch (data.role) {
    case 'admin':
      return data.organisations && data.organisations.length >= 1
    case 'locataire':
      // Pour l'instant, optionnel (propriétés pas encore implémentées)
      return true
    case 'collaborateur':
      // Pour l'instant, optionnel (propriétés assignées pas encore implémentées)
      return true
    case 'super_admin':
      // Super admin n'a pas d'assignations spécifiques
      return true
    default:
      return false
  }
}, {
  message: "Les admins doivent avoir au moins une organisation assignée",
  path: ["organisations"]
})

// Schema pour mise à jour utilisateur multi-rôle
export const updateUserWithRolesSchema = createUserWithRolesSchema.partial().extend({
  id: z.string().uuid('ID utilisateur invalide')
})

// Types dérivés des schémas
export type CreateUserWithRolesInput = z.infer<typeof createUserWithRolesSchema>
export type UpdateUserWithRolesInput = z.infer<typeof updateUserWithRolesSchema>

// Configuration des rôles avec métadonnées
export const ROLE_CONFIG = {
  super_admin: {
    label: 'Super Administrateur',
    description: 'Accès complet à toutes les fonctionnalités',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    assignmentRequired: false
  },
  admin: {
    label: 'Administrateur',
    description: 'Gestion des utilisateurs et organisations assignées',
    color: 'bg-orange-100 text-orange-800 border-orange-200', 
    assignmentRequired: true,
    assignmentType: 'organisations'
  },
  locataire: {
    label: 'Locataire', 
    description: 'Locataire avec réservations actives',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    assignmentRequired: false,
    assignmentType: 'reservations'
  },
  collaborateur: {
    label: 'Collaborateur',
    description: 'Accès aux propriétés assignées',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    assignmentRequired: false,
    assignmentType: 'proprietes_assignees'
  }
} as const

export type UserRole = keyof typeof ROLE_CONFIG

// Schema pour filtres utilisateurs
export const userFiltersSchema = z.object({
  search: z.string().optional(),
  role: z.array(z.enum(['super_admin', 'admin', 'locataire', 'collaborateur'])).optional(),
  organisations: z.array(z.string().uuid()).optional(),
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(10)
})

export type UserFilters = z.infer<typeof userFiltersSchema>

// Messages d'erreur personnalisés
export const userRoleErrorMessages = {
  invalid_user_id: 'ID utilisateur invalide',
  invalid_organisation_id: 'ID organisation invalide', 
  invalid_role: 'Rôle invalide. Doit être: super_admin, admin ou utilisateur',
  invalid_relationship_type: 'Type de relation invalide. Doit être: locataire ou prestataire',
  invalid_assignment_type: 'Type d\'assignation invalide. Doit être: locataire ou prestataire',
  duplicate_role: 'Cet utilisateur a déjà ce rôle dans cette organisation',
  duplicate_assignment: 'Cet utilisateur a déjà cette assignation dans cette organisation',
  role_required: 'Au moins un rôle doit être assigné à l\'utilisateur',
  organisation_required: 'L\'organisation est requise',
  user_not_found: 'Utilisateur non trouvé',
  organisation_not_found: 'Organisation non trouvée',
  permission_denied: 'Permissions insuffisantes pour cette action',
  cannot_remove_last_super_admin: 'Impossible de supprimer le dernier super administrateur',
  admin_needs_organisation: 'Les administrateurs doivent avoir au moins une organisation',
  invalid_assignment_for_role: 'Ce type d\'assignation n\'est pas valide pour ce rôle'
} as const