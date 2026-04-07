/**
 * Hook: Gestion Expéditions Ventes (Sales Orders)
 *
 * Features:
 * - Chargement items prêts à expédition
 * - Calcul automatique différentiel (quantité restante = commandée - déjà expédiée)
 * - Vérification stock disponible avant expédition
 * - Validation expéditions (partielles/complètes)
 * - Intégration transporteurs (Packlink, Mondial Relay, Chronotruck)
 * - Historique mouvements stock (traçabilité)
 * - Stats dashboard expéditions
 *
 * Workflow:
 * 1. Charger SO confirmé avec items enrichis
 * 2. Calculer quantités restantes (différentiel)
 * 3. Vérifier stock disponible
 * 4. User saisit quantités à expédier + transporteur
 * 5. Validation → Trigger stock + update statut
 */

'use client';

import { useShipmentDetail } from './use-shipment-detail';
import { useShipmentList } from './use-shipment-list';
import { useShipmentStats } from './use-shipment-stats';
import { useShipmentValidator } from './use-shipment-validator';

export type { SalesOrderForShipment } from './types';

/**
 * Orchestrateur : combine les 4 sub-hooks d'expédition
 * API publique identique à l'ancien hook monolithique
 */
export function useSalesShipments() {
  const detail = useShipmentDetail();
  const list = useShipmentList();
  const validator = useShipmentValidator();
  const stats = useShipmentStats();

  return {
    loading: detail.loading || list.loading,
    validating: validator.validating,
    error: detail.error ?? list.error,
    loadSalesOrderForShipment: detail.loadSalesOrderForShipment,
    prepareShipmentItems: detail.prepareShipmentItems,
    validateShipment: validator.validateShipment,
    loadShipmentHistory: detail.loadShipmentHistory,
    loadShipmentStats: stats.loadShipmentStats,
    loadSalesOrdersReadyForShipment: list.loadSalesOrdersReadyForShipment,
    loadShippedOrdersHistory: list.loadShippedOrdersHistory,
  };
}
