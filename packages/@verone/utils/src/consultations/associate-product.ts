/**
 * Helper d'association produit → consultation
 *
 * Source unique pour POST /api/consultations/associations.
 * Remplace les 5 appels inline (use-consultations.ts addItem, use-create-consultation.ts,
 * produits/[id]/page.tsx, SourcingProductModal.tsx, SourcingQuickForm/hooks.ts).
 *
 * Sprint BO-CONSULT-P2-001 — 2026-09-12
 */

export interface AssociateProductInput {
  consultationId: string;
  productId: string;
  quantity?: number;
  proposedPrice?: number | null;
  isFree?: boolean;
  notes?: string | null;
  isPrimaryProposal?: boolean;
}

/**
 * Associe un produit à une consultation via l'API.
 *
 * @throws {Error} si la réponse n'est pas ok (message issu de la réponse API)
 */
export async function associateProductToConsultation(
  input: AssociateProductInput
): Promise<void> {
  const body = {
    consultation_id: input.consultationId,
    product_id: input.productId,
    quantity: input.quantity ?? 1,
    proposed_price: input.proposedPrice ?? null,
    is_free: input.isFree ?? false,
    notes: input.notes ?? null,
    is_primary_proposal: input.isPrimaryProposal ?? false,
  };

  const response = await fetch('/api/consultations/associations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const result: unknown = await response.json().catch(() => null);
    const message =
      result !== null &&
      typeof result === 'object' &&
      'error' in result &&
      typeof (result as { error: unknown }).error === 'string'
        ? (result as { error: string }).error
        : `Erreur HTTP ${response.status} lors de l'association du produit`;
    throw new Error(message);
  }
}
