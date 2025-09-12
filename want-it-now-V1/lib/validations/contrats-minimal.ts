import { z } from 'zod'

// Schema minimal aligné avec la table contrats (18 champs uniquement)
export const contratMinimalSchema = z.object({
  // Champs obligatoires de la table contrats
  organisation_id: z.string().uuid('ID organisation invalide'),
  propriete_id: z.string().uuid().optional().nullable(),
  unite_id: z.string().uuid().optional().nullable(),
  type_contrat: z.enum(['fixe', 'variable'], {
    errorMap: () => ({ message: 'Type de contrat requis (fixe ou variable)' })
  }),
  date_emission: z.string().optional(), // Auto-défaut en DB
  date_debut: z.string().min(1, 'Date de début requise'),
  date_fin: z.string().min(1, 'Date de fin requise'),
  meuble: z.boolean().default(false),
  autorisation_sous_location: z.boolean().default(true),
  besoin_renovation: z.boolean().default(false),
  deduction_futurs_loyers: z.string().optional(),
  duree_imposee_mois: z.string().optional(),
  commission_pourcentage: z.string().default('10'),
  usage_proprietaire_jours_max: z.string().default('60'),
  created_by: z.string().uuid().optional() // Auto-rempli côté serveur
}).superRefine((data, ctx) => {
  // Validation exclusive: propriété OU unité (business rule critique)
  const hasPropriete = data.propriete_id && data.propriete_id.trim() !== ''
  const hasUnite = data.unite_id && data.unite_id.trim() !== ''
  
  if (!hasPropriete && !hasUnite) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Vous devez sélectionner une propriété ou une unité',
      path: ['propriete_id']
    })
  }
  
  if (hasPropriete && hasUnite) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Un contrat ne peut pas être lié à la fois à une propriété ET une unité',
      path: ['unite_id']
    })
  }
  
  // Validation dates cohérentes
  if (data.date_debut && data.date_fin) {
    const dateDebut = new Date(data.date_debut)
    const dateFin = new Date(data.date_fin)
    
    if (dateFin <= dateDebut) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'La date de fin doit être postérieure à la date de début',
        path: ['date_fin']
      })
    }
  }
  
  // Validation business rules Want It Now
  if (!data.autorisation_sous_location) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'L\'autorisation de sous-location est obligatoire pour Want It Now',
      path: ['autorisation_sous_location']
    })
  }
  
  // Validation commission variable contracts (10%)
  if (data.type_contrat === 'variable' && data.commission_pourcentage && Number(data.commission_pourcentage) !== 10) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'La commission pour les contrats variables doit être de 10%',
      path: ['commission_pourcentage']
    })
  }
  
  // Validation usage propriétaire max 60 jours
  if (data.usage_proprietaire_jours_max && Number(data.usage_proprietaire_jours_max) > 60) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'L\'usage propriétaire ne peut pas dépasser 60 jours par an',
      path: ['usage_proprietaire_jours_max']
    })
  }
  
  // Validation champs numériques
  const numericFields = ['commission_pourcentage', 'usage_proprietaire_jours_max', 'deduction_futurs_loyers', 'duree_imposee_mois']
  
  numericFields.forEach(field => {
    const value = data[field as keyof typeof data] as string
    if (value && value.trim() && isNaN(Number(value))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Doit être un nombre valide',
        path: [field]
      })
    }
  })
})

// Validation par étapes simplifiées
export const stepValidationSchemas = {
  1: contratMinimalSchema.pick({
    propriete_id: true,
    unite_id: true
  }).refine(data => data.propriete_id || data.unite_id, {
    message: 'Vous devez sélectionner une propriété ou une unité',
    path: ['propriete_id']
  }),

  2: contratMinimalSchema.pick({
    type_contrat: true,
    date_debut: true,
    date_fin: true,
    meuble: true,
    autorisation_sous_location: true,
    besoin_renovation: true
  }),

  3: contratMinimalSchema.pick({
    commission_pourcentage: true,
    usage_proprietaire_jours_max: true
  })
}

export type ContratMinimalFormData = z.infer<typeof contratMinimalSchema>