/**
 * Types pour les Analytics LinkMe
 * Page /statistiques - Vue affilié
 */

// Périodes disponibles pour les analytics
export type AnalyticsPeriod = 'all' | 'week' | 'month' | 'quarter' | 'year';

// Données complètes analytics niveau affilié
export interface AffiliateAnalyticsData {
  // KPIs principaux (periode selectionnee)
  totalOrders: number;
  totalRevenueHT: number;
  totalCommissionsHT: number;
  totalCommissionsTTC: number;
  totalQuantitySold: number; // Somme de toutes les quantités vendues
  // KPI ALL TIME - source de verite pour page Commissions
  totalCommissionsTTCAllTime: number;
  pendingCommissionsHT: number;
  pendingCommissionsTTC: number;
  validatedCommissionsHT: number;
  validatedCommissionsTTC: number;
  paidCommissionsHT: number;
  paidCommissionsTTC: number;
  averageBasket: number;
  conversionRate: number;
  totalViews: number;

  // Données pour graphiques
  revenueByPeriod: RevenueDataPoint[];
  commissionsByStatus: CommissionsByStatus;

  // Données détaillées
  selectionsPerformance: SelectionPerformance[];
  topProducts: TopProductData[];
}

// Point de données pour graphique CA
export interface RevenueDataPoint {
  date: string;
  label: string;
  revenue: number;
  orders: number;
}

// Répartition des commissions par statut
export interface CommissionsByStatus {
  pending: CommissionStatusData;
  validated: CommissionStatusData;
  requested: CommissionStatusData;
  paid: CommissionStatusData;
  total: CommissionStatusData;
}

export interface CommissionStatusData {
  count: number;
  amountHT: number;
  amountTTC: number;
}

// Performance d'une sélection
export interface SelectionPerformance {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  productsCount: number;
  views: number;
  orders: number;
  revenue: number;
  conversionRate: number;
  publishedAt: string | null;
  topProducts?: TopProductData[];
}

// Données produit pour top ventes
export interface TopProductData {
  productId: string;
  productName: string;
  productSku: string;
  productImageUrl: string | null;
  quantitySold: number;
  revenueHT: number;
  commissionHT: number;
  selectionId?: string;
  selectionName?: string;
  isRevendeur?: boolean; // true si produit créé par l'affilié
}

// Commission individuelle pour liste
export interface CommissionItem {
  id: string;
  orderNumber: string;
  orderAmountHT: number;
  affiliateCommission: number;
  affiliateCommissionTTC: number;
  linkmeCommission: number;
  marginRateApplied: number;
  status: CommissionStatus;
  createdAt: string;
  validatedAt: string | null;
  paidAt: string | null;
  selectionName?: string;
  customerName?: string; // Nom du restaurant/client
}

export type CommissionStatus =
  | 'pending'
  | 'validated'
  | 'payable' // Alias de 'validated' utilisé dans certaines parties de la DB
  | 'requested'
  | 'paid'
  | 'cancelled';

// Labels pour les statuts
export const COMMISSION_STATUS_LABELS: Record<CommissionStatus, string> = {
  pending: 'En attente',
  validated: 'Payable',
  payable: 'Payable', // Alias de 'validated'
  requested: 'Demande en cours',
  paid: 'Payée',
  cancelled: 'Annulée',
};

// Couleurs pour les statuts
export const COMMISSION_STATUS_COLORS: Record<CommissionStatus, string> = {
  pending: 'orange',
  validated: 'teal', // Turquoise LinkMe
  payable: 'teal', // Alias de 'validated'
  requested: 'blue',
  paid: 'green',
  cancelled: 'red',
};

// Labels périodes
export const PERIOD_LABELS: Record<AnalyticsPeriod, string> = {
  all: 'Tout',
  week: '7 jours',
  month: '30 jours',
  quarter: 'Ce trimestre',
  year: 'Cette année',
};

// Helper pour calculer la date de début de période
// Retourne null pour 'all' (pas de filtre de date)
export function getPeriodStartDate(period: AnalyticsPeriod): Date | null {
  if (period === 'all') return null;
  const now = new Date();
  switch (period) {
    case 'week':
      return new Date(now.setDate(now.getDate() - 7));
    case 'month':
      return new Date(now.setDate(now.getDate() - 30));
    case 'quarter': {
      // Trimestre calendaire: Q1=Jan-Mars, Q2=Avr-Juin, Q3=Juil-Sept, Q4=Oct-Déc
      const currentQuarter = Math.floor(now.getMonth() / 3);
      return new Date(now.getFullYear(), currentQuarter * 3, 1);
    }
    case 'year':
      return new Date(now.getFullYear(), 0, 1);
    default:
      return new Date(now.setDate(now.getDate() - 30));
  }
}

// Helper pour formater les montants (TOUJOURS avec 2 décimales - règle métier)
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Helper pour formater les pourcentages
export function formatPercentage(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
}

// Helper pour formater les nombres compacts
export function formatCompactNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
}

// ============================================================================
// Types pour les Demandes de Versement (Payment Requests)
// ============================================================================

export type PaymentRequestStatus =
  | 'pending'
  | 'invoice_received'
  | 'paid'
  | 'cancelled';

export interface PaymentRequest {
  id: string;
  affiliateId: string;
  requestNumber: string;
  totalAmountHT: number;
  totalAmountTTC: number;
  taxRate: number;
  status: PaymentRequestStatus;
  invoiceFileUrl: string | null;
  invoiceFileName: string | null;
  invoiceReceivedAt: string | null;
  paidAt: string | null;
  paidBy: string | null;
  paymentReference: string | null;
  paymentProofUrl: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  // Relations
  items?: PaymentRequestItem[];
  commissions?: CommissionItem[];
}

export interface PaymentRequestItem {
  id: string;
  paymentRequestId: string;
  commissionId: string;
  commissionAmountTTC: number;
  createdAt: string;
}

// Labels statuts demande de versement
export const PAYMENT_REQUEST_STATUS_LABELS: Record<
  PaymentRequestStatus,
  string
> = {
  pending: 'En attente de facture',
  invoice_received: 'Facture reçue',
  paid: 'Payée',
  cancelled: 'Annulée',
};

// Couleurs statuts demande de versement
export const PAYMENT_REQUEST_STATUS_COLORS: Record<
  PaymentRequestStatus,
  string
> = {
  pending: 'orange',
  invoice_received: 'blue',
  paid: 'green',
  cancelled: 'red',
};

// Informations légales Vérone pour factures
export const VERONE_LEGAL_INFO = {
  name: 'VERONE SAS',
  address: '229 Rue Saint-Honoré',
  postalCode: '75001',
  city: 'PARIS',
  siret: '914 588 785 00016',
  fullAddress: '229 Rue Saint-Honoré, 75001 PARIS',
};

// Type pour données affilié (facturation)
export interface AffiliateInvoiceInfo {
  name: string;
  email: string;
  address?: string;
  siret?: string;
  tvaNumber?: string;
  iban?: string;
  bic?: string;
}

// Input pour créer une demande de versement
export interface CreatePaymentRequestInput {
  commissionIds: string[];
}

// Helper pour formater date française
export function formatDateFR(
  date: string | Date | null,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return '-';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString(
    'fr-FR',
    options || {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }
  );
}
