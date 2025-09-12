import { z } from 'zod'

// ==============================================================================
// ENUM TYPES MATCHING DATABASE
// ==============================================================================

// Propriétaire type enum (matches database)
export const ProprietaireTypeEnum = z.enum(['physique', 'morale'])
export type ProprietaireType = z.infer<typeof ProprietaireTypeEnum>

// Forme juridique enum (matches current database enum exactly)
export const FormeJuridiqueEnum = z.enum([
  // French legal forms
  'SARL', 'SAS', 'SA', 'SCI', 'EURL', 'SASU', 
  'GIE', 'Association', 'Autre',
  // Portuguese legal forms (database short codes)
  'LDA', 'SA_PT', 'UNIPESSOAL', 'SUQ', 'SGPS',
  // UK legal forms  
  'LTD', 'PLC',
  // German legal forms
  'GMBH', 'AG',
  // Spanish legal forms
  'SL', 'SA_ES'
])
export type FormeJuridique = z.infer<typeof FormeJuridiqueEnum>

// Code pays enum
export const CountryCodeEnum = z.enum(['FR', 'ES', 'DE', 'IT', 'GB', 'BE', 'CH', 'NL', 'PT', 'AT'])
export type CountryCode = z.infer<typeof CountryCodeEnum>

// ==============================================================================
// FORME JURIDIQUE DISPLAY FUNCTIONS
// ==============================================================================

/**
 * Retourne le libellé d'affichage complet pour une forme juridique
 * Gère les formes juridiques françaises et internationales (LDA portugaise)
 */
export function getFormeJuridiqueLabel(formeJuridique: string | null | undefined): string {
  if (!formeJuridique) return 'Non spécifiée'
  
  const labels: Record<string, string> = {
    // Formes juridiques françaises
    'SARL': 'SARL - Société à Responsabilité Limitée (France)',
    'SAS': 'SAS - Société par Actions Simplifiée (France)', 
    'SA': 'SA - Société Anonyme (France)',
    'SCI': 'SCI - Société Civile Immobilière (France)',
    'EURL': 'EURL - Entreprise Unipersonnelle à Responsabilité Limitée (France)',
    'SASU': 'SASU - Société par Actions Simplifiée Unipersonnelle (France)',
    'GIE': 'GIE - Groupement d\'Intérêt Économique (France)',
    'Association': 'Association (France)',
    
    // Formes juridiques internationales
    'LDA': 'LDA - Sociedade por Quotas (Portugal)',
    'SA_PT': 'SA - Sociedade Anónima (Portugal)',
    'SU': 'SU - Sociedade Unipessoal (Portugal)',
    'SL': 'SL - Sociedad Limitada (Espagne)',
    'SA_ES': 'SA - Sociedad Anónima (Espagne)',
    'LTD': 'LTD - Limited Company (Royaume-Uni)',
    'PLC': 'PLC - Public Limited Company (Royaume-Uni)',
    'GMBH': 'GmbH - Gesellschaft mit beschränkter Haftung (Allemagne)',
    'AG': 'AG - Aktiengesellschaft (Allemagne)'
  }
  
  return labels[formeJuridique] || formeJuridique
}

// ==============================================================================
// BASE PROPRIETAIRE SCHEMA
// ==============================================================================

export const proprietaireSchema = z.object({
  id: z.string().uuid('ID invalide'),
  
  // Type et informations de base
  type: ProprietaireTypeEnum,
  nom: z.string()
    .min(1, 'Le nom est obligatoire')
    .max(255, 'Le nom ne peut pas dépasser 255 caractères')
    .transform(val => val.trim()),
  prenom: z.string()
    .max(255, 'Le prénom ne peut pas dépasser 255 caractères')
    .nullable()
    .transform(val => val?.trim() || null),
  
  // Contact
  email: z.string()
    .email('Format d\'email invalide')
    .max(255, 'L\'email ne peut pas dépasser 255 caractères')
    .nullable(),
  telephone: z.string()
    .max(50, 'Le numéro de téléphone ne peut pas dépasser 50 caractères')
    .regex(/^[\+]?[0-9\s\-\(\)]*$/, 'Format de téléphone invalide')
    .nullable(),
  
  // Adresse
  adresse: z.string().max(1000, 'L\'adresse ne peut pas dépasser 1000 caractères').nullable(),
  code_postal: z.string().max(20, 'Le code postal ne peut pas dépasser 20 caractères').nullable(),
  ville: z.string().max(255, 'La ville ne peut pas dépasser 255 caractères').nullable(),
  pays: z.string()
    .length(2, 'Le code pays doit contenir exactement 2 caractères')
    .regex(/^[A-Z]{2}$/, 'Le code pays doit être composé de 2 lettres majuscules')
    .default('FR'),
  
  // Informations spécifiques personne physique
  date_naissance: z.string().date('Date de naissance invalide').nullable(),
  lieu_naissance: z.string().max(255, 'Le lieu de naissance ne peut pas dépasser 255 caractères').nullable(),
  nationalite: z.string().max(100, 'La nationalité ne peut pas dépasser 100 caractères').nullable(),
  
  // Informations spécifiques personne morale
  forme_juridique: FormeJuridiqueEnum.nullable(),
  numero_identification: z.string().max(100, 'Le numéro d\'identification ne peut pas dépasser 100 caractères').nullable(),
  capital_social: z.number().nonnegative('Le capital social doit être positif').nullable(),
  nombre_parts_total: z.number().int().positive('Le nombre de parts doit être un entier positif').nullable(),
  
  // Champs internationaux
  pays_constitution: z.string().max(10, 'Le pays de constitution ne peut pas dépasser 10 caractères').nullable(),
  nipc_numero: z.string().max(20, 'Le numéro NIPC ne peut pas dépasser 20 caractères').nullable(),
  nif_numero: z.string().max(20, 'Le numéro NIF ne peut pas dépasser 20 caractères').nullable(), 
  vat_number: z.string().max(30, 'Le numéro de TVA ne peut pas dépasser 30 caractères').nullable(),
  
  // Informations bancaires
  iban: z.string().max(34, 'L\'IBAN ne peut pas dépasser 34 caractères').nullable(),
  account_holder_name: z.string().max(255, 'Le nom du titulaire ne peut pas dépasser 255 caractères').nullable(),
  bank_name: z.string().max(255, 'Le nom de la banque ne peut pas dépasser 255 caractères').nullable(),
  swift_bic: z.string().max(11, 'Le code BIC/SWIFT ne peut pas dépasser 11 caractères').nullable(),
  
  // États et métadonnées
  is_brouillon: z.boolean().default(true),
  is_active: z.boolean().default(true),
  
  // Audit fields
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  created_by: z.string().uuid().nullable(),
  updated_by: z.string().uuid().nullable(),
})

// ==============================================================================
// ASSOCIE SCHEMA
// ==============================================================================

export const associeSchema = z.object({
  id: z.string().uuid('ID invalide'),
  proprietaire_id: z.string().uuid('ID propriétaire invalide'),
  
  // Type et informations de base
  type: ProprietaireTypeEnum,
  nom: z.string()
    .min(1, 'Le nom est obligatoire')
    .max(255, 'Le nom ne peut pas dépasser 255 caractères')
    .transform(val => val.trim()),
  prenom: z.string()
    .max(255, 'Le prénom ne peut pas dépasser 255 caractères')
    .nullable()
    .transform(val => val?.trim() || null),
  
  // Contact
  email: z.string()
    .email('Format d\'email invalide')
    .max(255, 'L\'email ne peut pas dépasser 255 caractères')
    .nullable(),
  telephone: z.string()
    .max(50, 'Le numéro de téléphone ne peut pas dépasser 50 caractères')
    .regex(/^[\+]?[0-9\s\-\(\)]*$/, 'Format de téléphone invalide')
    .nullable(),
  
  // Informations spécifiques personne physique
  date_naissance: z.string().date('Date de naissance invalide').nullable(),
  lieu_naissance: z.string().max(255, 'Le lieu de naissance ne peut pas dépasser 255 caractères').nullable(),
  nationalite: z.string().max(100, 'La nationalité ne peut pas dépasser 100 caractères').nullable(),
  
  // Informations spécifiques personne morale
  forme_juridique: FormeJuridiqueEnum.nullable(),
  numero_identification: z.string().max(100, 'Le numéro d\'identification ne peut pas dépasser 100 caractères').nullable(),
  
  // Quotités et participations
  nombre_parts: z.number().int().positive('Le nombre de parts doit être un entier positif'),
  date_entree: z.string().date('Date d\'entrée invalide').default(() => new Date().toISOString().split('T')[0]),
  date_sortie: z.string().date('Date de sortie invalide').nullable(),
  motif_sortie: z.string().max(1000, 'Le motif de sortie ne peut pas dépasser 1000 caractères').nullable(),
  
  // Métadonnées
  ordre_affichage: z.number().int().nonnegative('L\'ordre d\'affichage doit être positif').default(0),
  is_active: z.boolean().default(true),
  
  // Audit fields
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  created_by: z.string().uuid().nullable(),
  updated_by: z.string().uuid().nullable(),
})

// ==============================================================================
// CREATE SCHEMAS (FOR FORMS)
// ==============================================================================

// ==============================================================================
// DRAFT SCHEMAS (FOR PARTIAL VALIDATION)
// ==============================================================================

// Schema pour créer un propriétaire physique en mode brouillon
export const createProprietairePhysiqueDraftSchema = z.object({
  type: z.literal('physique'),
  nom: z.string()
    .max(255, 'Le nom ne peut pas dépasser 255 caractères')
    .transform(val => val.trim())
    .pipe(z.string().min(1, 'Le nom est obligatoire')),
  prenom: z.string()
    .max(255, 'Le prénom ne peut pas dépasser 255 caractères')
    .transform(val => val.trim())
    .pipe(z.string().min(1, 'Le prénom est obligatoire')),
  
  // Contact
  email: z.string()
    .optional()
    .refine(val => {
      if (!val || val.trim() === '') return true // Accepter vide en brouillon
      return z.string().email().safeParse(val).success
    }, 'Si renseigné, l\'email doit avoir un format valide')
    .transform(val => val?.trim() || ''),
  telephone: z.string()
    .optional()
    .refine(val => {
      if (!val || val.trim() === '') return true // Accepter vide en brouillon
      return /^[\+]?[0-9\s\-\(\)]*$/.test(val) && val.length <= 50
    }, 'Si renseigné, le téléphone doit avoir un format valide')
    .transform(val => val?.trim() || ''),
  
  // Adresse - tout optionnel en brouillon
  adresse: z.string().optional().transform(val => val?.trim() || ''),
  code_postal: z.string().optional().transform(val => val?.trim() || ''),
  ville: z.string().optional().transform(val => val?.trim() || ''),
  pays: z.string().default('FR'),
  
  // Champs spécifiques personne physique - optionnels en brouillon
  date_naissance: z.string()
    .optional()
    .refine(val => {
      if (!val || val.trim() === '') return true // Accepter vide en brouillon
      const date = new Date(val)
      if (isNaN(date.getTime())) return false
      const today = new Date()
      const age = today.getFullYear() - date.getFullYear()
      return age >= 18 && age <= 120
    }, 'Si renseignée, la date doit être valide et l\'âge entre 18 et 120 ans')
    .transform(val => val?.trim() || ''),
  lieu_naissance: z.string()
    .optional()
    .refine(val => {
      if (!val || val.trim() === '') return true // Accepter vide en brouillon
      return val.trim().length >= 2
    }, 'Si renseigné, le lieu de naissance doit contenir au moins 2 caractères')
    .transform(val => val?.trim() || ''),
  nationalite: z.string()
    .optional()
    .refine(val => {
      if (!val || val.trim() === '') return true // Accepter vide en brouillon
      return val.trim().length >= 2
    }, 'Si renseignée, la nationalité doit contenir au moins 2 caractères')
    .transform(val => val?.trim() || ''),
  
  // Informations bancaires - optionnelles
  iban: z.string().optional().transform(val => val?.trim() || ''),
  account_holder_name: z.string().optional().transform(val => val?.trim() || ''),
  bank_name: z.string().optional().transform(val => val?.trim() || ''),
  swift_bic: z.string().optional().transform(val => val?.trim() || ''),
  
  // États
  is_brouillon: z.boolean().default(true),
})

// Schema pour créer un propriétaire morale en mode brouillon
export const createProprietaireMoraleDraftSchema = z.object({
  type: z.literal('morale'),
  nom: z.string()
    .max(255, 'Le nom ne peut pas dépasser 255 caractères')
    .transform(val => val.trim())
    .pipe(z.string().min(1, 'Le nom de l\'entreprise est obligatoire')),
  
  // Contact - optionnel en brouillon
  email: z.string()
    .optional()
    .refine(val => {
      if (!val || val.trim() === '') return true // Accepter vide en brouillon
      return z.string().email().safeParse(val).success
    }, 'Si renseigné, l\'email doit avoir un format valide')
    .transform(val => val?.trim() || ''),
  telephone: z.string()
    .optional()
    .refine(val => {
      if (!val || val.trim() === '') return true // Accepter vide en brouillon
      return /^[\+]?[0-9\s\-\(\)]*$/.test(val) && val.length <= 50
    }, 'Si renseigné, le téléphone doit avoir un format valide')
    .transform(val => val?.trim() || ''),
  
  // Adresse - tout optionnel en brouillon
  adresse: z.string().optional().transform(val => val?.trim() || ''),
  code_postal: z.string().optional().transform(val => val?.trim() || ''),
  ville: z.string().optional().transform(val => val?.trim() || ''),
  pays: z.string().default('FR'),
  
  // Informations entreprise - optionnelles en brouillon
  forme_juridique: FormeJuridiqueEnum.optional(),
  numero_identification: z.string()
    .optional()
    .refine(val => {
      if (!val || val.trim() === '') return true // Accepter vide en brouillon
      return val.trim().length >= 2
    }, 'Si renseigné, le numéro d\'identification doit contenir au moins 2 caractères')
    .transform(val => val?.trim() || ''),
  capital_social: z.number()
    .optional()
    .refine(val => {
      if (val === undefined || val === null) return true // Accepter vide en brouillon
      return val > 0
    }, 'Si renseigné, le capital social doit être positif'),
  nombre_parts_total: z.number()
    .optional()
    .refine(val => {
      if (val === undefined || val === null) return true // Accepter vide en brouillon
      return Number.isInteger(val) && val > 0
    }, 'Si renseigné, le nombre de parts doit être un entier positif'),
  
  // Informations bancaires - optionnelles
  iban: z.string().optional().transform(val => val?.trim() || ''),
  account_holder_name: z.string().optional().transform(val => val?.trim() || ''),
  bank_name: z.string().optional().transform(val => val?.trim() || ''),
  swift_bic: z.string().optional().transform(val => val?.trim() || ''),
  
  // Associés - optionnels en brouillon
  associes: z.array(z.object({
    nom: z.string().min(1, 'Nom requis'),
    prenom: z.string().optional(),
    date_naissance: z.string().optional(),
    parts_nombre: z.number().positive('Le nombre de parts doit être positif'),
    parts_pourcentage: z.number().min(0.01).max(100)
  })).default([]),
  
  // États
  is_brouillon: z.boolean().default(true),
})

// Union discriminée pour les formulaires de création en mode brouillon
export const createProprietaireDraftSchema = z.discriminatedUnion('type', [
  createProprietairePhysiqueDraftSchema,
  createProprietaireMoraleDraftSchema,
])

// Schema pour créer un propriétaire (physique)
export const createProprietairePhysiqueSchema = z.object({
  type: z.literal('physique'),
  nom: z.string()
    .max(255, 'Le nom ne peut pas dépasser 255 caractères')
    .transform(val => val.trim())
    .pipe(z.string().min(1, 'Le nom est obligatoire')),
  prenom: z.string()
    .max(255, 'Le prénom ne peut pas dépasser 255 caractères')
    .transform(val => val.trim())
    .pipe(z.string().min(1, 'Le prénom est obligatoire')),
  
  // Contact
  email: z.string()
    .email('Format d\'email invalide')
    .max(255, 'L\'email ne peut pas dépasser 255 caractères')
    .optional()
    .or(z.literal('')),
  telephone: z.string()
    .max(50, 'Le numéro de téléphone ne peut pas dépasser 50 caractères')
    .regex(/^[\+]?[0-9\s\-\(\)]*$/, 'Format de téléphone invalide')
    .optional()
    .or(z.literal('')),
  
  // Adresse
  adresse: z.string()
    .max(1000, 'L\'adresse ne peut pas dépasser 1000 caractères')
    .optional()
    .or(z.literal('')),
  code_postal: z.string()
    .max(20, 'Le code postal ne peut pas dépasser 20 caractères')
    .optional()
    .or(z.literal('')),
  ville: z.string()
    .max(255, 'La ville ne peut pas dépasser 255 caractères')
    .optional()
    .or(z.literal('')),
  pays: z.string()
    .length(2, 'Sélectionnez un pays')
    .regex(/^[A-Z]{2}$/, 'Code pays invalide')
    .default('FR'),
  
  // Obligatoire pour personne physique
  date_naissance: z.string()
    .date('Date de naissance invalide')
    .refine(date => {
      const birth = new Date(date)
      const today = new Date()
      const age = today.getFullYear() - birth.getFullYear()
      return age >= 18 && age <= 120
    }, 'L\'âge doit être entre 18 et 120 ans'),
  lieu_naissance: z.string()
    .min(2, 'Le lieu de naissance est obligatoire')
    .max(255, 'Le lieu de naissance ne peut pas dépasser 255 caractères')
    .transform(val => val.trim()),
  nationalite: z.string()
    .min(2, 'La nationalité est obligatoire')
    .max(100, 'La nationalité ne peut pas dépasser 100 caractères')
    .transform(val => val.trim()),
  
  // États
  is_brouillon: z.boolean().default(false),
})

// Schema pour créer un propriétaire (morale)
export const createProprietaireMoraleSchema = z.object({
  type: z.literal('morale'),
  nom: z.string()
    .max(255, 'Le nom ne peut pas dépasser 255 caractères')
    .transform(val => val.trim())
    .pipe(z.string().min(1, 'Le nom de l\'entreprise est obligatoire')),
  
  // Contact
  email: z.string()
    .email('Format d\'email invalide')
    .max(255, 'L\'email ne peut pas dépasser 255 caractères')
    .optional()
    .or(z.literal('')),
  telephone: z.string()
    .max(50, 'Le numéro de téléphone ne peut pas dépasser 50 caractères')
    .regex(/^[\+]?[0-9\s\-\(\)]*$/, 'Format de téléphone invalide')
    .optional()
    .or(z.literal('')),
  
  // Adresse
  adresse: z.string()
    .max(1000, 'L\'adresse ne peut pas dépasser 1000 caractères')
    .optional()
    .or(z.literal('')),
  code_postal: z.string()
    .max(20, 'Le code postal ne peut pas dépasser 20 caractères')
    .optional()
    .or(z.literal('')),
  ville: z.string()
    .max(255, 'La ville ne peut pas dépasser 255 caractères')
    .optional()
    .or(z.literal('')),
  pays: z.string()
    .length(2, 'Sélectionnez un pays')
    .regex(/^[A-Z]{2}$/, 'Code pays invalide')
    .default('FR'),
  
  // Obligatoire pour personne morale
  forme_juridique: FormeJuridiqueEnum,
  numero_identification: z.union([z.string(), z.number()])
    .transform(val => String(val))
    .pipe(z.string().min(2, 'Le numéro d\'identification est obligatoire')
    .max(100, 'Le numéro d\'identification ne peut pas dépasser 100 caractères')
    .transform(val => val.trim())),
  capital_social: z.number()
    .positive('Le capital social doit être positif')
    .max(999999999, 'Le capital social ne peut pas dépasser 999 999 999'),
  nombre_parts_total: z.number()
    .int('Le nombre de parts doit être un entier')
    .positive('Le nombre de parts doit être positif')
    .max(999999999, 'Le nombre de parts ne peut pas dépasser 999 999 999'),
  
  // Informations bancaires
  iban: z.string()
    .optional()
    .refine(iban => {
      if (!iban || iban === '') return true // Champ optionnel, accepter vide
      if (iban.length > 34) return false // Longueur max
      return /^[A-Z]{2}[0-9]{2}[A-Z0-9\s]*$/.test(iban) // Format valide
    }, 'Format IBAN invalide (max 34 caractères)'),
  account_holder_name: z.string()
    .optional()
    .refine(name => {
      if (!name || name === '') return true // Champ optionnel, accepter vide
      return name.length <= 255 // Longueur max
    }, 'Le nom du titulaire ne peut pas dépasser 255 caractères'),
  bank_name: z.string()
    .optional()
    .refine(name => {
      if (!name || name === '') return true // Champ optionnel, accepter vide
      return name.length <= 255 // Longueur max
    }, 'Le nom de la banque ne peut pas dépasser 255 caractères'),
  swift_bic: z.string()
    .optional()
    .refine(bic => {
      if (!bic || bic === '') return true // Champ optionnel, accepter vide
      if (bic.length > 11) return false // Longueur max
      return /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(bic) // Format valide
    }, 'Format BIC/SWIFT invalide (max 11 caractères)'),
  
  // Associés (ajouté pour le wizard)
  associes: z.array(z.object({
    nom: z.string().min(2, 'Nom requis (minimum 2 caractères)'),
    prenom: z.string().optional(),
    date_naissance: z.string().optional(),
    parts_nombre: z.number().positive('Le nombre de parts doit être positif'),
    parts_pourcentage: z.number().min(0.01).max(100)
  })).default([]),
  
  // États
  is_brouillon: z.boolean().default(false),
})

// Union discriminée pour les formulaires de création
export const createProprietaireSchema = z.discriminatedUnion('type', [
  createProprietairePhysiqueSchema,
  createProprietaireMoraleSchema,
])


// ==============================================================================
// UPDATE SCHEMAS
// ==============================================================================

// Schema pour mise à jour personne physique
export const updateProprietairePhysiqueSchema = z.object({
  id: z.string().uuid('ID invalide'),
  type: z.literal('physique'),
  nom: z.string().min(1, 'Le nom est requis').optional(),
  prenom: z.string().min(1, 'Le prénom est requis').optional(),
  email: z.string()
    .optional()
    .refine(email => {
      if (!email || email === '') return true // Champ optionnel, accepter vide
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) // Email valide
    }, 'Format email invalide'),
  telephone: z.string().optional(),
  adresse: z.string().optional(),
  code_postal: z.string().optional(),
  ville: z.string().optional(),
  pays: CountryCodeEnum.optional(),
  date_naissance: z.string().optional(),
  lieu_naissance: z.string().optional(),
  nationalite: z.string().optional(),
  is_brouillon: z.boolean().default(false),
})

// Schema pour mise à jour personne morale
export const updateProprietaireMoraleSchema = z.object({
  id: z.string().uuid('ID invalide'),
  type: z.literal('morale'),
  nom: z.string().min(1, 'La raison sociale est requise').optional(),
  email: z.string()
    .optional()
    .refine(email => {
      if (!email || email === '') return true // Champ optionnel, accepter vide
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) // Email valide
    }, 'Format email invalide'),
  telephone: z.string().optional(),
  adresse: z.string().optional(),
  code_postal: z.string().optional(),
  ville: z.string().optional(),
  pays: CountryCodeEnum.optional(),
  forme_juridique: z.string()
    .optional()
    .refine(val => {
      if (!val) return true
      // ✅ FIXED: Accept LDA directly - now supported in database ENUM
      const accepted = [...FormeJuridiqueEnum.options, 'LDA']
      return accepted.includes(val as any)
    }, 'Forme juridique invalide'),
  numero_identification: z.string().optional(),
  capital_social: z.number().min(0, 'Le capital social doit être positif').optional(),
  nombre_parts_total: z.number().int().min(1, 'Le nombre de parts doit être au moins 1').optional(),
  is_brouillon: z.boolean().default(false),
})

// Union discriminée pour mise à jour
export const updateProprietaireSchema = z.discriminatedUnion('type', [
  updateProprietairePhysiqueSchema,
  updateProprietaireMoraleSchema,
])

// ==============================================================================
// ASSOCIE FORM SCHEMAS
// ==============================================================================

// Schema pour créer un associé physique
export const createAssociePhysiqueSchema = z.object({
  type: z.literal('physique'),
  nom: z.string()
    .max(255, 'Le nom ne peut pas dépasser 255 caractères')
    .transform(val => val.trim())
    .pipe(z.string().min(1, 'Le nom est obligatoire')),
  prenom: z.string()
    .max(255, 'Le prénom ne peut pas dépasser 255 caractères')
    .transform(val => val.trim())
    .pipe(z.string().min(1, 'Le prénom est obligatoire')),
  
  // Contact optionnel
  email: z.string()
    .optional()
    .refine(val => {
      if (!val || val.trim() === '') return true // Champ optionnel, accepter vide
      return z.string().email().safeParse(val).success
    }, 'Si renseigné, l\'email doit avoir un format valide')
    .transform(val => val?.trim() || undefined),
  telephone: z.string()
    .optional()
    .refine(val => {
      if (!val || val.trim() === '') return true // Champ optionnel, accepter vide
      return /^[\+]?[0-9\s\-\(\)]*$/.test(val) && val.length <= 50
    }, 'Si renseigné, le téléphone doit avoir un format valide')
    .transform(val => val?.trim() || undefined),
  
  // Informations personnelles optionnelles pour les associés
  date_naissance: z.string()
    .optional()
    .refine(date => {
      if (!date || date === '') return true // Champ optionnel, accepter vide
      const parsedDate = new Date(date)
      if (isNaN(parsedDate.getTime())) return false // Date invalide
      const today = new Date()
      const age = today.getFullYear() - parsedDate.getFullYear()
      return age >= 18 && age <= 120
    }, 'Si renseignée, la date doit être valide et l\'âge entre 18 et 120 ans')
    .transform(val => val?.trim() === '' ? undefined : val), // Transformer chaîne vide en undefined
  lieu_naissance: z.string()
    .optional()
    .refine(val => {
      if (!val || val.trim() === '') return true // Champ optionnel, accepter vide
      return val.trim().length >= 2
    }, 'Si renseigné, le lieu de naissance doit contenir au moins 2 caractères')
    .transform(val => val?.trim() || undefined),
  nationalite: z.string()
    .optional()
    .refine(val => {
      if (!val || val.trim() === '') return true // Champ optionnel, accepter vide  
      return val.trim().length >= 2
    }, 'Si renseignée, la nationalité doit contenir au moins 2 caractères')
    .transform(val => val?.trim() || undefined),
  
  // Quotités obligatoires
  nombre_parts: z.number()
    .int('Le nombre de parts doit être un entier')
    .positive('Le nombre de parts doit être positif')
    .max(999999999, 'Le nombre de parts ne peut pas dépasser 999 999 999'),
  
  // Dates optionnelles
  date_entree: z.string()
    .optional()
    .refine(date => {
      if (!date || date === '') return true // Champ optionnel, accepter vide
      const parsedDate = new Date(date)
      return !isNaN(parsedDate.getTime()) // Date valide
    }, 'Si renseignée, la date d\'entrée doit être valide')
    .transform(val => val?.trim() === '' ? undefined : val) // Transformer chaîne vide en undefined
    .default(() => new Date().toISOString().split('T')[0]),
    
  // Métadonnées
  ordre_affichage: z.number().int().nonnegative().default(0),
})

// Schema pour créer un associé morale
export const createAssocieMoraleSchema = z.object({
  type: z.literal('morale'),
  nom: z.string()
    .max(255, 'Le nom ne peut pas dépasser 255 caractères')
    .transform(val => val.trim())
    .pipe(z.string().min(1, 'Le nom de l\'entreprise est obligatoire')),
  
  // Contact optionnel
  email: z.string()
    .email('Format d\'email invalide')
    .max(255, 'L\'email ne peut pas dépasser 255 caractères')
    .optional()
    .or(z.literal('')),
  telephone: z.string()
    .max(50, 'Le numéro de téléphone ne peut pas dépasser 50 caractères')
    .regex(/^[\+]?[0-9\s\-\(\)]*$/, 'Format de téléphone invalide')
    .optional()
    .or(z.literal('')),
  
  // Informations entreprise obligatoires
  forme_juridique: FormeJuridiqueEnum,
  numero_identification: z.union([z.string(), z.number()])
    .transform(val => String(val))
    .pipe(z.string().min(2, 'Le numéro d\'identification est obligatoire')
    .max(100, 'Le numéro d\'identification ne peut pas dépasser 100 caractères')
    .transform(val => val.trim())),
  
  // Quotités obligatoires
  nombre_parts: z.number()
    .int('Le nombre de parts doit être un entier')
    .positive('Le nombre de parts doit être positif')
    .max(999999999, 'Le nombre de parts ne peut pas dépasser 999 999 999'),
  
  // Dates optionnelles
  date_entree: z.string()
    .optional()
    .refine(date => {
      if (!date || date === '') return true // Champ optionnel, accepter vide
      const parsedDate = new Date(date)
      return !isNaN(parsedDate.getTime()) // Date valide
    }, 'Si renseignée, la date d\'entrée doit être valide')
    .transform(val => val?.trim() === '' ? undefined : val) // Transformer chaîne vide en undefined
    .default(() => new Date().toISOString().split('T')[0]),
    
  // Métadonnées
  ordre_affichage: z.number().int().nonnegative().default(0),
})

// Union discriminée pour les formulaires d'associés
export const createAssocieSchema = z.discriminatedUnion('type', [
  createAssociePhysiqueSchema,
  createAssocieMoraleSchema,
])

// Update schema pour associés - schema séparé car .partial() ne fonctionne pas sur les unions discriminées
export const updateAssocieSchema = z.object({
  id: z.string().uuid('ID invalide'),
  proprietaire_id: z.string().uuid('ID propriétaire invalide'),
  type: ProprietaireTypeEnum, // Type ne peut pas être modifié
  nom: z.string().min(1, 'Le nom est requis').optional(),
  prenom: z.string().optional(),
  email: z.string()
    .optional()
    .refine(email => {
      if (!email || email === '') return true // Champ optionnel, accepter vide
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) // Email valide
    }, 'Format email invalide'),
  telephone: z.string().optional(),
  date_naissance: z.string().optional(),
  lieu_naissance: z.string().optional(),
  nationalite: z.string().optional(),
  forme_juridique: FormeJuridiqueEnum.optional(),
  numero_identification: z.string().optional(),
  nombre_parts: z.number().int().positive('Le nombre de parts doit être positif').optional(),
  date_entree: z.string().optional(),
  date_sortie: z.string().optional(),
  motif_sortie: z.string().optional(),
  ordre_affichage: z.number().int().nonnegative().optional(),
})

// ==============================================================================
// TRANSFORM FUNCTIONS
// ==============================================================================

// 🔧 REMOVED: Destructive mapping function that converted Portuguese LDA to French SARL
// This function was causing international legal forms to be saved incorrectly
// Architecture now uses direct Foreign Key relationship to country_legal_forms table

// Transformation des données de formulaire avant validation
export const preprocessFormData = (formData: any) => {
  const processed = { ...formData }
  
  // 🔧 CORRECTION CRITIQUE : Mapper type enum avant validation
  if (processed.type === 'personne_morale') {
    processed.type = 'morale' // Pour match enum DB
  } else if (processed.type === 'personne_physique') {
    processed.type = 'physique' // Pour match enum DB
  }
  
  // Mapper nipc_numero vers numero_identification pour les personnes morales
  if (processed.type === 'morale' && processed.nipc_numero) {
    processed.numero_identification = processed.nipc_numero
    delete processed.nipc_numero
  }
  
  // 🔧 FIXED: No longer destructively mapping forme_juridique
  // Legal forms are now validated directly against country_legal_forms lookup table
  // This preserves Portuguese LDA, Spanish SL, etc. without conversion to French equivalents
  
  return processed
}

// Transformation des données de formulaire (empty strings -> undefined)
export const transformProprietaireFormData = (data: z.infer<typeof createProprietaireSchema> | z.infer<typeof createProprietaireDraftSchema>) => ({
  ...data,
  email: data.email === '' ? undefined : data.email,
  telephone: data.telephone === '' ? undefined : data.telephone,
  adresse: data.adresse === '' ? undefined : data.adresse,
  code_postal: data.code_postal === '' ? undefined : data.code_postal,
  ville: data.ville === '' ? undefined : data.ville,
  // 🔧 FIX: Transform empty date fields to undefined for database compatibility
  date_naissance: 'date_naissance' in data && data.date_naissance === '' ? undefined : data.date_naissance,
  lieu_naissance: 'lieu_naissance' in data && data.lieu_naissance === '' ? undefined : data.lieu_naissance,
  nationalite: 'nationalite' in data && data.nationalite === '' ? undefined : data.nationalite,
  // 🔧 FIX: Transform empty banking fields to undefined
  iban: 'iban' in data && data.iban === '' ? undefined : data.iban,
  account_holder_name: 'account_holder_name' in data && data.account_holder_name === '' ? undefined : data.account_holder_name,
  bank_name: 'bank_name' in data && data.bank_name === '' ? undefined : data.bank_name,
  swift_bic: 'swift_bic' in data && data.swift_bic === '' ? undefined : data.swift_bic,
  // ✅ FIXED: Direct legal form passthrough - LDA now supported in database
  forme_juridique: data.type === 'morale' && 'forme_juridique' in data && data.forme_juridique 
    ? data.forme_juridique // Direct passthrough - no more destructive mapping
    : (data.type === 'morale' && 'forme_juridique' in data ? data.forme_juridique : undefined)
})

export const transformAssocieFormData = (data: z.infer<typeof createAssocieSchema>) => ({
  ...data,
  email: data.email === '' ? undefined : data.email,
  telephone: data.telephone === '' ? undefined : data.telephone,
  // 🔧 FIX: Transform empty date and optional fields to undefined
  date_naissance: 'date_naissance' in data && data.date_naissance === '' ? undefined : data.date_naissance,
  lieu_naissance: 'lieu_naissance' in data && data.lieu_naissance === '' ? undefined : data.lieu_naissance,
  nationalite: 'nationalite' in data && data.nationalite === '' ? undefined : data.nationalite,
  numero_identification: 'numero_identification' in data && data.numero_identification === '' ? undefined : data.numero_identification,
  // ✅ FIXED: Direct legal form passthrough - LDA now supported in database
  forme_juridique: data.type === 'morale' && 'forme_juridique' in data && data.forme_juridique 
    ? data.forme_juridique // Direct passthrough - no more destructive mapping
    : (data.type === 'morale' && 'forme_juridique' in data ? data.forme_juridique : undefined)
})

// ==============================================================================
// TYPESCRIPT TYPES
// ==============================================================================

export type Proprietaire = z.infer<typeof proprietaireSchema>
export type Associe = z.infer<typeof associeSchema>

export type CreateProprietairePhysique = z.infer<typeof createProprietairePhysiqueSchema>
export type CreateProprietaireMorale = z.infer<typeof createProprietaireMoraleSchema>
export type CreateProprietaire = z.infer<typeof createProprietaireSchema>

// Types pour les brouillons
export type CreateProprietairePhysiqueDraft = z.infer<typeof createProprietairePhysiqueDraftSchema>
export type CreateProprietaireMoraleDraft = z.infer<typeof createProprietaireMoraleDraftSchema>
export type CreateProprietaireDraft = z.infer<typeof createProprietaireDraftSchema>
export type UpdateProprietaire = z.infer<typeof updateProprietaireSchema>

export type CreateAssociePhysique = z.infer<typeof createAssociePhysiqueSchema>
export type CreateAssocieMorale = z.infer<typeof createAssocieMoraleSchema>
export type CreateAssocie = z.infer<typeof createAssocieSchema>
export type UpdateAssocie = z.infer<typeof updateAssocieSchema>

// ==============================================================================
// CONSTANTS & OPTIONS
// ==============================================================================

// Options pour les formulaires - International support
export const FORME_JURIDIQUE_OPTIONS = [
  // French legal forms
  { value: 'SARL', label: 'SARL - Société à Responsabilité Limitée (France)' },
  { value: 'SAS', label: 'SAS - Société par Actions Simplifiée (France)' },
  { value: 'SA', label: 'SA - Société Anonyme (France)' },
  { value: 'SCI', label: 'SCI - Société Civile Immobilière (France)' },
  { value: 'EURL', label: 'EURL - Entreprise Unipersonnelle à Responsabilité Limitée (France)' },
  { value: 'SASU', label: 'SASU - Société par Actions Simplifiée Unipersonnelle (France)' },
  { value: 'GIE', label: 'GIE - Groupement d\'Intérêt Économique (France)' },
  { value: 'Association', label: 'Association (France)' },
  
  // Portuguese legal forms
  { value: 'LDA', label: 'LDA - Sociedade por Quotas (Portugal)' },
  { value: 'SA_PT', label: 'SA - Sociedade Anónima (Portugal)' },
  { value: 'SU', label: 'SU - Sociedade Unipessoal (Portugal)' },
  
  // Spanish legal forms
  { value: 'SL', label: 'SL - Sociedad Limitada (Espagne)' },
  { value: 'SA_ES', label: 'SA - Sociedad Anónima (Espagne)' },
  
  // Other
  { value: 'Autre', label: 'Autre forme juridique' },
] as const

export const PROPRIETAIRE_TYPE_OPTIONS = [
  { value: 'physique', label: '👤 Personne physique' },
  { value: 'morale', label: '🏢 Personne morale' },
] as const

// Pays supportés (réutilise la liste des organisations)
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

// ==============================================================================
// PROPRIETAIRE WITH COMPUTED FIELDS (VUES DATABASE)
// ==============================================================================

// Type pour la vue proprietaires_detail_v avec champs calculés
export type ProprietaireWithStats = Proprietaire & {
  capital_completion_percent?: number | null
  nombre_associes?: number | null
  total_parts_attribuees?: number | null
  associes_count?: number | null
  proprietes_count?: number | null
}

// Messages d'erreur
export const PROPRIETAIRE_ERRORS = {
  NOT_FOUND: 'Propriétaire non trouvé',
  UNAUTHORIZED: 'Vous n\'êtes pas autorisé à effectuer cette action',
  INVALID_DATA: 'Données invalides',
  CAPITAL_EXCEEDED: 'Le total des parts dépasse le capital social',
  CANNOT_DELETE: 'Impossible de supprimer ce propriétaire (associés actifs)',
  ASSOCIE_NOT_FOUND: 'Associé non trouvé',
  INVALID_QUOTITES: 'Quotités invalides',
} as const