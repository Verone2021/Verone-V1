'use client';

import { useState, useMemo } from 'react';

import {
  Search,
  CheckCircle,
  Package,
  Loader2,
  Plus,
  ImageOff,
  AlertTriangle,
} from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

import {
  useAddProductsToMeta,
  useMetaEligibleProducts,
} from '@verone/channels';
import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Card, CardContent } from '@verone/ui';
import { Checkbox } from '@verone/ui';
import { Input } from '@verone/ui';
import { cn } from '@verone/utils';

export function AddProductsTab() {
  const { data: eligible, isLoading } = useMetaEligibleProducts();
  const addProducts = useAddProductsToMeta();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!eligible) return [];
    if (!search) return eligible;
    const q = search.toLowerCase();
    return eligible.filter(
      p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    );
  }, [eligible, search]);

  const withImages = useMemo(
    () => filtered.filter(p => p.image_count > 0),
    [filtered]
  );

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllWithImages = () => {
    if (selectedIds.size === withImages.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(withImages.map(p => p.id)));
    }
  };

  const handleAdd = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    try {
      const result = await addProducts.mutateAsync(ids);
      const errorCount = (result as { error_count?: number }).error_count ?? 0;
      if (errorCount > 0) {
        toast.warning(
          `${result.success_count} ajoute(s), ${errorCount} en erreur`
        );
      } else {
        toast.success(`${result.success_count} produit(s) ajoute(s) a Meta`);
      }
      setSelectedIds(new Set());
    } catch (err) {
      console.error('[AddProductsTab] Add failed:', err);
      toast.error("Erreur lors de l'ajout");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!eligible || eligible.length === 0) {
    return (
      <div className="text-center py-16">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <p className="text-muted-foreground">
          Tous les produits du site internet sont deja sur Meta !
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un produit..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Badge variant="outline" className="whitespace-nowrap">
          {eligible.length} eligible(s)
        </Badge>
        <ButtonV2 variant="outline" size="sm" onClick={selectAllWithImages}>
          {selectedIds.size === withImages.length && withImages.length > 0
            ? 'Tout deselectionner'
            : `Tout selectionner (${withImages.length})`}
        </ButtonV2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(p => {
          const isSelected = selectedIds.has(p.id);
          const noImages = p.image_count === 0;
          const outOfStock = p.stock_status === 'out_of_stock';
          return (
            <Card
              key={p.id}
              className={cn(
                'cursor-pointer transition-all hover:shadow-sm',
                isSelected && 'ring-2 ring-primary',
                noImages && 'opacity-60'
              )}
              onClick={() => {
                if (!noImages) toggleSelect(p.id);
              }}
            >
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={isSelected}
                    disabled={noImages}
                    className="flex-shrink-0"
                  />
                  <div className="h-12 w-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
                    {p.primary_image_url ? (
                      <Image
                        src={p.primary_image_url}
                        alt={p.name}
                        width={48}
                        height={48}
                        className="object-cover h-full w-full"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <Package className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <p className="text-xs text-muted-foreground">{p.sku}</p>
                      {noImages && (
                        <Badge
                          variant="destructive"
                          className="text-[10px] px-1 py-0"
                        >
                          <ImageOff className="h-2.5 w-2.5 mr-0.5" />
                          Sans image
                        </Badge>
                      )}
                      {outOfStock && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1 py-0"
                        >
                          <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                          Rupture
                        </Badge>
                      )}
                    </div>
                    {p.site_price_ht != null && (
                      <p className="text-xs font-semibold mt-0.5">
                        {(Number(p.site_price_ht) * 1.2).toFixed(2)} EUR TTC
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedIds.size > 0 && (
        <div className="sticky bottom-0 bg-background border-t p-4 flex items-center justify-between">
          <p className="text-sm font-medium">
            {selectedIds.size} produit(s) selectionne(s)
          </p>
          <ButtonV2
            onClick={() => void handleAdd()}
            disabled={addProducts.isPending}
          >
            {addProducts.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Ajouter a Meta
          </ButtonV2>
        </div>
      )}
    </div>
  );
}
