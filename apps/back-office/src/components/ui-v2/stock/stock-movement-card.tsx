'use client';

/**
 * 🎨 StockMovementCard Component - Design V2 Minimaliste
 *
 * Card de mouvement de stock compacte et minimaliste
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
 *     products: { name: 'Canapé Oslo', sku: 'CANAPE-001' }
 *   }}
 *   onClick={() => console.warn('Card clicked')}
 * />
 * ```
 */

import * as React from 'react';

import Image from 'next/image';

import { cn } from '@verone/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Package } from 'lucide-react';

import { MOVEMENT_CONFIG, type MovementType } from './types';

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
      image_url?: string | null;
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
 * Card mouvement de stock - Design V2 Minimaliste
 *
 * Features:
 * - Hauteur AUTO (pas de h-[120px] fixe)
 * - Layout flex simple avec image 32x32
 * - Infos essentielles seulement
 * - Hover subtil
 * - Pas de Card wrapper (double bordure évitée)
 */
function formatMovementDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const diffDays = Math.floor(
      (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays === 0) return format(date, 'HH:mm', { locale: fr });
    if (diffDays === 1) return `Hier ${format(date, 'HH:mm', { locale: fr })}`;
    if (diffDays < 7) return format(date, 'EEE HH:mm', { locale: fr });
    return format(date, 'dd/MM HH:mm', { locale: fr });
  } catch {
    return dateStr;
  }
}

function MovementThumbnail({
  imageUrl,
  name,
}: {
  imageUrl?: string | null;
  name: string;
}) {
  if (imageUrl) {
    return (
      <Image
        src={imageUrl}
        alt={name}
        width={32}
        height={32}
        className="rounded object-cover flex-shrink-0"
      />
    );
  }
  return (
    <div className="h-8 w-8 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
      <Package className="h-4 w-4 text-gray-400" />
    </div>
  );
}

export function StockMovementCard({
  movement,
  onClick,
  className,
}: StockMovementCardProps) {
  const config = MOVEMENT_CONFIG[movement.movement_type];
  const isClickable = !!onClick;

  return (
    <div
      role={isClickable ? 'button' : 'article'}
      tabIndex={isClickable ? 0 : undefined}
      aria-label={`Mouvement ${config.label}: ${movement.products?.name ?? 'Produit'}`}
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
        // Base - hauteur AUTO
        'bg-white rounded-lg border border-gray-200 p-3',
        // Hover subtil
        'hover:shadow-sm hover:border-gray-300 transition-all',
        // Clickable
        isClickable && 'cursor-pointer',
        // Focus accessibility
        isClickable &&
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
        className
      )}
    >
      <div className="flex items-center gap-3">
        <MovementThumbnail
          imageUrl={movement.products?.image_url}
          name={movement.products?.name ?? 'Produit'}
        />

        {/* Contenu principal */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            {/* Nom produit */}
            <p className="text-sm font-medium text-gray-900 truncate">
              {movement.products?.name ?? 'Produit'}
            </p>

            {/* Quantité avec couleur */}
            <span
              className={cn(
                'text-sm font-semibold flex-shrink-0',
                config.textColor
              )}
            >
              {config.sign}
              {Math.abs(movement.quantity_change)}
            </span>
          </div>

          {/* Ligne infos secondaires */}
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
            <span>{config.label}</span>
            <span>•</span>
            <span>{formatMovementDate(movement.performed_at)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Type export pour usage externe
 */
StockMovementCard.displayName = 'StockMovementCard';
