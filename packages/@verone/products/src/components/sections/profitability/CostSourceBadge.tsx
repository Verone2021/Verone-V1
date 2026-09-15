'use client';

import { Badge } from '@verone/ui';

import type { CostSourceDisplay } from '../../../utils/product-sales-margin';

/** Labels lisibles par source de coût */
const SOURCE_LABELS: Record<CostSourceDisplay, string> = {
  validation: 'Figé à la vente',
  purchase_history: 'Achats antérieurs',
  current_cost_net_avg: 'Coût actuel',
  current_cost_price: 'Prix d’achat seul',
  missing: 'Manquant',
  current_not_frozen: 'Non figé',
};

const SOURCE_VARIANTS: Record<
  CostSourceDisplay,
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  validation: 'default',
  purchase_history: 'secondary',
  current_cost_net_avg: 'secondary',
  current_cost_price: 'outline',
  missing: 'destructive',
  current_not_frozen: 'outline',
};

interface Props {
  source: CostSourceDisplay;
}

export function CostSourceBadge({ source }: Props): React.JSX.Element {
  return (
    <Badge
      variant={SOURCE_VARIANTS[source]}
      className="text-[10px] px-1 py-0 font-normal whitespace-nowrap"
    >
      {SOURCE_LABELS[source]}
    </Badge>
  );
}
