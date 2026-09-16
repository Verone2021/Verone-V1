'use client';

import { ButtonV2 } from '@verone/ui/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@verone/ui/components/ui/card';
import { cn } from '@verone/utils';
import { ExternalLink, FlaskConical, Plus } from 'lucide-react';

import type { SampleDraftOrder } from '../../../hooks/sourcing/use-sample-draft-order';

export interface SampleOrderCardProps {
  order: SampleDraftOrder;
  /** Produit affiché : sa ligne est mise en avant dans la liste. */
  currentProductId: string;
  /** Nombre de produits du même fournisseur encore ajoutables. */
  candidateCount: number;
  busy?: boolean;
  onAddProducts: () => void;
  onOpenOrder: (orderId: string) => void;
  className?: string;
}

function euros(value: number): string {
  return value.toLocaleString('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  });
}

/**
 * Contenu de la commande d'échantillons en cours — [BO-SOURCING-SAMPLE-002]
 *
 * `request_sample_order` regroupe déjà plusieurs produits d'un même fournisseur
 * dans une seule commande brouillon, mais rien ne le montrait : on croyait
 * qu'un échantillon valait une commande. Tant que la commande est en brouillon,
 * on peut continuer d'y ajouter des produits.
 */
export function SampleOrderCard({
  order,
  currentProductId,
  candidateCount,
  busy = false,
  onAddProducts,
  onOpenOrder,
  className,
}: SampleOrderCardProps) {
  const totalHt = order.lines.reduce(
    (sum, line) => sum + line.unitPriceHt * line.quantity,
    0
  );
  const fees =
    order.shippingCostHt + order.customsCostHt + order.insuranceCostHt;

  return (
    <Card className={cn('border-black', className)}>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <FlaskConical className="h-4 w-4 text-gray-500" />
            Commande d’échantillons {order.poNumber}
          </CardTitle>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
            Brouillon · {order.lines.length} produit
            {order.lines.length > 1 ? 's' : ''}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <ul className="divide-y divide-gray-100">
          {order.lines.map(line => {
            const isCurrent = line.productId === currentProductId;
            return (
              <li
                key={line.id}
                className={cn(
                  'flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 py-2',
                  isCurrent && 'font-medium'
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="truncate">{line.name}</span>
                  <span className="ml-2 text-xs text-gray-500">{line.sku}</span>
                  {isCurrent && (
                    <span className="ml-2 text-xs text-gray-500">
                      (ce produit)
                    </span>
                  )}
                </span>
                <span className="text-sm text-gray-600">
                  {line.quantity} × {euros(line.unitPriceHt)}
                  {line.allocatedFeesHt > 0 && (
                    <span className="ml-2 text-xs text-gray-500">
                      + {euros(line.allocatedFeesHt)} de frais
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>

        <div className="flex flex-wrap items-baseline justify-between gap-2 border-t border-gray-100 pt-2 text-sm">
          <span className="text-gray-600">Total des articles</span>
          <span className="font-medium text-black">{euros(totalHt)}</span>
        </div>
        {fees > 0 && (
          <p className="text-xs text-gray-500">
            {euros(fees)} de frais (transport, douane, assurance) répartis sur
            les lignes au prorata de leur montant.
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <ButtonV2
            variant="outline"
            size="sm"
            icon={Plus}
            onClick={onAddProducts}
            disabled={busy || candidateCount === 0}
            className="h-11 md:h-9"
          >
            Ajouter d’autres produits
            {candidateCount > 0 ? ` (${candidateCount})` : ''}
          </ButtonV2>
          <ButtonV2
            variant="ghost"
            size="sm"
            icon={ExternalLink}
            onClick={() => onOpenOrder(order.id)}
            className="h-11 md:h-9"
          >
            Ouvrir la commande
          </ButtonV2>
        </div>
        {candidateCount === 0 && (
          <p className="text-xs text-gray-500">
            Aucun autre produit de ce fournisseur n’est prêt à être commandé en
            échantillon.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
