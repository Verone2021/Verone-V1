'use client';

import { ProductThumbnail } from '@verone/products';
import {
  Button,
  Input,
  Label,
  Badge,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  ConfirmDialog,
} from '@verone/ui';
import {
  Plus,
  Loader2,
  Percent,
  Search,
  X,
  Store,
  BookOpen,
} from 'lucide-react';

import { SelectionProductDetailModal } from '../../components/SelectionProductDetailModal';
import {
  type SelectionItem,
  type SourcedProduct,
} from '../../hooks/use-linkme-selections';
import { type LinkMeCatalogProduct } from '../../hooks/use-linkme-catalog';
import type { ProductSourceValue } from './selection-types';

type CatalogProduct = LinkMeCatalogProduct;

// ─────────────────────────────────────────────
// Modal: Add product
// ─────────────────────────────────────────────

type AddProductModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productSource: ProductSourceValue;
  searchQuery: string;
  selectedProductId: string | null;
  newMarginRate: number;
  availableCatalogProducts: CatalogProduct[];
  availableSourcedProducts: SourcedProduct[];
  filteredCatalogProducts: CatalogProduct[];
  filteredSourcedProducts: SourcedProduct[];
  hasSourcedProducts: boolean;
  isAdding: boolean;
  onProductSourceChange: (source: ProductSourceValue) => void;
  onSearchChange: (query: string) => void;
  onSelectProduct: (id: string, suggestedMargin: number) => void;
  onMarginChange: (rate: number) => void;
  onAdd: () => Promise<void>;
};

type AddProductBodyProps = Omit<
  AddProductModalProps,
  'open' | 'onOpenChange' | 'isAdding' | 'onAdd'
>;

function AddProductBody({
  productSource,
  searchQuery,
  selectedProductId,
  newMarginRate,
  availableCatalogProducts,
  availableSourcedProducts,
  filteredCatalogProducts,
  filteredSourcedProducts,
  hasSourcedProducts,
  onProductSourceChange,
  onSearchChange,
  onSelectProduct,
  onMarginChange,
}: AddProductBodyProps) {
  return (
    <div className="space-y-4">
      <AddProductSourceTabs
        productSource={productSource}
        availableCatalogCount={availableCatalogProducts.length}
        availableSourcedCount={availableSourcedProducts.length}
        hasSourcedProducts={hasSourcedProducts}
        onProductSourceChange={onProductSourceChange}
        onSearchChange={onSearchChange}
      />
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={
            productSource === 'catalog'
              ? 'Rechercher dans le catalogue...'
              : 'Rechercher un produit sourcé...'
          }
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          className="pl-10"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
            onClick={() => onSearchChange('')}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
      {productSource === 'catalog' ? (
        <CatalogProductList
          products={filteredCatalogProducts}
          searchQuery={searchQuery}
          selectedProductId={selectedProductId}
          onSelectProduct={onSelectProduct}
        />
      ) : (
        <SourcedProductList
          products={filteredSourcedProducts}
          searchQuery={searchQuery}
          selectedProductId={selectedProductId}
          onSelectProduct={onSelectProduct}
        />
      )}
      {selectedProductId && (
        <MarginRateInput value={newMarginRate} onChange={onMarginChange} />
      )}
    </div>
  );
}

export function AddProductModal({
  open,
  onOpenChange,
  isAdding,
  onAdd,
  ...bodyProps
}: AddProductModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ajouter un produit</DialogTitle>
          <DialogDescription>
            Sélectionnez un produit du catalogue LinkMe ou des produits sourcés
          </DialogDescription>
        </DialogHeader>
        <AddProductBody {...bodyProps} />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={() => {
              void onAdd().catch((err: unknown) => {
                console.error('[Selections] handleAddProduct failed:', err);
              });
            }}
            disabled={!bodyProps.selectedProductId || isAdding}
          >
            {isAdding ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Ajouter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type AddProductSourceTabsProps = {
  productSource: ProductSourceValue;
  availableCatalogCount: number;
  availableSourcedCount: number;
  hasSourcedProducts: boolean;
  onProductSourceChange: (source: ProductSourceValue) => void;
  onSearchChange: (query: string) => void;
};

function AddProductSourceTabs({
  productSource,
  availableCatalogCount,
  availableSourcedCount,
  hasSourcedProducts,
  onProductSourceChange,
  onSearchChange,
}: AddProductSourceTabsProps) {
  const tabClass = (active: boolean) =>
    `flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
      active
        ? 'border-primary text-primary'
        : 'border-transparent text-muted-foreground hover:text-foreground'
    }`;

  return (
    <div className="flex gap-2 border-b">
      <button
        type="button"
        className={tabClass(productSource === 'catalog')}
        onClick={() => {
          onProductSourceChange('catalog');
          onSearchChange('');
        }}
      >
        <BookOpen className="h-4 w-4" />
        Catalogue LinkMe ({availableCatalogCount})
      </button>
      {hasSourcedProducts && (
        <button
          type="button"
          className={tabClass(productSource === 'sourced')}
          onClick={() => {
            onProductSourceChange('sourced');
            onSearchChange('');
          }}
        >
          <Store className="h-4 w-4" />
          Produits sourcés ({availableSourcedCount})
        </button>
      )}
    </div>
  );
}

type CatalogProductListProps = {
  products: CatalogProduct[];
  searchQuery: string;
  selectedProductId: string | null;
  onSelectProduct: (id: string, suggestedMargin: number) => void;
};

function CatalogProductList({
  products,
  searchQuery,
  selectedProductId,
  onSelectProduct,
}: CatalogProductListProps) {
  return (
    <div className="max-h-64 overflow-y-auto border rounded-lg">
      {products.length > 0 ? (
        products.slice(0, 20).map((product: CatalogProduct) => (
          <div
            key={product.product_id}
            className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 border-b last:border-b-0 ${
              selectedProductId === product.product_id ? 'bg-primary/10' : ''
            }`}
            onClick={() =>
              onSelectProduct(
                product.product_id,
                product.suggested_margin_rate ?? 10
              )
            }
          >
            <ProductThumbnail
              src={product.product_image_url}
              alt={product.product_name}
              size="xs"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{product.product_name}</p>
              <p className="text-sm text-muted-foreground">
                {product.product_reference}
                {product.product_selling_price_ht != null && (
                  <> - {product.product_selling_price_ht.toFixed(2)} € HT</>
                )}
              </p>
            </div>
            {selectedProductId === product.product_id && (
              <Badge>Sélectionné</Badge>
            )}
          </div>
        ))
      ) : (
        <div className="p-8 text-center text-muted-foreground">
          {searchQuery
            ? 'Aucun produit trouvé'
            : 'Tous les produits sont déjà dans la sélection'}
        </div>
      )}
    </div>
  );
}

type SourcedProductListProps = {
  products: SourcedProduct[];
  searchQuery: string;
  selectedProductId: string | null;
  onSelectProduct: (id: string, suggestedMargin: number) => void;
};

function SourcedProductList({
  products,
  searchQuery,
  selectedProductId,
  onSelectProduct,
}: SourcedProductListProps) {
  return (
    <div className="max-h-64 overflow-y-auto border rounded-lg">
      {products.length > 0 ? (
        products.slice(0, 20).map((product: SourcedProduct) => (
          <div
            key={product.id}
            className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 border-b last:border-b-0 ${
              selectedProductId === product.id ? 'bg-primary/10' : ''
            }`}
            onClick={() => onSelectProduct(product.id, 10)}
          >
            <ProductThumbnail
              src={product.primary_image_url}
              alt={product.name}
              size="xs"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium truncate">{product.name}</p>
                <Badge
                  variant="outline"
                  className="text-xs bg-amber-50 text-amber-700 border-amber-200"
                >
                  Sourcé
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {product.sku ?? product.supplier_reference ?? 'Sans référence'}{' '}
                - {product.selling_price_ht.toFixed(2)} € HT
              </p>
            </div>
            {selectedProductId === product.id && <Badge>Sélectionné</Badge>}
          </div>
        ))
      ) : (
        <div className="p-8 text-center text-muted-foreground">
          {searchQuery
            ? 'Aucun produit sourcé trouvé'
            : 'Tous les produits sourcés sont déjà dans la sélection'}
        </div>
      )}
    </div>
  );
}

type MarginRateInputProps = {
  value: number;
  onChange: (rate: number) => void;
};

function MarginRateInput({ value, onChange }: MarginRateInputProps) {
  return (
    <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/30">
      <Percent className="h-5 w-5 text-muted-foreground" />
      <div className="flex-1">
        <Label>Taux de marque</Label>
        <p className="text-sm text-muted-foreground">
          Marge appliquée sur le prix de base
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          value={value}
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          className="w-20 text-center font-mono"
          min={0}
          max={100}
          step={0.1}
        />
        <span>%</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Modals: View + Edit + Delete
// ─────────────────────────────────────────────

type ViewEditDeleteModalsProps = {
  isViewModalOpen: boolean;
  onViewModalOpenChange: (open: boolean) => void;
  viewItem: SelectionItem | null;
  isEditModalOpen: boolean;
  onEditModalOpenChange: (open: boolean) => void;
  editItem: SelectionItem | null;
  isSavingItem: boolean;
  deleteItemId: string | null;
  isRemoving: boolean;
  onDeleteOpenChange: (open: boolean) => void;
  onSaveFromDetail: (
    itemId: string,
    updates: { marginRate?: number; customPriceHT?: number }
  ) => Promise<void>;
  onConfirmDelete: () => Promise<void>;
};

export function ViewEditDeleteModals({
  isViewModalOpen,
  onViewModalOpenChange,
  viewItem,
  isEditModalOpen,
  onEditModalOpenChange,
  editItem,
  isSavingItem,
  deleteItemId,
  isRemoving,
  onDeleteOpenChange,
  onSaveFromDetail,
  onConfirmDelete,
}: ViewEditDeleteModalsProps) {
  return (
    <>
      <SelectionProductDetailModal
        open={isViewModalOpen}
        onOpenChange={onViewModalOpenChange}
        item={viewItem}
        mode="view"
      />
      <SelectionProductDetailModal
        open={isEditModalOpen}
        onOpenChange={onEditModalOpenChange}
        item={editItem}
        onSave={onSaveFromDetail}
        isSaving={isSavingItem}
      />
      <ConfirmDialog
        open={deleteItemId !== null}
        onOpenChange={open => {
          if (!open) onDeleteOpenChange(false);
        }}
        variant="destructive"
        title="Supprimer définitivement ce produit ?"
        description="Le produit sera retiré de cette sélection. Cette action est irréversible."
        confirmText="Supprimer"
        onConfirm={onConfirmDelete}
        loading={isRemoving}
      />
    </>
  );
}
