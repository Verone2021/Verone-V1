'use client';

/**
 * 🎨 StockMovementCard Component
 *
 * Card de mouvement de stock avec traçabilité complète
 * Design System V2 - Best Practices 2025
 *
 * @example
 * ```tsx
 * <StockMovementCard
 *   movement={{
 *     id: '123',
 *     movement_type: 'IN',
 *     quantity_change: 50,
 *     reason_code: 'PURCHASE',
 *     performed_at: '2025-10-31T10:00:00Z',
 *     channel_id: 'ch-1',
 *     products: { name: 'Canapé Oslo', sku: 'CANAPE-001' },
 *     sales_channels: { name: 'E-commerce', code: 'ecommerce' }
 *   }}
 *   onClick={() => console.log('Card clicked')}
 * />
 * ```
 */

import * as React from 'react';

import Image from 'next/image';

import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Package } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { cn } from '@verone/utils';

import { ChannelBadge } from './ChannelBadge';
import { MOVEMENT_CONFIG, type MovementType, type ChannelCode } from './types';

export interface StockMovementCardProps {
  /**
   * Données du mouvement de stock
   */
  movement: {
    id: string;
    movement_type: MovementType;
    quantity_change: number;
    reason_code: string;
    performed_at: string;
    channel_id?: string | null;
    products?: {
      name: string;
      sku: string;
      image_url?: string | null; // ✅ NOUVEAU - URL image produit
    } | null;
    sales_channels?: {
      name: string;
      code: string;
    } | null;
  };

  /**
   * Callback click sur la card
   */
  onClick?: () => void;

  /**
   * Classes CSS additionnelles
   */
  className?: string;
}

/**
 * Card mouvement de stock avec traçabilité complète
 *
 * Features:
 * - Border-left 4px selon type mouvement (IN=green, OUT=red, ADJUST=blue, TRANSFER=purple)
 * - Grid layout 4 colonnes: Product | Quantity | Channel | Date
 * - Height fixe 120px
 * - Hover: shadow-md + cursor-pointer (si onClick fourni)
 * - ChannelBadge intégré si channel_id présent
 * - Quantité avec signe (+/-) et couleur
 * - Format date français (date-fns)
 * - Responsive mobile-first
 * - Accessibility compliant
 */
export function StockMovementCard({
  movement,
  onClick,
  className,
}: StockMovementCardProps) {
  const config = MOVEMENT_CONFIG[movement.movement_type];
  const isClickable = !!onClick;

  /**
   * Normaliser code canal pour badge
   */
  const normalizeChannelCode = (code: string): ChannelCode => {
    const lowerCode = code.toLowerCase();

    if (lowerCode.includes('b2b')) return 'b2b';
    if (lowerCode.includes('ecommerce') || lowerCode.includes('e-commerce'))
      return 'ecommerce';
    if (lowerCode.includes('retail')) return 'retail';
    if (lowerCode.includes('wholesale')) return 'wholesale';

    return 'ecommerce';
  };

  /**
   * Formater la date
   */
  const formatDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      return format(date, "dd MMM yyyy 'à' HH:mm", { locale: fr });
    } catch {
      return dateStr;
    }
  };

  return (
    <Card
      role={isClickable ? 'button' : 'article'}
      tabIndex={isClickable ? 0 : undefined}
      aria-label={`Mouvement ${config.label}: ${movement.products?.name || 'Produit'}`}
      onClick={onClick}
      onKeyDown={
        isClickable
          ? e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      className={cn(
        // Base styles
        'relative h-[120px] overflow-hidden border-l-4 transition-all duration-200',

        // Border color selon type
        config.borderColor,

        // Hover microinteraction (si clickable)
        isClickable && [
          'cursor-pointer',
          'hover:shadow-md hover:scale-[1.01]',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        ],

        className
      )}
    >
      <div className="h-full p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-full items-center">
          {/* Product Info */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Image Produit */}
            {movement.products?.image_url ? (
              <Image
                src={movement.products.image_url}
                alt={movement.products?.name || 'Produit'}
                width={48}
                height={48}
                className="rounded-lg object-cover border border-gray-200 flex-shrink-0"
              />
            ) : (
              <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Package className="h-6 w-6 text-gray-400" />
              </div>
            )}

            {/* Info Produit */}
            <div className="flex flex-col gap-1 min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {movement.products?.name || 'Produit inconnu'}
              </p>
              <p className="text-xs text-gray-500 font-mono">
                {movement.products?.sku || 'N/A'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {config.label} · {movement.reason_code}
              </p>
            </div>
          </div>

          {/* Quantity */}
          <div className="flex items-center justify-start md:justify-center">
            <div
              className={cn(
                'inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold',
                config.bgColor,
                config.textColor
              )}
            >
              <span className="text-lg">{config.sign}</span>
              <span className="text-xl">
                {Math.abs(movement.quantity_change)}
              </span>
            </div>
          </div>

          {/* Channel */}
          <div className="flex items-center justify-start md:justify-center">
            {movement.sales_channels ? (
              <ChannelBadge
                channelCode={normalizeChannelCode(movement.sales_channels.code)}
                size="md"
                showIcon
              />
            ) : (
              <span className="text-xs text-gray-400 italic">Aucun canal</span>
            )}
          </div>

          {/* Date */}
          <div className="flex flex-col gap-0.5 text-right">
            <p className="text-xs text-gray-500">
              {formatDate(movement.performed_at)}
            </p>
            <p className="text-xs text-gray-400 font-mono">
              #{movement.id.slice(0, 8)}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}

/**
 * Type export pour usage externe
 */
StockMovementCard.displayName = 'StockMovementCard';
