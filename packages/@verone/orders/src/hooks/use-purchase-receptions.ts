/**
 * 📦 Hook: Gestion Réceptions Achats (Purchase Orders)
 *
 * Features:
 * - Chargement items prêts à réception
 * - Calcul automatique différentiel (quantité restante = commandée - déjà reçue)
 * - Validation réceptions (partielles/complètes)
 * - Historique mouvements stock (traçabilité)
 * - Stats dashboard réceptions
 *
 * Workflow:
 * 1. Charger PO confirmé avec items enrichis
 * 2. Calculer quantités restantes (différentiel)
 * 3. User saisit quantités à recevoir
 * 4. Validation → Trigger stock + update statut
 */

'use client';

export type { PurchaseOrderForReception } from './purchase-receptions.types';

import { useAffiliateReceptions } from './use-affiliate-receptions';
import { usePurchaseReceptionsDetail } from './use-purchase-receptions-detail';
import { usePurchaseReceptionsList } from './use-purchase-receptions-list';

export function usePurchaseReceptions() {
  const list = usePurchaseReceptionsList();
  const detail = usePurchaseReceptionsDetail();
  const affiliate = useAffiliateReceptions();

  return {
    loading: list.loading || detail.loading || affiliate.loading,
    validating: detail.validating || affiliate.validating,
    cancelling: detail.cancelling,
    error: detail.error ?? list.error ?? affiliate.error,
    loadPurchaseOrderForReception: detail.loadPurchaseOrderForReception,
    prepareReceptionItems: detail.prepareReceptionItems,
    validateReception: detail.validateReception,
    loadReceptionHistory: detail.loadReceptionHistory,
    loadCancellationHistory: detail.loadCancellationHistory,
    loadReceptionStats: list.loadReceptionStats,
    loadPurchaseOrdersReadyForReception:
      list.loadPurchaseOrdersReadyForReception,
    cancelRemainder: detail.cancelRemainder,
    loadAffiliateProductReceptions: affiliate.loadAffiliateProductReceptions,
    confirmAffiliateReception: affiliate.confirmAffiliateReception,
    cancelAffiliateRemainder: affiliate.cancelAffiliateRemainder,
  };
}
