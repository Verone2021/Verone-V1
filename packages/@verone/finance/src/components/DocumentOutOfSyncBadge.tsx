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
 * Badge ambre affiché uniquement quand :
 * - Le document est en statut 'draft'
 * - La commande a été modifiée APRES la création du document
 *
 * Indique que le document n'est plus synchronisé avec la commande.
 * Utilisé sur les listes /devis et /factures pour signaler les documents à régénérer.
 *
 * [BO-RLS-PERF-002 étape 4] Refonte visuelle pour meilleure visibilité :
 * - Fond ambre plus marqué + bordure visible
 * - Pulse subtil sur l'icône pour attirer l'œil sans saturer
 * - Texte raccourci ("À regénérer") plus actionnable que "Non synchronisé"
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
        'gap-1.5 border-amber-400 bg-amber-100 px-2 py-0.5 text-amber-900 font-medium shadow-sm',
        className
      )}
      title="La commande source a été modifiée après la création de ce brouillon. Régénération recommandée pour synchroniser les montants."
    >
      <AlertTriangle className="h-3 w-3 animate-pulse text-amber-700" />À
      régénérer
    </Badge>
  );
}
