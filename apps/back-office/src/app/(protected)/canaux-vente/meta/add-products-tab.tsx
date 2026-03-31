'use client';

import { useState, useMemo } from 'react';

import { Search, CheckCircle, Package, Loader2, Plus } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

import {
  useMetaCommerceProducts,
  useAddProductsToMeta,
} from '@verone/channels';
import { ButtonV2 } from '@verone/ui';
import { Card, CardContent } from '@verone/ui';
import { Checkbox } from '@verone/ui';
import { Input } from '@verone/ui';
import { cn } from '@verone/utils';
import { useQuery } from '@tanstack/react-query';

import { callRpc } from '@verone/channels/hooks/meta/rpc-helper';

interface RpcProduct {
  product_id: string;
  sku: string;
  name: string;
  primary_image_url: string | null;
  cost_price: number;
  stock_status: string;
  status: string;
  price_ttc: number | null;
}

interface EligibleProduct {
  id: string;
  sku: string;
  name: string;
  primary_image_url: string | null;
  cost_price: number;
  stock_status: string;
  product_status: string;
  price_ttc: number | null;
}

export function AddProductsTab() {
  const { data: metaProducts } = useMetaCommerceProducts();
  const addProducts = useAddProductsToMeta();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  const { data: allProducts, isLoading } = useQuery<EligibleProduct[]>({
    queryKey: ['meta-eligible-products'],
    queryFn: async () => {
      const { data, error } = await callRpc<RpcProduct[]>(
        'get_site_internet_products'
      );
      if (error) throw new Error(error.message);
      const rpcProducts = data ?? [];
      return rpcProducts.map(p => ({
        id: p.product_id,
        sku: p.sku,
        name: p.name,
        primary_image_url: p.primary_image_url,
        cost_price: p.cost_price,
        stock_status: p.stock_status,
        product_status: p.status,
        price_ttc: p.price_ttc,
      }));
    },
    staleTime: 60000,
  });

  const syncedIds = useMemo(
    () => new Set((metaProducts ?? []).map(p => p.product_id)),
    [metaProducts]
  );

  const eligible = useMemo(() => {
    if (!allProducts) return [];
    return allProducts.filter(p => !syncedIds.has(p.id));
  }, [allProducts, syncedIds]);

  const filtered = useMemo(() => {
    if (!search) return eligible;
    const q = search.toLowerCase();
    return eligible.filter(
      p => p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q)
    );
  }, [eligible, search]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(p => p.id)));
    }
  };

  const handleAdd = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    try {
      const result = await addProducts.mutateAsync(ids);
      toast.success(`${result.success_count} produit(s) ajoute(s) a Meta`);
      setSelectedIds(new Set());
    } catch {
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

  if (eligible.length === 0) {
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
        <ButtonV2 variant="outline" size="sm" onClick={selectAll}>
          {selectedIds.size === filtered.length
            ? 'Tout desélectionner'
            : `Tout selectionner (${filtered.length})`}
        </ButtonV2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(p => {
          const isSelected = selectedIds.has(p.id);
          return (
            <Card
              key={p.id}
              className={cn(
                'cursor-pointer transition-all hover:shadow-sm',
                isSelected && 'ring-2 ring-primary'
              )}
              onClick={() => toggleSelect(p.id)}
            >
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <Checkbox checked={isSelected} className="flex-shrink-0" />
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
                    <p className="text-xs text-muted-foreground">{p.sku}</p>
                    {p.price_ttc != null && (
                      <p className="text-xs font-semibold mt-0.5">
                        {Number(p.price_ttc).toFixed(2)} € TTC
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
