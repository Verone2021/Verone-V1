'use client';

import * as React from 'react';

import { Badge } from '@verone/ui';
import { cn } from '@verone/utils';

/**
 * Configuration d'un statut
 */
export interface StatusConfig {
  label: string;
  variant:
    | 'default'
    | 'secondary'
    | 'destructive'
    | 'outline'
    | 'success'
    | 'warning';
  icon?: React.ReactNode;
}

/**
 * Props pour le composant StatusPill
 */
export interface StatusPillProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Valeur du statut */
  status: string;
  /** Configuration des statuts disponibles */
  config?: Record<string, StatusConfig>;
  /** Taille du pill */
  size?: 'sm' | 'md' | 'lg';
}

// Configuration par défaut pour les statuts financiers courants
const defaultFinanceConfig: Record<string, StatusConfig> = {
  // Statuts de documents financiers
  draft: { label: 'Brouillon', variant: 'secondary' },
  sent: { label: 'Envoyée', variant: 'default' },
  received: { label: 'Reçue', variant: 'default' },
  paid: { label: 'Payée', variant: 'success' },
  partially_paid: { label: 'Paiement partiel', variant: 'warning' },
  overdue: { label: 'En retard', variant: 'destructive' },
  cancelled: { label: 'Annulée', variant: 'secondary' },
  refunded: { label: 'Remboursée', variant: 'outline' },

  // Statuts de transactions bancaires
  completed: { label: 'Complétée', variant: 'success' },
  pending: { label: 'En cours', variant: 'warning' },
  declined: { label: 'Refusée', variant: 'destructive' },
  reversed: { label: 'Annulée', variant: 'secondary' },

  // Statuts de rapprochement
  unmatched: { label: 'Non rapproché', variant: 'outline' },
  auto_matched: { label: 'Auto-match', variant: 'success' },
  manual_matched: { label: 'Rapproché manuellement', variant: 'default' },
  partial_matched: { label: 'Partiel', variant: 'warning' },
  ignored: { label: 'Ignoré', variant: 'secondary' },

  // Statuts de sync Qonto
  synced: { label: 'Synchronisé', variant: 'success' },
  error: { label: 'Erreur sync', variant: 'destructive' },

  // Supplier invoices
  to_review: { label: 'À vérifier', variant: 'warning' },
  to_pay: { label: 'À payer', variant: 'default' },
};

// Classes de taille
const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-0.5',
  lg: 'text-base px-3 py-1',
};

// Classes de variantes personnalisées (success et warning non supportés par Badge par défaut)
const customVariantClasses: Record<string, string> = {
  success:
    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border-green-200',
  warning:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 border-yellow-200',
};

/**
 * Composant StatusPill - Affiche un statut sous forme de badge coloré
 *
 * @example
 * <StatusPill status="paid" /> // Badge vert "Payée"
 * <StatusPill status="overdue" /> // Badge rouge "En retard"
 * <StatusPill status="custom" config={{ custom: { label: 'Custom', variant: 'default' }}} />
 */
export function StatusPill({
  status,
  config = defaultFinanceConfig,
  size = 'md',
  className,
  ...props
}: StatusPillProps) {
  // Récupérer la configuration du statut
  const statusConfig = config[status] || {
    label: status,
    variant: 'outline' as const,
  };

  const { label, variant, icon } = statusConfig;

  // Déterminer si c'est une variante personnalisée
  const isCustomVariant = variant === 'success' || variant === 'warning';

  return (
    <Badge
      variant={isCustomVariant ? 'outline' : variant}
      className={cn(
        sizeClasses[size],
        isCustomVariant && customVariantClasses[variant],
        'font-medium whitespace-nowrap',
        className
      )}
      {...props}
    >
      {icon && <span className="mr-1">{icon}</span>}
      {label}
    </Badge>
  );
}

/**
 * Configuration par défaut pour les statuts de paiement commande
 */
export const orderPaymentStatusConfig: Record<string, StatusConfig> = {
  unpaid: { label: 'Non payée', variant: 'outline' },
  partial: { label: 'Paiement partiel', variant: 'warning' },
  paid: { label: 'Payée', variant: 'success' },
  refunded: { label: 'Remboursée', variant: 'secondary' },
};

/**
 * Configuration par défaut pour les statuts de facture Qonto
 */
export const qontoInvoiceStatusConfig: Record<string, StatusConfig> = {
  draft: { label: 'Brouillon', variant: 'secondary' },
  unpaid: { label: 'Non payée', variant: 'warning' },
  paid: { label: 'Payée', variant: 'success' },
  overdue: { label: 'En retard', variant: 'destructive' },
  cancelled: { label: 'Annulée', variant: 'secondary' },
  canceled: { label: 'Annulée', variant: 'secondary' },
  finalized: { label: 'Finalisée', variant: 'default' },
  pending: { label: 'En attente', variant: 'warning' },
  sent: { label: 'Envoyée', variant: 'default' },
  accepted: { label: 'Accepté', variant: 'success' },
  declined: { label: 'Refusé', variant: 'destructive' },
};

// Export de la config par défaut pour personnalisation
export { defaultFinanceConfig };
