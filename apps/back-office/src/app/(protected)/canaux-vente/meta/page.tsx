'use client';

import { useState, useMemo } from 'react';

import {
  Search,
  Facebook,
  Instagram,
  Eye,
  EyeOff,
  Trash2,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Package,
  Loader2,
  Plus,
} from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

import {
  useMetaCommerceProducts,
  useMetaCommerceStats,
  useAddProductsToMeta,
  useToggleMetaVisibility,
  useRemoveFromMeta,
} from '@verone/channels';
import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Card, CardContent } from '@verone/ui';
import { Checkbox } from '@verone/ui';
import { Input } from '@verone/ui';
import { cn } from '@verone/utils';
import { useQuery } from '@tanstack/react-query';

import { callRpc } from '@verone/channels/hooks/meta/rpc-helper';

// ---- Types ----

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

// ---- Stats Cards ----

function StatsCards() {
  const { data: stats } = useMetaCommerceStats();

  if (!stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardContent className="pt-4 pb-3">
              <p className="text-sm text-muted-foreground">—</p>
              <p className="text-2xl font-bold">0</p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    { label: 'Produits Meta', value: stats.total_products, icon: Package },
    { label: 'Actifs', value: stats.active_products, icon: CheckCircle },
    { label: 'En attente', value: stats.pending_products, icon: Clock },
    { label: 'Rejetes', value: stats.rejected_products, icon: XCircle },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map(c => (
        <Card key={c.label}>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <c.icon className="h-4 w-4" />
              {c.label}
            </div>
            <p className="text-2xl font-bold">{c.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ---- Status Badge ----

function MetaStatusBadge({ status }: { status: string | null }) {
  switch (status) {
    case 'active':
      return (
        <Badge
          variant="default"
          className="bg-green-100 text-green-800 hover:bg-green-100"
        >
          <CheckCircle className="h-3 w-3 mr-1" /> Actif
        </Badge>
      );
    case 'pending':
      return (
        <Badge variant="secondary">
          <Clock className="h-3 w-3 mr-1" /> En attente
        </Badge>
      );
    case 'rejected':
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" /> Rejete
        </Badge>
      );
    default:
      return <Badge variant="outline">Inconnu</Badge>;
  }
}

// ---- Synced Products Tab ----

function SyncedProductsTab() {
  const { data: products, isLoading } = useMetaCommerceProducts();
  const toggleVisibility = useToggleMetaVisibility();
  const removeFromMeta = useRemoveFromMeta();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!products) return [];
    if (!search) return products;
    const q = search.toLowerCase();
    return products.filter(
      p =>
        p.product_name.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q)
    );
  }, [products, search]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-16">
        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">
          Aucun produit synchronise avec Meta.
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Utilisez l&apos;onglet &quot;Ajouter des produits&quot; pour
          commencer.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un produit..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="space-y-2">
        {filtered.map(p => (
          <Card key={p.id} className="hover:shadow-sm transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                {/* Image */}
                <div className="h-14 w-14 rounded-md overflow-hidden bg-muted flex-shrink-0">
                  {p.primary_image_url ? (
                    <Image
                      src={p.primary_image_url}
                      alt={p.product_name}
                      width={56}
                      height={56}
                      className="object-cover h-full w-full"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <Package className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{p.product_name}</p>
                  <p className="text-sm text-muted-foreground">{p.sku}</p>
                </div>

                {/* Status */}
                <MetaStatusBadge status={p.meta_status} />

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <ButtonV2
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      void toggleVisibility
                        .mutateAsync({
                          productId: p.product_id,
                          visible: p.sync_status === 'deleted',
                        })
                        .then(() => {
                          toast.success(
                            p.sync_status === 'deleted'
                              ? 'Produit reactive sur Meta'
                              : 'Produit masque de Meta'
                          );
                        });
                    }}
                    title={
                      p.sync_status === 'deleted' ? 'Reactiver' : 'Masquer'
                    }
                  >
                    {p.sync_status === 'deleted' ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </ButtonV2>
                  <ButtonV2
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      void removeFromMeta.mutateAsync(p.product_id).then(() => {
                        toast.success('Produit retire de Meta');
                      });
                    }}
                    title="Retirer"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </ButtonV2>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ---- Add Products Tab ----

function AddProductsTab() {
  const { data: metaProducts } = useMetaCommerceProducts();
  const addProducts = useAddProductsToMeta();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  // Fetch eligible products (published on site internet)
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

  // Filter out already-synced products
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
      {/* Search + Select all */}
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

      {/* Product grid */}
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

      {/* Sticky footer */}
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

// ---- Main Page ----

export default function MetaCommercePage() {
  const [activeTab, setActiveTab] = useState<'synced' | 'add'>('synced');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Facebook className="h-6 w-6 text-blue-600" />
              <Instagram className="h-6 w-6 text-pink-500" />
            </div>
            Meta Commerce
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerez vos produits sur Facebook Shop, Instagram Shopping et WhatsApp
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          Catalogue ID: 1223749196006844
        </Badge>
      </div>

      {/* Stats */}
      <StatsCards />

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-blue-900">
            Synchronisation automatique via Feed XML
          </p>
          <p className="text-blue-700 mt-1">
            Les produits ajoutes ici apparaissent dans le feed XML
            (veronecollections.fr/api/feeds/products.xml). Meta recupere ce feed
            toutes les heures automatiquement.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-4">
          <button
            type="button"
            className={cn(
              'pb-2 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'synced'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
            onClick={() => setActiveTab('synced')}
          >
            Produits synchronises
          </button>
          <button
            type="button"
            className={cn(
              'pb-2 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'add'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
            onClick={() => setActiveTab('add')}
          >
            Ajouter des produits
          </button>
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'synced' ? <SyncedProductsTab /> : <AddProductsTab />}
    </div>
  );
}
