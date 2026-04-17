// Finance components exports

// Modals principaux (unifiés)
export * from './QuickClassificationModal';
export * from './OrganisationLinkingModal';
export * from './InvoiceUploadModal';
export * from './RapprochementModal';
export * from './RapprochementContent/index'; // Headless content: embedded bank reconciliation
export * from './RapprochementFromOrderModal'; // Modal inverse: Commande → Transaction (thin wrapper)
export * from './InvoiceCreateFromOrderModal/index'; // Modal: Commande → Facture Qonto
export * from './InvoiceDetailModal'; // Modal: Détail facture avec workflow actions
export * from './InvoiceCreateServiceModal'; // Modal: Facture service (sans commande) (2026-01-07)
export * from './PaymentRecordModal'; // Modal: Enregistrer un paiement (2026-01-09)
export * from './ReconcileTransactionModal'; // Modal: Rapprochement bancaire (2026-01-09)
export * from './OrderSelectModal'; // Modal: Selection commande pour facturation
export * from './CreditNoteCreateModal'; // Modal: Facture → Avoir Qonto (2026-01-07)
export * from './QuoteCreateFromOrderModal'; // Modal: Commande → Devis Qonto (2026-01-07)
export * from './QuoteFormModal'; // Modal: Devis service (lignes libres, sans commande) (2026-02-28)
export * from './RuleModal/index'; // SLICE 2: RuleModal universel (création + édition)
export * from './ApplyExistingWizard'; // Wizard preview/confirm pour application de règles

// Tables
export * from './tables/EditableQuoteItemRow'; // Ligne éditable devis (catalogue vs libre)

// Composants UI
export * from './QuoteStatusBadge'; // Badge statut devis réutilisable
export * from './DocumentSourceBadge'; // Badge Commande vs Service (BO-FIN-010)
export * from './SupplierCell';
export * from './OrganisationTransactionsSection';
export * from './TransactionDetailDialog';
export * from './TransactionDetailSheet';

// Email sending
export * from './SendDocumentEmailModal';
export * from './DocumentEmailHistory';

// PDF Preview
export * from './PdfPreviewModal';
export { PdfPreviewModalDynamic } from './PdfPreviewModalDynamic';

// Charts (Recharts-based)
export * from './charts';

// Dashboard
export * from './dashboard';

// Treasury
export * from './treasury';
