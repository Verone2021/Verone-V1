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
  Tabs,
  TabsList,
  TabsTrigger,
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

import { SelectionProductDetailModal } from '../../components/SelectionProductDetailModal';
import {
  useLinkMeCatalogProducts,
  type LinkMeCatalogProduct,
} from '../../hooks/use-linkme-catalog';
import {
  useLinkMeSelection,
  useEnseigneSourcedProducts,
  useUpdateSelection,
  useAddProductToSelection,
  useRemoveProductFromSelection,
  useUpdateProductMargin,
  useUpdateSelectionItem,
  type SelectionItem,
  type SourcedProduct,
} from '../../hooks/use-linkme-selections';
// Import du hook catalogue avec les BONS prix (depuis channel_pricing)

// Type alias pour compatibilité
type CatalogProduct = LinkMeCatalogProduct;

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
    archived_at: null as string | null,
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
  const _updateMargin = useUpdateProductMargin();
  const updateItem = useUpdateSelectionItem();

  // Onglet sélectionné pour filtrer produits Catalogue vs Revendeur
  const [productTab, setProductTab] = useState<'all' | 'catalog' | 'reseller'>(
    'all'
  );

  // Note: Les marges ne sont plus éditables depuis cette vue
  // L'utilisateur doit aller dans la page détail du produit pour modifier

  // Synchroniser le formulaire avec les données
  useEffect(() => {
    if (selection) {
      setFormData({
        name: selection.name || '',
        description: selection.description || '',
        archived_at: selection.archived_at || null,
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
      // Utiliser le prix de vente HT (custom_price_ht de channel_pricing)
      // Fallback sur prix d'achat si pas de prix de vente défini
      basePriceHt =
        product.product_selling_price_ht ?? product.product_price_ht;
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

    // Utiliser useUpdateSelectionItem pour MAJ marge ET prix en une seule requête
    const updateData: { margin_rate?: number; base_price_ht?: number } = {};

    if (updates.marginRate !== undefined) {
      updateData.margin_rate = updates.marginRate;
    }
    if (updates.customPriceHT !== undefined) {
      updateData.base_price_ht = updates.customPriceHT;
    }

    if (Object.keys(updateData).length > 0) {
      await updateItem.mutateAsync({
        itemId,
        selectionId: selection.id,
        data: updateData,
      });
    }
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
          {selection.archived_at === null && selection.share_token && (
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
                variant={selection.archived_at ? 'outline' : 'default'}
                className={
                  selection.archived_at
                    ? 'bg-gray-50 text-gray-500'
                    : 'bg-green-100 text-green-700'
                }
              >
                {selection.archived_at ? 'Archivée' : 'Active'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Produits */}
      <Card>
        <CardHeader className="flex flex-col gap-4">
          <div className="flex flex-row items-center justify-between">
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
          </div>
          {/* Onglets Catalogue / Revendeur */}
          <Tabs
            value={productTab}
            onValueChange={v =>
              setProductTab(v as 'all' | 'catalog' | 'reseller')
            }
          >
            <TabsList>
              <TabsTrigger value="all" className="gap-2">
                <Package className="h-4 w-4" />
                Tous ({selection.items?.length ?? 0})
              </TabsTrigger>
              <TabsTrigger value="catalog" className="gap-2">
                <BookOpen className="h-4 w-4" />
                Catalogue (
                {selection.items?.filter(
                  i =>
                    i.product?.created_by_affiliate === null ||
                    i.product?.created_by_affiliate === undefined
                ).length ?? 0}
                )
              </TabsTrigger>
              <TabsTrigger value="reseller" className="gap-2">
                <Store className="h-4 w-4" />
                Revendeur (
                {selection.items?.filter(
                  i =>
                    i.product?.created_by_affiliate !== null &&
                    i.product?.created_by_affiliate !== undefined
                ).length ?? 0}
                )
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {selection.items && selection.items.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Image</TableHead>
                  <TableHead>Produit</TableHead>
                  <TableHead className="text-center w-20">Stock</TableHead>
                  <TableHead className="text-right">Catalogue HT</TableHead>
                  <TableHead className="text-right">
                    Prix vente LinkMe HT
                  </TableHead>
                  <TableHead className="text-right">
                    Prix vente Final HT
                  </TableHead>
                  <TableHead className="text-center w-24">Marge %</TableHead>
                  <TableHead className="text-right">Marge €</TableHead>
                  <TableHead className="text-right">Prix affilié HT</TableHead>
                  <TableHead className="text-right w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selection.items
                  .filter((item: SelectionItem) => {
                    // Filtrage selon l'onglet sélectionné
                    if (productTab === 'all') return true;
                    const isAffiliate =
                      item.product?.created_by_affiliate !== null &&
                      item.product?.created_by_affiliate !== undefined;
                    if (productTab === 'catalog') return !isAffiliate;
                    if (productTab === 'reseller') return isAffiliate;
                    return true;
                  })
                  .map((item: SelectionItem) => {
                    const marginRate = item.margin_rate;
                    const commissionRate = (item.commission_rate ?? 0) / 100; // Conversion % → décimal (5.00 → 0.05)

                    // DÉTECTION: Produit AFFILIÉ (créé par l'affilié) vs Produit CATALOGUE (Vérone)
                    const isAffiliateProduct =
                      item.product?.created_by_affiliate !== null &&
                      item.product?.created_by_affiliate !== undefined;

                    // Prix Catalogue HT = prix du catalogue LinkMe (référence)
                    const catalogPriceHT =
                      item.catalog_price_ht || item.base_price_ht;
                    // Prix de vente LinkMe HT = prix de base de la sélection
                    const selectionPriceHT = item.base_price_ht;

                    let prixVenteFinalHT: number;
                    let marginEuros: number;
                    let prixAffilieHT: number;
                    let displayMarginRate: number;

                    if (isAffiliateProduct) {
                      // ========================================
                      // PRODUIT AFFILIÉ (Modèle INVERSÉ)
                      // ========================================
                      // Le prix catalogue EST le prix de vente au client final
                      // Vérone DÉDUIT sa commission, l'affilié reçoit le reste
                      // Exemple: 500€ vente - 15% = 75€ pour Vérone, 425€ pour l'affilié
                      const affiliateCommissionRate =
                        item.product?.affiliate_commission_rate ?? 15;
                      displayMarginRate = affiliateCommissionRate;
                      // Prix de vente final = prix catalogue (pas de majoration)
                      prixVenteFinalHT = selectionPriceHT;
                      // Frais LinkMe (commission Vérone) = prix × taux%
                      marginEuros =
                        selectionPriceHT * (affiliateCommissionRate / 100);
                      // Payout affilié = prix vente - commission Vérone
                      prixAffilieHT = selectionPriceHT - marginEuros;
                    } else {
                      // ========================================
                      // PRODUIT CATALOGUE (Modèle STANDARD)
                      // ========================================
                      // L'affilié GAGNE une marge qu'on AJOUTE au prix de base
                      displayMarginRate = marginRate;
                      // Prix de vente LinkMe Final HT = Prix × (1 + commission)
                      prixVenteFinalHT =
                        selectionPriceHT * (1 + commissionRate);
                      // Taux de marque: PVHT = PAHT / (1 - taux%)
                      const sellingPriceWithMargin =
                        selectionPriceHT / (1 - marginRate / 100);
                      // Marge € = Prix avec taux de marque - Prix de base
                      marginEuros = sellingPriceWithMargin - selectionPriceHT;
                      // Prix affilié HT = Prix avec taux de marque × (1 + commission)
                      prixAffilieHT =
                        sellingPriceWithMargin * (1 + commissionRate);
                    }

                    // Calcul remise si Prix Sélection < Prix Catalogue
                    const hasDiscount =
                      selectionPriceHT < catalogPriceHT && catalogPriceHT > 0;
                    const discountPercent = hasDiscount
                      ? ((catalogPriceHT - selectionPriceHT) / catalogPriceHT) *
                        100
                      : 0;

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
                            <div className="flex items-center gap-2">
                              {item.channel_pricing_id ? (
                                <Link
                                  href={`/canaux-vente/linkme/catalogue/${item.channel_pricing_id}`}
                                  className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                                >
                                  {item.product?.name}
                                </Link>
                              ) : (
                                <span className="font-medium">
                                  {item.product?.name}
                                </span>
                              )}
                              {isAffiliateProduct && (
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-purple-100 text-purple-700 border-purple-200"
                                >
                                  Revendeur
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {item.product?.sku}
                            </p>
                          </div>
                        </TableCell>
                        {/* Stock reel (source de verite) */}
                        <TableCell className="text-center">
                          {(() => {
                            const stock = item.product?.stock_real ?? 0;
                            let badgeClass = '';
                            if (stock > 10) {
                              badgeClass = 'bg-green-100 text-green-700';
                            } else if (stock > 0) {
                              badgeClass = 'bg-orange-100 text-orange-700';
                            } else {
                              badgeClass = 'bg-red-100 text-red-700';
                            }
                            return (
                              <Badge variant="outline" className={badgeClass}>
                                {stock}
                              </Badge>
                            );
                          })()}
                        </TableCell>
                        {/* Prix Catalogue HT */}
                        <TableCell className="text-right font-mono text-muted-foreground">
                          {catalogPriceHT.toFixed(2)} €
                        </TableCell>
                        {/* Prix vente LinkMe HT (avec badge remise si applicable) */}
                        <TableCell className="text-right font-mono">
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="font-medium">
                              {selectionPriceHT.toFixed(2)} €
                            </span>
                            {hasDiscount && (
                              <Badge
                                variant="secondary"
                                className="text-xs bg-green-100 text-green-700 border-green-200"
                              >
                                -{discountPercent.toFixed(1)}%
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        {/* Prix vente Final HT = prix × (1 + commission) */}
                        <TableCell className="text-right font-mono font-medium text-primary">
                          {prixVenteFinalHT.toFixed(2)} €
                        </TableCell>
                        {/* Marge % avec indicateur Traffic Light */}
                        <TableCell>
                          <div className="flex items-center justify-center gap-1.5">
                            <div
                              className={`w-2.5 h-2.5 rounded-full ${marginIndicatorColors[getMarginIndicatorColor(displayMarginRate)]} shrink-0`}
                              title={
                                isAffiliateProduct
                                  ? 'Frais LinkMe (produit revendeur)'
                                  : marginIndicatorTooltips[
                                      getMarginIndicatorColor(displayMarginRate)
                                    ]
                              }
                            />
                            <span className="font-mono text-sm">
                              {displayMarginRate.toFixed(2)} %
                            </span>
                          </div>
                        </TableCell>
                        {/* Marge € (ou Frais LinkMe pour produits affiliés) */}
                        <TableCell
                          className={`text-right font-mono ${isAffiliateProduct ? 'text-orange-600' : 'text-green-600'}`}
                        >
                          {marginEuros.toFixed(2)} €
                        </TableCell>
                        {/* Prix affilié HT (Payout pour produits affiliés) */}
                        <TableCell
                          className={`text-right font-mono font-semibold ${isAffiliateProduct ? 'text-green-600' : 'text-blue-600'}`}
                          title={
                            isAffiliateProduct
                              ? 'Payout affilié (prix vente - frais)'
                              : 'Prix affilié HT'
                          }
                        >
                          {prixAffilieHT.toFixed(2)} €
                        </TableCell>
                        {/* Actions */}
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
                            {(
                              product.product_selling_price_ht ??
                              product.product_price_ht
                            ).toFixed(2)}{' '}
                            € HT
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

      {/* Modal Vue Produit (READ-ONLY) - Utilise le composant unifié */}
      <SelectionProductDetailModal
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        item={viewItem}
        mode="view"
      />

      {/* Modal Édition Produit (avec jauge de marge interactive) - Pencil button */}
      <SelectionProductDetailModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        item={editItem}
        onSave={handleSaveFromDetail}
        isSaving={updateItem.isPending}
      />
    </div>
  );
}
