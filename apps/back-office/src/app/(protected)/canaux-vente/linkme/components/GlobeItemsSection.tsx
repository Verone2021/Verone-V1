'use client';

/**
 * GlobeItemsSection — Gestion des produits et organisations affiches sur le globe LinkMe
 *
 * - Liste des items actuels avec bouton retirer
 * - Modal UniversalProductSelectorV2 pour ajouter des produits (avec categories)
 * - Recherche pour ajouter des organisations (avec logo)
 *
 * @module GlobeItemsSection
 * @since 2026-03-27
 */

import { useState, useEffect } from 'react';

import Image from 'next/image';

import {
  UniversalProductSelectorV2,
  type SelectedProduct,
} from '@verone/products';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import {
  Globe,
  Package,
  Building2,
  X,
  Plus,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

import {
  useGlobeItems,
  useGlobeStats,
  useToggleGlobeItem,
  useBatchAddGlobeProducts,
} from '../hooks/use-linkme-page-config';

// ============================================================================
// HELPERS
// ============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';

/** Convertit un path storage ou URL complete en URL utilisable par next/image */
function toImageUrl(src: string): string {
  if (!src) return '';
  if (src.startsWith('http')) return src;
  // Path relatif = bucket organisation-logos
  return `${SUPABASE_URL}/storage/v1/object/public/organisation-logos/${src}`;
}

// ============================================================================
// HOOKS
// ============================================================================

type OrgCandidateType = 'enseigne' | 'fournisseur' | 'client' | 'prestataire';

interface OrgCandidate {
  id: string;
  name: string;
  logo_url: string;
  type: OrgCandidateType;
}

/** Charge enseignes + toutes organisations avec logo, classees par type */
function useGlobeOrgCandidates() {
  const [items, setItems] = useState<OrgCandidate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();

      // Enseignes avec logo
      const { data: enseignes } = await supabase
        .from('enseignes')
        .select('id, name, logo_url')
        .not('logo_url', 'is', null)
        .eq('is_active', true);

      // Organisations independantes avec logo (sans enseigne — celles avec enseigne sont representees par l'enseigne)
      const { data: orgs } = await supabase
        .from('organisations')
        .select('id, trade_name, legal_name, logo_url, type')
        .is('enseigne_id', null)
        .not('logo_url', 'is', null)
        .eq('show_on_linkme_globe', false)
        .limit(100);

      const result: OrgCandidate[] = [];

      for (const e of enseignes ?? []) {
        if (e.logo_url) {
          result.push({
            id: e.id,
            name: e.name,
            logo_url: toImageUrl(e.logo_url),
            type: 'enseigne',
          });
        }
      }

      for (const o of orgs ?? []) {
        if (o.logo_url) {
          const orgType = (o.type as string) ?? 'client';
          let candidateType: OrgCandidateType = 'client';
          if (orgType === 'supplier') candidateType = 'fournisseur';
          else if (orgType === 'partner') candidateType = 'prestataire';

          result.push({
            id: o.id,
            name: o.trade_name ?? o.legal_name,
            logo_url: toImageUrl(o.logo_url ?? ''),
            type: candidateType,
          });
        }
      }

      setItems(result);
      setLoading(false);
    };
    void load();
  }, []);

  return { items, loading };
}

// ============================================================================
// COMPONENT
// ============================================================================

export function GlobeItemsSection() {
  const { data: items, isLoading: itemsLoading } = useGlobeItems();
  const { data: stats } = useGlobeStats();
  const toggleItem = useToggleGlobeItem();
  const batchAdd = useBatchAddGlobeProducts();

  const [showProductSelector, setShowProductSelector] = useState(false);
  const [showOrgCandidates, setShowOrgCandidates] = useState(false);
  const [orgTypeFilter, setOrgTypeFilter] = useState<OrgCandidateType | 'all'>(
    'all'
  );
  const orgCandidates = useGlobeOrgCandidates();

  const productItems = (items ?? []).filter(i => i.item_type === 'product');
  const orgItems = (items ?? []).filter(
    i => i.item_type === 'organisation' || i.item_type === 'enseigne'
  );

  // IDs des produits deja sur le globe (exclus du selecteur)
  const excludeProductIds = productItems.map(p => p.id);

  const handleRemove = (
    itemType: 'product' | 'organisation' | 'enseigne',
    id: string
  ) => {
    void toggleItem
      .mutateAsync({ itemType, itemId: id, enabled: false })
      .catch(err => console.error('[GlobeItems] Remove failed:', err));
  };

  const handleAddProducts = (selected: SelectedProduct[]) => {
    // Filtrer pour n'ajouter que les nouveaux (pas ceux deja sur le globe)
    const existingIds = new Set(productItems.map(p => p.id));
    const newIds = selected.filter(p => !existingIds.has(p.id)).map(p => p.id);
    if (newIds.length === 0) {
      setShowProductSelector(false);
      return;
    }
    void batchAdd
      .mutateAsync(newIds)
      .then(() => setShowProductSelector(false))
      .catch(err => console.error('[GlobeItems] Batch add failed:', err));
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <Package className="h-5 w-5 text-blue-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">{stats?.products ?? 0}</p>
            <p className="text-xs text-muted-foreground">Produits</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <Building2 className="h-5 w-5 text-green-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">{stats?.organisations ?? 0}</p>
            <p className="text-xs text-muted-foreground">Organisations</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <Globe className="h-5 w-5 text-indigo-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">{stats?.total ?? 0}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
      </div>

      {/* Warning > 50 */}
      {(stats?.total ?? 0) > 50 && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          Le globe affiche un maximum de 50 items. Retirez des items pour que
          tous soient visibles.
        </div>
      )}

      {/* Produits section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4 text-blue-500" />
              Produits sur le globe ({productItems.length})
            </CardTitle>
            <Button size="sm" onClick={() => setShowProductSelector(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Ajouter des produits
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Current items */}
          {itemsLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : productItems.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                Aucun produit sur le globe
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Cliquez sur &quot;Ajouter des produits&quot; pour commencer
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5">
              {productItems.map(item => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 p-1.5 border rounded text-xs"
                >
                  <Image
                    src={toImageUrl(item.image_url)}
                    alt={item.name}
                    width={28}
                    height={28}
                    className="rounded object-cover flex-shrink-0"
                  />
                  <p className="flex-1 font-medium truncate">{item.name}</p>
                  <button
                    className="text-red-500 hover:text-red-700 p-0.5 flex-shrink-0"
                    onClick={() => handleRemove('product', item.id)}
                    disabled={toggleItem.isPending}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal selection produits */}
      <UniversalProductSelectorV2
        open={showProductSelector}
        onClose={() => setShowProductSelector(false)}
        onSelect={selected => {
          handleAddProducts(selected);
        }}
        title="Ajouter des produits au globe"
        description="Selectionnez les produits a afficher sur le globe 3D de la page de connexion LinkMe. Seuls les produits avec une image primaire seront visibles."
        excludeProductIds={excludeProductIds}
        showImages
        showQuantity={false}
        showPricing={false}
      />

      {/* Enseignes & Organisations section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 text-green-500" />
              Enseignes &amp; Organisations sur le globe ({orgItems.length})
            </CardTitle>
            <Button
              size="sm"
              variant={showOrgCandidates ? 'outline' : 'default'}
              onClick={() => setShowOrgCandidates(!showOrgCandidates)}
            >
              <Plus className="h-4 w-4 mr-1" />
              {showOrgCandidates ? 'Masquer' : 'Ajouter'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Items deja sur le globe */}
          {orgItems.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5 mb-3">
              {orgItems.map(item => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 p-1.5 border rounded text-xs"
                >
                  <Image
                    src={toImageUrl(item.image_url)}
                    alt={item.name}
                    width={28}
                    height={28}
                    className="rounded object-cover flex-shrink-0"
                  />
                  <p className="flex-1 font-medium truncate">{item.name}</p>
                  <button
                    className="text-red-500 hover:text-red-700 p-0.5 flex-shrink-0"
                    onClick={() =>
                      handleRemove(
                        item.item_type as 'organisation' | 'enseigne',
                        item.id
                      )
                    }
                    disabled={toggleItem.isPending}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Candidates : enseignes + organisations avec logo */}
          {showOrgCandidates && (
            <>
              {/* Filtres par type */}
              <div className="flex gap-1.5 flex-wrap">
                {(
                  [
                    'all',
                    'enseigne',
                    'fournisseur',
                    'client',
                    'prestataire',
                  ] as const
                ).map(t => (
                  <button
                    key={t}
                    className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                      orgTypeFilter === t
                        ? 'bg-green-100 border-green-300 text-green-700'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                    onClick={() => setOrgTypeFilter(t)}
                  >
                    {t === 'all'
                      ? 'Tous'
                      : t === 'enseigne'
                        ? 'Enseignes'
                        : t === 'fournisseur'
                          ? 'Fournisseurs'
                          : t === 'client'
                            ? 'Clients Pro'
                            : 'Prestataires'}
                  </button>
                ))}
              </div>

              {orgCandidates.loading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {orgCandidates.items
                    .filter(c => !orgItems.some(o => o.id === c.id))
                    .filter(
                      c => orgTypeFilter === 'all' || c.type === orgTypeFilter
                    )
                    .map(candidate => (
                      <button
                        key={candidate.id}
                        className="flex items-center gap-2.5 p-2 border rounded-lg text-xs hover:bg-green-50 hover:border-green-300 transition-colors text-left"
                        onClick={() => {
                          void toggleItem
                            .mutateAsync({
                              itemType:
                                candidate.type === 'enseigne'
                                  ? 'enseigne'
                                  : 'organisation',
                              itemId: candidate.id,
                              enabled: true,
                            })
                            .catch(err =>
                              console.error('[GlobeItems] Add org failed:', err)
                            );
                        }}
                        disabled={toggleItem.isPending}
                      >
                        <Image
                          src={candidate.logo_url}
                          alt={candidate.name}
                          width={36}
                          height={36}
                          className="rounded object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {candidate.name}
                          </p>
                          <p className="text-gray-400">
                            {candidate.type === 'enseigne'
                              ? 'Enseigne'
                              : candidate.type === 'fournisseur'
                                ? 'Fournisseur'
                                : candidate.type === 'prestataire'
                                  ? 'Prestataire'
                                  : 'Client'}
                          </p>
                        </div>
                        <Plus className="h-3 w-3 text-green-500 flex-shrink-0" />
                      </button>
                    ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
