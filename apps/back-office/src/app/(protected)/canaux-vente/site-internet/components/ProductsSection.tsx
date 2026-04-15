'use client';

import { useState, useMemo, useCallback } from 'react';

import { useToast } from '@verone/common/hooks';
import { useDebounce } from '@verone/hooks';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ErrorStateCard,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  ButtonV2,
} from '@verone/ui';
import { Plus, Search, Loader2 } from 'lucide-react';

import {
  useSiteInternetProducts,
  useToggleProductPublication,
  useRemoveProductFromSiteInternet,
  useAddProductsToSiteInternet,
  useAddVariantGroupToSiteInternet,
} from '../hooks/use-site-internet-products';
import type { SiteInternetProduct } from '../types';
import { ProductsTable } from './ProductsTable';
import { ProductsModals } from './ProductsModals';

export function ProductsSection() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'published' | 'draft'
  >('all');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [productToRemove, setProductToRemove] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] =
    useState<SiteInternetProduct | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewProduct, setPreviewProduct] =
    useState<SiteInternetProduct | null>(null);
  const [addProductsOpen, setAddProductsOpen] = useState(false);
  const [addVariantGroupOpen, setAddVariantGroupOpen] = useState(false);

  const {
    data: products = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useSiteInternetProducts();
  const togglePublication = useToggleProductPublication();
  const removeProduct = useRemoveProductFromSiteInternet();
  const addProducts = useAddProductsToSiteInternet();
  const addVariantGroup = useAddVariantGroupToSiteInternet();

  const filteredProducts = useMemo(
    () =>
      products.filter(product => {
        const matchesSearch =
          product.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          product.sku.toLowerCase().includes(debouncedSearch.toLowerCase());
        const matchesStatus =
          statusFilter === 'all' ||
          (statusFilter === 'published' && product.is_published) ||
          (statusFilter === 'draft' && !product.is_published);
        return matchesSearch && matchesStatus;
      }),
    [products, debouncedSearch, statusFilter]
  );

  const handleTogglePublish = useCallback(
    async (productId: string, isPublished: boolean) => {
      try {
        await togglePublication.mutateAsync({
          productId,
          isPublished: !isPublished,
        });
        toast({
          title: isPublished ? 'Produit depublie' : 'Produit publie',
          description: `Le produit a ete ${isPublished ? 'retire du' : 'ajoute au'} site internet.`,
        });
      } catch {
        toast({
          title: 'Erreur',
          description: 'Impossible de modifier le statut du produit.',
          variant: 'destructive',
        });
      }
    },
    [togglePublication, toast]
  );

  const handleRemove = useCallback((productId: string) => {
    setProductToRemove(productId);
    setConfirmDialogOpen(true);
  }, []);
  const confirmRemove = useCallback(async () => {
    if (!productToRemove) return;
    try {
      await removeProduct.mutateAsync(productToRemove);
      toast({
        title: 'Produit retire',
        description: 'Le produit a ete retire du site internet.',
      });
    } catch {
      toast({
        title: 'Erreur',
        description: 'Impossible de retirer le produit.',
        variant: 'destructive',
      });
    }
  }, [productToRemove, removeProduct, toast]);

  if (isLoading)
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  if (isError)
    return (
      <ErrorStateCard
        title="Erreur de chargement"
        message={
          error instanceof Error
            ? error.message
            : 'Impossible de charger les produits.'
        }
        variant="destructive"
        onRetry={() => {
          void refetch().catch(err => {
            console.error('[ProductsSection] refetch failed:', err);
          });
        }}
      />
    );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Produits Site Internet</CardTitle>
              <CardDescription>
                {filteredProducts.length} produits (
                {products.filter(p => p.is_published).length} publies)
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <ButtonV2
                variant="outline"
                onClick={() => setAddVariantGroupOpen(true)}
              >
                Ajouter variantes
              </ButtonV2>
              <ButtonV2 onClick={() => setAddProductsOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter des produits
              </ButtonV2>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom ou SKU..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value: 'all' | 'published' | 'draft') =>
                setStatusFilter(value)
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les produits</SelectItem>
                <SelectItem value="published">Publies</SelectItem>
                <SelectItem value="draft">Brouillons</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <ProductsTable
            products={filteredProducts}
            isPendingToggle={togglePublication.isPending}
            isPendingRemove={removeProduct.isPending}
            onTogglePublish={(id, isPublished) => {
              void handleTogglePublish(id, isPublished).catch(err => {
                console.error(
                  '[ProductsSection] handleTogglePublish failed:',
                  err
                );
              });
            }}
            onEdit={product => {
              setSelectedProduct(product);
              setEditModalOpen(true);
            }}
            onPreview={product => {
              setPreviewProduct(product);
              setPreviewModalOpen(true);
            }}
            onRemove={handleRemove}
          />
        </CardContent>
      </Card>

      <ProductsModals
        confirmDialogOpen={confirmDialogOpen}
        setConfirmDialogOpen={setConfirmDialogOpen}
        confirmRemove={confirmRemove}
        selectedProduct={selectedProduct}
        editModalOpen={editModalOpen}
        onCloseEditModal={() => {
          setEditModalOpen(false);
          setSelectedProduct(null);
        }}
        onEditSuccess={() => {
          void refetch().catch(err => {
            console.error('[ProductsSection] refetch failed:', err);
          });
          toast({
            title: 'Produit mis a jour',
            description: 'Les modifications ont ete enregistrees avec succes',
          });
        }}
        previewProduct={previewProduct}
        previewModalOpen={previewModalOpen}
        onClosePreviewModal={() => {
          setPreviewModalOpen(false);
          setPreviewProduct(null);
        }}
        addVariantGroupOpen={addVariantGroupOpen}
        onCloseVariantGroup={() => setAddVariantGroupOpen(false)}
        onConfirmVariantGroup={async (variantGroupId, customPriceHt) => {
          const count = await addVariantGroup.mutateAsync({
            variantGroupId,
            customPriceHt: customPriceHt,
          });
          toast({
            title: 'Groupe ajoute',
            description: `${String(count)} variantes ajoutees au site internet`,
          });
        }}
        existingProductIds={products.map(p => p.product_id)}
        addProductsOpen={addProductsOpen}
        onCloseAddProducts={() => setAddProductsOpen(false)}
        onSelectProducts={async selected => {
          await addProducts.mutateAsync(selected.map(p => p.id));
          setAddProductsOpen(false);
          toast({
            title: 'Produits ajoutes',
            description: `${String(selected.length)} produit(s) ajoute(s) au site internet`,
          });
        }}
        excludeProductIds={products.map(p => p.product_id)}
      />
    </div>
  );
}
