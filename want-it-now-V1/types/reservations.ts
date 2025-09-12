import { z } from 'zod';

// ============================================================================
// ENUMS
// ============================================================================

export const ReservationStatut = {
  CONFIRMEE: 'confirmee',
  EN_ATTENTE: 'en_attente',
  ANNULEE: 'annulee',
  COMPLETEE: 'completee',
  EN_COURS: 'en_cours'
} as const;

export const SourceReservation = {
  AIRBNB: 'airbnb',
  BOOKING: 'booking',
  EXPEDIA: 'expedia',
  DIRECT: 'direct',
  AUTRE: 'autre'
} as const;

export const TypePaiement = {
  ACOMPTE: 'acompte',
  SOLDE: 'solde',
  REMBOURSEMENT: 'remboursement',
  COMMISSION: 'commission',
  TAXE: 'taxe'
} as const;

export const StatutPaiement = {
  EN_ATTENTE: 'en_attente',
  RECU: 'recu',
  ECHOUE: 'echoue',
  ANNULE: 'annule',
  REMBOURSE: 'rembourse'
} as const;

export const CalendrierStatut = {
  DISPONIBLE: 'disponible',
  INDISPONIBLE: 'indisponible',
  RESERVE: 'reserve',
  BLOQUE: 'bloque',
  MAINTENANCE: 'maintenance'
} as const;

// ============================================================================
// TYPES DE BASE
// ============================================================================

export type ReservationStatut = typeof ReservationStatut[keyof typeof ReservationStatut];
export type SourceReservation = typeof SourceReservation[keyof typeof SourceReservation];
export type TypePaiement = typeof TypePaiement[keyof typeof TypePaiement];
export type StatutPaiement = typeof StatutPaiement[keyof typeof StatutPaiement];
export type CalendrierStatut = typeof CalendrierStatut[keyof typeof CalendrierStatut];

// ============================================================================
// SCHEMAS DE VALIDATION
// ============================================================================

// Schema pour l'import CSV Airbnb (basé sur le template)
export const airbnbCsvSchema = z.object({
  "Code de confirmation": z.string(),
  "Statut": z.string(),
  "Nom du voyageur": z.string(),
  "Contact": z.string().optional(),
  "# des adultes": z.string().transform(v => parseInt(v) || 0),
  "# des enfants": z.string().transform(v => parseInt(v) || 0),
  "# des bébés": z.string().transform(v => parseInt(v) || 0),
  "Date de début": z.string(), // Format: JJ/MM/AAAA
  "Date de fin": z.string(),
  "# des nuits": z.string().transform(v => parseInt(v) || 0),
  "Réservée": z.string(), // Date de réservation
  "Annonce": z.string(), // Nom de la propriété
  "Revenus": z.string() // Format: "1 097,03 €"
});

// Schema principal de réservation
export const reservationSchema = z.object({
  id: z.string().uuid().optional(),
  
  // Liens
  contrat_id: z.string().uuid(),
  propriete_id: z.string().uuid().nullable(),
  unite_id: z.string().uuid().nullable(),
  organisation_id: z.string().uuid(),
  
  // Informations voyageur
  voyageur_nom: z.string().min(1),
  voyageur_prenom: z.string().optional(),
  voyageur_email: z.string().email().optional(),
  voyageur_telephone: z.string().optional(),
  voyageur_pays: z.string().optional(),
  voyageur_ville: z.string().optional(),
  voyageur_identite_verifiee: z.boolean().default(false),
  voyageur_evaluation: z.number().min(0).max(5).optional(),
  voyageur_nb_commentaires: z.number().optional(),
  
  // Dates et statut
  date_arrivee: z.string(),
  date_depart: z.string(),
  nombre_nuits: z.number().optional(),
  date_reservation: z.string().optional(),
  statut: z.nativeEnum(ReservationStatut).default(ReservationStatut.CONFIRMEE),
  code_confirmation: z.string(),
  source_reservation: z.nativeEnum(SourceReservation).default(SourceReservation.DIRECT),
  source_reference: z.string().optional(),
  
  // Détails réservation
  nombre_adultes: z.number().min(0).default(1),
  nombre_enfants: z.number().min(0).default(0),
  nombre_bebes: z.number().min(0).default(0),
  nombre_animaux: z.number().min(0).default(0),
  conditions_annulation: z.string().optional(),
  
  // Financier
  prix_nuit: z.number().optional(),
  sous_total_nuits: z.number().optional(),
  frais_menage: z.number().default(0),
  frais_service_voyageur: z.number().default(0),
  taxes_sejour: z.number().default(0),
  total_voyageur: z.number().optional(),
  
  frais_service_hote: z.number().default(0),
  frais_service_hote_taux: z.number().optional(),
  tva_frais_service: z.number().default(0),
  total_hote_net: z.number().optional(),
  commission_plateforme_total: z.number().optional(),
  
  // Notes
  notes_internes: z.string().optional(),
  notes_calendrier: z.string().optional(),
  special_requests: z.string().optional()
}).refine(
  (data) => {
    // Validation exclusive propriété XOR unité
    return (data.propriete_id !== null) !== (data.unite_id !== null);
  },
  {
    message: "Une réservation doit être liée soit à une propriété soit à une unité, pas les deux",
    path: ["propriete_id", "unite_id"]
  }
);

// Schema pour le calendrier
export const calendrierDisponibiliteSchema = z.object({
  id: z.string().uuid().optional(),
  propriete_id: z.string().uuid().nullable(),
  unite_id: z.string().uuid().nullable(),
  date: z.string(),
  statut: z.nativeEnum(CalendrierStatut).default(CalendrierStatut.DISPONIBLE),
  prix_custom: z.number().optional(),
  prix_minimum: z.number().optional(),
  sejour_minimum: z.number().min(1).default(1),
  reservation_id: z.string().uuid().optional(),
  notes: z.string().optional()
});

// Schema pour les paiements
export const paiementReservationSchema = z.object({
  id: z.string().uuid().optional(),
  reservation_id: z.string().uuid(),
  type_paiement: z.nativeEnum(TypePaiement),
  montant: z.number().min(0),
  date_paiement: z.string().optional(),
  date_reception: z.string().optional(),
  methode_paiement: z.string().optional(),
  reference_transaction: z.string().optional(),
  statut: z.nativeEnum(StatutPaiement).default(StatutPaiement.EN_ATTENTE),
  notes: z.string().optional()
});

// ============================================================================
// TYPES TYPESCRIPT
// ============================================================================

export type Reservation = z.infer<typeof reservationSchema>;
export type CalendrierDisponibilite = z.infer<typeof calendrierDisponibiliteSchema>;
export type PaiementReservation = z.infer<typeof paiementReservationSchema>;
export type AirbnbCsvRow = z.infer<typeof airbnbCsvSchema>;

// Type pour l'import avec mapping
export interface ImportMapping {
  csvColumn: string;
  dbField: keyof Reservation;
  transform?: (value: string) => any;
}

// Configuration mapping Airbnb
export const AIRBNB_MAPPING: ImportMapping[] = [
  { csvColumn: "Code de confirmation", dbField: "code_confirmation" },
  { csvColumn: "Nom du voyageur", dbField: "voyageur_nom" },
  { csvColumn: "Contact", dbField: "voyageur_telephone" },
  { csvColumn: "# des adultes", dbField: "nombre_adultes", transform: (v) => parseInt(v) || 0 },
  { csvColumn: "# des enfants", dbField: "nombre_enfants", transform: (v) => parseInt(v) || 0 },
  { csvColumn: "# des bébés", dbField: "nombre_bebes", transform: (v) => parseInt(v) || 0 },
  { 
    csvColumn: "Date de début", 
    dbField: "date_arrivee",
    transform: (v) => {
      // Convertir JJ/MM/AAAA en YYYY-MM-DD
      const [day, month, year] = v.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  },
  { 
    csvColumn: "Date de fin", 
    dbField: "date_depart",
    transform: (v) => {
      const [day, month, year] = v.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  },
  { csvColumn: "# des nuits", dbField: "nombre_nuits", transform: (v) => parseInt(v) || 0 },
  { 
    csvColumn: "Réservée", 
    dbField: "date_reservation",
    transform: (v) => {
      const [day, month, year] = v.split('-');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  },
  { 
    csvColumn: "Revenus", 
    dbField: "total_hote_net",
    transform: (v) => {
      // Convertir "1 097,03 €" en nombre
      return parseFloat(v.replace(/[^\d,]/g, '').replace(',', '.'));
    }
  }
];

// ============================================================================
// HELPERS
// ============================================================================

export function calculateCommissions(reservation: Partial<Reservation>) {
  const { 
    prix_nuit = 0,
    nombre_nuits = 0,
    frais_menage = 0,
    source_reservation = SourceReservation.DIRECT
  } = reservation;
  
  // Taux par défaut selon plateforme
  const commissionRates = {
    [SourceReservation.AIRBNB]: { voyageur: 0.142, hote: 0.03 },
    [SourceReservation.BOOKING]: { voyageur: 0, hote: 0.15 },
    [SourceReservation.EXPEDIA]: { voyageur: 0, hote: 0.15 },
    [SourceReservation.DIRECT]: { voyageur: 0, hote: 0 },
    [SourceReservation.AUTRE]: { voyageur: 0, hote: 0 }
  };
  
  const rates = commissionRates[source_reservation];
  
  // Calculs
  const sous_total_nuits = prix_nuit * nombre_nuits;
  const frais_service_voyageur = sous_total_nuits * rates.voyageur;
  const total_voyageur = sous_total_nuits + frais_menage + frais_service_voyageur;
  
  const frais_service_hote = (sous_total_nuits + frais_menage) * rates.hote;
  const tva_frais_service = frais_service_hote * 0.20;
  const total_hote_net = sous_total_nuits + frais_menage - frais_service_hote;
  
  const commission_plateforme_total = frais_service_voyageur + frais_service_hote;
  
  return {
    sous_total_nuits,
    frais_service_voyageur,
    total_voyageur,
    frais_service_hote,
    tva_frais_service,
    total_hote_net,
    commission_plateforme_total
  };
}

export function parseAirbnbDate(dateStr: string): string {
  // Convertir "13/10/2025" en "2025-10-13"
  const [day, month, year] = dateStr.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

export function parseAirbnbAmount(amountStr: string): number {
  // Convertir "1 097,03 €" en 1097.03
  return parseFloat(amountStr.replace(/[^\d,]/g, '').replace(',', '.'));
}

export function formatStatutAirbnb(statut: string): ReservationStatut {
  const mapping: Record<string, ReservationStatut> = {
    'Confirmée': ReservationStatut.CONFIRMEE,
    'En cours': ReservationStatut.EN_COURS,
    'Séjour en cours': ReservationStatut.EN_COURS,
    'Annulée': ReservationStatut.ANNULEE,
    'En attente': ReservationStatut.EN_ATTENTE
  };
  
  return mapping[statut] || ReservationStatut.CONFIRMEE;
}