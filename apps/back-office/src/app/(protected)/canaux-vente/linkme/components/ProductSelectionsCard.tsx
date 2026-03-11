'use client';

import { useState } from 'react';

import Link from 'next/link';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
} from '@verone/ui';
import { formatPrice } from '@verone/utils';
import {
  Layers,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

import type { ProductSelectionPresence } from '../hooks/use-linkme-catalog';

interface ProductSelectionsCardProps {
  selections: ProductSelectionPresence[];
  catalogPriceHt: number | null;
  isLoading: boolean;
  onPropagate: () => Promise<void>;
  isPropagating: boolean;
  onSyncItem?: (itemId: string) => Promise<void>;
}

export function ProductSelectionsCard({
  selections,
  catalogPriceHt,
  isLoading,
  onPropagate,
  isPropagating,
  onSyncItem,
}: ProductSelectionsCardProps): React.JSX.Element {
  const hasMismatch = selections.some(
    s => catalogPriceHt != null && s.base_price_ht !== catalogPriceHt
  );
  const mismatchCount = selections.filter(
    s => catalogPriceHt != null && s.base_price_ht !== catalogPriceHt
  ).length;

  const [syncingItemIds, setSyncingItemIds] = useState<Set<string>>(new Set());

  const handlePropagate = async (): Promise<void> => {
    try {
      await onPropagate();
      toast.success('Prix propagé vers toutes les sélections');
    } catch {
      toast.error('Erreur lors de la propagation du prix');
    }
  };

  const handleSyncItem = async (
    itemId: string,
    selectionName: string
  ): Promise<void> => {
    if (!onSyncItem) return;
    setSyncingItemIds(prev => new Set(prev).add(itemId));
    try {
      await onSyncItem(itemId);
      toast.success(`Prix synchronisé pour ${selectionName}`);
    } catch {
      toast.error(`Erreur de synchronisation pour ${selectionName}`);
    } finally {
      setSyncingItemIds(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Layers className="h-4 w-4" />
            Présence dans les sélections
            {selections.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {selections.length}
              </Badge>
            )}
          </CardTitle>
          {hasMismatch && (
            <Button
              size="sm"
              variant="outline"
              onClick={(): void => void handlePropagate()}
              disabled={isPropagating}
              className="text-orange-600 border-orange-300 hover:bg-orange-50"
            >
              {isPropagating ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-1" />
              )}
              Synchroniser ({mismatchCount})
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            Chargement...
          </div>
        ) : selections.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">
            Ce produit n&apos;est dans aucune sélection.
          </p>
        ) : (
          <div className="space-y-2">
            {/* Header */}
            <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 text-xs font-medium text-muted-foreground px-2 pb-1 border-b">
              <span>Sélection</span>
              <span className="text-right w-24">Prix sélection</span>
              <span className="text-right w-24">Prix catalogue</span>
              <span className="text-center w-20">Statut</span>
              <span className="w-8" />
            </div>
            {/* Rows */}
            {selections.map(sel => {
              const isMismatch =
                catalogPriceHt != null && sel.base_price_ht !== catalogPriceHt;
              return (
                <div
                  key={sel.selection_id}
                  className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 items-center px-2 py-1.5 rounded hover:bg-muted/50"
                >
                  <Link
                    href={`/canaux-vente/linkme/selections/${sel.selection_id}`}
                    className="text-sm font-medium text-primary hover:underline truncate"
                  >
                    {sel.selection_name}
                  </Link>
                  <span className="text-sm text-right w-24 tabular-nums">
                    {formatPrice(sel.base_price_ht)}
                  </span>
                  <span className="text-sm text-right w-24 tabular-nums">
                    {catalogPriceHt != null ? formatPrice(catalogPriceHt) : '—'}
                  </span>
                  <div className="flex justify-center w-20">
                    {isMismatch ? (
                      <Badge
                        variant="outline"
                        className="text-orange-600 border-orange-300 bg-orange-50 text-xs"
                      >
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Écart
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-green-600 border-green-300 bg-green-50 text-xs"
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />À jour
                      </Badge>
                    )}
                  </div>
                  <div className="w-8 flex justify-center">
                    {isMismatch && onSyncItem && (
                      <button
                        type="button"
                        onClick={(): void => {
                          void handleSyncItem(sel.item_id, sel.selection_name);
                        }}
                        disabled={syncingItemIds.has(sel.item_id)}
                        className="p-1 rounded hover:bg-orange-100 text-orange-500 hover:text-orange-600 transition-colors"
                        title={`Synchroniser ${sel.selection_name}: ${formatPrice(sel.base_price_ht)} → ${formatPrice(catalogPriceHt ?? 0)}`}
                      >
                        {syncingItemIds.has(sel.item_id) ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
