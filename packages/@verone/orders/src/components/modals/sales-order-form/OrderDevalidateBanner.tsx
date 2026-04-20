'use client';

/**
 * OrderDevalidateBanner — bannière "Dévalider pour modifier".
 *
 * [BO-FIN-009 Phase 3.2 — R6 finance.md — UX]
 * Affichée dans `SalesOrderFormModal` en mode édition lorsque la commande
 * n'est pas en `draft`. Propose à l'utilisateur un bouton pour repasser la
 * commande en brouillon (trigger DB rollback stock / prix / commission
 * LinkMe), après quoi les champs deviennent éditables.
 *
 * Le bouton applique les mêmes guards que le bouton "Dévalider" de la
 * page /commandes/clients : rejet si expéditions déjà effectuées, ou si
 * une facture liée est `sent` ou `paid`.
 */

import { useCallback, useState } from 'react';

import { useToast } from '@verone/common/hooks';
import { createClient } from '@verone/utils/supabase/client';
import { Button } from '@verone/ui';
import { AlertTriangle, Loader2, RotateCcw } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OrderDevalidateBannerProps {
  /** ID commande (UUID sales_orders) */
  orderId: string;
  /** Statut actuel de la commande. Si `draft` : aucun rendu. */
  status: string | null | undefined;
  /** Numéro commande pour message utilisateur (optionnel) */
  orderNumber?: string | null;
  /** Callback après dévalidation réussie (refetch order → UI editable) */
  onDevalidated: () => void | Promise<void>;
}

// ---------------------------------------------------------------------------
// Helper — dévalidation via Supabase client direct
// ---------------------------------------------------------------------------

async function devalidateOrder(orderId: string): Promise<void> {
  const supabase = createClient();

  // Guard 1 : pas d'expéditions effectuées
  const { data: items } = await supabase
    .from('sales_order_items')
    .select('quantity_shipped')
    .eq('sales_order_id', orderId);
  if (items?.some(i => (i.quantity_shipped ?? 0) > 0)) {
    throw new Error(
      'Impossible de dévalider : des expéditions ont déjà été effectuées.'
    );
  }

  // Guard 2 : aucune facture finalisée / payée liée
  const { data: invoices } = await supabase
    .from('financial_documents')
    .select('id, document_number, status')
    .eq('sales_order_id', orderId)
    .eq('document_type', 'customer_invoice')
    .in('status', ['sent', 'paid'])
    .is('deleted_at', null)
    .limit(1);
  if (invoices && invoices.length > 0) {
    const inv = invoices[0];
    throw new Error(
      `Impossible de dévalider : la facture ${inv.document_number} est ${inv.status === 'paid' ? 'payée' : 'définitive'}. Créez d'abord un avoir pour annuler cette facture.`
    );
  }

  // Transition validated → draft : les triggers DB gèrent le rollback en cascade
  const { error } = await supabase
    .from('sales_orders')
    .update({
      status: 'draft',
      updated_at: new Date().toISOString(),
      confirmed_at: null,
      confirmed_by: null,
    })
    .eq('id', orderId);

  if (error) throw new Error(error.message);

  // Libérer les réservations stock associées (non-bloquant)
  try {
    const { data: userData } = await supabase.auth.getUser();
    await supabase
      .from('stock_reservations')
      .update({
        released_at: new Date().toISOString(),
        released_by: userData.user?.id,
      })
      .eq('reference_type', 'sales_order')
      .eq('reference_id', orderId)
      .is('released_at', null);
  } catch (e) {
    console.warn(
      '[OrderDevalidateBanner] Stock reservations release failed (non-blocking):',
      e
    );
  }
}

// ---------------------------------------------------------------------------
// Composant
// ---------------------------------------------------------------------------

const STATUS_LABELS: Record<string, string> = {
  validated: 'validée',
  partially_shipped: 'partiellement expédiée',
  shipped: 'expédiée',
  delivered: 'livrée',
  cancelled: 'annulée',
  pending_approval: "en attente d'approbation",
};

export function OrderDevalidateBanner({
  orderId,
  status,
  orderNumber,
  onDevalidated,
}: OrderDevalidateBannerProps): React.ReactNode {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const needsDevalidation = !!status && status !== 'draft';

  const handleClick = useCallback((): void => {
    setIsLoading(true);
    devalidateOrder(orderId)
      .then(async () => {
        toast({
          title: 'Commande dévalidée',
          description:
            'Stock prévisionnel, prix lockés et commission LinkMe rollbackés. Vous pouvez maintenant modifier la commande.',
        });
        await onDevalidated();
      })
      .catch((error: unknown) => {
        console.error('[OrderDevalidateBanner] Devalidation failed:', error);
        toast({
          title: 'Impossible de dévalider',
          description:
            error instanceof Error ? error.message : 'Erreur inconnue',
          variant: 'destructive',
        });
      })
      .finally(() => setIsLoading(false));
  }, [orderId, onDevalidated, toast]);

  if (!needsDevalidation) return null;

  const humanStatus = STATUS_LABELS[status ?? ''] ?? status;

  return (
    <div className="rounded-md border border-orange-300 bg-orange-50 p-3 flex items-start gap-3 mb-4">
      <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="text-sm">
          <span className="font-medium text-orange-900">
            Commande {humanStatus}
            {orderNumber ? ` ${orderNumber}` : ''} — non modifiable
          </span>
          <p className="text-xs text-orange-700 mt-1">
            Pour modifier les articles, adresses ou client, dévalidez
            d&apos;abord la commande (retour brouillon). Les cascades DB
            rollbackent automatiquement le stock prévisionnel, les prix lockés
            et la commission LinkMe. Vous pourrez la revalider après
            modification.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleClick}
          disabled={status === 'cancelled' || isLoading}
          className="gap-1.5 border-orange-400 text-orange-800 hover:bg-orange-100"
        >
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RotateCcw className="h-3.5 w-3.5" />
          )}
          Dévalider pour modifier
        </Button>
      </div>
    </div>
  );
}
