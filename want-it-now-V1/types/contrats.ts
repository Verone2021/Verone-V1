// Types TypeScript pour le système de gestion des contrats
// Want It Now V1 - Contract Management System

export type ContratType = 'fixe' | 'variable'

// Interface principale Contrat
export interface Contrat {
  id: string
  organisation_id: string
  propriete_id?: string | null
  unite_id?: string | null
  
  // Informations générales du contrat
  type_contrat: ContratType
  date_emission: string // ISO date string
  date_debut: string    // ISO date string
  date_fin: string      // ISO date string
  
  // Caractéristiques du bien
  meuble: boolean
  autorisation_sous_location: boolean
  
  // Gestion rénovations
  besoin_renovation: boolean
  deduction_futurs_loyers?: number | null
  duree_imposee_mois?: number | null
  
  // Commission et conditions financières
  commission_pourcentage: number
  usage_proprietaire_jours_max: number
  
  // ============================================================================
  // INFORMATIONS GÉNÉRALES DU BAILLEUR (OWNER INFORMATION)
  // ============================================================================
  bailleur_nom?: string | null
  bailleur_adresse_siege?: string | null
  bailleur_siren_siret?: string | null
  bailleur_tva_intracommunautaire?: string | null
  bailleur_representant_legal?: string | null
  bailleur_email?: string | null
  bailleur_telephone?: string | null

  // ============================================================================
  // INFORMATIONS SUR LE BIEN IMMOBILIER (PROPERTY INFORMATION)
  // ============================================================================
  bien_adresse_complete?: string | null
  bien_type?: string | null
  bien_superficie?: number | null // m²
  bien_nombre_pieces?: number | null
  bien_etat_lieux_initial?: string | null

  // ============================================================================
  // CONDITIONS FINANCIÈRES (FINANCIAL CONDITIONS)
  // ============================================================================
  // Contrat Fixe
  loyer_mensuel_ht?: number | null
  jour_paiement_loyer?: number | null // 1-31
  charges_mensuelles?: number | null
  charges_inclus?: string | null
  depot_garantie?: number | null
  plafond_depannages_urgents?: number | null
  delai_paiement_factures?: number | null // jours

  // Contrat Variable
  estimation_revenus_mensuels?: number | null
  methode_calcul_revenus?: string | null
  dates_paiement?: string | null
  frais_abonnement_internet?: number | null
  frais_equipements_domotique?: number | null
  catalogue_equipements?: string | null

  // ============================================================================
  // CLAUSES SPÉCIFIQUES (SPECIFIC CLAUSES)
  // ============================================================================
  conditions_sous_location?: string | null
  activites_permises?: string | null
  autorisation_travaux?: boolean | null
  conditions_suspension_bail?: string | null
  conditions_remboursement_travaux?: string | null

  // ============================================================================
  // ASSURANCES (INSURANCE)
  // ============================================================================
  attestation_assurance?: boolean | null
  nom_assureur?: string | null
  numero_police?: string | null
  date_expiration_assurance?: string | null // ISO date string

  // Assurances spécifiques contrat variable
  assurance_pertes_exploitation?: boolean | null
  assurance_pertes_exploitation_details?: string | null
  assurance_occupation_illicite?: boolean | null
  assurance_occupation_illicite_details?: string | null
  protection_juridique?: boolean | null
  protection_juridique_details?: string | null

  // ============================================================================
  // DOCUMENTATION ET ANNEXES (DOCUMENTATION & ATTACHMENTS)
  // ============================================================================
  inventaire_meubles?: string | null
  modele_etat_lieux?: string | null
  reglement_copropriete?: string | null

  // ============================================================================
  // INFORMATIONS DE CONTACT D'URGENCE (EMERGENCY CONTACT)
  // ============================================================================
  contact_urgence_nom?: string | null
  contact_urgence_telephone?: string | null
  contact_urgence_email?: string | null

  // ============================================================================
  // DÉTAILS JURIDIQUES ET ADMINISTRATIFS (LEGAL & ADMINISTRATIVE)
  // ============================================================================
  duree_bail_initial?: number | null // mois
  conditions_renouvellement?: string | null
  clauses_resiliation_anticipee?: string | null
  obligations_entretien_reparations?: string | null
  revision_loyer_irl?: boolean | null

  // ============================================================================
  // SPÉCIFIQUE À L'ACTIVITÉ WANT IT NOW (BUSINESS SPECIFIC)
  // ============================================================================
  type_activite_sous_location?: string | null
  conditions_restitution_bien?: string | null
  procedures_dommages_degradations?: string | null

  // Contrat Variable - Conditions d'utilisation propriétaire
  duree_contrat_1an?: boolean | null
  conditions_utilisation_proprietaire?: string | null
  periodes_creuses?: string | null

  // ============================================================================
  // GESTION ET MAINTENANCE (MANAGEMENT & MAINTENANCE)
  // ============================================================================
  reparations_entretien_responsabilites?: string | null
  gestion_sinistres_urgences?: string | null
  procedure_urgence?: string | null

  // ============================================================================
  // MÉTADONNÉES ÉTENDUES (EXTENDED METADATA)
  // ============================================================================
  documents_fournis?: Record<string, any> | null // JSONB
  statut_validation?: string | null
  notes_internes?: string | null
  date_validation?: string | null // ISO date string
  valide_par?: string | null

  // Métadonnées système
  created_at: string
  updated_at: string
  created_by?: string | null
}

// Types pour propriétaires avec quotités
export interface ProprietaireAvecQuotite {
  id: string
  nom: string
  prenom?: string | null
  type: 'physique' | 'morale'
  email?: string | null
  telephone?: string | null
  adresse?: string | null
  forme_juridique?: string | null
  numero_identification?: string | null
  
  // Quotités (fraction et pourcentage)
  quotite_numerateur: number
  quotite_denominateur: number
  pourcentage: number
  
  // Dates de détention
  date_debut?: string | null
  date_fin?: string | null
  is_active: boolean
}

// Interface enrichie avec relations (pour affichage)
export interface ContratAvecRelations extends Contrat {
  // Organisation
  organisation_nom?: string
  organisation_pays?: string
  
  // Propriété (si applicable)
  propriete_nom?: string
  propriete_adresse?: string
  propriete_ville?: string
  
  // Unité (si applicable)
  unite_nom?: string
  unite_numero?: string
  unite_propriete_nom?: string
  
  // Indicateurs calculés
  type_libelle?: string
  meuble_libelle?: string
  duree_jours?: number
  statut_contrat?: string
  
  // ============================================================================
  // NOUVEAUX CHAMPS - PROPRIÉTAIRES ET ORGANISATION
  // ============================================================================
  
  // Propriétaires avec leurs quotités
  proprietaires_data?: ProprietaireAvecQuotite[]
  
  // Validation des quotités
  quotites_total?: number
  quotites_valid?: boolean
  
  // Informations d'affichage de l'organisation
  organisation_display_name?: string
  organisation_country_flag?: string
}

// Interface pour création de contrat
export interface CreateContratRequest {
  organisation_id: string
  propriete_id?: string | null
  unite_id?: string | null
  
  type_contrat: ContratType
  date_emission?: string // Optionnel, défaut = aujourd'hui
  date_debut: string
  date_fin: string
  
  meuble?: boolean // Défaut false
  autorisation_sous_location?: boolean // Défaut true
  
  besoin_renovation?: boolean // Défaut false
  deduction_futurs_loyers?: number | null
  duree_imposee_mois?: number | null
  
  commission_pourcentage?: number // Défaut 10.00
  usage_proprietaire_jours_max?: number // Défaut 60

  // ============================================================================
  // INFORMATIONS GÉNÉRALES DU BAILLEUR (OWNER INFORMATION)
  // ============================================================================
  bailleur_nom?: string
  bailleur_adresse_siege?: string
  bailleur_siren_siret?: string
  bailleur_tva_intracommunautaire?: string
  bailleur_representant_legal?: string
  bailleur_email?: string
  bailleur_telephone?: string

  // ============================================================================
  // INFORMATIONS SUR LE BIEN IMMOBILIER (PROPERTY INFORMATION)
  // ============================================================================
  bien_adresse_complete?: string
  bien_type?: string
  bien_superficie?: number // m²
  bien_nombre_pieces?: number
  bien_etat_lieux_initial?: string

  // ============================================================================
  // CONDITIONS FINANCIÈRES (FINANCIAL CONDITIONS)
  // ============================================================================
  // Contrat Fixe
  loyer_mensuel_ht?: number
  jour_paiement_loyer?: number // 1-31
  charges_mensuelles?: number
  charges_inclus?: string
  depot_garantie?: number
  plafond_depannages_urgents?: number
  delai_paiement_factures?: number // jours

  // Contrat Variable
  estimation_revenus_mensuels?: number
  methode_calcul_revenus?: string
  dates_paiement?: string
  frais_abonnement_internet?: number
  frais_equipements_domotique?: number
  catalogue_equipements?: string

  // ============================================================================
  // CLAUSES SPÉCIFIQUES (SPECIFIC CLAUSES)
  // ============================================================================
  conditions_sous_location?: string
  activites_permises?: string
  autorisation_travaux?: boolean
  conditions_suspension_bail?: string
  conditions_remboursement_travaux?: string

  // ============================================================================
  // ASSURANCES (INSURANCE)
  // ============================================================================
  attestation_assurance?: boolean
  nom_assureur?: string
  numero_police?: string
  date_expiration_assurance?: string // ISO date string

  // Assurances spécifiques contrat variable
  assurance_pertes_exploitation?: boolean
  assurance_pertes_exploitation_details?: string
  assurance_occupation_illicite?: boolean
  assurance_occupation_illicite_details?: string
  protection_juridique?: boolean
  protection_juridique_details?: string

  // ============================================================================
  // DOCUMENTATION ET ANNEXES (DOCUMENTATION & ATTACHMENTS)
  // ============================================================================
  inventaire_meubles?: string
  modele_etat_lieux?: string
  reglement_copropriete?: string

  // ============================================================================
  // INFORMATIONS DE CONTACT D'URGENCE (EMERGENCY CONTACT)
  // ============================================================================
  contact_urgence_nom?: string
  contact_urgence_telephone?: string
  contact_urgence_email?: string

  // ============================================================================
  // DÉTAILS JURIDIQUES ET ADMINISTRATIFS (LEGAL & ADMINISTRATIVE)
  // ============================================================================
  duree_bail_initial?: number // mois
  conditions_renouvellement?: string
  clauses_resiliation_anticipee?: string
  obligations_entretien_reparations?: string
  revision_loyer_irl?: boolean

  // ============================================================================
  // SPÉCIFIQUE À L'ACTIVITÉ WANT IT NOW (BUSINESS SPECIFIC)
  // ============================================================================
  type_activite_sous_location?: string
  conditions_restitution_bien?: string
  procedures_dommages_degradations?: string

  // Contrat Variable - Conditions d'utilisation propriétaire
  duree_contrat_1an?: boolean
  conditions_utilisation_proprietaire?: string
  periodes_creuses?: string

  // ============================================================================
  // GESTION ET MAINTENANCE (MANAGEMENT & MAINTENANCE)
  // ============================================================================
  reparations_entretien_responsabilites?: string
  gestion_sinistres_urgences?: string
  procedure_urgence?: string

  // ============================================================================
  // MÉTADONNÉES ÉTENDUES (EXTENDED METADATA)
  // ============================================================================
  documents_fournis?: Record<string, any>
  statut_validation?: string
  notes_internes?: string
}

// Interface pour mise à jour de contrat
export interface UpdateContratRequest extends Partial<CreateContratRequest> {
  id: string
}

// Interface pour les filtres de recherche
export interface ContratFilters {
  organisation_id?: string
  propriete_id?: string
  unite_id?: string
  type_contrat?: ContratType
  meuble?: boolean
  statut_contrat?: 'a_venir' | 'en_cours' | 'termine'
  date_debut_min?: string
  date_debut_max?: string
  date_fin_min?: string
  date_fin_max?: string
  search?: string // Recherche textuelle
}

// Interface pour les options d'affichage/tri
export interface ContratQueryOptions {
  limit?: number
  offset?: number
  orderBy?: 'date_debut' | 'date_fin' | 'created_at' | 'type_contrat'
  orderDirection?: 'asc' | 'desc'
  include_relations?: boolean
}

// Interface pour les statistiques des contrats
export interface ContratStatistics {
  total_contrats: number
  contrats_actifs: number
  contrats_termines: number
  contrats_a_venir: number
  revenus_estimes_mois: number
  taux_occupation: number
}

// Interface pour validation de disponibilité
export interface DisponibiliteCheck {
  disponible: boolean
  conflits?: Array<{
    contrat_id: string
    date_debut: string
    date_fin: string
    type_contrat: ContratType
  }>
}

// Interface pour les données de formulaire
export interface ContratFormData {
  // Sélection propriété/unité (simplifiée)
  propriete_id?: string
  unite_id?: string
  
  // Informations contrat
  type_contrat: ContratType
  date_debut: string
  date_fin: string
  
  // Caractéristiques
  meuble: boolean
  autorisation_sous_location: boolean
  
  // Rénovations
  besoin_renovation: boolean
  deduction_futurs_loyers?: string // String pour formulaire
  duree_imposee_mois?: string      // String pour formulaire
  
  // Financier
  commission_pourcentage: string   // String pour formulaire
  usage_proprietaire_jours_max: string // String pour formulaire

  // ============================================================================
  // INFORMATIONS GÉNÉRALES DU BAILLEUR (OWNER INFORMATION)
  // ============================================================================
  bailleur_nom?: string
  bailleur_adresse_siege?: string
  bailleur_siren_siret?: string
  bailleur_tva_intracommunautaire?: string
  bailleur_representant_legal?: string
  bailleur_email?: string
  bailleur_telephone?: string

  // ============================================================================
  // INFORMATIONS SUR LE BIEN IMMOBILIER (PROPERTY INFORMATION)
  // ============================================================================
  bien_adresse_complete?: string
  bien_type?: string
  bien_superficie?: string // String pour formulaire
  bien_nombre_pieces?: string // String pour formulaire
  bien_etat_lieux_initial?: string

  // ============================================================================
  // CONDITIONS FINANCIÈRES (FINANCIAL CONDITIONS)
  // ============================================================================
  // Contrat Fixe
  loyer_mensuel_ht?: string // String pour formulaire
  jour_paiement_loyer?: string // String pour formulaire
  charges_mensuelles?: string // String pour formulaire
  charges_inclus?: string
  depot_garantie?: string // String pour formulaire
  plafond_depannages_urgents?: string // String pour formulaire
  delai_paiement_factures?: string // String pour formulaire

  // Contrat Variable
  estimation_revenus_mensuels?: string // String pour formulaire
  methode_calcul_revenus?: string
  dates_paiement?: string
  frais_abonnement_internet?: string // String pour formulaire
  frais_equipements_domotique?: string // String pour formulaire
  catalogue_equipements?: string

  // ============================================================================
  // CLAUSES SPÉCIFIQUES (SPECIFIC CLAUSES)
  // ============================================================================
  conditions_sous_location?: string
  activites_permises?: string
  autorisation_travaux?: boolean
  conditions_suspension_bail?: string
  conditions_remboursement_travaux?: string

  // ============================================================================
  // ASSURANCES (INSURANCE)
  // ============================================================================
  attestation_assurance?: boolean
  nom_assureur?: string
  numero_police?: string
  date_expiration_assurance?: string

  // Assurances spécifiques contrat variable
  assurance_pertes_exploitation?: boolean
  assurance_pertes_exploitation_details?: string
  assurance_occupation_illicite?: boolean
  assurance_occupation_illicite_details?: string
  protection_juridique?: boolean
  protection_juridique_details?: string

  // ============================================================================
  // DOCUMENTATION ET ANNEXES (DOCUMENTATION & ATTACHMENTS)
  // ============================================================================
  inventaire_meubles?: string
  modele_etat_lieux?: string
  reglement_copropriete?: string

  // ============================================================================
  // INFORMATIONS DE CONTACT D'URGENCE (EMERGENCY CONTACT)
  // ============================================================================
  contact_urgence_nom?: string
  contact_urgence_telephone?: string
  contact_urgence_email?: string

  // ============================================================================
  // DÉTAILS JURIDIQUES ET ADMINISTRATIFS (LEGAL & ADMINISTRATIVE)
  // ============================================================================
  duree_bail_initial?: string // String pour formulaire
  conditions_renouvellement?: string
  clauses_resiliation_anticipee?: string
  obligations_entretien_reparations?: string
  revision_loyer_irl?: boolean

  // ============================================================================
  // SPÉCIFIQUE À L'ACTIVITÉ WANT IT NOW (BUSINESS SPECIFIC)
  // ============================================================================
  type_activite_sous_location?: string
  conditions_restitution_bien?: string
  procedures_dommages_degradations?: string

  // Contrat Variable - Conditions d'utilisation propriétaire
  duree_contrat_1an?: boolean
  conditions_utilisation_proprietaire?: string
  periodes_creuses?: string

  // ============================================================================
  // GESTION ET MAINTENANCE (MANAGEMENT & MAINTENANCE)
  // ============================================================================
  reparations_entretien_responsabilites?: string
  gestion_sinistres_urgences?: string
  procedure_urgence?: string

  // ============================================================================
  // MÉTADONNÉES (METADATA)
  // ============================================================================
  notes_internes?: string
}

// Types utilitaires
export type ContratStatus = 'a_venir' | 'en_cours' | 'termine'
export type ContratTarget = 'propriete' | 'unite'

// Interface pour les erreurs de validation
export interface ContratValidationError {
  field: keyof ContratFormData
  message: string
  code: string
}

// Interface pour les réponses d'API
export interface ContratResponse<T = Contrat> {
  success: boolean
  data?: T
  error?: string
  errors?: ContratValidationError[]
}

export interface ContratsListResponse {
  success: boolean
  data?: ContratAvecRelations[]
  total?: number
  error?: string
}

// Interface pour les options de sélection (dropdowns)
export interface ContratSelectOption {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

// Interface pour les données d'export
export interface ContratExportData {
  contrats: ContratAvecRelations[]
  export_date: string
  total_count: number
  filters_applied: ContratFilters
}

// Constantes
export const CONTRAT_TYPES: Array<{value: ContratType, label: string}> = [
  { value: 'fixe', label: 'Contrat Fixe' },
  { value: 'variable', label: 'Contrat Variable' }
]

export const CONTRAT_STATUS_OPTIONS = [
  { value: 'a_venir', label: 'À venir', emoji: '⏳' },
  { value: 'en_cours', label: 'En cours', emoji: '🔄' },
  { value: 'termine', label: 'Terminé', emoji: '✅' }
] as const

// Valeurs par défaut
export const CONTRAT_DEFAULTS = {
  commission_pourcentage: 10.00,
  usage_proprietaire_jours_max: 60,
  autorisation_sous_location: true,
  meuble: false,
  besoin_renovation: false
} as const