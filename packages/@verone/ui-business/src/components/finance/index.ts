/**
 * @verone/ui-business - Finance Components
 *
 * Composants réutilisables pour les interfaces financières :
 * - Money: Affichage formaté des montants avec devise
 * - StatusPill: Badges de statut colorés
 * - PartnerChip: Badge partenaire avec rôles
 * - DocumentLink: Lien vers document financier
 * - SyncButton: Bouton de synchronisation avec état
 * - ConfidenceMeter: Jauge de confiance pour matching
 * - KpiCard: Carte KPI avec tendance
 * - DataTableToolbar: Barre d'outils pour tables de données
 */

// Money - Affichage montants
export { Money, MoneyCompact } from './Money';
export type { MoneyProps } from './Money';

// StatusPill - Badges de statut
export {
  StatusPill,
  defaultFinanceConfig,
  orderPaymentStatusConfig,
  qontoInvoiceStatusConfig,
} from './StatusPill';
export type { StatusPillProps, StatusConfig } from './StatusPill';

// PartnerChip - Badge partenaire
export { PartnerChip, PartnerChipMini, roleConfig } from './PartnerChip';
export type { PartnerChipProps, OrganisationRole } from './PartnerChip';

// DocumentLink - Lien document
export {
  DocumentLink,
  DocumentBadge,
  generateDocumentNumber,
  documentTypeConfig,
} from './DocumentLink';
export type { DocumentLinkProps, FinancialDocumentType } from './DocumentLink';

// SyncButton - Bouton synchronisation
export { SyncButton } from './SyncButton';
export type { SyncButtonProps, SyncStatus } from './SyncButton';

// ConfidenceMeter - Jauge confiance
export { ConfidenceMeter, ConfidenceBadge } from './ConfidenceMeter';
export type { ConfidenceMeterProps } from './ConfidenceMeter';

// KpiCard - Cartes KPI
export { KpiCard, KpiGrid } from './KpiCard';
export type { KpiCardProps } from './KpiCard';

// DataTableToolbar - Barre d'outils table
export { DataTableToolbar, DateRangeFilter } from './DataTableToolbar';
export type {
  DataTableToolbarProps,
  ToolbarFilterConfig,
  ToolbarFilterOption,
} from './DataTableToolbar';
