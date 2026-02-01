'use client';

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return, react-hooks/exhaustive-deps */

import { useEffect, useState, useMemo } from 'react';

import Link from 'next/link';

import { useToast } from '@verone/common';
import { ButtonV2 } from '@verone/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@verone/ui';
import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { Skeleton } from '@verone/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import { cn } from '@verone/utils';
import { createClient } from '@verone/utils/supabase/client';
import {
  Search,
  Layers,
  Eye,
  Package,
  ShoppingBag,
  Archive,
  ArchiveRestore,
  CheckCircle,
  Plus,
  Trash2,
} from 'lucide-react';

import { ProductMarginEditor } from './ProductMarginEditor';

interface Selection {
  id: string;
  affiliate_id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  share_token: string | null;
  products_count: number | null;
  views_count: number | null;
  orders_count: number | null;
  archived_at: string | null; // NULL = active, timestamp = archivée
  published_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  // Joined
  affiliate?: {
    display_name: string;
    slug: string;
  } | null;
}

interface CatalogProduct {
  id: string;
  product_id: string;
  product_name: string;
  product_reference: string;
  product_price_ht: number;
  product_image_url: string | null;
  max_margin_rate: number;
  min_margin_rate: number;
  suggested_margin_rate: number;
  /** Commission LinkMe (%) - depuis RPC get_linkme_catalog_products_for_affiliate */
  linkme_commission_rate: number | null;
}

interface SelectedProduct {
  product_id: string;
  product_name: string;
  base_price_ht: number;
  margin_rate: number;
  /** Limites de marge depuis le catalogue */
  min_margin_rate: number;
  max_margin_rate: number;
  suggested_margin_rate: number;
  /** Commission LinkMe (%) */
  linkme_commission_rate: number;
}

/**
 * SelectionsSection - Liste des sélections (mini-boutiques)
 *
 * Fonctionnalités:
 * - Liste toutes les sélections (tous affiliés)
 * - Filtres par affilié, statut
 * - Preview sélection
 * - Stats par sélection
 */
export function SelectionsSection() {
  const { toast } = useToast();
  const [selections, setSelections] = useState<Selection[]>([]);
  const [affiliates, setAffiliates] = useState<
    { id: string; display_name: string; slug: string }[]
  >([]);
  const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [affiliateFilter, setAffiliateFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');

  // Modal création
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    affiliate_id: '',
    name: '',
    description: '',
  });
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>(
    []
  );
  const [productSearch, setProductSearch] = useState('');

  useEffect(() => {
    void fetchData().catch(error => {
      console.error('[SelectionsSection] Initial fetch failed:', error);
    });
  }, []);

  // Filtrer les produits du catalogue par recherche
  const filteredCatalogProducts = useMemo(() => {
    if (!productSearch) return catalogProducts;
    const searchLower = productSearch.toLowerCase();
    return catalogProducts.filter(
      p =>
        p.product_name.toLowerCase().includes(searchLower) ||
        p.product_reference.toLowerCase().includes(searchLower)
    );
  }, [catalogProducts, productSearch]);

  async function fetchData() {
    const supabase = createClient();
    setLoading(true);

    try {
      // Fetch selections with affiliate info
      const { data: selectionsData, error: selectionsError } = await (
        supabase as any
      )
        .from('linkme_selections')
        .select(
          `
          *,
          affiliate:linkme_affiliates(display_name, slug)
        `
        )
        .order('created_at', { ascending: false });

      if (selectionsError) throw selectionsError;

      // Fetch affiliates for filter (actifs uniquement)
      const { data: affiliatesData, error: affiliatesError } = await (
        supabase as any
      )
        .from('linkme_affiliates')
        .select('id, display_name, slug')
        .eq('status', 'active');

      if (affiliatesError) throw affiliatesError;

      // Fetch catalogue LinkMe depuis channel_pricing
      // Channel ID LinkMe: 93c68db1-5a30-4168-89ec-6383152be405
      const LINKME_CHANNEL_ID = '93c68db1-5a30-4168-89ec-6383152be405';
      const { data: catalogData, error: catalogError } = await supabase
        .from('channel_pricing')
        .select(
          `
          id,
          product_id,
          min_margin_rate,
          max_margin_rate,
          suggested_margin_rate,
          channel_commission_rate,
          public_price_ht,
          products:product_id (
            name,
            sku
          )
        `
        )
        .eq('channel_id', LINKME_CHANNEL_ID)
        .eq('is_active', true);

      if (catalogError) {
        console.error('Error fetching catalog:', catalogError);
      }

      // Fetch images primaires depuis product_images
      const productIds = (catalogData ?? []).map(
        (item: any) => item.product_id
      );
      const { data: imagesData } = await supabase
        .from('product_images')
        .select('product_id, public_url')
        .in('product_id', productIds)
        .eq('is_primary', true);

      // Créer map des images par product_id
      const imageMap = new Map(
        (imagesData ?? []).map((img: any) => [img.product_id, img.public_url])
      );

      // Transformer les données pour correspondre à l'interface CatalogProduct
      const transformedCatalog: CatalogProduct[] = (catalogData ?? []).map(
        (item: any) => ({
          id: item.id,
          product_id: item.product_id,
          product_name: item.products?.name ?? 'Produit inconnu',
          product_reference: item.products?.sku ?? '',
          product_price_ht: Number(item.public_price_ht ?? 0),
          product_image_url: imageMap.get(item.product_id) ?? null,
          max_margin_rate: Number(item.max_margin_rate ?? 30),
          min_margin_rate: Number(item.min_margin_rate ?? 5),
          suggested_margin_rate: Number(item.suggested_margin_rate ?? 15),
          linkme_commission_rate: Number(item.channel_commission_rate ?? 5),
        })
      );

      setSelections(selectionsData ?? []);
      setAffiliates(affiliatesData ?? []);
      setCatalogProducts(transformedCatalog);
    } catch (error) {
      console.error('Error fetching selections:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les sélections',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  // Créer une sélection avec ses produits
  async function handleCreateSelection() {
    if (
      !formData.affiliate_id ||
      !formData.name.trim() ||
      selectedProducts.length === 0
    ) {
      toast({
        title: 'Erreur',
        description:
          'Veuillez remplir tous les champs et sélectionner au moins un produit',
        variant: 'destructive',
      });
      return;
    }

    const supabase = createClient();
    setSaving(true);

    try {
      // Générer un slug à partir du nom
      const slug = formData.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      // Générer un token de partage unique
      const shareToken = crypto.randomUUID().slice(0, 8);

      // 1. Créer la sélection (toujours publiée immédiatement)
      const { data: selectionData, error: selectionError } = await (
        supabase as any
      )
        .from('linkme_selections')
        .insert({
          affiliate_id: formData.affiliate_id,
          name: formData.name.trim(),
          slug: slug,
          description: formData.description ?? null,
          share_token: shareToken,
          products_count: selectedProducts.length,
          views_count: 0,
          orders_count: 0,
          archived_at: null,
          published_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (selectionError) throw selectionError;

      // 2. Créer les items de sélection
      // Note: selling_price_ht est une colonne générée automatiquement par la DB
      const selectionItems = selectedProducts.map((product, index) => ({
        selection_id: selectionData.id,
        product_id: product.product_id,
        base_price_ht: product.base_price_ht,
        margin_rate: product.margin_rate,
        display_order: index,
        is_featured: index === 0, // Premier produit en vedette
      }));

      const { error: itemsError } = await (supabase as any)
        .from('linkme_selection_items')
        .insert(selectionItems);

      if (itemsError) throw itemsError;

      toast({
        title: 'Succès',
        description: `Sélection "${formData.name}" créée avec ${selectedProducts.length} produit(s)`,
      });

      // Reset et refresh
      setIsCreateModalOpen(false);
      resetForm();
      void fetchData().catch(error => {
        console.error('[SelectionsSection] Fetch after create failed:', error);
      });
    } catch (error) {
      console.error('Error creating selection:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer la sélection',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setFormData({
      affiliate_id: '',
      name: '',
      description: '',
    });
    setSelectedProducts([]);
    setProductSearch('');
  }

  function addProductToSelection(product: CatalogProduct) {
    // Vérifier si le produit n'est pas déjà sélectionné
    if (selectedProducts.find(p => p.product_id === product.product_id)) {
      return;
    }

    // Commission par défaut si non définie
    const commissionRate = product.linkme_commission_rate ?? 5;

    setSelectedProducts(prev => [
      ...prev,
      {
        product_id: product.product_id,
        product_name: product.product_name,
        base_price_ht: product.product_price_ht,
        margin_rate: product.suggested_margin_rate,
        // Transférer les limites de marge du catalogue
        min_margin_rate: product.min_margin_rate,
        max_margin_rate: product.max_margin_rate,
        suggested_margin_rate: product.suggested_margin_rate,
        linkme_commission_rate: commissionRate,
      },
    ]);
  }

  function removeProductFromSelection(productId: string) {
    setSelectedProducts(prev => prev.filter(p => p.product_id !== productId));
  }

  function updateProductMargin(productId: string, marginRate: number) {
    setSelectedProducts(prev =>
      prev.map(p =>
        p.product_id === productId ? { ...p, margin_rate: marginRate } : p
      )
    );
  }

  // Validation des marges - vérifie que toutes les marges sont dans les limites
  const marginValidationErrors = useMemo(() => {
    const errors: string[] = [];
    for (const product of selectedProducts) {
      if (product.margin_rate < product.min_margin_rate) {
        errors.push(
          `${product.product_name}: marge ${product.margin_rate}% < min ${product.min_margin_rate}%`
        );
      }
      if (product.margin_rate > product.max_margin_rate) {
        errors.push(
          `${product.product_name}: marge ${product.margin_rate}% > max ${product.max_margin_rate}%`
        );
      }
    }
    return errors;
  }, [selectedProducts]);

  const hasValidationErrors = marginValidationErrors.length > 0;

  // Supprimer une sélection
  async function handleDeleteSelection(
    selectionId: string,
    selectionName: string
  ) {
    if (
      !confirm(
        `Êtes-vous sûr de vouloir supprimer la sélection "${selectionName}" ?\n\nCette action est irréversible.`
      )
    ) {
      return;
    }

    try {
      // Utiliser l'API route pour bypasser les restrictions RLS
      const response = await fetch('/api/linkme/selections/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ selection_id: selectionId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? 'Erreur lors de la suppression');
      }

      // Mettre à jour localement
      setSelections(prev => prev.filter(s => s.id !== selectionId));

      toast({
        title: 'Sélection supprimée',
        description: `La sélection "${selectionName}" a été supprimée définitivement.`,
      });
    } catch (error) {
      console.error('Error deleting selection:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer la sélection',
        variant: 'destructive',
      });
    }
  }

  // Archiver/Désarchiver une sélection
  async function handleArchive(selection: Selection) {
    const supabase = createClient();
    const isCurrentlyArchived = selection.archived_at !== null;
    const newArchivedAt = isCurrentlyArchived ? null : new Date().toISOString();

    try {
      const { error } = await (supabase as any)
        .from('linkme_selections')
        .update({
          archived_at: newArchivedAt,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selection.id);

      if (error) throw error;

      // Mettre à jour localement
      setSelections(prev =>
        prev.map(s =>
          s.id === selection.id ? { ...s, archived_at: newArchivedAt } : s
        )
      );

      toast({
        title: isCurrentlyArchived
          ? 'Sélection désarchivée'
          : 'Sélection archivée',
        description: isCurrentlyArchived
          ? `"${selection.name}" est maintenant active.`
          : `"${selection.name}" a été archivée.`,
      });
    } catch (error) {
      console.error('Error archiving selection:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier le statut de la sélection',
        variant: 'destructive',
      });
    }
  }

  // Compteurs pour les onglets
  const activeCount = selections.filter(s => s.archived_at === null).length;
  const archivedCount = selections.filter(s => s.archived_at !== null).length;

  // Filter selections
  const filteredSelections = selections.filter(selection => {
    const matchesSearch =
      selection.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      selection.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAffiliate =
      affiliateFilter === 'all' || selection.affiliate_id === affiliateFilter;
    const matchesTab =
      activeTab === 'active'
        ? selection.archived_at === null
        : selection.archived_at !== null;
    return matchesSearch && matchesAffiliate && matchesTab;
  });

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Sélections</CardTitle>
              <CardDescription>
                Toutes les mini-boutiques créées par les affiliés
              </CardDescription>
            </div>
            <Link href="/canaux-vente/linkme/selections/new">
              <ButtonV2>
                <Plus className="h-4 w-4 mr-2" />
                Créer une sélection
              </ButtonV2>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {/* Onglets Actives/Archivées */}
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => setActiveTab('active')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                activeTab === 'active'
                  ? 'bg-black text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              )}
            >
              Actives
              <span className="ml-2 opacity-70">({activeCount})</span>
            </button>

            <button
              onClick={() => setActiveTab('archived')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                activeTab === 'archived'
                  ? 'bg-black text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              )}
            >
              Archivées
              <span className="ml-2 opacity-70">({archivedCount})</span>
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une sélection..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={affiliateFilter} onValueChange={setAffiliateFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Affilié" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les affiliés</SelectItem>
                {affiliates.map(affiliate => (
                  <SelectItem key={affiliate.id} value={affiliate.id}>
                    {affiliate.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {filteredSelections.length === 0 ? (
            <div className="text-center py-12">
              <Layers className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucune sélection</h3>
              <p className="text-muted-foreground">
                {searchTerm || affiliateFilter !== 'all'
                  ? 'Aucun résultat pour ces filtres'
                  : activeTab === 'archived'
                    ? 'Aucune sélection archivée'
                    : "Les affiliés n'ont pas encore créé de sélections"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sélection</TableHead>
                  <TableHead>Affilié</TableHead>
                  <TableHead>Produits</TableHead>
                  <TableHead>Vues</TableHead>
                  <TableHead>Commandes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSelections.map(selection => (
                  <TableRow key={selection.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-blue-100">
                          <Layers className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">{selection.name}</div>
                          <div className="text-sm text-muted-foreground font-mono">
                            /{selection.affiliate?.slug}/{selection.slug}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {selection.affiliate?.display_name ?? 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        {selection.products_count}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        {selection.views_count}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                        {selection.orders_count}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Bouton Voir (page détail) */}
                        <Link
                          href={`/canaux-vente/linkme/selections/${selection.id}`}
                          className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:scale-105 transition-all"
                          title="Voir la sélection"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>

                        {/* Bouton Archiver/Désarchiver */}
                        {selection.archived_at !== null ? (
                          <ButtonV2
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => {
                              void handleArchive(selection).catch(error => {
                                console.error(
                                  '[SelectionsSection] Archive failed:',
                                  error
                                );
                              });
                            }}
                            title="Désarchiver la sélection"
                          >
                            <ArchiveRestore className="h-4 w-4" />
                          </ButtonV2>
                        ) : (
                          <ButtonV2
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 text-orange-500 hover:text-orange-600 hover:bg-orange-50"
                            onClick={() => {
                              void handleArchive(selection).catch(error => {
                                console.error(
                                  '[SelectionsSection] Archive failed:',
                                  error
                                );
                              });
                            }}
                            title="Archiver la sélection"
                          >
                            <Archive className="h-4 w-4" />
                          </ButtonV2>
                        )}

                        {/* Bouton Supprimer (uniquement pour archivées) */}
                        {selection.archived_at !== null && (
                          <ButtonV2
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              void handleDeleteSelection(
                                selection.id,
                                selection.name
                              ).catch(error => {
                                console.error(
                                  '[SelectionsSection] Delete failed:',
                                  error
                                );
                              });
                            }}
                            title="Supprimer la sélection"
                          >
                            <Trash2 className="h-4 w-4" />
                          </ButtonV2>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal Création Sélection */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Créer une sélection</DialogTitle>
            <DialogDescription>
              Créez une mini-boutique pour un affilié avec une sélection de
              produits
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Affilié */}
            <div className="grid gap-2">
              <Label>Affilié *</Label>
              <Select
                value={formData.affiliate_id}
                onValueChange={value =>
                  setFormData(prev => ({ ...prev, affiliate_id: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un affilié" />
                </SelectTrigger>
                <SelectContent>
                  {affiliates.length === 0 ? (
                    <SelectItem value="none" disabled>
                      Aucun affilié actif
                    </SelectItem>
                  ) : (
                    affiliates.map(affiliate => (
                      <SelectItem key={affiliate.id} value={affiliate.id}>
                        {affiliate.display_name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Nom de la sélection */}
            <div className="grid gap-2">
              <Label htmlFor="selection_name">Nom de la sélection *</Label>
              <Input
                id="selection_name"
                value={formData.name}
                onChange={e =>
                  setFormData(prev => ({ ...prev, name: e.target.value }))
                }
                placeholder="Ex: Collection Été 2024"
              />
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="selection_description">Description</Label>
              <Input
                id="selection_description"
                value={formData.description}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Description courte de la sélection..."
              />
            </div>

            {/* Sélection de produits */}
            <div className="grid gap-2">
              <Label>
                Produits ({selectedProducts.length} sélectionné(s)) *
              </Label>

              {/* Recherche produits */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un produit du catalogue..."
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Liste des produits sélectionnés avec slider de marge */}
              {selectedProducts.length > 0 && (
                <div className="border rounded-md p-3 bg-blue-50 space-y-2">
                  <p className="text-sm font-medium text-blue-800">
                    Produits dans la sélection :
                  </p>
                  {selectedProducts.map(product => (
                    <ProductMarginEditor
                      key={product.product_id}
                      product={product}
                      onMarginChange={updateProductMargin}
                      onRemove={removeProductFromSelection}
                      compact
                    />
                  ))}
                </div>
              )}

              {/* Liste des produits du catalogue */}
              <div className="max-h-48 overflow-y-auto border rounded-md">
                {filteredCatalogProducts.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    {productSearch
                      ? 'Aucun produit trouvé'
                      : 'Chargement du catalogue...'}
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredCatalogProducts.slice(0, 20).map(product => {
                      const isSelected = selectedProducts.some(
                        p => p.product_id === product.product_id
                      );
                      return (
                        <button
                          key={product.id}
                          type="button"
                          disabled={isSelected}
                          onClick={() => addProductToSelection(product)}
                          className={`w-full p-3 text-left flex items-center gap-3 transition-colors ${
                            isSelected
                              ? 'bg-gray-100 opacity-50 cursor-not-allowed'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {product.product_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Réf: {product.product_reference} | Prix:{' '}
                              {product.product_price_ht.toFixed(2)}€ | Marge
                              suggérée: {product.suggested_margin_rate}%
                            </p>
                          </div>
                          {isSelected ? (
                            <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                          ) : (
                            <Plus className="h-4 w-4 text-blue-600 flex-shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Erreurs de validation des marges */}
          {hasValidationErrors && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mx-6 mb-4">
              <p className="text-sm font-medium text-red-800 mb-2">
                Erreurs de validation des marges :
              </p>
              <ul className="text-xs text-red-700 space-y-1">
                {marginValidationErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          <DialogFooter>
            <ButtonV2
              variant="outline"
              onClick={() => {
                setIsCreateModalOpen(false);
                resetForm();
              }}
            >
              Annuler
            </ButtonV2>
            <ButtonV2
              onClick={() => {
                void handleCreateSelection().catch(error => {
                  console.error(
                    '[SelectionsSection] Create selection failed:',
                    error
                  );
                });
              }}
              disabled={
                saving ||
                !formData.affiliate_id ||
                !formData.name.trim() ||
                selectedProducts.length === 0 ||
                hasValidationErrors
              }
            >
              {saving
                ? 'Création...'
                : hasValidationErrors
                  ? 'Corrigez les marges'
                  : `Créer (${selectedProducts.length} produit${selectedProducts.length > 1 ? 's' : ''})`}
            </ButtonV2>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return, react-hooks/exhaustive-deps */
