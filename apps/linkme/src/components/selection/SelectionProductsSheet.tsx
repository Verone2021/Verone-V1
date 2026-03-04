'use client';

/**
 * SelectionCatalogDialog V4
 * Dialog plein ecran compact style catalogue pro. Layout liste horizontale,
 * filtres stock + categories 2 niveaux (categorie parente -> sous-categorie).
 * Clic sur un produit ouvre le detail avec feu tricolore (lecture seule).
 *
 * @module SelectionCatalogDialog
 * @since 2026-02
 */

import { useState, useMemo } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@verone/ui';

import {
  Globe,
  Lock,
  Loader2,
  Package,
  Search,
  X,
  AlertTriangle,
  Grid3X3,
  Settings,
  ChevronLeft,
  ChevronRight,
  EyeOff,
} from 'lucide-react';

import { PLATFORM_COMMISSION_RATE } from '@verone/utils';

import {
  useSelectionItems,
  useUserAffiliate,
  type UserSelection,
  type SelectionItem,
} from '../../lib/hooks/use-user-selection';

import { ProductDetailSheet } from './ProductDetailSheet';

interface ISelectionCatalogDialogProps {
  selection: UserSelection;
  isOpen: boolean;
  onClose: () => void;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(price);
}

type StockFilter = 'all' | 'in_stock' | 'out_of_stock';

const ALL_CATEGORIES = '__all__';
const ALL_SUBCATEGORIES = '__all__';
const ITEMS_PER_PAGE = 18; // 6 rows x 3 columns

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  active: { label: 'Actif', className: 'bg-green-100 text-green-700' },
  preorder: { label: 'Précommande', className: 'bg-blue-100 text-blue-700' },
  discontinued: { label: 'Arrêté', className: 'bg-red-100 text-red-700' },
  draft: { label: 'Brouillon', className: 'bg-gray-100 text-gray-500' },
};

function ProductStatusBadge({
  status,
}: {
  status: string;
}): React.JSX.Element | null {
  // Don't show badge for active products (default/most common)
  if (status === 'active') return null;
  const config = STATUS_CONFIG[status];
  if (!config) return null;
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}

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

function ProductRow({
  item,
  onClick,
}: {
  item: SelectionItem;
  onClick: () => void;
}): React.JSX.Element {
  const isHidden = item.is_hidden_by_staff;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 rounded-lg border p-2.5 hover:shadow-sm transition-all text-left w-full cursor-pointer ${
        isHidden
          ? 'opacity-50 bg-orange-50 border-orange-200'
          : 'bg-white border-gray-100 hover:border-linkme-turquoise/40'
      }`}
    >
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
          {isHidden && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-100 text-orange-700 flex-shrink-0">
              <EyeOff className="h-2.5 w-2.5" />
              Masqué par Vérone
            </span>
          )}
        </div>
        {item.subcategory_name && (
          <p className="text-xs text-gray-400 truncate mt-0.5">
            {item.subcategory_name}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-sm font-semibold text-gray-900">
            {formatPrice(item.selling_price_ht)}
            <span className="text-[10px] font-normal text-gray-400 ml-0.5">
              HT
            </span>
          </span>
          {!item.is_affiliate_product ? (
            <span className="text-xs text-linkme-turquoise font-medium">
              M:{item.margin_rate.toFixed(0)}%
            </span>
          ) : (
            <span className="text-xs text-indigo-500 font-medium">Affilie</span>
          )}
          <StockBadgeCompact stock={item.product_stock_real} />
          <ProductStatusBadge status={item.product_status} />
        </div>
      </div>
    </button>
  );
}

export function SelectionCatalogDialog({
  selection,
  isOpen,
  onClose,
}: ISelectionCatalogDialogProps): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORIES);
  const [activeSubcategory, setActiveSubcategory] = useState(ALL_SUBCATEGORIES);
  const [selectedItem, setSelectedItem] = useState<SelectionItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const { data: items, isLoading } = useSelectionItems(
    isOpen ? selection.id : null
  );

  // Get affiliate commission rate
  const { data: affiliate } = useUserAffiliate();
  const commissionRate =
    affiliate?.linkme_commission_rate ?? PLATFORM_COMMISSION_RATE;

  // Counts
  const totalItems = items?.length ?? 0;
  const inStockCount = useMemo(
    () => (items ?? []).filter(i => i.product_stock_real > 0).length,
    [items]
  );
  const outOfStockCount = totalItems - inStockCount;

  // Extract unique categories (parent)
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

  // Extract subcategories for active category
  const subcategories = useMemo(() => {
    if (!items || activeCategory === ALL_CATEGORIES) return [];
    const subs = new Map<string, number>();
    for (const item of items) {
      if (item.category_name === activeCategory && item.subcategory_name) {
        subs.set(
          item.subcategory_name,
          (subs.get(item.subcategory_name) ?? 0) + 1
        );
      }
    }
    return Array.from(subs.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, count]) => ({ name, count }));
  }, [items, activeCategory]);

  // Show subcategory row only if >1 subcategory
  const showSubcategories = subcategories.length > 1;

  // Filter items
  const filteredItems = useMemo(() => {
    if (!items) return [];
    return items.filter(item => {
      // Stock filter
      if (stockFilter === 'in_stock' && item.product_stock_real <= 0)
        return false;
      if (stockFilter === 'out_of_stock' && item.product_stock_real > 0)
        return false;

      // Category filter
      if (
        activeCategory !== ALL_CATEGORIES &&
        item.category_name !== activeCategory
      )
        return false;

      // Subcategory filter
      if (
        activeSubcategory !== ALL_SUBCATEGORIES &&
        item.subcategory_name !== activeSubcategory
      )
        return false;

      // Search filter
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
  }, [items, stockFilter, activeCategory, activeSubcategory, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredItems, currentPage]);

  // Reset page when filters change
  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    setActiveSubcategory(ALL_SUBCATEGORIES);
    setCurrentPage(1);
  };

  const handleSubcategoryChange = (sub: string) => {
    setActiveSubcategory(sub);
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

  const configureHref = `/ma-selection/${selection.slug}`;

  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={open => {
          if (!open) onClose();
        }}
      >
        <DialogContent
          dialogSize="full"
          hideCloseButton
          className="flex flex-col gap-0 p-0 bg-gray-50"
        >
          {/* Header - compact with action buttons on the right */}
          <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linkme-turquoise/10">
                <Grid3X3 className="h-4 w-4 text-linkme-turquoise" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-gray-900">
                  {selection.name}
                </DialogTitle>
                <DialogDescription className="flex items-center gap-2 mt-0">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      selection.published_at
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {selection.published_at ? (
                      <>
                        <Globe className="h-2.5 w-2.5" />
                        Publiee
                      </>
                    ) : (
                      <>
                        <Lock className="h-2.5 w-2.5" />
                        Brouillon
                      </>
                    )}
                  </span>
                  <span className="text-xs text-gray-500">
                    {totalItems} produit{totalItems > 1 ? 's' : ''}
                  </span>
                  {outOfStockCount > 0 && (
                    <span className="text-[10px] text-red-600 font-medium">
                      {outOfStockCount} rupture
                    </span>
                  )}
                </DialogDescription>
              </div>
            </div>

            {/* Action buttons + close */}
            <div className="flex items-center gap-2">
              <Link
                href={configureHref}
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
              >
                <Settings className="h-3.5 w-3.5" />
                Configurer
              </Link>
              <Link
                href={`${configureHref}/produits`}
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-linkme-turquoise text-white rounded-lg text-xs font-medium hover:bg-linkme-turquoise/90 transition-colors"
              >
                <Package className="h-3.5 w-3.5" />
                Gerer les produits
              </Link>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 transition-colors"
                aria-label="Fermer"
              >
                <X className="h-4 w-4 text-red-500" />
              </button>
            </div>
          </div>

          {/* Filters bar */}
          <div className="px-4 py-2 bg-white border-b border-gray-100 space-y-2">
            {/* Row 1: Search + Stock filters */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative w-48">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={e => handleSearchChange(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-linkme-turquoise/30 focus:border-linkme-turquoise bg-gray-50"
                />
              </div>

              {/* Separator */}
              <div className="h-5 w-px bg-gray-200" />

              {/* Stock filters */}
              <button
                onClick={() => handleStockFilterChange('all')}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  stockFilter === 'all'
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Tout ({totalItems})
              </button>
              <button
                onClick={() => handleStockFilterChange('in_stock')}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
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
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    stockFilter === 'out_of_stock'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Rupture ({outOfStockCount})
                </button>
              )}
            </div>

            {/* Row 2: Category pills (parent categories) */}
            {categories.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <button
                  onClick={() => handleCategoryChange(ALL_CATEGORIES)}
                  className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
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
                    className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
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

            {/* Row 3: Subcategory pills (conditional) */}
            {showSubcategories && (
              <div className="flex items-center gap-1.5 overflow-x-auto pl-0.5">
                <span className="text-[10px] text-gray-400 mr-1 flex-shrink-0">
                  Sous-cat.
                </span>
                <button
                  onClick={() => handleSubcategoryChange(ALL_SUBCATEGORIES)}
                  className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors ${
                    activeSubcategory === ALL_SUBCATEGORIES
                      ? 'bg-linkme-turquoise/80 text-white'
                      : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  Tout
                </button>
                {subcategories.map(sub => (
                  <button
                    key={sub.name}
                    onClick={() => handleSubcategoryChange(sub.name)}
                    className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors ${
                      activeSubcategory === sub.name
                        ? 'bg-linkme-turquoise/80 text-white'
                        : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {sub.name} ({sub.count})
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product list */}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 text-linkme-turquoise animate-spin" />
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Package className="h-10 w-10 mb-2" />
                <p className="text-sm font-medium">
                  {searchQuery ||
                  activeCategory !== ALL_CATEGORIES ||
                  stockFilter !== 'all'
                    ? 'Aucun produit correspondant'
                    : 'Aucun produit dans cette selection'}
                </p>
                {(searchQuery ||
                  activeCategory !== ALL_CATEGORIES ||
                  stockFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setActiveCategory(ALL_CATEGORIES);
                      setActiveSubcategory(ALL_SUBCATEGORIES);
                      setStockFilter('all');
                      setCurrentPage(1);
                    }}
                    className="mt-2 text-xs text-linkme-turquoise hover:underline"
                  >
                    Reinitialiser les filtres
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {paginatedItems.map(item => (
                  <ProductRow
                    key={item.id}
                    item={item}
                    onClick={() => setSelectedItem(item)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer with pagination */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-white border-t border-gray-200">
            <p className="text-xs text-gray-500">
              {filteredItems.length} produit
              {filteredItems.length > 1 ? 's' : ''}
              {totalPages > 1 && (
                <span className="text-gray-400">
                  {' '}
                  &middot; Page {currentPage}/{totalPages}
                </span>
              )}
            </p>

            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Page precedente"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    // Show first, last, current, and neighbors
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
                        className={`flex h-7 min-w-[28px] items-center justify-center rounded-md text-xs font-medium transition-colors ${
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
                  onClick={() =>
                    setCurrentPage(p => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Page suivante"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Product detail modal */}
      <ProductDetailSheet
        item={selectedItem}
        isOpen={selectedItem !== null}
        onClose={() => setSelectedItem(null)}
        configureHref={configureHref}
        commissionRate={commissionRate}
      />
    </>
  );
}
