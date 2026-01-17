/**
 * Page: Créer une nouvelle sélection LinkMe
 *
 * Workflow:
 * 1. Sélectionner un utilisateur LinkMe → affiche son organisation/enseigne
 * 2. Définir nom et description de la sélection
 * 3. Sélectionner des produits depuis le catalogue général LinkMe
 * 4. Configurer la marge pour chaque produit (jauge tricolore)
 * 5. Créer la sélection
 */

'use client';

import React, { useState, useMemo } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useToast } from '@verone/common';
import { ProductThumbnail } from '@verone/products';
import { ButtonV2, Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import { Textarea } from '@verone/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Search,
  Package,
  User,
  Info,
  Check,
} from 'lucide-react';

import {
  useLinkMeCatalogProducts,
  type LinkMeCatalogProduct,
} from '../../hooks/use-linkme-catalog';
import {
  useLinkMeUsers,
  type LinkMeUser,
  LINKME_ROLE_LABELS,
  LINKME_ROLE_COLORS,
} from '../../hooks/use-linkme-users';
import {
  calculateLinkMeMargins,
  calculateFinalClientPrice,
  getMarginColor,
} from '../../types';

// ============================================================================
// Types
// ============================================================================

interface SelectedProduct {
  product_id: string;
  name: string;
  sku: string;
  image_url: string | null;
  base_price_ht: number;
  linkme_price_ht: number;
  public_price_ht: number | null;
  commission_rate: number;
  margin_rate: number;
  max_margin_rate: number;
  suggested_margin_rate: number;
}

// CatalogProduct type imported from use-linkme-catalog.ts as LinkMeCatalogProduct
// Type alias for backward compatibility
type CatalogProduct = LinkMeCatalogProduct;

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_COMMISSION_RATE = 0.05; // 5%
const DEFAULT_BUFFER_RATE = 0.05; // 5%
const MIN_MARGIN_RATE = 0.01; // 1%
const DEFAULT_MARGIN_RATE = 0.15; // 15%

// ============================================================================
// Components
// ============================================================================

/**
 * Jauge de marge avec zones de couleur
 */
function MarginGauge({
  marginRate,
  maxRate,
  suggestedRate,
  onChange,
}: {
  marginRate: number;
  maxRate: number;
  suggestedRate: number;
  onChange: (rate: number) => void;
}) {
  const greenZoneEnd = suggestedRate;
  const orangeZoneEnd = suggestedRate * 2;

  // Calculer les pourcentages pour le gradient
  const greenPct = maxRate > 0 ? (greenZoneEnd / maxRate) * 100 : 33;
  const orangePct = maxRate > 0 ? (orangeZoneEnd / maxRate) * 100 : 66;

  const currentColor = getMarginColor(marginRate, {
    minRate: MIN_MARGIN_RATE,
    maxRate,
    suggestedRate,
    isProductSellable: maxRate > MIN_MARGIN_RATE,
    greenZoneEnd,
    orangeZoneEnd,
  });

  const colorClasses = {
    green: 'text-green-600',
    orange: 'text-orange-600',
    red: 'text-red-600',
  };

  return (
    <div className="space-y-2">
      {/* Slider */}
      <div className="relative">
        <input
          type="range"
          min={MIN_MARGIN_RATE * 100}
          max={Math.max(maxRate * 100, MIN_MARGIN_RATE * 100 + 1)}
          step={0.5}
          value={marginRate * 100}
          onChange={e => onChange(parseFloat(e.target.value) / 100)}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right,
              #22c55e 0%, #22c55e ${greenPct}%,
              #f97316 ${greenPct}%, #f97316 ${orangePct}%,
              #ef4444 ${orangePct}%, #ef4444 100%)`,
          }}
        />
      </div>

      {/* Légende */}
      <div className="flex justify-between text-xs text-gray-500">
        <span>{(MIN_MARGIN_RATE * 100).toFixed(0)}%</span>
        <span className="text-green-600">
          {(greenZoneEnd * 100).toFixed(1)}%
        </span>
        <span className="text-orange-600">
          {(orangeZoneEnd * 100).toFixed(1)}%
        </span>
        <span className="text-red-600">{(maxRate * 100).toFixed(1)}%</span>
      </div>

      {/* Valeur actuelle */}
      <div className={`text-center font-medium ${colorClasses[currentColor]}`}>
        Marge: {(marginRate * 100).toFixed(1)}%
      </div>
    </div>
  );
}

/**
 * Carte de configuration d'un produit sélectionné
 */
function ProductConfigCard({
  product,
  onMarginChange,
  onRemove,
}: {
  product: SelectedProduct;
  onMarginChange: (marginRate: number) => void;
  onRemove: () => void;
}) {
  const finalPrice = calculateFinalClientPrice(
    product.base_price_ht,
    product.commission_rate,
    product.margin_rate
  );

  const gain = product.base_price_ht * product.margin_rate;

  return (
    <Card className="relative">
      <button
        onClick={onRemove}
        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
        title="Retirer"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Image */}
          <ProductThumbnail
            src={product.image_url}
            alt={product.name}
            size="md"
          />

          {/* Infos */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{product.name}</h4>
            <p className="text-xs text-gray-500">{product.sku}</p>

            {/* Prix */}
            <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-gray-500">Base HT</span>
                <p className="font-medium">
                  {product.base_price_ht.toFixed(2)} €
                </p>
              </div>
              <div>
                <span className="text-gray-500">Prix LinkMe</span>
                <p className="font-medium">
                  {product.linkme_price_ht.toFixed(2)} €
                </p>
              </div>
              <div>
                <span className="text-gray-500">Public</span>
                <p className="font-medium">
                  {product.public_price_ht?.toFixed(2) ?? '-'} €
                </p>
              </div>
            </div>

            {/* Jauge de marge */}
            <div className="mt-4">
              <MarginGauge
                marginRate={product.margin_rate}
                maxRate={product.max_margin_rate}
                suggestedRate={product.suggested_margin_rate}
                onChange={onMarginChange}
              />
            </div>

            {/* Résultat */}
            <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Votre gain:</span>
                <p className="font-medium text-green-600">
                  {gain.toFixed(2)} €
                </p>
              </div>
              <div>
                <span className="text-gray-500">Prix final:</span>
                <p className="font-semibold">{finalPrice.toFixed(2)} € HT</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function NewSelectionPage() {
  const router = useRouter();
  const { toast } = useToast();

  // Form state
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectionName, setSelectionName] = useState('');
  const [selectionDescription, setSelectionDescription] = useState('');
  const [status, setStatus] = useState<'draft' | 'active'>('draft');
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>(
    []
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Queries
  const { data: users, isLoading: usersLoading } = useLinkMeUsers();
  const { data: catalogProducts, isLoading: catalogLoading } =
    useLinkMeCatalogProducts();

  // Selected user details
  const selectedUser = useMemo(() => {
    if (!selectedUserId || !users) return null;
    return users.find(u => u.user_id === selectedUserId) ?? null;
  }, [selectedUserId, users]);

  // Filtrage utilisateurs (exclure les clients, garder uniquement ceux qui peuvent avoir des sélections)
  const eligibleUsers = useMemo(() => {
    if (!users) return [];
    return users.filter(
      u =>
        u.linkme_role === 'organisation_admin' ||
        u.linkme_role === 'org_independante' ||
        u.linkme_role === 'enseigne_admin'
    );
  }, [users]);

  // Filtered catalog products - filtrage par organisation/enseigne + recherche
  const filteredCatalog = useMemo(() => {
    if (!catalogProducts) return [];
    const products = catalogProducts;

    // RÈGLE 1: Si aucun utilisateur sélectionné, ne rien afficher
    if (!selectedUser) return [];

    // RÈGLE 2: Filtrer par organisation/enseigne de l'utilisateur
    const orgFilteredProducts = products.filter(p => {
      // Produits généraux (non sourcés) : toujours visibles
      if (!p.is_sourced) return true;

      // Produits sur mesure enseigne : visibles si même enseigne
      if (p.enseigne_id && selectedUser.enseigne_id) {
        return p.enseigne_id === selectedUser.enseigne_id;
      }

      // Produits sur mesure organisation : visibles si même organisation
      if (p.assigned_client_id && selectedUser.organisation_id) {
        return p.assigned_client_id === selectedUser.organisation_id;
      }

      // Produit sourcé sans correspondance : masquer
      return false;
    });

    // RÈGLE 3: Filtrer par recherche textuelle
    if (!searchQuery.trim()) return orgFilteredProducts;

    const query = searchQuery.toLowerCase();
    return orgFilteredProducts.filter(
      p =>
        p.product_name.toLowerCase().includes(query) ||
        p.product_reference.toLowerCase().includes(query)
    );
  }, [catalogProducts, searchQuery, selectedUser]);

  // IDs des produits déjà sélectionnés
  const selectedProductIds = useMemo(
    () => new Set(selectedProducts.map(p => p.product_id)),
    [selectedProducts]
  );

  // Handlers
  const handleAddProduct = (product: CatalogProduct) => {
    const basePriceHT = Number(product.product_price_ht);
    const commissionRate = product.channel_commission_rate
      ? Number(product.channel_commission_rate) / 100
      : DEFAULT_COMMISSION_RATE;

    // Utiliser les marges pré-calculées depuis la RPC
    const minMarginRate = product.min_margin_rate
      ? Number(product.min_margin_rate) / 100
      : MIN_MARGIN_RATE;
    const maxMarginRate = product.max_margin_rate
      ? Number(product.max_margin_rate) / 100
      : 0.4;
    const suggestedMarginRate = product.suggested_margin_rate
      ? Number(product.suggested_margin_rate) / 100
      : maxMarginRate / 3;

    // Utiliser la marge par défaut de l'utilisateur ou la marge suggérée
    const defaultMargin = selectedUser?.default_margin_rate
      ? selectedUser.default_margin_rate / 100
      : suggestedMarginRate || DEFAULT_MARGIN_RATE;

    // S'assurer que la marge est dans les limites
    const marginRate = Math.min(
      Math.max(defaultMargin, minMarginRate),
      maxMarginRate
    );

    const newProduct: SelectedProduct = {
      product_id: product.product_id,
      name: product.product_name,
      sku: product.product_reference,
      image_url: product.product_image_url,
      base_price_ht: basePriceHT,
      linkme_price_ht: basePriceHT * (1 + commissionRate),
      public_price_ht: null, // Non disponible depuis la RPC actuelle
      commission_rate: commissionRate,
      margin_rate: marginRate,
      max_margin_rate: maxMarginRate,
      suggested_margin_rate: suggestedMarginRate,
    };

    setSelectedProducts(prev => [...prev, newProduct]);
  };

  const handleRemoveProduct = (productId: string) => {
    setSelectedProducts(prev => prev.filter(p => p.product_id !== productId));
  };

  const handleMarginChange = (productId: string, marginRate: number) => {
    setSelectedProducts(prev =>
      prev.map(p =>
        p.product_id === productId ? { ...p, margin_rate: marginRate } : p
      )
    );
  };

  const handleCreate = async () => {
    // Validation
    if (!selectedUserId) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner un utilisateur.',
        variant: 'destructive',
      });
      return;
    }

    if (!selectionName.trim()) {
      toast({
        title: 'Erreur',
        description: 'Veuillez entrer un nom pour la sélection.',
        variant: 'destructive',
      });
      return;
    }

    if (selectedProducts.length === 0) {
      toast({
        title: 'Erreur',
        description: 'Veuillez ajouter au moins un produit.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsCreating(true);

      // Appel API pour créer la sélection
      const response = await fetch('/api/linkme/selections/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: selectedUserId,
          name: selectionName,
          description: selectionDescription || null,
          status,
          products: selectedProducts.map(p => ({
            product_id: p.product_id,
            base_price_ht: p.base_price_ht,
            // Convertir de décimal (0.186) en pourcentage (18.6) pour la BDD
            margin_rate: p.margin_rate * 100,
          })),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la création');
      }

      const { selection } = await response.json();

      toast({
        title: 'Sélection créée',
        description: `La sélection "${selectionName}" a été créée avec succès.`,
      });

      // Rediriger vers la page de détail
      router.push(`/canaux-vente/linkme/selections/${selection.id}`);
    } catch (error: any) {
      console.error('Erreur création sélection:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer la sélection.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/canaux-vente/linkme/selections"
              className="text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold">Créer une sélection</h1>
              <p className="text-sm text-gray-500">
                Configurez une nouvelle sélection de produits pour un
                utilisateur LinkMe
              </p>
            </div>
          </div>

          <ButtonV2
            variant="primary"
            icon={Check}
            onClick={handleCreate}
            loading={isCreating}
            disabled={
              isCreating ||
              !selectedUserId ||
              !selectionName ||
              selectedProducts.length === 0
            }
          >
            Créer la sélection
          </ButtonV2>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* ÉTAPE 1: Informations générales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Étape 1 : Informations générales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Sélection utilisateur */}
            <div className="space-y-2">
              <Label htmlFor="user">Utilisateur LinkMe *</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger id="user">
                  <SelectValue placeholder="Sélectionner un utilisateur..." />
                </SelectTrigger>
                <SelectContent>
                  {usersLoading ? (
                    <SelectItem value="loading" disabled>
                      Chargement...
                    </SelectItem>
                  ) : (
                    eligibleUsers.map(user => (
                      <SelectItem key={user.user_id} value={user.user_id}>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span>
                            {user.first_name} {user.last_name} ({user.email})
                          </span>
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded ${LINKME_ROLE_COLORS[user.linkme_role]}`}
                          >
                            {LINKME_ROLE_LABELS[user.linkme_role]}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>

              {/* Info utilisateur sélectionné */}
              {selectedUser && (
                <div className="mt-2 p-3 bg-blue-50 rounded-lg text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600 font-medium">
                      {selectedUser.organisation_name ||
                        selectedUser.enseigne_name ||
                        "Pas d'organisation"}
                    </span>
                    {selectedUser.enseigne_name &&
                      selectedUser.organisation_name && (
                        <span className="text-blue-400">
                          • Enseigne: {selectedUser.enseigne_name}
                        </span>
                      )}
                  </div>
                  {selectedUser.default_margin_rate && (
                    <p className="text-blue-500 mt-1">
                      Marge par défaut: {selectedUser.default_margin_rate}%
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Nom et description */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom de la sélection *</Label>
                <Input
                  id="name"
                  value={selectionName}
                  onChange={e => setSelectionName(e.target.value)}
                  placeholder="Ex: Sélection Mobilier Bureau"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Statut</Label>
                <Select
                  value={status}
                  onValueChange={v => setStatus(v as 'draft' | 'active')}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Brouillon</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optionnelle)</Label>
              <Textarea
                id="description"
                value={selectionDescription}
                onChange={e => setSelectionDescription(e.target.value)}
                placeholder="Description de la sélection..."
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* ÉTAPE 2 & 3: Sélection et configuration des produits */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Catalogue */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Étape 2 : Catalogue LinkMe
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Recherche */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un produit..."
                  className="pl-10"
                />
              </div>

              {/* Liste produits */}
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {catalogLoading ? (
                  <div className="text-center py-8 text-gray-500">
                    Chargement du catalogue...
                  </div>
                ) : !selectedUser ? (
                  <div className="text-center py-8 text-gray-500">
                    <User className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p>Sélectionnez un utilisateur</p>
                    <p className="text-sm mt-1">
                      pour voir les produits disponibles
                    </p>
                  </div>
                ) : filteredCatalog.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p>Aucun produit disponible</p>
                    <p className="text-sm mt-1">pour cette organisation</p>
                  </div>
                ) : (
                  filteredCatalog.map(product => {
                    const isSelected = selectedProductIds.has(
                      product.product_id
                    );
                    const basePriceHT = Number(product.product_price_ht);

                    return (
                      <div
                        key={product.product_id}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                          isSelected
                            ? 'bg-green-50 border-green-200'
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <ProductThumbnail
                          src={product.product_image_url}
                          alt={product.product_name}
                          size="sm"
                        />

                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {product.product_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {product.product_reference}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            {basePriceHT.toFixed(2)} € HT
                            {product.suggested_margin_rate && (
                              <span className="text-gray-400">
                                {' '}
                                / Marge suggérée:{' '}
                                {Number(product.suggested_margin_rate).toFixed(
                                  1
                                )}
                                %
                              </span>
                            )}
                          </p>
                        </div>

                        <ButtonV2
                          variant={isSelected ? 'ghost' : 'secondary'}
                          size="sm"
                          icon={isSelected ? Check : Plus}
                          onClick={() =>
                            !isSelected && handleAddProduct(product)
                          }
                          disabled={isSelected}
                        >
                          {isSelected ? 'Ajouté' : 'Ajouter'}
                        </ButtonV2>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="mt-4 text-sm text-gray-500 text-center">
                {filteredCatalog.length} produit(s) disponible(s)
              </div>
            </CardContent>
          </Card>

          {/* Produits sélectionnés avec configuration marge */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Check className="h-5 w-5" />
                  Étape 3 : Configuration des marges
                </span>
                <span className="text-sm font-normal text-gray-500">
                  {selectedProducts.length} produit(s)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedProducts.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Aucun produit sélectionné</p>
                  <p className="text-sm">
                    Ajoutez des produits depuis le catalogue pour configurer
                    leurs marges
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {selectedProducts.map(product => (
                    <ProductConfigCard
                      key={product.product_id}
                      product={product}
                      onMarginChange={rate =>
                        handleMarginChange(product.product_id, rate)
                      }
                      onRemove={() => handleRemoveProduct(product.product_id)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
