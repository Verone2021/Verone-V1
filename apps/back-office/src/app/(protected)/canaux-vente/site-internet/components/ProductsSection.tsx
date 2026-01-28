/**
 * Composant: ProductsSection
 * Gestion complète produits site internet (add/edit/delete + variantes)
 */

'use client';

import { useState, useMemo, useCallback } from 'react';

import Link from 'next/link';

import { useToast } from '@verone/common/hooks';
import { useDebounce } from '@verone/hooks';
import { ProductThumbnail } from '@verone/products';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { ConfirmDialog } from '@verone/ui';
import { ErrorStateCard } from '@verone/ui';
import { Input } from '@verone/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import { Switch } from '@verone/ui';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  FileText,
  Package,
  AlertCircle,
  CheckCircle,
  Loader2,
} from 'lucide-react';

import { EditSiteInternetProductModal } from './EditSiteInternetProductModal';
import { ProductPreviewModal } from './ProductPreviewModal';

// Hooks
import {
  useSiteInternetProducts,
  useToggleProductPublication,
  useRemoveProductFromSiteInternet,
} from '../hooks/use-site-internet-products';

/**
 * Section Produits Principale
 */
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
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewProduct, setPreviewProduct] = useState<any>(null);

  // Hooks
  const {
    data: products = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useSiteInternetProducts();
  const togglePublication = useToggleProductPublication();
  const removeProduct = useRemoveProductFromSiteInternet();

  // Filtrage produits (memoized avec debounce)
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

  // Handlers (memoized)
  const handleTogglePublish = useCallback(
    async (productId: string, isPublished: boolean) => {
      try {
        await togglePublication.mutateAsync({
          productId,
          isPublished: !isPublished,
        });
        toast({
          title: isPublished ? 'Produit dépublié' : 'Produit publié',
          description: `Le produit a été ${isPublished ? 'retiré du' : 'ajouté au'} site internet.`,
        });
      } catch (_error) {
        toast({
          title: 'Erreur',
          description: 'Impossible de modifier le statut du produit.',
          variant: 'destructive',
        });
      }
    },
    [togglePublication, toast]
  );

  const handleRemove = useCallback(
    (productId: string) => {
      setProductToRemove(productId);
      setConfirmDialogOpen(true);
    },
    [setProductToRemove, setConfirmDialogOpen]
  );

  const confirmRemove = useCallback(async () => {
    if (!productToRemove) return;

    try {
      await removeProduct.mutateAsync(productToRemove);
      toast({
        title: 'Produit retiré',
        description: 'Le produit a été retiré du site internet.',
      });
    } catch (_error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de retirer le produit.',
        variant: 'destructive',
      });
    }
  }, [productToRemove, removeProduct, toast]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <ErrorStateCard
        title="Erreur de chargement"
        message={
          error instanceof Error
            ? error.message
            : 'Impossible de charger les produits. Veuillez réessayer.'
        }
        variant="destructive"
        onRetry={() => {
          void refetch().catch(error => {
            console.error('[ProductsSection] refetch failed:', error);
          });
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Produits Site Internet</CardTitle>
              <CardDescription>
                {filteredProducts.length} produits (
                {products.filter(p => p.is_published).length} publiés)
              </CardDescription>
            </div>
            <ButtonV2
              onClick={() => {
                toast({
                  title: 'Fonctionnalité à venir',
                  description: "Modal d'ajout de produits (à implémenter)",
                });
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter des produits
            </ButtonV2>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtres */}
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
              onValueChange={(value: any) => setStatusFilter(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les produits</SelectItem>
                <SelectItem value="published">Publiés</SelectItem>
                <SelectItem value="draft">Brouillons</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table Produits */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Produit</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Variantes</TableHead>
                <TableHead>Prix</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Éligibilité</TableHead>
                <TableHead>Publié</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Package className="h-8 w-8 opacity-50" />
                      <p>Aucun produit trouvé</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map(product => (
                  <TableRow key={product.product_id}>
                    {/* Image */}
                    <TableCell>
                      <ProductThumbnail
                        src={product.primary_image_url}
                        alt={product.name}
                        size="sm"
                      />
                    </TableCell>

                    {/* Nom */}
                    <TableCell className="font-medium">
                      {product.name}
                    </TableCell>

                    {/* SKU */}
                    <TableCell className="text-sm text-muted-foreground">
                      {product.sku}
                    </TableCell>

                    {/* Variantes */}
                    <TableCell>
                      {product.has_variants ? (
                        <Badge variant="outline">
                          {product.variants_count} variantes
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    {/* Prix */}
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">
                          {product.price_ttc.toFixed(2)} € TTC
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {product.price_source === 'channel_pricing'
                            ? 'Prix canal'
                            : 'Prix base'}
                        </div>
                      </div>
                    </TableCell>

                    {/* Statut */}
                    <TableCell>
                      <Badge
                        variant={
                          product.status === 'active' ? 'default' : 'secondary'
                        }
                      >
                        {product.status}
                      </Badge>
                    </TableCell>

                    {/* Éligibilité */}
                    <TableCell>
                      {product.is_eligible ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm">Éligible</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-orange-600">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-sm">Non éligible</span>
                        </div>
                      )}
                    </TableCell>

                    {/* Toggle Publication */}
                    <TableCell>
                      <Switch
                        checked={product.is_published}
                        onCheckedChange={() => {
                          void handleTogglePublish(
                            product.product_id,
                            product.is_published
                          ).catch(error => {
                            console.error(
                              '[ProductsSection] handleTogglePublish failed:',
                              error
                            );
                          });
                        }}
                        disabled={togglePublication.isPending}
                      />
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/canaux-vente/site-internet/produits/${product.product_id}`}
                        >
                          <ButtonV2
                            variant="ghost"
                            size="sm"
                            title="Voir détails"
                          >
                            <FileText className="h-4 w-4" />
                          </ButtonV2>
                        </Link>
                        <ButtonV2
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedProduct(product);
                            setEditModalOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </ButtonV2>
                        <ButtonV2
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setPreviewProduct(product);
                            setPreviewModalOpen(true);
                          }}
                          title="Prévisualiser le produit"
                        >
                          <Eye className="h-4 w-4" />
                        </ButtonV2>
                        <ButtonV2
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemove(product.product_id)}
                          disabled={removeProduct.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </ButtonV2>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        title="Retirer ce produit ?"
        description="Êtes-vous sûr de vouloir retirer ce produit du site internet ? Cette action ne supprimera pas le produit de votre catalogue, elle le retirera seulement du site."
        variant="destructive"
        confirmText="Retirer"
        cancelText="Annuler"
        onConfirm={confirmRemove}
      />

      {/* Modal édition produit */}
      {selectedProduct && (
        <EditSiteInternetProductModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedProduct(null);
          }}
          product={selectedProduct}
          onSuccess={() => {
            void refetch().catch(error => {
              console.error(
                '[ProductsSection] refetch (onSuccess) failed:',
                error
              );
            });
            toast({
              title: 'Produit mis à jour',
              description: 'Les modifications ont été enregistrées avec succès',
            });
          }}
        />
      )}

      {/* Modal prévisualisation produit */}
      <ProductPreviewModal
        product={previewProduct}
        isOpen={previewModalOpen}
        onClose={() => {
          setPreviewModalOpen(false);
          setPreviewProduct(null);
        }}
      />
    </div>
  );
}
