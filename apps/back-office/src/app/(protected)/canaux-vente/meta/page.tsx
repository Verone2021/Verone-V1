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
  RefreshCw,
} from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

import {
  useMetaCommerceProducts,
  useMetaCommerceStats,
  useToggleMetaVisibility,
  useRemoveFromMeta,
} from '@verone/channels';
import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Card, CardContent } from '@verone/ui';
import { Input } from '@verone/ui';
import { cn } from '@verone/utils';
import { useQueryClient } from '@tanstack/react-query';

import { AddProductsTab } from './add-products-tab';

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

// ---- Main Page ----

export default function MetaCommercePage() {
  const [activeTab, setActiveTab] = useState<'synced' | 'add'>('synced');
  const [isSyncing, setIsSyncing] = useState(false);
  const queryClient = useQueryClient();

  async function handleSyncStatuses() {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/meta-commerce/sync-statuses', {
        method: 'POST',
      });
      const data = (await res.json()) as {
        error?: string;
        updated?: number;
        meta_products_found?: number;
      };
      if (!res.ok) {
        toast.error(data.error ?? 'Erreur lors de la synchronisation');
        return;
      }
      await queryClient.invalidateQueries({
        queryKey: ['meta-commerce-products'],
      });
      await queryClient.invalidateQueries({
        queryKey: ['meta-commerce-stats'],
      });
      toast.success(
        `Statuts mis a jour : ${data.updated ?? 0} produits sur ${data.meta_products_found ?? 0} trouves`
      );
    } catch (err) {
      console.error('[MetaCommerce] Sync statuses failed:', err);
      toast.error('Erreur de connexion');
    } finally {
      setIsSyncing(false);
    }
  }

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
        <div className="flex items-center gap-2">
          <ButtonV2
            variant="outline"
            size="sm"
            onClick={() => {
              void handleSyncStatuses().catch((err: unknown) => {
                console.error('[MetaCommerce] Sync error:', err);
              });
            }}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Actualiser les statuts
          </ButtonV2>
          <Badge variant="outline" className="text-xs">
            Catalogue ID: 1223749196006844
          </Badge>
        </div>
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
