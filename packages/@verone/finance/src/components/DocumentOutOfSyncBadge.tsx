'use client';

import { AlertTriangle } from 'lucide-react';

import { Badge, cn } from '@verone/ui';

/**
 * Helper pur — testable sans contexte React.
 * Retourne true si la commande a été modifiée après la création du document.
 * Logique de détection out-of-sync : orderUpdatedAt > documentCreatedAt
 */
export function isDocumentOutOfSync(
  orderUpdatedAt: string | null | undefined,
  documentCreatedAt: string | null | undefined
): boolean {
  if (!orderUpdatedAt || !documentCreatedAt) return false;
  return new Date(orderUpdatedAt) > new Date(documentCreatedAt);
}

interface DocumentOutOfSyncBadgeProps {
  orderUpdatedAt: string | null | undefined;
  documentCreatedAt: string | null | undefined;
  documentStatus: string;
  className?: string;
}

/**
 * Badge orange affiché uniquement quand :
 * - Le document est en statut 'draft'
 * - La commande a été modifiée APRES la création du document
 *
 * Indique que le document n'est plus synchronisé avec la commande.
 * Utilisé sur les listes /devis et /factures pour signaler les documents à régénérer.
 */
export function DocumentOutOfSyncBadge({
  orderUpdatedAt,
  documentCreatedAt,
  documentStatus,
  className,
}: DocumentOutOfSyncBadgeProps): React.ReactNode {
  if (documentStatus !== 'draft') return null;
  if (!isDocumentOutOfSync(orderUpdatedAt, documentCreatedAt)) return null;

  return (
    <Badge
      variant="outline"
      className={cn(
        'bg-orange-50 text-orange-700 border-orange-200 gap-1',
        className
      )}
      title="Commande modifiee apres la creation de ce document - Re-synchroniser recommande"
    >
      <AlertTriangle className="h-3 w-3" />
      Non synchronise
    </Badge>
  );
}
