import { z } from 'zod'

// Schema pour validation progressive par étapes
export const contratWizardSchema = z.object({
  // Étape 1: Sélection Propriété/Unité
  propriete_id: z.string().optional(),
  unite_id: z.string().optional(),

  // Étape 2: Informations Générales
  type_contrat: z.enum(['fixe', 'variable']),
  date_debut: z.string().min(1, 'Date de début requise'),
  date_fin: z.string().min(1, 'Date de fin requise'),
  meuble: z.boolean(),
  autorisation_sous_location: z.boolean(),
  besoin_renovation: z.boolean(),
  deduction_futurs_loyers: z.string().optional(),
  duree_imposee_mois: z.string().optional(),
  
  // Bailleur info (auto-filled from property)
  bailleur_nom: z.string().optional(),
  bailleur_adresse_siege: z.string().optional(),
  bailleur_siren_siret: z.string().optional(),
  bailleur_tva_intracommunautaire: z.string().optional(),
  bailleur_representant_legal: z.string().optional(),
  bailleur_email: z.string().email('Email invalide').or(z.literal('')).optional(),
  bailleur_telephone: z.string().optional(),

  // Bien immobilier (auto-filled from property/unit)
  bien_adresse_complete: z.string().optional(),
  bien_type: z.string().optional(),
  bien_superficie: z.string().optional(),
  bien_nombre_pieces: z.string().optional(),
  bien_etat_lieux_initial: z.string().optional(),

  // Étape 3: Conditions Financières
  commission_pourcentage: z.string().min(1, 'Commission requise'),
  usage_proprietaire_jours_max: z.string().min(1, 'Usage propriétaire requis'),
  
  // Contrat Fixe
  loyer_mensuel_ht: z.string().optional(),
  jour_paiement_loyer: z.string().optional(),
  charges_mensuelles: z.string().optional(),
  charges_inclus: z.string().optional(),
  depot_garantie: z.string().optional(),
  plafond_depannages_urgents: z.string().optional(),
  delai_paiement_factures: z.string().optional(),

  // Contrat Variable
  estimation_revenus_mensuels: z.string().optional(),
  methode_calcul_revenus: z.string().optional(),
  dates_paiement: z.string().optional(),
  frais_abonnement_internet: z.string().optional(),
  frais_equipements_domotique: z.string().optional(),
  catalogue_equipements: z.string().optional(),

  // Étape 4: Assurances & Protection
  attestation_assurance: z.boolean().optional(),
  nom_assureur: z.string().optional(),
  numero_police: z.string().optional(),
  date_expiration_assurance: z.string().optional(),
  assurance_pertes_exploitation: z.boolean().optional(),
  assurance_pertes_exploitation_details: z.string().optional(),
  assurance_occupation_illicite: z.boolean().optional(),
  assurance_occupation_illicite_details: z.string().optional(),
  protection_juridique: z.boolean().optional(),
  protection_juridique_details: z.string().optional(),

  // Étape 5: Clauses & Règles Métier
  conditions_sous_location: z.string().optional(),
  activites_permises: z.string().optional(),
  autorisation_travaux: z.boolean().optional(),
  conditions_suspension_bail: z.string().optional(),
  conditions_remboursement_travaux: z.string().optional(),
  
  // Contact urgence
  contact_urgence_nom: z.string().optional(),
  contact_urgence_telephone: z.string().optional(),
  contact_urgence_email: z.string().email('Email invalide').or(z.literal('')).optional(),

  // Juridique et administratif
  duree_bail_initial: z.string().optional(),
  conditions_renouvellement: z.string().optional(),
  clauses_resiliation_anticipee: z.string().optional(),
  obligations_entretien_reparations: z.string().optional(),
  revision_loyer_irl: z.boolean().optional(),

  // Spécifique Want It Now
  conditions_restitution_bien: z.string().optional(),
  procedures_dommages_degradations: z.string().optional(),
  duree_contrat_1an: z.boolean().optional(),
  conditions_utilisation_proprietaire: z.string().optional(),
  periodes_creuses: z.string().optional(),

  // Gestion et maintenance
  reparations_entretien_responsabilites: z.string().optional(),
  gestion_sinistres_urgences: z.string().optional(),
  procedure_urgence: z.string().optional(),

  // Étape 6: Documentation & Révision
  inventaire_meubles: z.string().optional(),
  modele_etat_lieux: z.string().optional(),
  reglement_copropriete: z.string().optional(),
  notes_internes: z.string().optional(),

  // Metadata
  draft: z.boolean().optional()
}).superRefine((data, ctx) => {
  // Validation des dates
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
  
  // Business rules validation
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

  // Validation des champs numériques
  const numericFields = [
    'commission_pourcentage', 'usage_proprietaire_jours_max', 'deduction_futurs_loyers',
    'duree_imposee_mois', 'bien_superficie', 'bien_nombre_pieces', 'loyer_mensuel_ht',
    'jour_paiement_loyer', 'charges_mensuelles', 'depot_garantie', 'plafond_depannages_urgents',
    'delai_paiement_factures', 'estimation_revenus_mensuels', 'frais_abonnement_internet',
    'frais_equipements_domotique', 'duree_bail_initial'
  ]
  
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
  
  // Validation jour de paiement (1-31)
  if (data.jour_paiement_loyer) {
    const jour = Number(data.jour_paiement_loyer)
    if (jour < 1 || jour > 31) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Le jour doit être entre 1 et 31',
        path: ['jour_paiement_loyer']
      })
    }
  }
})

// Schema pour validation par étape
export const stepValidationSchemas = {
  1: contratWizardSchema.pick({
    propriete_id: true,
    unite_id: true
  }).refine(data => data.propriete_id || data.unite_id, {
    message: 'Vous devez sélectionner une propriété ou une unité',
    path: ['propriete_id']
  }),

  2: contratWizardSchema.pick({
    type_contrat: true,
    date_debut: true,
    date_fin: true,
    meuble: true,
    autorisation_sous_location: true,
    besoin_renovation: true
  }),

  3: contratWizardSchema.pick({
    commission_pourcentage: true,
    usage_proprietaire_jours_max: true
    // loyer_mensuel_ht et charges_mensuelles sont optionnels pour l'étape 3
  }),

  4: contratWizardSchema.pick({
    attestation_assurance: true,
    nom_assureur: true,
    protection_juridique: true
  }),

  5: contratWizardSchema.pick({
    conditions_sous_location: true,
    contact_urgence_nom: true,
    contact_urgence_telephone: true
  }),

  6: contratWizardSchema.pick({
    notes_internes: true
  })
}

export type ContratWizardFormData = z.infer<typeof contratWizardSchema>