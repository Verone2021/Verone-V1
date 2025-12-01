'use client';

import { useEffect, useState, useMemo } from 'react';

import { useToast } from '@verone/common';
import { Badge } from '@verone/ui';
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
import { Checkbox } from '@verone/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import {
  Search,
  Layers,
  Eye,
  ExternalLink,
  Package,
  ShoppingBag,
  FileEdit,
  Archive,
  CheckCircle,
  Plus,
  Trash2,
  Globe,
  Lock,
} from 'lucide-react';

interface Selection {
  id: string;
  affiliate_id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  is_public: boolean | null;
  share_token: string | null;
  products_count: number | null;
  views_count: number | null;
  orders_count: number | null;
  status: string | null; // 'draft' | 'active' | 'archived' - relaxed for Supabase types
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
}

interface SelectedProduct {
  product_id: string;
  product_name: string;
  base_price_ht: number;
  margin_rate: number;
}

const statusConfig = {
  draft: {
    label: 'Brouillon',
    variant: 'outline' as const,
    icon: FileEdit,
    color: 'text-gray-600',
  },
  active: {
    label: 'Publiée',
    variant: 'default' as const,
    icon: CheckCircle,
    color: 'text-green-600',
  },
  archived: {
    label: 'Archivée',
    variant: 'secondary' as const,
    icon: Archive,
    color: 'text-gray-500',
  },
};

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
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal création
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    affiliate_id: '',
    name: '',
    description: '',
    status: 'draft' as 'draft' | 'active',
  });
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>(
    []
  );
  const [productSearch, setProductSearch] = useState('');

  useEffect(() => {
    fetchData();
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

      // Fetch catalogue LinkMe via RPC
      const { data: catalogData, error: catalogError } = await supabase.rpc(
        'get_linkme_catalog_products_for_affiliate' as any
      );

      if (catalogError) {
        console.error('Error fetching catalog:', catalogError);
      }

      setSelections(selectionsData || []);
      setAffiliates(affiliatesData || []);
      setCatalogProducts((catalogData as unknown as CatalogProduct[]) || []);
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

      // 1. Créer la sélection
      const { data: selectionData, error: selectionError } = await (
        supabase as any
      )
        .from('linkme_selections')
        .insert({
          affiliate_id: formData.affiliate_id,
          name: formData.name.trim(),
          slug: slug,
          description: formData.description || null,
          status: formData.status,
          share_token: shareToken,
          is_public: formData.status === 'active',
          products_count: selectedProducts.length,
          views_count: 0,
          orders_count: 0,
          published_at:
            formData.status === 'active' ? new Date().toISOString() : null,
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
      fetchData();
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
      status: 'draft',
    });
    setSelectedProducts([]);
    setProductSearch('');
  }

  function addProductToSelection(product: CatalogProduct) {
    // Vérifier si le produit n'est pas déjà sélectionné
    if (selectedProducts.find(p => p.product_id === product.product_id)) {
      return;
    }

    setSelectedProducts(prev => [
      ...prev,
      {
        product_id: product.product_id,
        product_name: product.product_name,
        base_price_ht: product.product_price_ht,
        margin_rate: product.suggested_margin_rate,
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

  // Toggle visibilité (is_public)
  async function toggleVisibility(
    selectionId: string,
    currentValue: boolean | null
  ) {
    const supabase = createClient();
    const newValue = !currentValue;

    try {
      const { error } = await (supabase as any)
        .from('linkme_selections')
        .update({ is_public: newValue })
        .eq('id', selectionId);

      if (error) throw error;

      // Mettre à jour localement
      setSelections(prev =>
        prev.map(s =>
          s.id === selectionId ? { ...s, is_public: newValue } : s
        )
      );

      toast({
        title: 'Visibilité mise à jour',
        description: newValue
          ? 'La sélection est maintenant publique (visible sur internet)'
          : 'La sélection est maintenant privée (réseau LinkMe uniquement)',
      });
    } catch (error) {
      console.error('Error toggling visibility:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier la visibilité',
        variant: 'destructive',
      });
    }
  }

  // Filter selections
  const filteredSelections = selections.filter(selection => {
    const matchesSearch =
      selection.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      selection.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAffiliate =
      affiliateFilter === 'all' || selection.affiliate_id === affiliateFilter;
    const matchesStatus =
      statusFilter === 'all' || selection.status === statusFilter;
    return matchesSearch && matchesAffiliate && matchesStatus;
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
            <ButtonV2 onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Créer une sélection
            </ButtonV2>
          </div>
        </CardHeader>
        <CardContent>
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="draft">Brouillons</SelectItem>
                <SelectItem value="active">Publiées</SelectItem>
                <SelectItem value="archived">Archivées</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {filteredSelections.length === 0 ? (
            <div className="text-center py-12">
              <Layers className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucune sélection</h3>
              <p className="text-muted-foreground">
                {searchTerm ||
                affiliateFilter !== 'all' ||
                statusFilter !== 'all'
                  ? 'Aucun résultat pour ces filtres'
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
                  <TableHead>Statut</TableHead>
                  <TableHead>Visibilité</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSelections.map(selection => {
                  const statusInfo =
                    statusConfig[
                      (selection.status || 'draft') as keyof typeof statusConfig
                    ];

                  return (
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
                        {selection.affiliate?.display_name || 'N/A'}
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
                      <TableCell>
                        <Badge variant={statusInfo.variant}>
                          <statusInfo.icon className="h-3 w-3 mr-1" />
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() =>
                            toggleVisibility(selection.id, selection.is_public)
                          }
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                            selection.is_public
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                          title={
                            selection.is_public
                              ? 'Cliquer pour rendre privée'
                              : 'Cliquer pour rendre publique'
                          }
                        >
                          {selection.is_public ? (
                            <>
                              <Globe className="h-3 w-3" />
                              Publique
                            </>
                          ) : (
                            <>
                              <Lock className="h-3 w-3" />
                              Réseau
                            </>
                          )}
                        </button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {selection.status === 'active' && (
                            <ButtonV2
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                window.open(
                                  `https://linkme.verone.fr/s/${selection.affiliate?.slug}/${selection.slug}`,
                                  '_blank'
                                )
                              }
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              Voir
                            </ButtonV2>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
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

            {/* Statut */}
            <div className="grid gap-2">
              <Label>Statut</Label>
              <Select
                value={formData.status}
                onValueChange={value =>
                  setFormData(prev => ({
                    ...prev,
                    status: value as 'draft' | 'active',
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">
                    <div className="flex items-center gap-2">
                      <FileEdit className="h-4 w-4" />
                      Brouillon (non publié)
                    </div>
                  </SelectItem>
                  <SelectItem value="active">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Publié immédiatement
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
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

              {/* Liste des produits sélectionnés */}
              {selectedProducts.length > 0 && (
                <div className="border rounded-md p-3 bg-blue-50 space-y-2">
                  <p className="text-sm font-medium text-blue-800">
                    Produits dans la sélection :
                  </p>
                  {selectedProducts.map(product => (
                    <div
                      key={product.product_id}
                      className="flex items-center justify-between bg-white p-2 rounded border"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {product.product_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Prix: {product.base_price_ht.toFixed(2)}€ HT | Marge:{' '}
                          {product.margin_rate}% | PV:{' '}
                          {(
                            product.base_price_ht *
                            (1 + product.margin_rate / 100)
                          ).toFixed(2)}
                          €
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          max="50"
                          value={product.margin_rate}
                          onChange={e =>
                            updateProductMargin(
                              product.product_id,
                              Number(e.target.value)
                            )
                          }
                          className="w-16 h-8 text-center"
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                        <ButtonV2
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            removeProductFromSelection(product.product_id)
                          }
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </ButtonV2>
                      </div>
                    </div>
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
              onClick={handleCreateSelection}
              disabled={
                saving ||
                !formData.affiliate_id ||
                !formData.name.trim() ||
                selectedProducts.length === 0
              }
            >
              {saving
                ? 'Création...'
                : `Créer (${selectedProducts.length} produit${selectedProducts.length > 1 ? 's' : ''})`}
            </ButtonV2>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
