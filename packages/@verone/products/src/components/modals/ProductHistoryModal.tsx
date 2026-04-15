'use client';

import { useState, useEffect, useMemo } from 'react';

import { History, RefreshCw, Badge as BadgeIcon } from 'lucide-react';

import { Badge } from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@verone/ui';
import { useStockMovements } from '@verone/stock/hooks';

import {
  filterMovements,
  computeStats,
  type HistoryFilters,
  type StockMovement,
} from './product-history/types';
import { ProductHistoryStats } from './product-history/ProductHistoryStats';
import { ProductHistoryFilters } from './product-history/ProductHistoryFilters';
import { ProductHistoryTimeline } from './product-history/ProductHistoryTimeline';

interface ProductHistoryModalProduct {
  id: string;
  name?: string;
  sku?: string;
  stock_quantity?: number;
}

interface ProductHistoryModalProps {
  product: ProductHistoryModalProduct | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProductHistoryModal({
  product,
  isOpen,
  onClose,
}: ProductHistoryModalProps) {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<HistoryFilters>({
    dateRange: 'all',
    movementTypes: [],
  });
  const { getProductHistory, getReasonDescription } = useStockMovements();

  useEffect(() => {
    if (isOpen && product) {
      void loadHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, product]);

  const loadHistory = async () => {
    if (!product) return;
    setLoading(true);
    try {
      const history = await getProductHistory(product.id);
      setMovements((history as StockMovement[]) ?? []);
    } catch (_error) {
      // Erreur gérée dans le hook
    } finally {
      setLoading(false);
    }
  };

  const filteredMovements = useMemo(
    () => filterMovements(movements, filters),
    [movements, filters]
  );

  const stats = useMemo(
    () => computeStats(filteredMovements),
    [filteredMovements]
  );

  const hasActiveFilters =
    filters.dateRange !== 'all' || filters.movementTypes.length > 0;

  const toggleMovementType = (type: string) => {
    setFilters(prev => ({
      ...prev,
      movementTypes: prev.movementTypes.includes(type)
        ? prev.movementTypes.filter(t => t !== type)
        : [...prev.movementTypes, type],
    }));
  };

  const resetFilters = () => {
    setFilters({ dateRange: 'all', movementTypes: [] });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[85vh]">
        <DialogHeader className="border-b border-gray-200 pb-3">
          <DialogTitle className="text-xl font-bold text-black flex items-center gap-3">
            <History className="h-5 w-5" />
            Historique complet - {product?.name}
            <Badge variant="outline" className="ml-2 text-xs font-mono">
              {product?.sku}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Visualisez tous les mouvements de stock pour ce produit
          </DialogDescription>
        </DialogHeader>

        {movements.length > 0 && <ProductHistoryStats stats={stats} />}

        {movements.length > 0 && (
          <ProductHistoryFilters
            filters={filters}
            hasActiveFilters={hasActiveFilters}
            onDateRangeChange={range =>
              setFilters(prev => ({ ...prev, dateRange: range }))
            }
            onToggleMovementType={toggleMovementType}
            onReset={resetFilters}
          />
        )}

        <div
          className="overflow-y-auto pr-2"
          style={{ maxHeight: 'calc(85vh - 350px)' }}
        >
          {loading ? (
            <div className="flex justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <ProductHistoryTimeline
              movements={movements}
              filteredMovements={filteredMovements}
              onResetFilters={resetFilters}
              getReasonDescription={getReasonDescription}
            />
          )}
        </div>

        {movements.length > 0 && (
          <div className="border-t border-gray-200 pt-3 mt-2">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <div className="flex items-center gap-4">
                <span className="font-medium text-black">
                  {hasActiveFilters && `${stats.total} / `}
                  {movements.length} mouvement{movements.length > 1 ? 's' : ''}
                  {hasActiveFilters && ' total'}
                </span>
                <span>
                  Stock actuel:{' '}
                  <strong className="text-black">
                    {product?.stock_quantity ?? 0}
                  </strong>
                </span>
                {hasActiveFilters && (
                  <Badge variant="secondary" className="text-xs">
                    <BadgeIcon className="h-3 w-3 mr-1" />
                    Filtres actifs
                  </Badge>
                )}
              </div>
              <span className="text-gray-500">
                Dernier mouvement:{' '}
                {movements[0]
                  ? new Date(movements[0].performed_at).toLocaleDateString(
                      'fr-FR'
                    )
                  : 'Aucun'}
              </span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
