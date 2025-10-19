/**
 * 📦 Types pour Module Réceptions & Expéditions
 *
 * Date: 2025-10-18
 * Convention: Workflow Odoo-inspired avec support réceptions/expéditions partielles
 *
 * Features:
 * - Réceptions achats (purchase orders)
 * - Expéditions ventes (sales orders)
 * - Support partiel (multiple receipts/shipments par commande)
 * - Calcul automatique différentiel
 * - Tracking stock forecast temps réel
 */

// ============================================================================
// PURCHASE ORDERS - RÉCEPTIONS
// ============================================================================

/**
 * Item de ligne pour formulaire réception
 * Utilisé dans PurchaseOrderReceptionForm
 */
export interface ReceptionItem {
  /** ID de la ligne purchase_order_items */
  purchase_order_item_id: string

  /** ID du produit */
  product_id: string

  /** Nom du produit (display) */
  product_name: string

  /** SKU du produit (display) */
  product_sku: string

  /** Quantité commandée (total) */
  quantity_ordered: number

  /** Quantité déjà reçue (somme réceptions précédentes) */
  quantity_already_received: number

  /** Quantité restante à recevoir (calculated) */
  quantity_remaining: number

  /** Quantité à recevoir maintenant (USER INPUT) */
  quantity_to_receive: number

  /** Impact sur stock prévisionnel (calculé) */
  stock_forecast_impact: number

  /** Prix unitaire HT (pour calcul total réception) */
  unit_price_ht: number
}

/**
 * Payload pour validation réception
 * Envoyé à l'action server validatePurchaseReception
 */
export interface ValidateReceptionPayload {
  /** ID du purchase order */
  purchase_order_id: string

  /** Items avec quantités à recevoir */
  items: Array<{
    purchase_order_item_id: string
    product_id: string
    quantity_to_receive: number
  }>

  /** Date de réception effective (défaut: NOW) */
  received_at?: string

  /** Notes réception optionnelles */
  notes?: string

  /** ID utilisateur qui réceptionne */
  received_by: string
}

/**
 * Historique réception (mouvement stock lié)
 * Affiché dans onglet Réception pour traçabilité
 */
export interface ReceptionHistory {
  /** ID mouvement stock */
  movement_id: string

  /** Date réception */
  received_at: string

  /** User qui a réceptionné */
  received_by: string
  received_by_name: string

  /** Items réceptionnés */
  items: Array<{
    product_name: string
    product_sku: string
    quantity_received: number
    stock_before: number
    stock_after: number
  }>

  /** Notes */
  notes?: string

  /** Total quantité */
  total_quantity: number
}

// ============================================================================
// SALES ORDERS - EXPÉDITIONS
// ============================================================================

/**
 * Item de ligne pour formulaire expédition
 * Utilisé dans SalesOrderShipmentForm
 */
export interface ShipmentItem {
  /** ID de la ligne sales_order_items */
  sales_order_item_id: string

  /** ID du produit */
  product_id: string

  /** Nom du produit (display) */
  product_name: string

  /** SKU du produit (display) */
  product_sku: string

  /** Quantité commandée (total) */
  quantity_ordered: number

  /** Quantité déjà expédiée (somme expéditions précédentes) */
  quantity_already_shipped: number

  /** Quantité restante à expédier (calculated) */
  quantity_remaining: number

  /** Quantité à expédier maintenant (USER INPUT) */
  quantity_to_ship: number

  /** Stock disponible actuel (vérification) */
  stock_available: number

  /** Prix unitaire HT */
  unit_price_ht: number
}

/**
 * Informations transporteur pour expédition
 */
export interface ShipmentCarrierInfo {
  /** Type transporteur */
  carrier_type: 'packlink' | 'mondial_relay' | 'chronotruck' | 'other'

  /** Nom transporteur (si other) */
  carrier_name?: string

  /** Service choisi (ex: Colissimo, UPS Express) */
  service_name?: string

  /** Numéro de tracking */
  tracking_number?: string

  /** URL de tracking */
  tracking_url?: string

  /** Coût expédition payé (EUR) */
  cost_paid_eur?: number

  /** Coût facturé client (EUR) */
  cost_charged_eur?: number

  /** Date livraison estimée */
  estimated_delivery_at?: string

  /** ID référence Packlink */
  packlink_shipment_id?: string

  /** URL étiquette Packlink */
  packlink_label_url?: string

  /** Point Mondial Relay */
  mondial_relay_point_id?: string
  mondial_relay_point_name?: string

  /** Référence Chronotruck */
  chronotruck_reference?: string
  chronotruck_palette_count?: number
}

/**
 * Adresse expédition
 * Pré-remplie depuis sales_order, éditable
 */
export interface ShippingAddress {
  /** Nom complet destinataire */
  recipient_name: string

  /** Entreprise (optionnel) */
  company?: string

  /** Ligne adresse 1 */
  address_line1: string

  /** Ligne adresse 2 (optionnel) */
  address_line2?: string

  /** Code postal */
  postal_code: string

  /** Ville */
  city: string

  /** Pays */
  country: string

  /** Téléphone */
  phone?: string

  /** Email */
  email?: string
}

/**
 * Payload pour validation expédition
 * Envoyé à l'action server validateSalesShipment
 */
export interface ValidateShipmentPayload {
  /** ID du sales order */
  sales_order_id: string

  /** Items avec quantités à expédier */
  items: Array<{
    sales_order_item_id: string
    product_id: string
    quantity_to_ship: number
  }>

  /** Date expédition effective (défaut: NOW) */
  shipped_at?: string

  /** Informations transporteur */
  carrier_info: ShipmentCarrierInfo

  /** Adresse expédition */
  shipping_address: ShippingAddress

  /** Notes expédition optionnelles */
  notes?: string

  /** ID utilisateur qui expédie */
  shipped_by: string
}

/**
 * Historique expédition
 * Affiché dans onglet Expédition pour traçabilité
 */
export interface ShipmentHistory {
  /** ID shipment */
  shipment_id: string

  /** Date expédition */
  shipped_at: string

  /** Date livraison effective (si delivered) */
  delivered_at?: string

  /** Transporteur */
  carrier_name: string
  service_name?: string

  /** Tracking */
  tracking_number?: string
  tracking_url?: string

  /** Items expédiés */
  items: Array<{
    product_name: string
    product_sku: string
    quantity_shipped: number
  }>

  /** Total quantité */
  total_quantity: number

  /** Coût */
  cost_paid_eur?: number
  cost_charged_eur?: number

  /** Statut livraison */
  delivery_status: 'in_transit' | 'delivered' | 'failed' | 'returned'
}

// ============================================================================
// COMMON TYPES
// ============================================================================

/**
 * Statut réception/expédition
 */
export type ReceptionShipmentStatus =
  | 'pending'           // En attente
  | 'partial'           // Partielle
  | 'complete'          // Complète
  | 'cancelled'         // Annulée

/**
 * Filtre pour pages liste réceptions/expéditions
 */
export interface ReceptionShipmentFilters {
  /** Statut */
  status?: ReceptionShipmentStatus

  /** Recherche (PO/SO number, fournisseur/client, produit) */
  search?: string

  /** Date début */
  date_from?: string

  /** Date fin */
  date_to?: string

  /** Filtre urgence (date livraison < 3 jours) */
  urgent_only?: boolean

  /** Filtre en retard (date livraison passée) */
  overdue_only?: boolean
}

/**
 * Stats pour dashboard réceptions/expéditions
 */
export interface ReceptionShipmentStats {
  /** Total à traiter */
  total_pending: number

  /** Total partielles */
  total_partial: number

  /** Total complètes aujourd'hui */
  total_completed_today: number

  /** Total en retard */
  total_overdue: number

  /** Total urgent (< 3 jours) */
  total_urgent: number
}
