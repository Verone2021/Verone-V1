import { z } from 'zod'

// =============================================
// ENUMS & CONSTANTS
// =============================================

export const PROPRIETE_STATUTS = [
  'brouillon',
  'sourcing',
  'evaluation',
  'negociation',
  'achetee',
  'disponible',
  'louee',
  'vendue',
  'archive'
] as const

export const PROPRIETE_TYPES = [
  'appartement',
  'maison',
  'terrain',
  'immeuble',
  'commerce',
  'bureau',
  'entrepot',
  'parking',
  'autre'
] as const

// Removed MULTI_UNITE_TYPES - any property type can now have units

export const PROPRIETE_ERRORS = {
  NOT_FOUND: 'Propriété introuvable',
  INVALID_DATA: 'Les données fournies sont invalides',
  QUOTITE_EXCEEDS: 'Le total des quotités ne peut pas dépasser 100%',
  QUOTITE_INCOMPLETE: 'Le total des quotités doit être égal à 100%',
  PROPRIETAIRE_EXISTS: 'Ce propriétaire est déjà associé à cette propriété',
  CANNOT_DELETE: 'Cette propriété ne peut pas être supprimée (contrats actifs)',
  STRUCTURE_CHANGE: 'Impossible de modifier la structure après création',
  ORGANISATION_NOT_FOUND: 'Aucune organisation trouvée pour ce pays'
} as const

// =============================================
// BASE TYPES
// =============================================

export type ProprieteStatut = typeof PROPRIETE_STATUTS[number]
export type ProprieteType = typeof PROPRIETE_TYPES[number]

// Amenities structure (flexible JSONB)
export interface Amenities {
  // Confort
  wifi?: boolean
  climatisation?: boolean
  chauffage?: boolean
  television?: boolean
  netflix?: boolean
  
  // Cuisine
  cuisine_equipee?: boolean
  lave_vaisselle?: boolean
  machine_cafe?: boolean
  micro_ondes?: boolean
  refrigerateur?: boolean
  
  // Salle de bain
  baignoire?: boolean
  douche?: boolean
  seche_cheveux?: boolean
  
  // Autres
  lave_linge?: boolean
  seche_linge?: boolean
  fer_repasser?: boolean
  parking?: boolean
  piscine?: boolean
  jacuzzi?: boolean
  sauna?: boolean
  salle_sport?: boolean
  ascenseur?: boolean
  jardin?: boolean
  terrasse?: boolean
  balcon?: boolean
  barbecue?: boolean
  
  // Custom amenities
  autres?: string[]
}

// Règles structure (flexible JSONB)
export interface Regles {
  fumeurs_autorises?: boolean
  animaux_autorises?: boolean
  fetes_autorisees?: boolean
  enfants_bienvenus?: boolean
  
  heure_arrivee_debut?: string
  heure_arrivee_fin?: string
  heure_depart?: string
  
  age_minimum?: number
  sejour_minimum_nuits?: number
  sejour_maximum_nuits?: number
  
  regles_supplementaires?: string
}

// =============================================
// DATABASE TYPES
// =============================================

export interface Propriete {
  id: string
  reference: string
  organisation_id: string
  
  type: ProprieteType
  statut: ProprieteStatut
  nom: string
  titre_annonce?: string
  description?: string
  
  a_unites: boolean
  nombre_unites?: number
  
  adresse?: string
  adresse_complement?: string
  code_postal?: string
  ville?: string
  region?: string
  pays?: string
  latitude?: number
  longitude?: number
  
  surface_m2?: number
  surface_terrain_m2?: number
  nombre_pieces?: number
  nb_chambres: number
  nb_sdb: number
  etage?: number
  nb_etages?: number
  annee_construction?: number
  
  prix_achat?: number
  frais_acquisition?: number
  frais_notaire?: number
  frais_annexes?: number
  valeur_actuelle?: number
  loyer?: number
  charges?: number
  taxe_fonciere?: number
  
  // Nouveaux champs ajoutés depuis la DB
  proprietaire_id?: string
  quartier?: string
  transport_proche?: string
  ecoles_proche?: string
  date_changement_statut?: string
  statut_precedent?: ProprieteStatut
  surface_totale?: number
  orientation?: string
  vue?: string
  luminosite?: string
  photo_principale_url?: string
  
  // Équipements boolean (renommés depuis a_*)
  ascenseur?: boolean
  parking?: boolean
  nombre_places_parking?: number
  cave?: boolean
  balcon?: boolean
  surface_balcon?: number
  terrasse?: boolean
  surface_terrasse?: number
  jardin?: boolean
  surface_jardin?: number
  piscine?: boolean
  
  // Diagnostics énergétiques
  dpe_classe?: string
  dpe_valeur?: number
  ges_classe?: string
  ges_valeur?: number
  
  // Champs techniques
  notes_internes?: string
  
  amenities: Amenities
  regles: Regles
  
  is_brouillon: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  created_by?: string
  updated_by?: string
}

export interface Unite {
  id: string
  propriete_id: string
  reference?: string
  
  nom: string
  type?: string
  description?: string
  
  batiment?: string
  etage?: number
  numero?: string
  position?: string
  
  surface_m2?: number
  nb_chambres: number
  nb_lits: number
  nb_sdb: number
  capacite_max: number
  
  prix_nuit?: number
  prix_semaine?: number
  prix_mois?: number
  caution?: number
  frais_menage?: number
  
  amenities: Amenities
  regles: Regles
  
  is_active: boolean
  is_disponible: boolean
  
  created_at: string
  updated_at: string
  created_by?: string
  updated_by?: string
}

export interface ProprieteProprietaire {
  id: string
  propriete_id: string
  proprietaire_id: string
  pourcentage: number
  is_gerant: boolean
  date_acquisition?: string
  prix_acquisition?: number
  notes?: string
  created_at: string
  updated_at: string
}

export interface ProprietePhoto {
  id: string
  propriete_id: string
  unite_id?: string
  storage_path: string
  public_url?: string
  caption?: string
  ordre?: number
  est_couverture: boolean
  type?: string
  taille?: number
  created_at: string
  updated_at: string
}

// =============================================
// VIEW TYPES
// =============================================

export interface ProprieteWithStats extends Propriete {
  organisation_nom: string
  organisation_pays_code: string
  quotites_total: number
  quotites_complete: boolean
  nombre_proprietaires: number
  unites_actives_count?: number
  capacite_totale: number
  photos_count: number
  cover_photo_url?: string
  statut_libelle: string
  type_libelle: string
  can_delete: boolean
}

export interface ProprieteListItem {
  id: string
  reference: string
  nom: string
  type: ProprieteType
  statut: ProprieteStatut
  ville?: string
  pays?: string
  surface_m2?: number
  nb_chambres: number
  capacite_max: number
  valeur_actuelle?: number
  is_brouillon: boolean
  is_active: boolean
  created_at: string
  a_unites: boolean
  nombre_unites?: number
  organisation_nom: string
  quotites_total: number
  cover_photo_url?: string
  statut_libelle: string
  type_libelle: string
}

export interface ProprieteQuotite extends ProprieteProprietaire {
  // Informations sur la propriété
  propriete_nom: string
  propriete_reference: string
  propriete_type: ProprieteType
  
  // Relation complète avec le propriétaire
  proprietaire: {
    id: string
    type: 'physique' | 'morale'
    nom: string
    prenom?: string
    email?: string
    telephone?: string
  }
  
  // Champs aplatis (pour compatibilité)
  proprietaire_nom: string
  proprietaire_prenom?: string
  proprietaire_type: 'physique' | 'morale'
  proprietaire_email?: string
  proprietaire_telephone?: string
  proprietaire_nom_complet: string
  quotite_pourcentage: number
  valeur_part?: number
  ordre: number
  frais_acquisition?: number
}

// =============================================
// FORM TYPES
// =============================================

export interface ProprieteFormData {
  // Basic info
  type: ProprieteType
  nom: string
  titre_annonce?: string
  description?: string
  
  // Structure
  a_unites: boolean
  nombre_unites?: number
  
  // Location
  adresse?: string
  adresse_complement?: string
  code_postal?: string
  ville?: string
  region?: string
  pays?: string
  latitude?: string | number
  longitude?: string | number
  
  // Characteristics
  surface_m2?: string | number
  surface_terrain_m2?: string | number
  nombre_pieces?: string | number
  nb_chambres?: string | number
  nb_sdb?: string | number
  etage?: string | number
  nb_etages?: string | number
  annee_construction?: string | number
  
  // Financial
  prix_achat?: string | number
  frais_acquisition?: string | number
  frais_notaire?: string | number
  frais_annexes?: string | number
  valeur_actuelle?: string | number
  charges?: string | number
  taxe_fonciere?: string | number
  
  // Location
  loyer?: string | number
  
  // Nouveaux champs
  proprietaire_id?: string
  quartier?: string
  transport_proche?: string
  ecoles_proche?: string
  surface_totale?: string | number
  orientation?: string
  vue?: string
  luminosite?: string
  
  // Amenities & rules (will be transformed to JSONB)
  amenities?: Amenities
  regles?: Regles
  
  // Status
  statut?: ProprieteStatut
  is_brouillon?: boolean
}

export interface UniteFormData {
  propriete_id: string
  nom: string
  type?: string
  description?: string
  
  batiment?: string
  etage?: string | number
  numero?: string
  position?: string
  
  surface_m2?: string | number
  nb_chambres?: string | number
  nb_lits?: string | number
  nb_sdb?: string | number
  capacite_max?: string | number
  
  prix_nuit?: string | number
  prix_semaine?: string | number
  prix_mois?: string | number
  caution?: string | number
  frais_menage?: string | number
  
  amenities?: Amenities
  regles?: Regles
  
  is_disponible?: boolean
}

// =============================================
// VALIDATION SCHEMAS
// =============================================

// Schema for creating propriété
export const createProprieteSchema = z.object({
  type: z.enum(PROPRIETE_TYPES),
  nom: z.string().min(1, 'Le nom est requis').max(255),
  titre_annonce: z.string().max(500).optional().nullable(),
  description: z.string().optional().nullable(),
  
  a_unites: z.boolean().default(false),
  nombre_unites: z.number().int().positive().optional().nullable(),
  
  adresse: z.string().max(255).optional().nullable(),
  adresse_complement: z.string().max(255).optional().nullable(),
  code_postal: z.string().max(20).optional().nullable(),
  ville: z.string().max(100).optional().nullable(),
  region: z.string().max(100).optional().nullable(),
  pays: z.string().length(2, 'Le code pays doit faire 2 caractères').min(1, 'Le pays est requis'),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  
  surface_m2: z.number().int().min(0).optional().nullable(),
  surface_terrain_m2: z.number().int().min(0).optional().nullable(),
  nombre_pieces: z.number().int().min(0).optional().nullable(),
  nb_chambres: z.number().int().min(0).default(0),
  nb_sdb: z.number().int().min(0).default(0),
  etage: z.number().int().optional().nullable(),
  nb_etages: z.number().int().min(0).optional().nullable(),
  annee_construction: z.number().int().min(1800).max(new Date().getFullYear()).optional().nullable(),
  
  prix_achat: z.number().min(0).optional().nullable(),
  frais_acquisition: z.number().min(0).optional().nullable(),
  frais_notaire: z.number().min(0).optional().nullable(),
  frais_annexes: z.number().min(0).optional().nullable(),
  valeur_actuelle: z.number().min(0).optional().nullable(),
  loyer: z.number().min(0).optional().nullable(),
  charges: z.number().min(0).optional().nullable(),
  taxe_fonciere: z.number().min(0).optional().nullable(),
  
  // Nouveaux champs
  proprietaire_id: z.string().uuid().optional().nullable(),
  quartier: z.string().max(100).optional().nullable(),
  transport_proche: z.string().optional().nullable(),
  ecoles_proche: z.string().optional().nullable(),
  surface_totale: z.number().min(0).optional().nullable(),
  orientation: z.string().max(50).optional().nullable(),
  vue: z.string().max(100).optional().nullable(),
  luminosite: z.string().max(50).optional().nullable(),
  photo_principale_url: z.string().url().optional().nullable(),
  
  // Équipements
  ascenseur: z.boolean().optional().nullable(),
  parking: z.boolean().optional().nullable(),
  nombre_places_parking: z.number().int().min(0).optional().nullable(),
  cave: z.boolean().optional().nullable(),
  balcon: z.boolean().optional().nullable(),
  surface_balcon: z.number().min(0).optional().nullable(),
  terrasse: z.boolean().optional().nullable(),
  surface_terrasse: z.number().min(0).optional().nullable(),
  jardin: z.boolean().optional().nullable(),
  surface_jardin: z.number().min(0).optional().nullable(),
  piscine: z.boolean().optional().nullable(),
  
  // Diagnostics énergétiques
  dpe_classe: z.string().max(1).optional().nullable(),
  dpe_valeur: z.number().min(0).optional().nullable(),
  ges_classe: z.string().max(1).optional().nullable(),
  ges_valeur: z.number().min(0).optional().nullable(),
  
  // Notes
  notes_internes: z.string().optional().nullable(),
  
  amenities: z.record(z.string(), z.any()).default({}),
  regles: z.record(z.string(), z.any()).default({}),
  
  statut: z.enum(PROPRIETE_STATUTS).default('brouillon'),
  is_brouillon: z.boolean().default(true),
  is_active: z.boolean().default(true)
}).refine(
  (data) => {
    // If multi-unités, must have nombre_unites
    if (data.a_unites) {
      return data.nombre_unites && data.nombre_unites > 0
    }
    return true
  },
  {
    message: "Le nombre d'unités est requis pour les propriétés multi-unités",
    path: ["nombre_unites"]
  }
)

// Schema for updating propriété (partial)
export const updateProprieteSchema = createProprieteSchema.partial()

// Schema for editing propriété (similar to create but without required fields)
export const proprieteEditSchema = z.object({
  // Base information
  nom: z.string().min(1, 'Le nom est requis').max(255),
  type: z.enum(PROPRIETE_TYPES),
  description: z.string().optional().nullable(),
  statut: z.enum(PROPRIETE_STATUTS).optional(),
  
  // Address
  adresse: z.string().max(255).optional().nullable(),
  adresse_complement: z.string().max(255).optional().nullable(),
  ville: z.string().max(100).optional().nullable(),
  code_postal: z.string().max(20).optional().nullable(),
  region: z.string().max(100).optional().nullable(),
  pays: z.string().length(2).optional().nullable(),
  
  // Characteristics
  surface_m2: z.number().int().min(0).optional().nullable(),
  surface_terrain_m2: z.number().int().min(0).optional().nullable(),
  nombre_pieces: z.number().int().min(0).optional().nullable(),
  nb_chambres: z.number().int().min(0).optional().nullable(),
  nb_sdb: z.number().int().min(0).optional().nullable(),
  etage: z.number().int().optional().nullable(),
  nb_etages: z.number().int().min(0).optional().nullable(),
  annee_construction: z.number().int().min(1800).max(new Date().getFullYear() + 10).optional().nullable(),
  
  // Equipment
  ascenseur: z.boolean().optional(),
  parking: z.boolean().optional(),
  nombre_places_parking: z.number().int().min(0).optional().nullable(),
  cave: z.boolean().optional(),
  balcon: z.boolean().optional(),
  surface_balcon: z.number().min(0).optional().nullable(),
  terrasse: z.boolean().optional(),
  surface_terrasse: z.number().min(0).optional().nullable(),
  jardin: z.boolean().optional(),
  surface_jardin: z.number().min(0).optional().nullable(),
  piscine: z.boolean().optional(),
  
  // Energy diagnostics
  dpe_classe: z.enum(['A', 'B', 'C', 'D', 'E', 'F', 'G']).optional().nullable(),
  dpe_valeur: z.number().min(0).optional().nullable(),
  ges_classe: z.enum(['A', 'B', 'C', 'D', 'E', 'F', 'G']).optional().nullable(),
  ges_valeur: z.number().min(0).optional().nullable(),
  
  // Financial
  prix_achat: z.number().min(0).optional().nullable(),
  frais_acquisition: z.number().min(0).optional().nullable(),
  valeur_actuelle: z.number().min(0).optional().nullable(),
  loyer: z.number().min(0).optional().nullable(),
  charges: z.number().min(0).optional().nullable(),
  taxe_fonciere: z.number().min(0).optional().nullable(),
  notes_internes: z.string().optional().nullable(),
  
  // Structure
  a_unites: z.boolean().optional(),
  is_brouillon: z.boolean().optional()
})

// Schema for draft propriété (very minimal requirements)
export const draftProprieteSchema = z.object({
  type: z.enum(PROPRIETE_TYPES),
  nom: z.string().min(1, 'Le nom est requis'),
  a_unites: z.boolean().default(false),
  pays: z.string().length(2, 'Le code pays doit faire 2 caractères').min(1, 'Le pays est requis'),
  statut: z.enum(PROPRIETE_STATUTS).default('brouillon'),
  is_brouillon: z.boolean().default(true)
})

// Schema for creating unité
export const createUniteSchema = z.object({
  propriete_id: z.string().uuid(),
  nom: z.string().min(1, 'Le nom est requis').max(255),
  type: z.string().max(50).optional().nullable(),
  description: z.string().optional().nullable(),
  
  batiment: z.string().max(50).optional().nullable(),
  etage: z.number().int().optional().nullable(),
  numero: z.string().max(20).optional().nullable(),
  position: z.string().max(50).optional().nullable(),
  
  surface_m2: z.number().int().min(0).optional().nullable(),
  nb_chambres: z.number().int().min(0).default(0),
  nb_lits: z.number().int().min(0).default(0),
  nb_sdb: z.number().int().min(0).default(0),
  capacite_max: z.number().int().min(0).default(0),
  
  prix_nuit: z.number().min(0).optional().nullable(),
  prix_semaine: z.number().min(0).optional().nullable(),
  prix_mois: z.number().min(0).optional().nullable(),
  caution: z.number().min(0).optional().nullable(),
  frais_menage: z.number().min(0).optional().nullable(),
  
  amenities: z.record(z.string(), z.any()).default({}),
  regles: z.record(z.string(), z.any()).default({}),
  
  is_active: z.boolean().default(true),
  is_disponible: z.boolean().default(true)
})

// Schema for updating unité
export const updateUniteSchema = createUniteSchema.omit({ propriete_id: true }).partial()

// Schema for propriété quotité
export const proprieteQuotiteSchema = z.object({
  propriete_id: z.string().uuid(),
  proprietaire_id: z.string().uuid(),
  pourcentage: z.number().min(0.01).max(100),
  date_acquisition: z.string().optional().nullable(),
  prix_acquisition: z.number().min(0).optional().nullable(),
  notes: z.string().optional().nullable()
})

// =============================================
// FORM DATA TRANSFORMERS
// =============================================

export type CreatePropriete = z.infer<typeof createProprieteSchema>
export type UpdatePropriete = z.infer<typeof updateProprieteSchema>
export type CreateUnite = z.infer<typeof createUniteSchema>
export type UpdateUnite = z.infer<typeof updateUniteSchema>

/**
 * Détermine le statut cohérent basé sur is_brouillon
 * Règles business:
 * - Si is_brouillon = true → statut = 'brouillon'
 * - Si is_brouillon = false ET statut actuel = 'brouillon' → statut = 'disponible'
 * - Si is_brouillon = false ET statut différent → conserver le statut
 */
export function determineStatutFromBrouillon(
  currentStatut?: string, 
  isBrouillon?: boolean
): ProprieteStatut {
  // Si explicitement marqué comme brouillon
  if (isBrouillon === true) {
    return 'brouillon'
  }
  
  // Si décoché "brouillon" et était brouillon → passer à disponible
  if (isBrouillon === false && currentStatut === 'brouillon') {
    return 'disponible'
  }
  
  // Sinon conserver le statut existant ou défaut
  return (currentStatut as ProprieteStatut) || 'brouillon'
}

/**
 * Transform form data to match database schema
 */
export function transformProprieteFormData(data: ProprieteFormData): CreatePropriete {
  return {
    type: data.type,
    nom: data.nom,
    titre_annonce: data.titre_annonce || null,
    description: data.description || null,
    
    a_unites: data.a_unites || false,
    nombre_unites: data.nombre_unites ? Number(data.nombre_unites) : null,
    
    adresse: data.adresse || null,
    adresse_complement: data.adresse_complement || null,
    code_postal: data.code_postal || null,
    ville: data.ville || null,
    region: data.region || null,
    pays: data.pays || 'FR',
    latitude: data.latitude ? Number(data.latitude) : null,
    longitude: data.longitude ? Number(data.longitude) : null,
    
    surface_m2: data.surface_m2 ? Number(data.surface_m2) : null,
    surface_terrain_m2: data.surface_terrain_m2 ? Number(data.surface_terrain_m2) : null,
    nombre_pieces: data.nombre_pieces ? Number(data.nombre_pieces) : null,
    nb_chambres: data.nb_chambres ? Number(data.nb_chambres) : 0,
    nb_sdb: data.nb_sdb ? Number(data.nb_sdb) : 0,
    etage: data.etage ? Number(data.etage) : null,
    nb_etages: data.nb_etages ? Number(data.nb_etages) : null,
    annee_construction: data.annee_construction ? Number(data.annee_construction) : null,
    
    prix_achat: data.prix_achat ? Number(data.prix_achat) : null,
    frais_acquisition: data.frais_acquisition ? Number(data.frais_acquisition) : null,
    frais_notaire: data.frais_notaire ? Number(data.frais_notaire) : null,
    frais_annexes: data.frais_annexes ? Number(data.frais_annexes) : null,
    valeur_actuelle: data.valeur_actuelle ? Number(data.valeur_actuelle) : null,
    loyer: data.loyer ? Number(data.loyer) : null,
    charges: data.charges ? Number(data.charges) : null,
    taxe_fonciere: data.taxe_fonciere ? Number(data.taxe_fonciere) : null,
    
    proprietaire_id: data.proprietaire_id || null,
    quartier: data.quartier || null,
    transport_proche: data.transport_proche || null,
    ecoles_proche: data.ecoles_proche || null,
    surface_totale: data.surface_totale ? Number(data.surface_totale) : null,
    orientation: data.orientation || null,
    vue: data.vue || null,
    luminosite: data.luminosite || null,
    photo_principale_url: null,
    
    amenities: data.amenities || {},
    regles: data.regles || {},
    
    // Gestion cohérente des statuts : is_brouillon ↔ statut
    statut: determineStatutFromBrouillon(data.statut, data.is_brouillon),
    is_brouillon: data.is_brouillon !== false,
    is_active: true
  }
}

/**
 * Transform unité form data
 */
export function transformUniteFormData(data: UniteFormData): CreateUnite {
  return {
    propriete_id: data.propriete_id,
    nom: data.nom,
    type: data.type || null,
    description: data.description || null,
    
    batiment: data.batiment || null,
    etage: data.etage ? Number(data.etage) : null,
    numero: data.numero || null,
    position: data.position || null,
    
    surface_m2: data.surface_m2 ? Number(data.surface_m2) : null,
    nb_chambres: data.nb_chambres ? Number(data.nb_chambres) : 0,
    nb_lits: data.nb_lits ? Number(data.nb_lits) : 0,
    nb_sdb: data.nb_sdb ? Number(data.nb_sdb) : 0,
    capacite_max: data.capacite_max ? Number(data.capacite_max) : 0,
    
    prix_nuit: data.prix_nuit ? Number(data.prix_nuit) : null,
    prix_semaine: data.prix_semaine ? Number(data.prix_semaine) : null,
    prix_mois: data.prix_mois ? Number(data.prix_mois) : null,
    caution: data.caution ? Number(data.caution) : null,
    frais_menage: data.frais_menage ? Number(data.frais_menage) : null,
    
    amenities: data.amenities || {},
    regles: data.regles || {},
    
    is_active: true,
    is_disponible: data.is_disponible !== false
  }
}