/**
 * 🆕 Phase 3.4.4: Vue Cards pour mouvements stock
 *
 * Alternative à MovementsTable avec StockMovementCard en grid responsive
 *
 * @since Phase 3.4.4 - 2025-10-31
 */

'use client';

import { Clock } from 'lucide-react';

import { StockMovementCard } from '@/components/ui-v2/stock';
import type { StockMovementCardProps } from '@/components/ui-v2/stock/stock-movement-card';
import type { MovementWithDetails } from '@verone/stock';

interface MovementsListViewProps {
  movements: MovementWithDetails[];
  loading?: boolean;
  emptyMessage?: string;
  selectedChannel?: string | null;
}

/**
 * Mapper MovementWithDetails → StockMovementCardProps
 *
 * Transforme les données du hook vers le format attendu par StockMovementCard
 */
function mapMovementToCard(
  movement: MovementWithDetails
): StockMovementCardProps {
  return {
    movement: {
      id: movement.id,
      movement_type: movement.movement_type,
      quantity_change: movement.quantity_change,
      reason_code: movement.reason_code ?? 'unknown',
      performed_at: movement.performed_at,

      // Mapping produit
      products: {
        name: movement.product_name ?? 'Produit inconnu',
        sku: movement.product_sku ?? 'SKU inconnu',
        image_url: movement.product_image_url ?? null, // ✅ NOUVEAU - Image produit
      },

      // 🆕 Phase 3.4.4: Mapping canal depuis JOIN
      channel_id: movement.channel_id ?? null,
      sales_channels: movement.channel_name
        ? {
            name: movement.channel_name,
            code: movement.channel_code ?? '',
          }
        : null,
    },
  };
}

/**
 * Composant MovementsListView
 *
 * Affiche les mouvements en grid de cards responsive
 * Alternative moderne à la table classique
 */
export function MovementsListView({
  movements,
  loading = false,
  emptyMessage = 'Aucun mouvement trouvé',
  selectedChannel = null,
}: MovementsListViewProps) {
  // Empty state
  if (!loading && movements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Clock className="h-16 w-16 text-gray-300 mb-4" />
        <p className="text-sm text-gray-500">
          {selectedChannel ? 'Aucun mouvement pour ce canal' : emptyMessage}
        </p>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => i).map(i => (
          <div
            key={i}
            className="h-32 rounded-[10px] border border-gray-300 bg-gray-100 animate-pulse"
          />
        ))}
      </div>
    );
  }

  // Grid responsive de cards
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {movements.map(movement => (
        <StockMovementCard key={movement.id} {...mapMovementToCard(movement)} />
      ))}
    </div>
  );
}
