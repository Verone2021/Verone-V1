'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Table,
  TableBody,
  TableHeader,
  TableRow,
  TableHead,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Tabs,
  TabsList,
  TabsTrigger,
} from '@verone/ui';
import {
  Plus,
  Package,
  Loader2,
  Search,
  X,
  Store,
  BookOpen,
  ChevronDown,
  RefreshCw,
} from 'lucide-react';

import { type SelectionItem } from '../../hooks/use-linkme-selections';
import { type ProductTabValue } from './selection-types';
import { ItemRow } from './selection-item-row';

// ─────────────────────────────────────────────
// Table header columns
// ─────────────────────────────────────────────

function TableColumnHeaders({ productTab }: { productTab: ProductTabValue }) {
  const marginLabel =
    productTab === 'reseller'
      ? 'Frais LinkMe %'
      : productTab === 'catalog'
        ? 'Marge %'
        : 'Marge/Frais %';
  const marginEurosLabel =
    productTab === 'reseller'
      ? 'Frais LinkMe €'
      : productTab === 'catalog'
        ? 'Marge €'
        : 'Marge/Frais €';
  const affiliateLabel =
    productTab === 'reseller' ? 'Encaissement affilié' : 'Prix affilié HT';
  return (
    <TableRow>
      <TableHead className="w-16">Image</TableHead>
      <TableHead>Produit</TableHead>
      <TableHead className="text-center w-20">Stock</TableHead>
      <TableHead className="text-right">Catalogue HT</TableHead>
      <TableHead className="text-right">Prix vente LinkMe HT</TableHead>
      <TableHead className="text-right">Prix vente Final HT</TableHead>
      <TableHead className="text-center w-24">{marginLabel}</TableHead>
      <TableHead className="text-right">{marginEurosLabel}</TableHead>
      <TableHead className="text-right">{affiliateLabel}</TableHead>
      <TableHead className="text-right w-12">Actions</TableHead>
    </TableRow>
  );
}

// ─────────────────────────────────────────────
// Card header top bar
// ─────────────────────────────────────────────

type HeaderBarProps = {
  isProductsOpen: boolean;
  itemCount: number;
  divergentItemsCount: number;
  isSyncingAll: boolean;
  onSyncAll: () => void;
  onAddProduct: () => void;
};

function ProductsCardHeaderBar({
  isProductsOpen,
  itemCount,
  divergentItemsCount,
  isSyncingAll,
  onSyncAll,
  onAddProduct,
}: HeaderBarProps) {
  return (
    <div className="flex flex-row items-center justify-between">
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 text-left cursor-pointer hover:opacity-80 transition-opacity"
        >
          <ChevronDown
            className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${isProductsOpen ? '' : '-rotate-90'}`}
          />
          <div>
            <CardTitle>Produits de la sélection ({itemCount})</CardTitle>
            <CardDescription>
              Gérez les produits et leurs taux de marque
            </CardDescription>
          </div>
        </button>
      </CollapsibleTrigger>
      <div className="flex gap-2">
        {divergentItemsCount > 0 && (
          <Button
            variant="outline"
            onClick={onSyncAll}
            disabled={isSyncingAll}
            className="text-orange-600 border-orange-300 hover:bg-orange-50"
          >
            {isSyncingAll ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Synchroniser ({divergentItemsCount})
          </Button>
        )}
        <Button onClick={onAddProduct}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un produit
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Filters (tabs + search)
// ─────────────────────────────────────────────

type ProductsFiltersProps = {
  productTab: ProductTabValue;
  productSearchQuery: string;
  totalCount: number;
  catalogCount: number;
  resellerCount: number;
  onProductTabChange: (tab: ProductTabValue) => void;
  onProductSearchChange: (query: string) => void;
};

function ProductsFilters({
  productTab,
  productSearchQuery,
  totalCount,
  catalogCount,
  resellerCount,
  onProductTabChange,
  onProductSearchChange,
}: ProductsFiltersProps) {
  return (
    <div className="flex flex-col gap-3">
      <Tabs
        value={productTab}
        onValueChange={v => {
          onProductTabChange(v as ProductTabValue);
          onProductSearchChange('');
        }}
      >
        <TabsList>
          <TabsTrigger value="all" className="gap-2">
            <Package className="h-4 w-4" />
            Tous ({totalCount})
          </TabsTrigger>
          <TabsTrigger value="catalog" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Catalogue ({catalogCount})
          </TabsTrigger>
          <TabsTrigger value="reseller" className="gap-2">
            <Store className="h-4 w-4" />
            Revendeur ({resellerCount})
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher par nom ou SKU..."
          value={productSearchQuery}
          onChange={e => onProductSearchChange(e.target.value)}
          className="pl-10 pr-10"
        />
        {productSearchQuery && (
          <button
            type="button"
            onClick={() => onProductSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Pure helpers (not counted in max-lines-per-function)
// ─────────────────────────────────────────────

function filterItems(
  items: SelectionItem[],
  productTab: ProductTabValue,
  searchQuery: string
): SelectionItem[] {
  return items.filter(item => {
    if (productTab !== 'all') {
      const isAffiliate =
        item.product?.created_by_affiliate !== null &&
        item.product?.created_by_affiliate !== undefined;
      if (productTab === 'catalog' && isAffiliate) return false;
      if (productTab === 'reseller' && !isAffiliate) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = (item.product?.name ?? '').toLowerCase();
      const sku = (item.product?.sku ?? '').toLowerCase();
      if (!name.includes(q) && !sku.includes(q)) return false;
    }
    return true;
  });
}

function countByType(items: SelectionItem[]) {
  const catalogCount = items.filter(
    i =>
      i.product?.created_by_affiliate === null ||
      i.product?.created_by_affiliate === undefined
  ).length;
  const resellerCount = items.filter(
    i =>
      i.product?.created_by_affiliate !== null &&
      i.product?.created_by_affiliate !== undefined
  ).length;
  return { catalogCount, resellerCount };
}

// ─────────────────────────────────────────────
// Main exported component
// ─────────────────────────────────────────────

type ProductsTableContentProps = {
  selectionId: string;
  items: SelectionItem[];
  filteredItems: SelectionItem[];
  productTab: ProductTabValue;
  syncingItemIds: Set<string>;
  toggleVisibilityPending: boolean;
  removeProductPending: boolean;
  onAddProduct: () => void;
  onSyncItem: (item: SelectionItem) => void;
  onToggleVisibility: (item: SelectionItem) => void;
  onOpenViewModal: (item: SelectionItem) => void;
  onOpenEditModal: (item: SelectionItem) => void;
  onDeleteItem: (itemId: string) => void;
};

function ProductsTableContent({
  selectionId,
  items,
  filteredItems,
  productTab,
  syncingItemIds,
  toggleVisibilityPending,
  removeProductPending,
  onAddProduct,
  onSyncItem,
  onToggleVisibility,
  onOpenViewModal,
  onOpenEditModal,
  onDeleteItem,
}: ProductsTableContentProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Aucun produit dans cette sélection</p>
        <Button variant="outline" className="mt-4" onClick={onAddProduct}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter des produits
        </Button>
      </div>
    );
  }
  return (
    <Table>
      <TableHeader>
        <TableColumnHeaders productTab={productTab} />
      </TableHeader>
      <TableBody>
        {filteredItems.map(item => (
          <ItemRow
            key={item.id}
            item={item}
            selectionId={selectionId}
            syncingItemIds={syncingItemIds}
            toggleVisibilityPending={toggleVisibilityPending}
            removeProductPending={removeProductPending}
            onSyncItem={onSyncItem}
            onToggleVisibility={onToggleVisibility}
            onOpenViewModal={onOpenViewModal}
            onOpenEditModal={onOpenEditModal}
            onDeleteItem={onDeleteItem}
          />
        ))}
      </TableBody>
    </Table>
  );
}

export type SelectionItemsProps = {
  selectionId: string;
  items: SelectionItem[];
  productTab: ProductTabValue;
  productSearchQuery: string;
  isProductsOpen: boolean;
  divergentItemsCount: number;
  isSyncingAll: boolean;
  syncingItemIds: Set<string>;
  toggleVisibilityPending: boolean;
  removeProductPending: boolean;
  onProductsOpenChange: (open: boolean) => void;
  onProductTabChange: (tab: ProductTabValue) => void;
  onProductSearchChange: (query: string) => void;
  onAddProduct: () => void;
  onSyncAll: () => void;
  onSyncItem: (item: SelectionItem) => void;
  onToggleVisibility: (item: SelectionItem) => void;
  onOpenViewModal: (item: SelectionItem) => void;
  onOpenEditModal: (item: SelectionItem) => void;
  onDeleteItem: (itemId: string) => void;
};

export function SelectionItems({
  selectionId,
  items,
  productTab,
  productSearchQuery,
  isProductsOpen,
  divergentItemsCount,
  isSyncingAll,
  syncingItemIds,
  toggleVisibilityPending,
  removeProductPending,
  onProductsOpenChange,
  onProductTabChange,
  onProductSearchChange,
  onAddProduct,
  onSyncAll,
  onSyncItem,
  onToggleVisibility,
  onOpenViewModal,
  onOpenEditModal,
  onDeleteItem,
}: SelectionItemsProps) {
  const { catalogCount, resellerCount } = countByType(items);
  const filteredItems = filterItems(items, productTab, productSearchQuery);
  return (
    <Collapsible open={isProductsOpen} onOpenChange={onProductsOpenChange}>
      <Card>
        <CardHeader className="flex flex-col gap-4">
          <ProductsCardHeaderBar
            isProductsOpen={isProductsOpen}
            itemCount={items.length}
            divergentItemsCount={divergentItemsCount}
            isSyncingAll={isSyncingAll}
            onSyncAll={onSyncAll}
            onAddProduct={onAddProduct}
          />
          {isProductsOpen && (
            <ProductsFilters
              productTab={productTab}
              productSearchQuery={productSearchQuery}
              totalCount={items.length}
              catalogCount={catalogCount}
              resellerCount={resellerCount}
              onProductTabChange={onProductTabChange}
              onProductSearchChange={onProductSearchChange}
            />
          )}
        </CardHeader>
        <CollapsibleContent>
          <CardContent>
            <ProductsTableContent
              selectionId={selectionId}
              items={items}
              filteredItems={filteredItems}
              productTab={productTab}
              syncingItemIds={syncingItemIds}
              toggleVisibilityPending={toggleVisibilityPending}
              removeProductPending={removeProductPending}
              onAddProduct={onAddProduct}
              onSyncItem={onSyncItem}
              onToggleVisibility={onToggleVisibility}
              onOpenViewModal={onOpenViewModal}
              onOpenEditModal={onOpenEditModal}
              onDeleteItem={onDeleteItem}
            />
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
