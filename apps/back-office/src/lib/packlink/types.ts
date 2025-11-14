/**
 * Packlink API TypeScript Types
 * Documentation: https://github.com/wout/packlink.cr
 * Date: 2025-11-12
 */

// ============================================
// ADDRESS
// ============================================

export interface PacklinkAddress {
  name: string; // Prénom
  surname: string; // Nom de famille
  email: string; // Email contact
  phone: string; // Téléphone (+33...)
  street1: string; // Adresse ligne 1
  street2?: string; // Adresse ligne 2 (optionnel)
  city: string; // Ville
  zip_code: string; // Code postal
  country: string; // Code ISO 2 lettres (FR, DE, IT...)
  state?: string; // Région (optionnel France, requis USA/Canada)
}

// ============================================
// PACKAGE
// ============================================

export interface PacklinkPackage {
  width: number; // Largeur (cm)
  height: number; // Hauteur (cm)
  length: number; // Longueur (cm)
  weight: number; // Poids (kg)
}

// ============================================
// SERVICE (Transporteur disponible)
// ============================================

export interface PacklinkServicePrice {
  total_price: number; // Prix total EUR
  currency: string; // Devise (EUR)
  tax_price?: number; // TVA
  base_price?: number; // Prix HT
}

export interface PacklinkServiceDate {
  date: string; // Format YYYY-MM-DD
  from: string; // Heure début (HH:mm)
  till: string; // Heure fin (HH:mm)
}

export interface PacklinkService {
  id: number; // ID service Packlink
  carrier_name: string; // Nom transporteur (Chronopost, DPD, Colissimo...)
  name: string; // Nom service (Express, Standard...)
  price: PacklinkServicePrice; // Prix
  transit_hours: number; // Délai transit (heures)
  transit_days?: number; // Délai transit (jours)
  available_dates: Record<string, PacklinkServiceDate>; // Dates disponibles pickup
  national?: boolean; // Service national ou international
  category?: string; // Catégorie (express, economy...)
  dropoff?: boolean; // Dépôt en point relais ?
  collection_type?: 'home' | 'dropoff'; // ✅ FIX: Type collecte (domicile ou point relais)
  delivery_type?: 'home' | 'dropoff'; // ✅ FIX: Type livraison (domicile ou point relais)
}

// ============================================
// SHIPMENT REQUEST
// ============================================

export interface PacklinkCustomsItem {
  description_english: string; // Description EN
  quantity: number; // Quantité
  weight: number; // Poids unitaire (kg)
  value: number; // Valeur unitaire (EUR)
  country_of_origin: string; // Code ISO 2 lettres
  hs_code?: string; // Code douanier (optionnel)
}

export interface PacklinkCustoms {
  eori_number: string; // EORI exportateur
  vat_number: string; // N° TVA
  sender_type: 'company' | 'individual'; // Type expéditeur
  sender_personalid?: string; // ID personnel si individual
  shipment_type: 'commercial' | 'gift' | 'sample'; // Type expédition
  items: PacklinkCustomsItem[]; // Items customs
}

export interface PacklinkShipmentRequest {
  from: PacklinkAddress; // Adresse expéditeur
  to: PacklinkAddress; // Adresse destinataire
  packages: PacklinkPackage[]; // Colis (1 ou plusieurs)
  service_id: number; // ID service choisi
  content: string; // Description contenu
  contentvalue: number; // Valeur déclarée (EUR)
  shipment_custom_reference?: string; // Référence custom (ex: VERONE-SHIP-XXX)
  dropoff_point_id?: string; // ID point relais (si applicable)
  source?: 'source_inbound' | 'source_outbound'; // Source
  customs?: PacklinkCustoms; // Customs (requis hors UE)
}

// ============================================
// ORDER REQUEST (peut contenir plusieurs shipments)
// ============================================

export interface PacklinkOrderRequest {
  order_custom_reference: string; // Référence custom order (ex: VERONE-ORD-XXX)
  shipments: PacklinkShipmentRequest[]; // Liste shipments
}

// ============================================
// ORDER RESPONSE
// ============================================

export interface PacklinkShipmentLine {
  shipment_reference: string; // Référence Packlink (DE567YH981230AA)
  shipment_custom_reference?: string; // Référence custom
  insurance_coverage_amount?: number; // Assurance EUR
  total_price: number; // Prix total EUR
  receipt_url?: string; // URL reçu
}

export interface PacklinkOrderResponse {
  order_reference: string; // Référence order Packlink (ORD-2025-ABC123)
  total_amount: number; // Montant total EUR
  shipments: PacklinkShipmentLine[]; // Liste shipments créés
}

// ============================================
// SHIPMENT DETAILS
// ============================================

export interface PacklinkShipmentDetails {
  shipment_reference: string; // Référence Packlink
  carrier: string; // Transporteur
  service_name: string; // Nom service
  tracking_code?: string; // Code suivi
  tracking_url?: string; // URL tracking
  base_price: number; // Prix HT
  total_price: number; // Prix TTC
  collection_date?: string; // Date collecte
  collection_hour?: string; // Heure collecte
  delivery_date?: string; // Date livraison
  collection: PacklinkAddress; // Adresse collecte
  delivery: PacklinkAddress; // Adresse livraison
  packages: PacklinkPackage[]; // Colis
  status?: string; // Statut actuel
}

// ============================================
// TRACKING EVENT
// ============================================

export interface PacklinkTrackingEvent {
  timestamp: string; // Timestamp ISO 8601
  city?: string; // Ville événement
  description: string; // Description (DELIVERED, IN_TRANSIT...)
  created_at: string; // Date création événement
}

// ============================================
// LABEL RESPONSE
// ============================================

export interface PacklinkLabel {
  url: string; // URL PDF étiquette
  format?: string; // Format (A4, A6...)
  created_at?: string; // Date création
}

// ============================================
// DROPOFF POINT
// ============================================

export interface PacklinkDropoffOpeningTimes {
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
  saturday?: string;
  sunday?: string;
}

export interface PacklinkDropoff {
  id: string; // ID point relais
  commerce_name: string; // Nom commerce
  address: string; // Adresse
  city: string; // Ville
  zip: string; // Code postal
  country: string; // Pays
  phone?: string; // Téléphone
  lat: number; // Latitude
  long: number; // Longitude
  distance?: number; // Distance (km)
  opening_times: PacklinkDropoffOpeningTimes; // Horaires
}

// ============================================
// WEBHOOK EVENT
// ============================================

export interface PacklinkWebhookEventData {
  shipment_custom_reference?: string; // Référence custom
  shipment_reference: string; // Référence Packlink
  status?: string; // Statut actuel
  tracking_code?: string; // Code suivi
  carrier?: string; // Transporteur
  [key: string]: unknown; // Autres champs dynamiques
}

export interface PacklinkWebhookEvent {
  name: string; // Nom événement (shipment.delivered, etc.)
  created_at: string; // Timestamp ISO 8601
  data: PacklinkWebhookEventData; // Données événement
}

// ============================================
// SHIPMENT STATUS (Enum)
// ============================================

export type PacklinkShipmentStatus =
  | 'PENDING' // Commande reçue, préparation
  | 'READY_TO_PURCHASE' // Prêt achat transporteur
  | 'PROCESSING' // Génération label en cours
  | 'READY_FOR_SHIPPING' // Label prêt, attente collecte
  | 'TRACKING' // Collecté par transporteur
  | 'IN_TRANSIT' // En transit
  | 'OUT_FOR_DELIVERY' // En livraison
  | 'DELIVERED' // Livré
  | 'INCIDENT' // Problème (adresse, douane...)
  | 'RETURNED_TO_SENDER' // Retourné expéditeur
  | 'DRAFT' // Brouillon (incomplet)
  | 'ARCHIVED'; // Archivé (>90 jours)

// ============================================
// CLIENT CONFIG
// ============================================

export interface PacklinkClientConfig {
  apiKey: string; // Clé API Packlink
  environment: 'production' | 'sandbox'; // Environnement
  timeout?: number; // Timeout requêtes (ms) - défaut 30000
  maxRetries?: number; // Nombre tentatives - défaut 3
}

// ============================================
// ERROR RESPONSE
// ============================================

export interface PacklinkErrorResponse {
  message: string; // Message erreur
  code?: string; // Code erreur
  errors?: Record<string, string[]>; // Erreurs validation par champ
}

// ============================================
// API ERROR (Structure standardisée)
// ============================================

export interface ErrorDetail {
  field: string; // Champ en erreur
  type: string; // Type erreur (required, invalid_format, mismatch...)
  message: string; // Message explicite
}

export interface ApiError {
  error: boolean; // true
  code: number; // Code HTTP (400, 422, 500...)
  message: string; // Message principal
  details?: ErrorDetail[]; // Détails par champ
  hint?: string; // Conseil pour corriger
}

// ============================================
// DRAFT (Brouillon expédition)
// ============================================

export interface PacklinkDraftResponse {
  draft_id: string; // ID draft Packlink
  shipment_custom_reference?: string; // Référence custom
  from: PacklinkAddress; // Expéditeur
  to: PacklinkAddress; // Destinataire
  packages: PacklinkPackage[]; // Colis
  service_id: number; // Service choisi
  content: string; // Description
  contentvalue: number; // Valeur déclarée
  estimated_price?: number; // Prix estimé
  created_at: string; // Date création ISO 8601
}

// ============================================
// SEARCH SERVICES REQUEST
// ============================================

export interface SearchServicesRequest {
  from: {
    zip: string; // Code postal expéditeur
    country: string; // Pays ISO 2 lettres
  };
  to: {
    zip: string; // Code postal destinataire
    country: string; // Pays ISO 2 lettres
  };
  packages: PacklinkPackage[]; // Colis à expédier
}

// ============================================
// FORM DATA (Interfaces formulaire front)
// ============================================

export interface ShipmentFormData {
  // Expéditeur
  from: PacklinkAddress;

  // Destinataire
  to: PacklinkAddress;

  // Colis (1 ou plusieurs)
  packages: PacklinkPackage[];

  // Contenu
  content: string; // Description
  contentvalue: number; // Valeur déclarée EUR

  // Service (sélectionné après recherche)
  service_id?: number;

  // Référence interne
  shipment_custom_reference?: string;

  // Douanes (si nécessaire)
  customs?: PacklinkCustoms;

  // Point relais (si applicable)
  dropoff_point_id?: string;
}
