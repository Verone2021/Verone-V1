import { z } from 'zod'

// Organisation entity Zod schemas for validation
export const organisationSchema = z.object({
  id: z.string().uuid('ID invalide'),
  nom: z.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(255, 'Le nom ne peut pas dépasser 255 caractères')
    .transform(val => val.trim()),
  pays: z.string()
    .length(2, 'Le code pays doit contenir exactement 2 caractères')
    .regex(/^[A-Z]{2}$/, 'Le code pays doit être composé de 2 lettres majuscules (ex: FR, ES, DE)'),
  description: z.string().max(1000, 'La description ne peut pas dépasser 1000 caractères').optional(),
  adresse_siege: z.string().max(500, 'L\'adresse ne peut pas dépasser 500 caractères').optional(),
  telephone: z.string()
    .max(20, 'Le numéro de téléphone ne peut pas dépasser 20 caractères')
    .regex(/^[\+]?[0-9\s\-\(\)]+$/, 'Format de téléphone invalide')
    .optional(),
  email: z.string()
    .email('Format d\'email invalide')
    .max(255, 'L\'email ne peut pas dépasser 255 caractères')
    .optional(),
  site_web: z.string()
    .url('URL invalide')
    .max(255, 'L\'URL ne peut pas dépasser 255 caractères')
    .optional(),
  is_active: z.boolean().default(true),
  deleted_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  created_by: z.string().uuid().nullable(),
  updated_by: z.string().uuid().nullable(),
})

// Schema for creating a new organisation
export const createOrganisationSchema = organisationSchema.omit({
  id: true,
  is_active: true,
  deleted_at: true,
  created_at: true,
  updated_at: true,
  created_by: true,
  updated_by: true,
})

// Schema for updating an existing organisation (pays never modifiable)
export const updateOrganisationSchema = createOrganisationSchema.omit({
  pays: true  // Pays is never modifiable - it's the unique business identifier
}).partial()

// Schema for organisation form (frontend)
export const organisationFormSchema = z.object({
  nom: z.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(255, 'Le nom ne peut pas dépasser 255 caractères')
    .transform(val => val.trim()),
  pays: z.string()
    .length(2, 'Sélectionnez un pays')
    .regex(/^[A-Z]{2}$/, 'Code pays invalide'),
  description: z.string()
    .max(1000, 'La description ne peut pas dépasser 1000 caractères')
    .optional()
    .or(z.literal('')),
  adresse_siege: z.string()
    .max(500, 'L\'adresse ne peut pas dépasser 500 caractères')
    .optional()
    .or(z.literal('')),
  telephone: z.string()
    .max(20, 'Le numéro de téléphone ne peut pas dépasser 20 caractères')
    .regex(/^[\+]?[0-9\s\-\(\)]*$/, 'Format de téléphone invalide')
    .optional()
    .or(z.literal('')),
  email: z.string()
    .email('Format d\'email invalide')
    .max(255, 'L\'email ne peut pas dépasser 255 caractères')
    .optional()
    .or(z.literal('')),
  site_web: z.string()
    .url('URL invalide (ex: https://exemple.com)')
    .max(255, 'L\'URL ne peut pas dépasser 255 caractères')
    .optional()
    .or(z.literal('')),
})

// Schema for organisation edit form (frontend - excludes pays)
export const organisationEditFormSchema = organisationFormSchema.omit({
  pays: true
})

// Transform empty strings to undefined for optional fields
export const transformOrganisationFormData = (data: z.infer<typeof organisationFormSchema>) => ({
  ...data,
  description: data.description === '' ? undefined : data.description,
  adresse_siege: data.adresse_siege === '' ? undefined : data.adresse_siege,
  telephone: data.telephone === '' ? undefined : data.telephone,
  email: data.email === '' ? undefined : data.email,
  site_web: data.site_web === '' ? undefined : data.site_web,
})

// Transform edit form data (excludes pays)
export const transformOrganisationEditFormData = (data: z.infer<typeof organisationEditFormSchema>) => ({
  ...data,
  description: data.description === '' ? undefined : data.description,
  adresse_siege: data.adresse_siege === '' ? undefined : data.adresse_siege,
  telephone: data.telephone === '' ? undefined : data.telephone,
  email: data.email === '' ? undefined : data.email,
  site_web: data.site_web === '' ? undefined : data.site_web,
})

// TypeScript types
export type Organisation = z.infer<typeof organisationSchema>
export type CreateOrganisation = z.infer<typeof createOrganisationSchema>
export type UpdateOrganisation = z.infer<typeof updateOrganisationSchema>
export type OrganisationFormData = z.infer<typeof organisationFormSchema>
export type OrganisationEditFormData = z.infer<typeof organisationEditFormSchema>

// Country codes for dropdown selection
export const COUNTRY_OPTIONS = [
  { value: 'FR', label: '🇫🇷 France' },
  { value: 'ES', label: '🇪🇸 Espagne' },
  { value: 'DE', label: '🇩🇪 Allemagne' },
  { value: 'IT', label: '🇮🇹 Italie' },
  { value: 'GB', label: '🇬🇧 Royaume-Uni' },
  { value: 'BE', label: '🇧🇪 Belgique' },
  { value: 'CH', label: '🇨🇭 Suisse' },
  { value: 'NL', label: '🇳🇱 Pays-Bas' },
  { value: 'PT', label: '🇵🇹 Portugal' },
  { value: 'AT', label: '🇦🇹 Autriche' },
] as const

// Error messages for unique constraint violation
export const ORGANISATION_ERRORS = {
  COUNTRY_EXISTS: 'Une organisation existe déjà pour ce pays',
  NOT_FOUND: 'Organisation non trouvée',
  UNAUTHORIZED: 'Vous n\'êtes pas autorisé à effectuer cette action',
  INVALID_DATA: 'Données invalides',
} as const