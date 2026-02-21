// Finance components exports

// Modals principaux (unifiés)
export * from './QuickClassificationModal';
export * from './OrganisationLinkingModal';
export * from './InvoiceUploadModal';
export * from './RapprochementModal';
export * from './RapprochementContent'; // Headless content: embedded bank reconciliation
export * from './RapprochementFromOrderModal'; // Modal inverse: Commande → Transaction (thin wrapper)
export * from './InvoiceCreateFromOrderModal'; // Modal: Commande → Facture Qonto
export * from './InvoiceDetailModal'; // Modal: Détail facture avec workflow actions
export * from './InvoiceCreateServiceModal'; // Modal: Facture service (sans commande) (2026-01-07)
export * from './PaymentRecordModal'; // Modal: Enregistrer un paiement (2026-01-09)
export * from './ReconcileTransactionModal'; // Modal: Rapprochement bancaire (2026-01-09)
export * from './OrderSelectModal'; // Modal: Selection commande pour facturation
export * from './CreditNoteCreateModal'; // Modal: Facture → Avoir Qonto (2026-01-07)
export * from './QuoteCreateFromOrderModal'; // Modal: Commande → Devis Qonto (2026-01-07)
export * from './QuoteCreateServiceModal'; // Modal: Devis service (sans commande) (2026-01-07)
export * from './RuleModal'; // SLICE 2: RuleModal universel (création + édition)
export * from './ApplyExistingWizard'; // Wizard preview/confirm pour application de règles

// Composants UI
export * from './SupplierCell';
export * from './OrganisationTransactionsSection';

// Charts (Recharts-based)
export * from './charts';

// Dashboard
export * from './dashboard';

// Treasury
export * from './treasury';
