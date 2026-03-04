'use client';

/**
 * Page Gestion Produits d'une Sélection
 * Grille 3 colonnes avec filtres stock/catégorie, pagination, actions inline.
 * Alignée avec le design du SelectionCatalogDialog.
 *
 * @module SelectionProductsPage
 * @since 2026-01-09
 * @updated 2026-03-04 - Refonte grille + filtres + pagination (plus de drag & drop)
 */

import { useState, useMemo } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import {
  ArrowLeft,
  Loader2,
  Package,
  Plus,
  Search,
  Edit3,
  Trash2,
  X,
  LayoutGrid,
  ShoppingBag,
  Lock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

import { EditMarginModal } from '../../../../../components/selection/EditMarginModal';
import { useAuth, type LinkMeRole } from '../../../../../contexts/AuthContext';
import {
  useUserAffiliate,
  useUserSelections,
  useSelectionItems,
  useRemoveFromSelection,
  type SelectionItem,
} from '../../../../../lib/hooks/use-user-selection';
import { formatCurrency } from '../../../../../types/analytics';

// Rôles autorisés
const AUTHORIZED_ROLES: LinkMeRole[] = ['enseigne_admin', 'organisation_admin'];

type StockFilter = 'all' | 'in_stock' | 'out_of_stock';
const ALL_CATEGORIES = '__all__';
const ITEMS_PER_PAGE = 18;

function StockBadgeCompact({ stock }: { stock: number }): React.JSX.Element {
  if (stock > 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-green-600">
        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
        {stock}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-red-500">
      <AlertTriangle className="h-3 w-3" />
      Rupture
    </span>
  );
}

export default function SelectionProductsPage() {
  const params = useParams();
  const selectionId = params.id as string;

  const { user, linkMeRole, initializing: authLoading } = useAuth();
  const { data: _affiliate, isLoading: affiliateLoading } = useUserAffiliate();
  const { data: selections, isLoading: selectionsLoading } =
    useUserSelections();

  // Trouver la sélection par ID ou slug (URL propre)
  const selection = selections?.find(
    s => s.id === selectionId || s.slug === selectionId
  );

  // Fetcher les items avec l'ID réel (pas le slug)
  const { data: items, isLoading: itemsLoading } = useSelectionItems(
    selection?.id ?? null
  );

  const removeItemMutation = useRemoveFromSelection();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORIES);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingItem, setEditingItem] = useState<SelectionItem | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

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

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredItems, currentPage]);

  // Reset page when filters change
  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    setCurrentPage(1);
  };

  const handleStockFilterChange = (filter: StockFilter) => {
    setStockFilter(filter);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  // Handler suppression
  const handleRemoveItem = async (item: SelectionItem) => {
    setDeletingItemId(item.id);

    try {
      await removeItemMutation.mutateAsync({
        itemId: item.id,
        selectionId: selection?.id ?? '',
      });
      toast.success('Produit retiré de la sélection');
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

  // Vérification accès
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

  // Sélection non trouvée
  if (!selection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 rounded-2xl bg-linkme-turquoise/10 flex items-center justify-center mx-auto mb-4">
            <LayoutGrid className="h-8 w-8 text-linkme-turquoise" />
          </div>
          <h1 className="text-xl font-bold text-linkme-marine mb-2">
            Sélection introuvable
          </h1>
          <p className="text-linkme-marine/60 mb-6 text-sm">
            Cette sélection n&apos;existe pas ou a été supprimée.
          </p>
          <Link
            href="/ma-selection"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-linkme-turquoise text-white rounded-xl font-medium hover:bg-linkme-turquoise/90 transition-all duration-200 shadow-md hover:shadow-lg text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux sélections
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header navigation */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href={`/ma-selection/${selection?.slug ?? selectionId}`}
            className="flex items-center gap-2 text-linkme-marine/60 hover:text-linkme-marine transition-colors text-sm group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform duration-200" />
            <span className="font-medium">{selection.name}</span>
          </Link>

          <Link
            href={`/catalogue?selection=${selection?.id ?? ''}`}
            className="flex items-center gap-2 px-4 py-2.5 bg-linkme-turquoise text-white rounded-xl font-semibold hover:bg-linkme-turquoise/90 transition-all duration-200 shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] text-sm"
          >
            <Plus className="h-4 w-4" />
            Ajouter des produits
          </Link>
        </div>

        {/* Titre avec icône */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-linkme-turquoise/10 flex items-center justify-center flex-shrink-0">
            <Package className="h-7 w-7 text-linkme-turquoise" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-linkme-marine">
              Produits de la sélection
            </h1>
            <p className="text-linkme-marine/60 text-sm">
              {filteredItems.length} produit
              {filteredItems.length > 1 ? 's' : ''}
              {searchQuery && ` trouvé${filteredItems.length > 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6 space-y-3">
          {/* Row 1: Recherche + Filtres stock */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Barre de recherche */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-linkme-marine/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => handleSearchChange(e.target.value)}
                placeholder="Rechercher un produit..."
                className="w-full pl-10 pr-10 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-linkme-turquoise/30 focus:border-linkme-turquoise transition-all duration-200 bg-gray-50"
              />
              {searchQuery && (
                <button
                  onClick={() => handleSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-linkme-marine/40 hover:text-linkme-marine transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="h-6 w-px bg-gray-200" />

            {/* Filtres stock */}
            <button
              onClick={() => handleStockFilterChange('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                stockFilter === 'all'
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Tout ({totalItems})
            </button>
            <button
              onClick={() => handleStockFilterChange('in_stock')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                stockFilter === 'in_stock'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              En stock ({inStockCount})
            </button>
            {outOfStockCount > 0 && (
              <button
                onClick={() => handleStockFilterChange('out_of_stock')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  stockFilter === 'out_of_stock'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Rupture ({outOfStockCount})
              </button>
            )}
          </div>

          {/* Row 2: Filtres catégorie */}
          {categories.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button
                onClick={() => handleCategoryChange(ALL_CATEGORIES)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  activeCategory === ALL_CATEGORIES
                    ? 'bg-linkme-turquoise text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Toutes ({totalItems})
              </button>
              {categories.map(cat => (
                <button
                  key={cat.name}
                  onClick={() => handleCategoryChange(cat.name)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    activeCategory === cat.name
                      ? 'bg-linkme-turquoise text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat.name} ({cat.count})
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Grille produits */}
        {itemsLoading ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <Loader2 className="h-8 w-8 text-linkme-turquoise animate-spin mx-auto" />
            <p className="text-linkme-marine/60 text-sm mt-3">
              Chargement des produits...
            </p>
          </div>
        ) : paginatedItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {paginatedItems.map(item => (
              <ProductCard
                key={item.id}
                item={item}
                onEdit={() => setEditingItem(item)}
                onRemove={() => {
                  void handleRemoveItem(item).catch(error => {
                    console.error('[ProductList] Remove failed:', error);
                  });
                }}
                isDeleting={deletingItemId === item.id}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-linkme-turquoise/10 flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="h-8 w-8 text-linkme-turquoise" />
            </div>
            <h3 className="text-lg font-semibold text-linkme-marine mb-2">
              {searchQuery ||
              activeCategory !== ALL_CATEGORIES ||
              stockFilter !== 'all'
                ? 'Aucun produit trouvé'
                : 'Aucun produit dans cette sélection'}
            </h3>
            <p className="text-linkme-marine/60 mb-6 text-sm max-w-sm mx-auto">
              {searchQuery ||
              activeCategory !== ALL_CATEGORIES ||
              stockFilter !== 'all'
                ? "Essayez avec d'autres filtres."
                : 'Ajoutez des produits depuis le catalogue pour commencer à vendre.'}
            </p>
            {searchQuery ||
            activeCategory !== ALL_CATEGORIES ||
            stockFilter !== 'all' ? (
              <button
                onClick={() => {
                  handleSearchChange('');
                  setActiveCategory(ALL_CATEGORIES);
                  setStockFilter('all');
                  setCurrentPage(1);
                }}
                className="text-sm text-linkme-turquoise hover:underline font-medium"
              >
                Réinitialiser les filtres
              </button>
            ) : (
              <Link
                href="/catalogue"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-linkme-turquoise text-white rounded-xl font-medium hover:bg-linkme-turquoise/90 transition-all duration-200 shadow-md hover:shadow-lg text-sm"
              >
                <Plus className="h-4 w-4" />
                Parcourir le catalogue
              </Link>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 px-1">
            <p className="text-xs text-gray-500">
              {filteredItems.length} produit
              {filteredItems.length > 1 ? 's' : ''}
              <span className="text-gray-400">
                {' '}
                &middot; Page {currentPage}/{totalPages}
              </span>
            </p>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Page précédente"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => {
                  if (page === 1 || page === totalPages) return true;
                  if (Math.abs(page - currentPage) <= 1) return true;
                  return false;
                })
                .reduce<(number | 'ellipsis')[]>((acc, page, idx, arr) => {
                  if (idx > 0) {
                    const prev = arr[idx - 1];
                    if (page - prev > 1) acc.push('ellipsis');
                  }
                  acc.push(page);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === 'ellipsis' ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className="px-1 text-xs text-gray-400"
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => setCurrentPage(item)}
                      className={`flex h-8 min-w-[32px] items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                        currentPage === item
                          ? 'bg-linkme-turquoise text-white'
                          : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Page suivante"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal édition marge */}
      {editingItem && selection && (
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

// ============================================================================
// Composant ProductCard - Carte produit compacte avec actions
// ============================================================================

interface ProductCardProps {
  item: SelectionItem;
  onEdit: () => void;
  onRemove: () => void;
  isDeleting: boolean;
}

function ProductCard({ item, onEdit, onRemove, isDeleting }: ProductCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-white border-gray-100 hover:border-linkme-turquoise/40 p-2.5 hover:shadow-sm transition-all group">
      {/* Image */}
      <div className="relative h-16 w-16 flex-shrink-0 rounded-md bg-gray-50 overflow-hidden">
        {item.product_image_url ? (
          <Image
            src={item.product_image_url}
            alt={item.product_name}
            fill
            className="object-cover"
            sizes="64px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package className="h-6 w-6 text-gray-200" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-[10px] text-gray-400 font-mono flex-shrink-0">
            {item.product_reference}
          </span>
          <h3 className="text-sm font-medium text-gray-900 truncate">
            {item.product_name}
          </h3>
        </div>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-sm font-semibold text-gray-900">
            {formatCurrency(item.selling_price_ht)}
            <span className="text-[10px] font-normal text-gray-400 ml-0.5">
              HT
            </span>
          </span>
          {!item.is_affiliate_product ? (
            <span className="text-xs text-linkme-turquoise font-medium">
              M:{item.margin_rate.toFixed(0)}%
            </span>
          ) : (
            <span className="text-xs text-indigo-500 font-medium">Affilié</span>
          )}
          <StockBadgeCompact stock={item.product_stock_real} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button
          onClick={onEdit}
          className="p-1.5 text-linkme-turquoise hover:bg-linkme-turquoise/10 rounded-lg transition-colors"
          title="Modifier la marge"
        >
          <Edit3 className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onRemove}
          disabled={isDeleting}
          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
          title="Retirer de la sélection"
        >
          {isDeleting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}
