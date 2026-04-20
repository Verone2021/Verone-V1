'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import { formatPrice } from '@verone/utils';
import { Package, TrendingDown, TrendingUp } from 'lucide-react';

interface PurchaseHistoryRow {
  id: string;
  purchased_at: string;
  unit_price_ht: number;
  unit_cost_net: number | null;
  quantity: number;
  purchase_order: {
    id: string;
    reference: string | null;
    status: string | null;
    supplier: { name: string | null } | null;
  } | null;
}

interface PurchasePriceHistoryTimelineProps {
  productId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PurchasePriceHistoryTimeline({
  productId,
  open,
  onOpenChange,
}: PurchasePriceHistoryTimelineProps) {
  const supabase = createClient();

  const { data, isLoading, error } = useQuery({
    enabled: open && !!productId,
    queryKey: ['product-purchase-history', productId],
    queryFn: async (): Promise<PurchaseHistoryRow[]> => {
      const { data: rows, error: queryError } = await supabase
        .from('product_purchase_history')
        .select(
          `id, purchased_at, unit_price_ht, unit_cost_net, quantity,
           purchase_order:purchase_orders!product_purchase_history_purchase_order_id_fkey(
             id, reference, status,
             supplier:organisations!purchase_orders_supplier_id_fkey(name)
           )`
        )
        .eq('product_id', productId)
        .order('purchased_at', { ascending: false })
        .limit(50);

      if (queryError) throw new Error(queryError.message);
      return (rows ?? []) as unknown as PurchaseHistoryRow[];
    },
  });

  const rows = data ?? [];
  const prevPrices = rows.map(r => r.unit_price_ht);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Historique prix d'achat
          </SheetTitle>
          <SheetDescription>
            Derniers achats fournisseurs (50 max). Prix net = unitaire + frais
            livraison/assurance répartis.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          {isLoading && (
            <div className="text-sm text-neutral-500">Chargement…</div>
          )}

          {error && (
            <div className="text-sm text-red-600">Erreur: {error.message}</div>
          )}

          {!isLoading && !error && rows.length === 0 && (
            <div className="text-sm text-neutral-500 italic">
              Aucune commande fournisseur réceptionnée pour ce produit.
            </div>
          )}

          {rows.length > 0 && (
            <ul className="space-y-3">
              {rows.map((row, idx) => {
                const previous = prevPrices[idx + 1];
                const delta =
                  previous != null ? row.unit_price_ht - previous : null;
                const deltaRel =
                  previous != null && previous > 0
                    ? (row.unit_price_ht - previous) / previous
                    : null;

                return (
                  <li
                    key={row.id}
                    className="border border-neutral-200 rounded-lg p-3 bg-white"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-neutral-900 truncate">
                          {row.purchase_order?.reference ?? 'PO sans ref.'}
                        </div>
                        <div className="text-xs text-neutral-500 truncate">
                          {row.purchase_order?.supplier?.name ??
                            'Fournisseur inconnu'}
                        </div>
                        <div className="text-xs text-neutral-400 mt-1">
                          {new Date(row.purchased_at).toLocaleDateString(
                            'fr-FR',
                            {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            }
                          )}
                          {' · '}
                          {row.quantity} u.
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-base font-semibold text-neutral-900">
                          {formatPrice(row.unit_price_ht)}
                        </div>
                        {row.unit_cost_net != null && (
                          <div className="text-xs text-neutral-500">
                            net {formatPrice(row.unit_cost_net)}
                          </div>
                        )}
                        {delta != null && deltaRel != null && (
                          <div
                            className={`text-xs font-medium mt-1 flex items-center justify-end gap-1 ${
                              delta > 0
                                ? 'text-red-600'
                                : delta < 0
                                  ? 'text-green-600'
                                  : 'text-neutral-500'
                            }`}
                          >
                            {delta > 0 ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : delta < 0 ? (
                              <TrendingDown className="h-3 w-3" />
                            ) : null}
                            {delta >= 0 ? '+' : ''}
                            {(deltaRel * 100).toFixed(1)}%
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
