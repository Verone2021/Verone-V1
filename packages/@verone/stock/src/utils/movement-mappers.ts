/**
 * 🔄 Mappers pour les mouvements de stock
 *
 * Transforme les données des hooks vers les formats attendus par les composants UI
 *
 * @module movement-mappers
 * @since Phase 3.3.1 - Migration Dashboard
 */

// FIXME: StockMovementCardProps can't be imported from apps/back-office in package
// import type { StockMovementCardProps } from '@/components/ui-v2/stock/stock-movement-card';

/**
 * Interface RecentMovement depuis use-stock-dashboard
 */
export interface RecentMovement {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  movement_type: 'IN' | 'OUT' | 'ADJUST' | 'TRANSFER';
  quantity_change: number;
  quantity_before: number;
  quantity_after: number;
  reason_code: string;
  notes: string | null;
  performed_at: string;
  performer_name: string | null;
  channel_id: string | null;
}

/**
 * Mapper RecentMovement → StockMovementCard props
 *
 * Transforme les données du dashboard vers le format attendu par le composant
 *
 * @example
 * ```typescript
 * const movement = {
 *   id: '123',
 *   product_name: 'Canapé Oslo',
 *   product_sku: 'CANAPE-001',
 *   movement_type: 'IN',
 *   quantity_change: 50,
 *   reason_code: 'PURCHASE',
 *   performed_at: '2025-10-31T10:00:00Z'
 * }
 *
 * const props = mapRecentMovementToCard(movement)
 * <StockMovementCard {...props} />
 * ```
 */
export function mapRecentMovementToCard(movement: RecentMovement): any {
  return {
    movement: {
      id: movement.id,
      movement_type: movement.movement_type,
      quantity_change: movement.quantity_change,
      reason_code: movement.reason_code,
      performed_at: movement.performed_at,

      // Mapping produit
      products: {
        name: movement.product_name,
        sku: movement.product_sku,
      },

      // Channel: null pour Phase 3.3 (sera ajouté Phase 3.4)
      // TODO Phase 3.4: Ajouter channel_id depuis base de données
      channel_id: null,
      sales_channels: null,
    },
  };
}

/**
 * Mapper batch RecentMovement[] → StockMovementCardProps[]
 *
 * Applique le mapping sur un tableau de mouvements
 *
 * @example
 * ```typescript
 * const recentMovements = await fetchRecentMovements()
 * const cardProps = mapRecentMovementsToCards(recentMovements)
 *
 * cardProps.map(props => <StockMovementCard key={props.movement.id} {...props} />)
 * ```
 */
export function mapRecentMovementsToCards(movements: RecentMovement[]): any[] {
  return movements.map(mapRecentMovementToCard);
}
