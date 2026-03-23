'use client';

/**
 * Page Detail Selection - PRODUITS D'ABORD
 * Affiche la grille de produits comme contenu principal.
 * La configuration (nom, image, visibilite, prix) est dans un Sheet lateral.
 *
 * @module SelectionDetailPage
 * @since 2026-01-09
 * @updated 2026-03 - Refonte UX "produits d'abord"
 */

import { useState, useMemo } from 'react';

import Link from 'next/link';
import { useParams } from 'next/navigation';

import {
  ArrowLeft,
  Loader2,
  Package,
  Globe,
  Lock,
  Plus,
  Settings,
  LayoutGrid,
} from 'lucide-react';
import { toast } from 'sonner';

import { EditMarginModal } from '../../../../components/selection/EditMarginModal';
import {
  ProductFilters,
  ALL_CATEGORIES,
} from '../../../../components/selection/ProductFilters';
import { SelectionConfigSheet } from '../../../../components/selection/SelectionConfigSheet';
import { SelectionProductGrid } from '../../../../components/selection/SelectionProductGrid';
import { ShareSelectionButton } from '../../../../components/selection/ShareSelectionButton';
import { useAuth, type LinkMeRole } from '../../../../contexts/AuthContext';
import { usePermissions } from '../../../../hooks/use-permissions';
import {
  useUserAffiliate,
  useUserSelections,
  useSelectionItems,
  useRemoveFromSelection,
  type SelectionItem,
} from '../../../../lib/hooks/use-user-selection';

// Roles autorises (collab peut voir sélections mais PAS éditer les marges)
const AUTHORIZED_ROLES: LinkMeRole[] = [
  'enseigne_admin',
  'organisation_admin',
  'enseigne_collaborateur',
];

export default function SelectionDetailPage(): React.JSX.Element | null {
  const params = useParams();
  const selectionId = params.id as string;

  const { user, linkMeRole, initializing: authLoading } = useAuth();
  const { canViewCommissions } = usePermissions();
  const { data: _affiliate, isLoading: affiliateLoading } = useUserAffiliate();
  const { data: selections, isLoading: selectionsLoading } =
    useUserSelections();

  // Trouver la selection actuelle (par ID ou slug)
  const selection = selections?.find(
    s => s.id === selectionId || s.slug === selectionId
  );

  // Fetcher les items avec l'ID reel (pas le slug)
  const { data: items, isLoading: itemsLoading } = useSelectionItems(
    selection?.id ?? null
  );

  const removeItemMutation = useRemoveFromSelection();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<
    'all' | 'in_stock' | 'out_of_stock'
  >('all');
  const [activeCategory, setActiveCategory] = useState<string>(ALL_CATEGORIES);
  const [editingItem, setEditingItem] = useState<SelectionItem | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const isPublished = !!selection?.published_at;

  // Counts
  const totalItems = items?.length ?? 0;
  const inStockCount = useMemo(
    () => (items ?? []).filter(i => i.product_stock_real > 0).length,
    [items]
  );
  const outOfStockCount = totalItems - inStockCount;

  // Extract unique parent categories
  const categories = useMemo(() => {
    if (!items) return [];
    const cats = new Map<string, number>();
    for (const item of items) {
      if (item.category_name) {
        cats.set(item.category_name, (cats.get(item.category_name) ?? 0) + 1);
      }
    }
    return Array.from(cats.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, count]) => ({ name, count }));
  }, [items]);

  // Filter items
  const filteredItems = useMemo(() => {
    if (!items) return [];
    return items.filter(item => {
      if (stockFilter === 'in_stock' && item.product_stock_real <= 0)
        return false;
      if (stockFilter === 'out_of_stock' && item.product_stock_real > 0)
        return false;
      if (
        activeCategory !== ALL_CATEGORIES &&
        item.category_name !== activeCategory
      )
        return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (
          !item.product_name.toLowerCase().includes(q) &&
          !item.product_reference.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [items, stockFilter, activeCategory, searchQuery]);

  const hasActiveFilters =
    searchQuery !== '' ||
    activeCategory !== ALL_CATEGORIES ||
    stockFilter !== 'all';

  // Handlers
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const handleStockFilterChange = (
    filter: 'all' | 'in_stock' | 'out_of_stock'
  ) => {
    setStockFilter(filter);
  };

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setActiveCategory(ALL_CATEGORIES);
    setStockFilter('all');
  };

  const handleRemoveItem = async (item: SelectionItem) => {
    setDeletingItemId(item.id);
    try {
      await removeItemMutation.mutateAsync({
        itemId: item.id,
        selectionId: selection?.id ?? '',
      });
      toast.success('Produit retiré de la boutique');
      setDeletingItemId(null);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Erreur lors de la suppression';
      toast.error(errorMessage);
      setDeletingItemId(null);
    }
  };

  // Chargement
  if (authLoading || affiliateLoading || selectionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-gray-50">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-linkme-turquoise/10 flex items-center justify-center mx-auto">
            <Loader2 className="h-8 w-8 text-linkme-turquoise animate-spin" />
          </div>
          <p className="text-linkme-marine/60 text-sm font-medium">
            Chargement...
          </p>
        </div>
      </div>
    );
  }

  // Verification acces
  if (!user || !linkMeRole || !AUTHORIZED_ROLES.includes(linkMeRole.role)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 rounded-2xl bg-linkme-turquoise/10 flex items-center justify-center mx-auto mb-4">
            <Lock className="h-8 w-8 text-linkme-turquoise" />
          </div>
          <h1 className="text-xl font-bold text-linkme-marine mb-2">
            Accès non autorisé
          </h1>
          <p className="text-linkme-marine/60 mb-6 text-sm">
            Vous n&apos;avez pas les permissions pour accéder à cette page.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-linkme-turquoise text-white rounded-xl font-medium hover:bg-linkme-turquoise/90 transition-all duration-200 shadow-md hover:shadow-lg text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Selection non trouvee
  if (!selection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 rounded-2xl bg-linkme-turquoise/10 flex items-center justify-center mx-auto mb-4">
            <LayoutGrid className="h-8 w-8 text-linkme-turquoise" />
          </div>
          <h1 className="text-xl font-bold text-linkme-marine mb-2">
            Boutique introuvable
          </h1>
          <p className="text-linkme-marine/60 mb-6 text-sm">
            Cette boutique n&apos;existe pas ou a été supprimée.
          </p>
          <Link
            href="/ma-selection"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-linkme-turquoise text-white rounded-xl font-medium hover:bg-linkme-turquoise/90 transition-all duration-200 shadow-md hover:shadow-lg text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux boutiques
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header compact */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/ma-selection"
            className="flex items-center gap-2 text-linkme-marine/60 hover:text-linkme-marine transition-colors text-sm group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform duration-200" />
            <span className="font-medium">Mes boutiques</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsConfigOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-linkme-marine rounded-xl font-medium hover:bg-gray-50 transition-all text-sm"
            >
              <Settings className="h-4 w-4" />
              Personnaliser
            </button>
            <ShareSelectionButton selection={selection} />
          </div>
        </div>

        {/* Titre + badges */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-linkme-turquoise/10 flex items-center justify-center flex-shrink-0">
            <Package className="h-7 w-7 text-linkme-turquoise" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-linkme-marine truncate">
                {selection.name}
              </h1>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                  isPublished
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {isPublished ? (
                  <>
                    <Globe className="h-3 w-3" /> En ligne
                  </>
                ) : (
                  <>
                    <Lock className="h-3 w-3" /> Non publiée
                  </>
                )}
              </span>
              <span className="text-xs text-gray-500">
                {totalItems} produit{totalItems > 1 ? 's' : ''}
              </span>
            </div>
            <p className="text-linkme-marine/60 text-sm mt-0.5">Mes produits</p>
          </div>

          <Link
            href={`/catalogue?selection=${selection.id}`}
            className="flex items-center gap-2 px-4 py-2.5 bg-linkme-turquoise text-white rounded-xl font-semibold hover:bg-linkme-turquoise/90 transition-all duration-200 shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] text-sm flex-shrink-0"
          >
            <Plus className="h-4 w-4" />
            Ajouter des produits
          </Link>
        </div>

        {/* Filtres */}
        <ProductFilters
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          stockFilter={stockFilter}
          onStockFilterChange={handleStockFilterChange}
          activeCategory={activeCategory}
          onCategoryChange={handleCategoryChange}
          totalItems={totalItems}
          inStockCount={inStockCount}
          outOfStockCount={outOfStockCount}
          categories={categories}
        />

        {/* Grille produits */}
        <SelectionProductGrid
          items={filteredItems}
          isLoading={itemsLoading}
          canViewCommissions={canViewCommissions}
          onEdit={
            canViewCommissions
              ? (item: SelectionItem) => setEditingItem(item)
              : undefined
          }
          onRemove={(item: SelectionItem) => {
            void handleRemoveItem(item).catch((error: unknown) => {
              console.error('[SelectionDetail] Remove failed:', error);
            });
          }}
          deletingItemId={deletingItemId}
          searchQuery={searchQuery}
          hasActiveFilters={hasActiveFilters}
          onResetFilters={handleResetFilters}
        />
      </div>

      {/* Sheet config lateral */}
      <SelectionConfigSheet
        selection={selection}
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
      />

      {/* Modal edition marge (masquée pour collaborateur) */}
      {canViewCommissions && editingItem && selection && (
        <EditMarginModal
          item={editingItem}
          selectionId={selection.id}
          onClose={() => setEditingItem(null)}
          isAffiliateProduct={editingItem.is_affiliate_product}
        />
      )}
    </div>
  );
}
