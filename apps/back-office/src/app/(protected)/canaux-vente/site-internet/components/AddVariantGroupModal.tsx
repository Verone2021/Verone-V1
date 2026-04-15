'use client';

import { useCallback, useState } from 'react';

import { useQuery } from '@tanstack/react-query';

import {
  Badge,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import { Layers, Package } from 'lucide-react';

const supabase = createClient();

interface VariantGroup {
  id: string;
  name: string;
  variant_type: string | null;
  has_common_cost_price: boolean;
  common_cost_price: number | null;
  productCount: number;
  alreadyAddedCount: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (variantGroupId: string, customPriceHt: number) => Promise<void>;
  existingProductIds: string[];
}

function useVariantGroups(existingProductIds: string[]) {
  return useQuery({
    queryKey: ['variant-groups-for-site', existingProductIds.length],
    queryFn: async (): Promise<VariantGroup[]> => {
      const { data: groups } = await supabase
        .from('variant_groups')
        .select(
          'id, name, variant_type, has_common_cost_price, common_cost_price'
        )
        .order('name');

      if (!groups) return [];

      // Get product counts per group
      const { data: products } = await supabase
        .from('products')
        .select('id, variant_group_id')
        .eq('product_status', 'active')
        .not('variant_group_id', 'is', null);

      const existingSet = new Set(existingProductIds);

      return (
        groups as Array<{
          id: string;
          name: string;
          variant_type: string | null;
          has_common_cost_price: boolean;
          common_cost_price: number | null;
        }>
      )
        .map(g => {
          const groupProducts = (products ?? []).filter(
            p => (p as { variant_group_id: string }).variant_group_id === g.id
          );
          const alreadyAdded = groupProducts.filter(p => existingSet.has(p.id));
          return {
            ...g,
            productCount: groupProducts.length,
            alreadyAddedCount: alreadyAdded.length,
          };
        })
        .filter(g => g.productCount > 0);
    },
    staleTime: 60_000,
  });
}

export function AddVariantGroupModal({
  open,
  onClose,
  onConfirm,
  existingProductIds,
}: Props) {
  const { data: groups = [], isLoading } = useVariantGroups(existingProductIds);
  const [selectedGroup, setSelectedGroup] = useState<VariantGroup | null>(null);
  const [priceHt, setPriceHt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const suggestedPrice = selectedGroup?.common_cost_price
    ? Math.round(selectedGroup.common_cost_price * 2.5 * 100) / 100
    : 0;

  const handleSelect = useCallback((group: VariantGroup) => {
    setSelectedGroup(group);
    const suggested = group.common_cost_price
      ? Math.round(group.common_cost_price * 2.5 * 100) / 100
      : 0;
    setPriceHt(suggested > 0 ? String(suggested) : '');
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!selectedGroup || !priceHt) return;
    setIsSubmitting(true);
    try {
      await onConfirm(selectedGroup.id, parseFloat(priceHt));
      setSelectedGroup(null);
      setPriceHt('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedGroup, priceHt, onConfirm, onClose]);

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Ajouter un groupe de variantes
          </DialogTitle>
        </DialogHeader>

        {!selectedGroup ? (
          <div className="space-y-2">
            {isLoading ? (
              <p className="text-center py-8 text-gray-500">Chargement...</p>
            ) : groups.length === 0 ? (
              <p className="text-center py-8 text-gray-500">
                Aucun groupe de variantes disponible.
              </p>
            ) : (
              groups.map(group => {
                const allAdded = group.alreadyAddedCount === group.productCount;
                return (
                  <button
                    key={group.id}
                    disabled={allAdded}
                    onClick={() => handleSelect(group)}
                    className={`flex items-center justify-between w-full px-4 py-3 rounded-lg border text-left transition ${
                      allAdded
                        ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                        : 'hover:bg-gray-50 hover:border-blue-300'
                    }`}
                  >
                    <div>
                      <p className="font-medium text-sm">{group.name}</p>
                      <p className="text-xs text-gray-500">
                        {group.variant_type ?? 'Variantes'} —{' '}
                        {group.productCount} produits
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {group.alreadyAddedCount > 0 && (
                        <Badge
                          variant="outline"
                          className={
                            allAdded
                              ? 'bg-green-50 text-green-700'
                              : 'bg-amber-50 text-amber-700'
                          }
                        >
                          {allAdded
                            ? 'Deja ajoute'
                            : `${group.alreadyAddedCount}/${group.productCount}`}
                        </Badge>
                      )}
                      <Package className="h-4 w-4 text-gray-400" />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-lg px-4 py-3">
              <p className="text-sm font-medium text-blue-900">
                {selectedGroup.name}
              </p>
              <p className="text-xs text-blue-700">
                {selectedGroup.productCount} variantes seront ajoutees avec le
                meme prix
              </p>
            </div>

            <div>
              <Label>Prix de vente HT (applique a toutes les variantes)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={priceHt}
                onChange={e => setPriceHt(e.target.value)}
                placeholder={`Suggere : ${suggestedPrice} EUR`}
                className="mt-1"
              />
              {suggestedPrice > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Prix suggere : {suggestedPrice} EUR HT (cout x 2.5) — TTC :{' '}
                  {(suggestedPrice * 1.2).toFixed(2)} EUR
                </p>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          {selectedGroup ? (
            <>
              <ButtonV2
                variant="outline"
                onClick={() => setSelectedGroup(null)}
              >
                Retour
              </ButtonV2>
              <ButtonV2
                onClick={() => {
                  void handleConfirm().catch((error: unknown) => {
                    console.error('[AddVariantGroup] Confirm failed:', error);
                  });
                }}
                disabled={isSubmitting || !priceHt || parseFloat(priceHt) <= 0}
              >
                {isSubmitting
                  ? 'Ajout...'
                  : `Ajouter ${selectedGroup.productCount} variantes`}
              </ButtonV2>
            </>
          ) : (
            <ButtonV2 variant="outline" onClick={onClose}>
              Fermer
            </ButtonV2>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
