'use client';

import { Badge } from '@verone/ui';
import { ShoppingBag, Briefcase } from 'lucide-react';

interface DocumentSourceBadgeProps {
  /**
   * True si le document est issu d'une commande (sales_order_id present).
   * False si document standalone (service / kind='service').
   */
  hasOrderLink: boolean;
  className?: string;
}

/**
 * Badge visuel indiquant la source du document financier :
 * - "Commande" (bleu, ShoppingBag) si rattache a une sales_order
 * - "Service" (ambre, Briefcase) si document standalone
 *
 * @since 2026-04-18 (BO-FIN-010)
 */
export function DocumentSourceBadge({
  hasOrderLink,
  className,
}: DocumentSourceBadgeProps) {
  if (hasOrderLink) {
    return (
      <Badge
        variant="outline"
        className={`bg-blue-50 text-blue-700 border-blue-200 ${className ?? ''}`}
      >
        <ShoppingBag className="h-3 w-3 mr-1" />
        Commande
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className={`bg-amber-50 text-amber-700 border-amber-200 ${className ?? ''}`}
    >
      <Briefcase className="h-3 w-3 mr-1" />
      Service
    </Badge>
  );
}
