import { z } from 'zod'

// Utilisateur entity Zod schemas for validation
export const utilisateurSchema = z.object({
  id: z.string().uuid('ID invalide'),
  nom: z.string()
    .max(255, 'Le nom ne peut pas dépasser 255 caractères')
    .optional()
    .nullable(),
  prenom: z.string()
    .max(255, 'Le prénom ne peut pas dépasser 255 caractères')
    .optional()
    .nullable(),
  email: z.string()
    .email('Format d\'email invalide')
    .max(255, 'L\'email ne peut pas dépasser 255 caractères'),
  telephone: z.string()
    .max(50, 'Le numéro de téléphone ne peut pas dépasser 50 caractères')
    .regex(/^[\+]?[0-9\s\-\(\)]*$/, 'Format de téléphone invalide')
    .optional()
    .nullable(),
  role: z.enum(['super_admin', 'admin', 'locataire', 'prestataire'], {
    message: 'Rôle invalide'
  }),
  organisation_id: z.string().uuid('Organisation invalide').optional().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

// Schema for creating a new user
export const createUtilisateurSchema = utilisateurSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

// Schema for updating an existing user
export const updateUtilisateurSchema = createUtilisateurSchema.partial()

// Schema for user form (frontend)
export const utilisateurFormSchema = z.object({
  nom: z.string()
    .max(255, 'Le nom ne peut pas dépasser 255 caractères')
    .optional()
    .or(z.literal('')),
  prenom: z.string()
    .max(255, 'Le prénom ne peut pas dépasser 255 caractères')
    .optional()
    .or(z.literal('')),
  email: z.string()
    .email('Format d\'email invalide')
    .max(255, 'L\'email ne peut pas dépasser 255 caractères')
    .min(1, 'L\'email est obligatoire'),
  telephone: z.string()
    .max(50, 'Le numéro de téléphone ne peut pas dépasser 50 caractères')
    .regex(/^[\+]?[0-9\s\-\(\)]*$/, 'Format de téléphone invalide')
    .optional()
    .or(z.literal('')),
  role: z.enum(['super_admin', 'admin', 'locataire', 'prestataire'], {
    message: 'Sélectionnez un rôle valide'
  }),
  organisation_id: z.string()
    .uuid('Organisation invalide')
    .optional()
    .or(z.literal(''))
    .or(z.literal(null))
    .nullable(),
})

// Schema for admin creation form (specific to admin users)
export const adminFormSchema = z.object({
  nom: z.string()
    .max(255, 'Le nom ne peut pas dépasser 255 caractères')
    .optional()
    .or(z.literal('')),
  prenom: z.string()
    .max(255, 'Le prénom ne peut pas dépasser 255 caractères')
    .optional()
    .or(z.literal('')),
  email: z.string()
    .email('Format d\'email invalide')
    .max(255, 'L\'email ne peut pas dépasser 255 caractères')
    .min(1, 'L\'email est obligatoire'),
  telephone: z.string()
    .max(50, 'Le numéro de téléphone ne peut pas dépasser 50 caractères')
    .optional()
    .or(z.literal('')),
  organisation_id: z.string()
    .uuid('Organisation invalide')
    .min(1, 'Sélectionnez une organisation'),
})

// Transform admin form data
export const transformAdminFormData = (data: z.infer<typeof adminFormSchema>) => ({
  ...data,
  nom: data.nom === '' ? null : data.nom,
  prenom: data.prenom === '' ? null : data.prenom,
  telephone: data.telephone === '' ? null : data.telephone,
  role: 'admin' as const, // Always admin for this form
})

// Schema for user profile editing (specific to profile information only)
export const userProfileEditSchema = z.object({
  prenom: z
    .string()
    .min(1, 'Le prénom est obligatoire')
    .min(2, 'Le prénom doit contenir au moins 2 caractères')
    .max(50, 'Le prénom ne peut pas dépasser 50 caractères')
    .regex(/^[a-zA-ZÀ-ÿ\s-']+$/, 'Le prénom ne peut contenir que des lettres, espaces, tirets et apostrophes'),
  
  nom: z
    .string()
    .min(1, 'Le nom est obligatoire')
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(50, 'Le nom ne peut pas dépasser 50 caractères')
    .regex(/^[a-zA-ZÀ-ÿ\s-']+$/, 'Le nom ne peut contenir que des lettres, espaces, tirets et apostrophes'),
  
  telephone: z
    .string()
    .transform(val => val === '' ? null : val)
    .refine(
      (val) => !val || /^(\+33|0)[1-9](\d{8})$/.test(val.replace(/[\s.-]/g, '')),
      {
        message: 'Le numéro de téléphone doit être un numéro français valide (ex: 01 23 45 67 89 ou +33 1 23 45 67 89)'
      }
    )
    .nullable()
    .optional()
})

// Transform empty strings to null for optional fields
export const transformUtilisateurFormData = (data: z.infer<typeof utilisateurFormSchema>) => ({
  ...data,
  nom: data.nom === '' ? null : data.nom,
  prenom: data.prenom === '' ? null : data.prenom,
  telephone: data.telephone === '' ? null : data.telephone,
  organisation_id: data.organisation_id === '' ? null : data.organisation_id,
})

// TypeScript types
export type Utilisateur = z.infer<typeof utilisateurSchema>
export type CreateUtilisateur = z.infer<typeof createUtilisateurSchema>
export type UpdateUtilisateur = z.infer<typeof updateUtilisateurSchema>
export type UtilisateurFormData = z.infer<typeof utilisateurFormSchema>
export type AdminFormData = z.infer<typeof adminFormSchema>
export type UserProfileEditData = z.infer<typeof userProfileEditSchema>

// Role options for dropdown selection
export const ROLE_OPTIONS = [
  { value: 'super_admin', label: '👑 Super Administrateur' },
  { value: 'admin', label: '🛡️ Administrateur' },
  { value: 'locataire', label: '👤 Locataire' },
  { value: 'prestataire', label: '🔧 Prestataire' },
] as const

// Role descriptions for help text
export const ROLE_DESCRIPTIONS = {
  super_admin: 'Accès complet à toutes les organisations et fonctionnalités',
  admin: 'Gestion d\'une ou plusieurs organisations attribuées',
  locataire: 'Accès uniquement à ses réservations',
  prestataire: 'Accès aux propriétés pour interventions (V2)',
} as const

// Error messages
export const UTILISATEUR_ERRORS = {
  EMAIL_EXISTS: 'Cette adresse email est déjà utilisée',
  NOT_FOUND: 'Utilisateur non trouvé',
  UNAUTHORIZED: 'Vous n\'êtes pas autorisé à effectuer cette action',
  INVALID_DATA: 'Données invalides',
  CANNOT_MODIFY_ROLE: 'Vous ne pouvez pas modifier votre propre rôle',
  CANNOT_DELETE_SELF: 'Vous ne pouvez pas supprimer votre propre compte',
} as const

// Helper functions
export const getDisplayName = (utilisateur: Pick<Utilisateur, 'nom' | 'prenom' | 'email'>) => {
  const parts = [utilisateur.prenom, utilisateur.nom].filter(Boolean)
  return parts.length > 0 ? parts.join(' ') : utilisateur.email
}

export const getRoleLabel = (role: Utilisateur['role']) => {
  return ROLE_OPTIONS.find(option => option.value === role)?.label || role
}

export const getRoleColor = (role: Utilisateur['role']) => {
  const roleColors = {
    super_admin: 'bg-purple-500 text-white',
    admin: 'bg-blue-500 text-white',
    locataire: 'bg-gray-500 text-white',
    prestataire: 'bg-orange-500 text-white',
  } as const
  
  return roleColors[role] || 'bg-gray-500 text-white'
}

export const canModifyUser = (currentUserRole: string, targetUserId: string, currentUserId: string) => {
  // Super admin et admin peuvent modifier tous les utilisateurs
  if (['super_admin', 'admin'].includes(currentUserRole)) {
    return true
  }
  
  // Un utilisateur peut modifier ses propres informations
  return targetUserId === currentUserId
}

export const canDeleteUser = (currentUserRole: string, targetUserId: string, currentUserId: string) => {
  // Seuls les super admin peuvent supprimer
  if (currentUserRole !== 'super_admin') {
    return false
  }
  
  // Un utilisateur ne peut pas se supprimer lui-même
  return targetUserId !== currentUserId
}