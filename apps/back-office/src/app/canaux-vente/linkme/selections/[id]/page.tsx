'use client';

import { useState, useEffect, use } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { ProductThumbnail } from '@verone/products';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Textarea,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Skeleton,
} from '@verone/ui';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Pencil,
  Package,
  ShoppingCart,
  ExternalLink,
  Loader2,
  Percent,
  Search,
  X,
  Store,
  BookOpen,
} from 'lucide-react';

import { MarginSliderCompact } from '../../components/MarginSlider';
import { SelectionProductDetailModal } from '../../components/SelectionProductDetailModal';
import {
  useLinkMeSelection,
  useLinkMeCatalogProducts,
  useEnseigneSourcedProducts,
  useUpdateSelection,
  useAddProductToSelection,
  useRemoveProductFromSelection,
  useUpdateProductMargin,
  type SelectionItem,
  type SourcedProduct,
} from '../../hooks/use-linkme-selections';

// Types pour le catalogue
interface CatalogProduct {
  id: string;
  product_id: string;
  product_name: string;
  product_reference: string;
  product_price_ht: number;
  product_image_url: string | null;
  suggested_margin_rate: number | null;
  min_margin_rate: number | null;
  max_margin_rate: number | null;
}

// Configuration des statuts
const statusConfig = {
  draft: { label: 'Brouillon', variant: 'secondary' as const },
  active: { label: 'Active', variant: 'default' as const },
  archived: { label: 'Archivée', variant: 'outline' as const },
};

export default function SelectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  // Hooks de données
  const { data: selection, isLoading, error } = useLinkMeSelection(id);
  const { data: catalogProducts } = useLinkMeCatalogProducts();
  // Récupérer enseigne_id: d'abord directement, sinon via l'organisation de l'affilié
  const enseigneId =
    selection?.affiliate?.enseigne_id ||
    selection?.affiliate?.organisation?.enseigne_id ||
    null;
  const { data: sourcedProducts } = useEnseigneSourcedProducts(enseigneId);
  const updateSelection = useUpdateSelection();
  const addProduct = useAddProductToSelection();
  const removeProduct = useRemoveProductFromSelection();

  // États du formulaire
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'draft' as 'draft' | 'active' | 'archived',
    is_public: false,
  });
  const [isDirty, setIsDirty] = useState(false);

  // Modal ajout produit
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null
  );
  const [newMarginRate, setNewMarginRate] = useState<number>(10);
  const [productSource, setProductSource] = useState<'catalog' | 'sourced'>(
    'catalog'
  );

  // Modal Vue produit (READ-ONLY) - ouvert par Eye
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewItem, setViewItem] = useState<SelectionItem | null>(null);

  // Modal Édition produit (avec jauge de marge interactive) - ouvert par Pencil
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<SelectionItem | null>(null);
  const updateMargin = useUpdateProductMargin();

  // Note: Les marges ne sont plus éditables depuis cette vue
  // L'utilisateur doit aller dans la page détail du produit pour modifier

  // Synchroniser le formulaire avec les données
  useEffect(() => {
    if (selection) {
      setFormData({
        name: selection.name || '',
        description: selection.description || '',
        status:
          (selection.status as 'draft' | 'active' | 'archived') || 'draft',
        is_public: selection.is_public || false,
      });
    }
  }, [selection]);

  // Sauvegarder les modifications
  const handleSave = async () => {
    if (!selection) return;
    await updateSelection.mutateAsync({
      selectionId: selection.id,
      data: formData,
    });
    setIsDirty(false);
  };

  // Produits filtrés (catalogue sans les produits déjà dans la sélection)
  const existingProductIds = new Set(
    selection?.items?.map(i => i.product_id) || []
  );
  const availableCatalogProducts =
    catalogProducts?.filter(
      (p: CatalogProduct) => !existingProductIds.has(p.product_id)
    ) || [];

  const filteredCatalogProducts = availableCatalogProducts.filter(
    (p: CatalogProduct) =>
      p.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.product_reference.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Produits sourcés filtrés (sans les produits déjà dans la sélection)
  const availableSourcedProducts =
    sourcedProducts?.filter(
      (p: SourcedProduct) => !existingProductIds.has(p.id)
    ) || [];

  const filteredSourcedProducts = availableSourcedProducts.filter(
    (p: SourcedProduct) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.supplier_reference &&
        p.supplier_reference.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Nombre de produits sourcés disponibles (pour afficher/masquer l'onglet)
  const hasSourcedProducts = (sourcedProducts?.length || 0) > 0;

  // Ajouter un produit (catalogue ou sourcé)
  const handleAddProduct = async () => {
    if (!selection || !selectedProductId) return;

    let basePriceHt: number;

    if (productSource === 'catalog') {
      const product = catalogProducts?.find(
        (p: CatalogProduct) => p.product_id === selectedProductId
      );
      if (!product) return;
      basePriceHt = product.product_price_ht;
    } else {
      const product = sourcedProducts?.find(
        (p: SourcedProduct) => p.id === selectedProductId
      );
      if (!product) return;
      // Pour les produits sourcés, utiliser le prix de vente (selling_price_ht)
      basePriceHt = product.selling_price_ht;
    }

    await addProduct.mutateAsync({
      selectionId: selection.id,
      productData: {
        product_id: selectedProductId,
        margin_rate: newMarginRate,
        base_price_ht: basePriceHt,
      },
    });

    setIsAddModalOpen(false);
    setSelectedProductId(null);
    setNewMarginRate(10);
    setSearchQuery('');
    setProductSource('catalog');
  };

  // Retirer un produit
  const handleRemoveProduct = async (itemId: string) => {
    if (!selection) return;
    await removeProduct.mutateAsync({
      selectionId: selection.id,
      itemId,
    });
  };

  // Ouvrir la modal Vue produit (READ-ONLY) - Eye button
  const handleOpenViewModal = (item: SelectionItem) => {
    setViewItem(item);
    setIsViewModalOpen(true);
  };

  // Ouvrir la modal Édition produit (avec jauge de marge) - Pencil button
  const handleOpenEditModal = (item: SelectionItem) => {
    setEditItem(item);
    setIsEditModalOpen(true);
  };

  // Sauvegarder depuis le modal de détail (marge + prix de vente)
  const handleSaveFromDetail = async (
    itemId: string,
    updates: { marginRate?: number; customPriceHT?: number }
  ) => {
    if (!selection) return;
    // Mettre à jour la marge si fournie
    if (updates.marginRate !== undefined) {
      await updateMargin.mutateAsync({
        itemId,
        marginRate: updates.marginRate,
        selectionId: selection.id,
      });
    }
    // Note: customPriceHT sera géré par un hook séparé si nécessaire
    // Pour l'instant, on met à jour uniquement la marge
  };

  // Déterminer la couleur de l'indicateur de marge (Traffic Light System)
  // Vert: 0-15% (compétitif), Orange: 15-25% (modéré), Rouge: >25% (élevé)
  const getMarginIndicatorColor = (
    marginRate: number
  ): 'green' | 'orange' | 'red' => {
    if (marginRate <= 15) return 'green';
    if (marginRate <= 25) return 'orange';
    return 'red';
  };

  const marginIndicatorColors = {
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
  };

  const marginIndicatorTooltips = {
    green: 'Marge compétitive (≤15%)',
    orange: 'Marge modérée (15-25%)',
    red: 'Marge élevée (>25%)',
  };

  // Loading
  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64 col-span-2" />
          <Skeleton className="h-64" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  // Erreur
  if (error || !selection) {
    return (
      <div className="container mx-auto py-6">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">
              Erreur lors du chargement de la sélection.
            </p>
            <button
              onClick={() => router.back()}
              className="inline-flex items-center justify-center mt-4 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center justify-center h-10 w-10 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">{selection.name}</h1>
            <p className="text-muted-foreground">
              Par {selection.affiliate?.display_name || 'Affilié inconnu'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selection.status === 'active' && selection.share_token && (
            <a
              href={`https://linkme.verone.fr/s/${selection.share_token}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Voir la boutique
            </a>
          )}
          <Button
            onClick={handleSave}
            disabled={!isDirty || updateSelection.isPending}
          >
            {updateSelection.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Enregistrer
          </Button>
        </div>
      </div>

      {/* Infos & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Informations */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Informations</CardTitle>
            <CardDescription>
              Modifiez les détails de la sélection
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e => {
                    setFormData(prev => ({ ...prev, name: e.target.value }));
                    setIsDirty(true);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Statut</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'draft' | 'active' | 'archived') => {
                    setFormData(prev => ({ ...prev, status: value }));
                    setIsDirty(true);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Brouillon</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archivée</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={e => {
                  setFormData(prev => ({
                    ...prev,
                    description: e.target.value,
                  }));
                  setIsDirty(true);
                }}
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                {formData.is_public ? (
                  <Eye className="h-5 w-5 text-primary" />
                ) : (
                  <EyeOff className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <p className="font-medium">Visibilité publique</p>
                  <p className="text-sm text-muted-foreground">
                    {formData.is_public
                      ? 'Visible par tous'
                      : 'Visible uniquement par le réseau'}
                  </p>
                </div>
              </div>
              <Switch
                checked={formData.is_public}
                onCheckedChange={checked => {
                  setFormData(prev => ({ ...prev, is_public: checked }));
                  setIsDirty(true);
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Statistiques */}
        <Card>
          <CardHeader>
            <CardTitle>Statistiques</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Package className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">
                  {selection.products_count || 0}
                </p>
                <p className="text-sm text-muted-foreground">Produits</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Eye className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">
                  {selection.views_count || 0}
                </p>
                <p className="text-sm text-muted-foreground">Vues</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <ShoppingCart className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">
                  {selection.orders_count || 0}
                </p>
                <p className="text-sm text-muted-foreground">Commandes</p>
              </div>
            </div>
            <div className="pt-2">
              <Badge
                variant={statusConfig[formData.status]?.variant || 'secondary'}
              >
                {statusConfig[formData.status]?.label || formData.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Produits */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Produits de la sélection</CardTitle>
            <CardDescription>
              Gérez les produits et leurs taux de marque
            </CardDescription>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un produit
          </Button>
        </CardHeader>
        <CardContent>
          {selection.items && selection.items.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Image</TableHead>
                  <TableHead>Produit</TableHead>
                  <TableHead className="text-right">
                    Prix HT (+ comm.)
                  </TableHead>
                  <TableHead className="text-center w-32">Marge %</TableHead>
                  <TableHead className="text-right">Marge nette €</TableHead>
                  <TableHead className="text-right">Prix vente HT</TableHead>
                  <TableHead className="text-right w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selection.items.map((item: SelectionItem) => {
                  const marginRate = item.margin_rate;
                  const commissionRate = (item.commission_rate || 0) / 100; // Conversion % → décimal (5.00 → 0.05)

                  // Calculs selon les formules du plan
                  // Prix HT (+ commission) = base × (1 + commission)
                  const priceWithCommission =
                    item.base_price_ht * (1 + commissionRate);
                  // Marge nette en € = base × (margin_rate / 100)
                  const marginNetEuros =
                    item.base_price_ht * (marginRate / 100);
                  // Prix vente total HT = base × (1 + margin_rate/100) × (1 + commission)
                  const totalSellingPrice =
                    item.base_price_ht *
                    (1 + marginRate / 100) *
                    (1 + commissionRate);

                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <ProductThumbnail
                          src={item.product_image_url}
                          alt={item.product?.name || 'Produit'}
                          size="sm"
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          {item.channel_pricing_id ? (
                            <Link
                              href={`/canaux-vente/linkme/catalogue/${item.channel_pricing_id}`}
                              className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              {item.product?.name}
                            </Link>
                          ) : (
                            <p className="font-medium">{item.product?.name}</p>
                          )}
                          <p className="text-sm text-muted-foreground">
                            {item.product?.sku}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        <div className="space-y-0.5">
                          {/* Prix de vente complet HT (base + commission) */}
                          <div>
                            <span>{priceWithCommission.toFixed(2)} €</span>
                            {commissionRate > 0 && (
                              <span className="text-xs text-muted-foreground ml-1">
                                (+{(commissionRate * 100).toFixed(0)}%)
                              </span>
                            )}
                          </div>
                          {/* Prix client LinkMe (calculé) - affiché SEULEMENT si inférieur au prix sélection */}
                          {(() => {
                            if (item.catalog_price_ht == null) return null;
                            const catalogCommRate =
                              (item.commission_rate || 0) / 100; // Conversion % → décimal
                            const prixClientLinkMe =
                              item.catalog_price_ht * (1 + catalogCommRate);
                            // Afficher uniquement si prix sélection < prix catalogue LinkMe
                            if (priceWithCommission >= prixClientLinkMe)
                              return null;
                            return (
                              <div className="text-xs text-blue-600">
                                ({prixClientLinkMe.toFixed(2)} € Prix client
                                LinkMe (calculé))
                              </div>
                            );
                          })()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {/* Indicateur de marge (Traffic Light) */}
                          <div
                            className={`w-2.5 h-2.5 rounded-full ${marginIndicatorColors[getMarginIndicatorColor(marginRate)]} shrink-0`}
                            title={
                              marginIndicatorTooltips[
                                getMarginIndicatorColor(marginRate)
                              ]
                            }
                          />
                          {/* Marge en lecture seule avec décimales */}
                          <span className="font-mono text-sm">
                            {marginRate.toFixed(2)} %
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-green-600">
                        {marginNetEuros.toFixed(2)} €
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        {totalSellingPrice.toFixed(2)} €
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Bouton Vue (READ-ONLY) */}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-gray-600 hover:text-gray-700"
                            onClick={() => handleOpenViewModal(item)}
                            title="Voir fiche"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {/* Bouton Édition (Pencil) */}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-blue-600 hover:text-blue-700"
                            onClick={() => handleOpenEditModal(item)}
                            title="Modifier"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {/* Bouton Supprimer */}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleRemoveProduct(item.id)}
                            disabled={removeProduct.isPending}
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun produit dans cette sélection</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setIsAddModalOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter des produits
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Ajout Produit */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ajouter un produit</DialogTitle>
            <DialogDescription>
              Sélectionnez un produit du catalogue LinkMe ou des produits
              sourcés
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Onglets source */}
            <div className="flex gap-2 border-b">
              <button
                type="button"
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  productSource === 'catalog'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => {
                  setProductSource('catalog');
                  setSelectedProductId(null);
                  setSearchQuery('');
                }}
              >
                <BookOpen className="h-4 w-4" />
                Catalogue LinkMe ({availableCatalogProducts.length})
              </button>
              {hasSourcedProducts && (
                <button
                  type="button"
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    productSource === 'sourced'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => {
                    setProductSource('sourced');
                    setSelectedProductId(null);
                    setSearchQuery('');
                  }}
                >
                  <Store className="h-4 w-4" />
                  Produits sourcés ({availableSourcedProducts.length})
                </button>
              )}
            </div>

            {/* Recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={
                  productSource === 'catalog'
                    ? 'Rechercher dans le catalogue...'
                    : 'Rechercher un produit sourcé...'
                }
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            {/* Liste des produits (Catalogue) */}
            {productSource === 'catalog' && (
              <div className="max-h-64 overflow-y-auto border rounded-lg">
                {filteredCatalogProducts.length > 0 ? (
                  filteredCatalogProducts
                    .slice(0, 20)
                    .map((product: CatalogProduct) => (
                      <div
                        key={product.product_id}
                        className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 border-b last:border-b-0 ${
                          selectedProductId === product.product_id
                            ? 'bg-primary/10'
                            : ''
                        }`}
                        onClick={() => {
                          setSelectedProductId(product.product_id);
                          setNewMarginRate(product.suggested_margin_rate || 10);
                        }}
                      >
                        <ProductThumbnail
                          src={product.product_image_url}
                          alt={product.product_name}
                          size="xs"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {product.product_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {product.product_reference} -{' '}
                            {product.product_price_ht.toFixed(2)} €
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
            )}

            {/* Liste des produits (Sourcés) */}
            {productSource === 'sourced' && (
              <div className="max-h-64 overflow-y-auto border rounded-lg">
                {filteredSourcedProducts.length > 0 ? (
                  filteredSourcedProducts
                    .slice(0, 20)
                    .map((product: SourcedProduct) => (
                      <div
                        key={product.id}
                        className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 border-b last:border-b-0 ${
                          selectedProductId === product.id
                            ? 'bg-primary/10'
                            : ''
                        }`}
                        onClick={() => {
                          setSelectedProductId(product.id);
                          setNewMarginRate(10); // Marge par défaut pour produits sourcés
                        }}
                      >
                        <ProductThumbnail
                          src={product.primary_image_url}
                          alt={product.name}
                          size="xs"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">
                              {product.name}
                            </p>
                            <Badge
                              variant="outline"
                              className="text-xs bg-amber-50 text-amber-700 border-amber-200"
                            >
                              Sourcé
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {product.sku ||
                              product.supplier_reference ||
                              'Sans référence'}{' '}
                            - {product.selling_price_ht.toFixed(2)} € HT
                          </p>
                        </div>
                        {selectedProductId === product.id && (
                          <Badge>Sélectionné</Badge>
                        )}
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
            )}

            {/* Marge */}
            {selectedProductId && (
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
                    value={newMarginRate}
                    onChange={e =>
                      setNewMarginRate(parseFloat(e.target.value) || 0)
                    }
                    className="w-20 text-center font-mono"
                    min={0}
                    max={100}
                    step={0.1}
                  />
                  <span>%</span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleAddProduct}
              disabled={!selectedProductId || addProduct.isPending}
            >
              {addProduct.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Vue Produit (READ-ONLY) - Design Dribbble 2025 */}
      {isViewModalOpen && viewItem && (
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="pb-4 border-b">
              <DialogTitle className="text-2xl">Fiche Produit</DialogTitle>
              <DialogDescription className="text-slate-600">
                Informations détaillées du produit (lecture seule)
              </DialogDescription>
            </DialogHeader>

            {/* Layout Grid 2 colonnes (desktop) / Stack (mobile) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 py-6">
              {/* COLONNE GAUCHE: Image Produit */}
              <div className="flex flex-col items-center justify-start">
                <div className="w-full max-w-md aspect-square bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden">
                  <ProductThumbnail
                    src={viewItem.product_image_url}
                    alt={viewItem.product?.name || 'Produit'}
                    size="xl"
                    priority
                  />
                </div>
              </div>

              {/* COLONNE DROITE: Informations Produit */}
              <div className="space-y-6">
                {/* En-tête Produit */}
                <div className="space-y-3">
                  <h2 className="text-3xl font-semibold text-slate-900 leading-tight">
                    {viewItem.product?.name}
                  </h2>
                  <p className="text-sm text-slate-500 font-mono">
                    SKU: {viewItem.product?.sku}
                  </p>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2">
                    {viewItem.is_featured && (
                      <Badge className="bg-amber-500 hover:bg-amber-600">
                        Produit Vedette
                      </Badge>
                    )}
                    {viewItem.product?.category_name && (
                      <Badge
                        variant="outline"
                        className="border-blue-300 text-blue-700"
                      >
                        {viewItem.product.category_name}
                      </Badge>
                    )}
                    <Badge
                      variant={
                        viewItem.product?.product_status === 'active'
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {viewItem.product?.product_status === 'active'
                        ? 'Actif'
                        : 'Inactif'}
                    </Badge>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-200" />

                {/* Section Description */}
                {(viewItem.custom_description ||
                  viewItem.product?.description) && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                      Description
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {viewItem.custom_description ||
                        viewItem.product?.description}
                    </p>
                  </div>
                )}

                {/* Section Arguments de Vente */}
                {viewItem.product?.selling_points &&
                  viewItem.product.selling_points.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                        Arguments de Vente
                      </h3>
                      <ul className="space-y-1.5">
                        {viewItem.product.selling_points.map((point, idx) => (
                          <li
                            key={idx}
                            className="text-sm text-slate-600 flex items-start gap-2"
                          >
                            <span className="text-green-600 mt-0.5">•</span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
              </div>
            </div>

            {/* Section Tarification (pleine largeur) */}
            {(() => {
              // CALCULS IDENTIQUES AU TABLEAU pour cohérence
              const viewCommissionRate = (viewItem.commission_rate || 0) / 100;
              const viewMarginRate = viewItem.margin_rate || 0;
              // Prix client LinkMe (calculé) = base × (1 + commission)
              const viewPrixClientLinkMe =
                viewItem.base_price_ht * (1 + viewCommissionRate);
              // Prix vente total HT = base × (1 + margin_rate/100) × (1 + commission)
              const viewTotalSellingPrice =
                viewItem.base_price_ht *
                (1 + viewMarginRate / 100) *
                (1 + viewCommissionRate);
              // Marge nette en € = base × (margin_rate / 100)
              const viewMarginNetEuros =
                viewItem.base_price_ht * (viewMarginRate / 100);
              // Couleur de la marge
              const viewMarginColor = getMarginIndicatorColor(viewMarginRate);

              return (
                <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl border border-slate-200 p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-800">
                      Tarification
                    </h3>
                    {/* Prix Public HT - déplacé en haut à droite */}
                    {viewItem.public_price_ht && (
                      <div className="text-right">
                        <p className="text-xs text-slate-500">Prix Public HT</p>
                        <p className="text-lg font-bold text-slate-600 font-mono">
                          {viewItem.public_price_ht.toFixed(2)} €
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Grille de prix 5 cases (nouvelle organisation) */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {/* 1. Prix Base HT */}
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
                      <p className="text-xs text-slate-500 mb-1">
                        Prix Base HT
                      </p>
                      <p className="text-xl font-bold text-slate-800 font-mono">
                        {viewItem.base_price_ht.toFixed(2)} €
                      </p>
                    </div>

                    {/* 2. Commission LinkMe */}
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
                      <p className="text-xs text-slate-500 mb-1">
                        Commission LinkMe
                      </p>
                      <p className="text-xl font-bold text-purple-700 font-mono">
                        {(viewCommissionRate * 100).toFixed(1)}%
                      </p>
                    </div>

                    {/* 3. Prix Client LinkMe (calculé) - NOUVELLE LIGNE */}
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-200 bg-purple-50/50">
                      <p className="text-xs text-purple-600 mb-1 font-medium">
                        Prix Client LinkMe
                      </p>
                      <p className="text-xl font-bold text-purple-700 font-mono">
                        {viewPrixClientLinkMe.toFixed(2)} €
                      </p>
                      <p className="text-[10px] text-purple-500 mt-0.5">
                        {viewItem.base_price_ht.toFixed(2)}€ +{' '}
                        {(viewCommissionRate * 100).toFixed(1)}%
                      </p>
                    </div>

                    {/* 4. Marge Actuelle avec point couleur */}
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
                      <p className="text-xs text-slate-500 mb-1">
                        Marge Actuelle
                      </p>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded-full ${marginIndicatorColors[viewMarginColor]}`}
                          title={marginIndicatorTooltips[viewMarginColor]}
                        />
                        <p className="text-xl font-bold text-green-700 font-mono">
                          {viewMarginRate.toFixed(1)}%
                        </p>
                      </div>
                      <p className="text-xs text-green-600 mt-0.5 font-mono">
                        +{viewMarginNetEuros.toFixed(2)} €
                      </p>
                    </div>

                    {/* 5. Prix Vente HT (avec commission) - CALCULÉ comme le tableau */}
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-300">
                      <p className="text-xs text-blue-600 mb-1 font-medium">
                        Prix Vente HT
                      </p>
                      <p className="text-xl font-bold text-blue-700 font-mono">
                        {viewTotalSellingPrice.toFixed(2)} €
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        avec marge + comm.
                      </p>
                    </div>
                  </div>

                  {/* Jauge de Marge avec indicateur point */}
                  {viewItem.min_margin_rate != null &&
                    viewItem.max_margin_rate != null && (
                      <div className="mt-4 space-y-2">
                        {/* Barre de marge avec point indicateur */}
                        <div className="relative">
                          <div className="flex h-3 w-full overflow-hidden rounded-full">
                            <div
                              className="bg-green-500"
                              style={{
                                width: `${viewItem.max_margin_rate > 0 ? ((viewItem.suggested_margin_rate || viewItem.max_margin_rate / 3) / viewItem.max_margin_rate) * 100 : 33.33}%`,
                              }}
                            />
                            <div
                              className="bg-orange-500"
                              style={{
                                width: `${viewItem.max_margin_rate > 0 ? ((viewItem.suggested_margin_rate || viewItem.max_margin_rate / 3) / viewItem.max_margin_rate) * 100 : 33.33}%`,
                              }}
                            />
                            <div className="flex-1 bg-red-500" />
                          </div>
                          {/* Point indicateur de la marge actuelle */}
                          {viewItem.max_margin_rate > 0 && (
                            <div
                              className="absolute top-1/2 -translate-y-1/2 transition-all"
                              style={{
                                left: `${Math.min((viewMarginRate / viewItem.max_margin_rate) * 100, 100)}%`,
                              }}
                            >
                              <div
                                className={`h-5 w-5 -ml-2.5 rounded-full border-2 border-white shadow-md ${marginIndicatorColors[viewMarginColor]}`}
                              />
                            </div>
                          )}
                        </div>
                        {/* Labels min/max */}
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>
                            Min: {viewItem.min_margin_rate.toFixed(0)}%
                          </span>
                          {viewItem.suggested_margin_rate != null && (
                            <span className="text-green-600 font-medium">
                              Suggéré:{' '}
                              {viewItem.suggested_margin_rate.toFixed(0)}%
                            </span>
                          )}
                          <span>
                            Max: {viewItem.max_margin_rate.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    )}
                </div>
              );
            })()}

            {/* Section Informations Complémentaires */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                Informations Complémentaires
              </h3>

              <div className="grid grid-cols-2 gap-4 text-sm">
                {viewItem.product?.supplier_name && (
                  <div>
                    <p className="text-slate-500 mb-1">Fournisseur</p>
                    <p className="font-medium text-slate-800">
                      {viewItem.product.supplier_name}
                    </p>
                  </div>
                )}

                {viewItem.product?.weight_kg && (
                  <div>
                    <p className="text-slate-500 mb-1">Poids</p>
                    <p className="font-medium text-slate-800">
                      {viewItem.product.weight_kg} kg
                    </p>
                  </div>
                )}

                {viewItem.product?.dimensions_cm && (
                  <div>
                    <p className="text-slate-500 mb-1">Dimensions</p>
                    <p className="font-medium text-slate-800">
                      {(() => {
                        const d = viewItem.product.dimensions_cm;
                        const parts: string[] = [];
                        if (d.length || d.longueur || d.L)
                          parts.push(`L: ${d.length || d.longueur || d.L} cm`);
                        if (d.width || d.largeur || d.l)
                          parts.push(`l: ${d.width || d.largeur || d.l} cm`);
                        if (d.height || d.hauteur || d.H || d.h)
                          parts.push(
                            `H: ${d.height || d.hauteur || d.H || d.h} cm`
                          );
                        if (d.diameter || d.diametre)
                          parts.push(`Ø: ${d.diameter || d.diametre} cm`);
                        return parts.length > 0
                          ? parts.join(' × ')
                          : JSON.stringify(d);
                      })()}
                    </p>
                  </div>
                )}

                {viewItem.product?.category_name && (
                  <div>
                    <p className="text-slate-500 mb-1">Sous-catégorie</p>
                    <p className="font-medium text-slate-800">
                      {viewItem.product.category_name}
                    </p>
                  </div>
                )}

                {viewItem.product?.product_status && (
                  <div>
                    <p className="text-slate-500 mb-1">Statut Produit</p>
                    <p className="font-medium text-slate-800 capitalize">
                      {viewItem.product.product_status}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Buttons */}
            <DialogFooter className="pt-4 border-t gap-2">
              {viewItem.channel_pricing_id && (
                <Link
                  href={`/canaux-vente/linkme/catalogue/${viewItem.channel_pricing_id}`}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium border border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-700 h-10 px-4 py-2 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  Voir dans catalogue
                </Link>
              )}
              <Button
                variant="outline"
                onClick={() => setIsViewModalOpen(false)}
              >
                Fermer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal Édition Produit (avec jauge de marge interactive) - Pencil button */}
      <SelectionProductDetailModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        item={editItem}
        onSave={handleSaveFromDetail}
        isSaving={updateMargin.isPending}
      />
    </div>
  );
}
