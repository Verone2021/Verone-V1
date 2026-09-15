/**
 * État de l'échantillon d'un produit, calculé depuis ses commandes
 * échantillon (BO-SOURCING-P4-001, décision D6).
 *
 * Plus aucun statut « échantillon » n'est écrit sur le produit : la vérité est la
 * commande fournisseur de type échantillon. Même lecture que la vue
 * customer_samples_view (20260121_001) et même règle que request_sample_order :
 * une ligne archivée ou une commande annulée ne compte plus comme échantillon actif.
 *
 * Pure : testée par __tests__/derive-sample-state.test.ts.
 */

export type SamplePurchaseOrderStatus =
  | 'draft'
  | 'validated'
  | 'partially_received'
  | 'received'
  | 'cancelled';

export type SampleState =
  | 'none'
  | 'to_send'
  | 'ordered'
  | 'received'
  | 'cancelled';

export const SAMPLE_STATE_LABELS: Record<SampleState, string> = {
  none: 'Aucun échantillon',
  to_send: 'Échantillon à envoyer',
  ordered: 'Échantillon commandé',
  received: 'Échantillon reçu',
  cancelled: 'Échantillon annulé',
};

export interface SampleOrderLine {
  itemId: string;
  itemArchivedAt: string | null;
  orderId: string;
  poNumber: string;
  poStatus: SamplePurchaseOrderStatus;
  poType: string | null;
  orderCreatedAt: string;
}

export interface SampleStateResult {
  state: SampleState;
  /** Commande à ouvrir (« Voir la commande ») : l'active, sinon la dernière. */
  order: {
    id: string;
    poNumber: string;
    status: SamplePurchaseOrderStatus;
  } | null;
  /** ID de la ligne purchase_order_items de l'échantillon actif (ou dernier connu). */
  itemId: string | null;
}

function newestFirst(a: SampleOrderLine, b: SampleOrderLine): number {
  return b.orderCreatedAt.localeCompare(a.orderCreatedAt);
}

function toOrder(line: SampleOrderLine): SampleStateResult['order'] {
  return { id: line.orderId, poNumber: line.poNumber, status: line.poStatus };
}

export function deriveSampleState(lines: SampleOrderLine[]): SampleStateResult {
  const samples = lines.filter(l => l.poType === 'sample').sort(newestFirst);

  const active = samples.find(
    l => l.itemArchivedAt === null && l.poStatus !== 'cancelled'
  );
  if (active) {
    const state: SampleState =
      active.poStatus === 'draft'
        ? 'to_send'
        : active.poStatus === 'validated'
          ? 'ordered'
          : 'received';
    return { state, order: toOrder(active), itemId: active.itemId };
  }

  if (samples.length > 0) {
    return {
      state: 'cancelled',
      order: toOrder(samples[0]),
      itemId: samples[0].itemId,
    };
  }

  return { state: 'none', order: null, itemId: null };
}
