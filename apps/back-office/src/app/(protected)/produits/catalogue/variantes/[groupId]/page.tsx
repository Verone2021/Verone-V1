'use client';

import { use, useState, useCallback, useEffect, useRef, useMemo } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useToast } from '@verone/common';
import type { SelectedProduct } from '@verone/products';
import { CreateProductInGroupModal } from '@verone/products';
import { EditProductVariantModal } from '@verone/products';
import { VariantGroupEditModal } from '@verone/products';
import { UniversalProductSelectorV2 } from '@verone/products';
import { useVariantGroups } from '@verone/products';
import { useVariantGroup, useProductVariantEditing } from '@verone/products';
import type { VariantProduct } from '@verone/types';
import {
  formatAttributesForDisplay,
  type VariantAttributes,
} from '@verone/types';
import { COLLECTION_STYLE_OPTIONS } from '@verone/types';
import { Input } from '@verone/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Badge } from '@verone/ui';
import { getOrganisationDisplayName } from '@verone/utils/utils/organisation-helpers';
import {
  ChevronLeft,
  Package,
  Calendar,
  Edit3,
  Plus,
  X,
  Eye,
  Palette,
  Ruler,
  Layers,
  Home,
  ExternalLink,
} from 'lucide-react';

interface VariantGroupDetailPageProps {
  params: Promise<{
    groupId: string;
  }>;
}

const formatVariantType = (type?: string): string => {
  if (!type) return '';
  const typeMap: Record<string, string> = {
    color: 'Couleur',
    size: 'Taille',
    material: 'Matériau',
    pattern: 'Motif',
  };
  return typeMap[type] || type;
};

const getVariantTypeIcon = (type: string) => {
  switch (type) {
    case 'color':
      return <Palette className="h-5 w-5 text-purple-600" />;
    case 'size':
      return <Ruler className="h-5 w-5 text-blue-600" />;
    case 'material':
      return <Layers className="h-5 w-5 text-green-600" />;
    case 'pattern':
      return <Layers className="h-5 w-5 text-black" />;
    default:
      return <Package className="h-5 w-5 text-gray-600" />;
  }
};

const formatStyle = (style?: string): string => {
  if (!style) return '';
  const styleOption = COLLECTION_STYLE_OPTIONS.find(s => s.value === style);
  return styleOption?.label || style;
};

// Composant pour carte produit COMPACTE (style catalogue)
interface VariantProductCardProps {
  product: any;
  variantType: string;
  hasCommonSupplier: boolean;
  groupDimensions: {
    length: number | null;
    width: number | null;
    height: number | null;
    unit: string;
  } | null;
  onRemove: (id: string, name: string) => void;
  onEdit: (product: any) => void;
  router: any;
}

function VariantProductCard({
  product,
  variantType: _variantType,
  hasCommonSupplier,
  groupDimensions,
  onRemove,
  onEdit,
  router,
}: VariantProductCardProps) {
  // Formater les attributs pour affichage
  const attributesDisplay = formatAttributesForDisplay(
    product.variant_attributes as VariantAttributes
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full">
      {/* Image compacte */}
      <div className="relative w-full h-32 bg-gray-50 flex-shrink-0">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-contain p-2"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-8 h-8 text-gray-400" />
          </div>
        )}
        {/* Badge position - petit */}
        {product.variant_position && (
          <div className="absolute top-1.5 left-1.5">
            <Badge className="bg-black text-white text-[10px] px-1.5 py-0.5">
              #{product.variant_position}
            </Badge>
          </div>
        )}
        {/* Bouton retirer - petit */}
        <button
          onClick={() => onRemove(product.id, product.name)}
          className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full p-1 opacity-0 hover:opacity-100 transition-opacity hover:bg-red-600"
          title={`Retirer ${product.name}`}
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      {/* Contenu compact */}
      <div className="p-3 flex-1 flex flex-col">
        {/* Nom + SKU compacts */}
        <div className="flex-none mb-2">
          <h3 className="font-semibold text-xs text-gray-900 line-clamp-2 mb-0.5">
            {product.name}
          </h3>
          <p className="text-[10px] text-gray-500">SKU: {product.sku}</p>
        </div>

        {/* Prix compact */}
        <div className="flex-none mb-2">
          <div className="text-sm font-semibold text-black">
            {product.cost_price ? `${product.cost_price.toFixed(2)} €` : 'N/A'}
          </div>
        </div>

        {/* Badges compacts */}
        <div className="flex-1 mb-2">
          <div className="flex flex-wrap gap-1">
            {attributesDisplay.map((attr, idx) => (
              <Badge
                key={idx}
                variant="secondary"
                className="text-[10px] px-1.5 py-0.5"
              >
                {attr.value}
              </Badge>
            ))}
            {product.weight && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0.5 bg-gray-50 text-gray-900 border-gray-300"
              >
                ⚖️ {product.weight}kg
              </Badge>
            )}
            {!hasCommonSupplier && product.supplier && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-700 border-blue-200"
              >
                🏢 {product.supplier.name}
              </Badge>
            )}
            {groupDimensions && groupDimensions.length && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0.5 bg-green-50 text-green-700 border-green-200"
              >
                📐 {groupDimensions.length}×{groupDimensions.width}×
                {groupDimensions.height}
              </Badge>
            )}
          </div>
        </div>

        {/* Boutons compacts en grille */}
        <div className="flex-none grid grid-cols-2 gap-1">
          <ButtonV2
            variant="outline"
            size="sm"
            className="text-[10px] h-7 w-full px-1"
            onClick={() => onEdit(product)}
          >
            <Edit3 className="w-3 h-3 mr-1" />
            Modifier
          </ButtonV2>
          <ButtonV2
            variant="outline"
            size="sm"
            className="text-[10px] h-7 w-full px-1"
            onClick={() => router.push(`/catalogue/${product.id}`)}
          >
            <Eye className="w-3 h-3 mr-1" />
            Détails
          </ButtonV2>
        </div>
      </div>
    </div>
  );
}

export default function VariantGroupDetailPage({
  params,
}: VariantGroupDetailPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { groupId } = use(params);
  const { variantGroup, loading, error } = useVariantGroup(groupId);
  const {
    removeProductFromGroup,
    updateVariantGroup,
    createProductInGroup,
    updateProductInGroup: _updateProductInGroup,
    addProductsToGroup,
    refetch,
  } = useVariantGroups();
  const { updateProductVariantAttribute: _updateProductVariantAttribute } =
    useProductVariantEditing();

  // États pour modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddProductsModal, setShowAddProductsModal] = useState(false);
  const [showCreateProductModal, setShowCreateProductModal] = useState(false);
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [selectedProductForEdit, setSelectedProductForEdit] =
    useState<VariantProduct | null>(null);

  // États pour édition inline
  const [editingName, setEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [savingName, setSavingName] = useState(false);

  const [editingType, setEditingType] = useState(false);
  const [editedType, setEditedType] = useState<
    'color' | 'size' | 'material' | 'pattern'
  >('color');
  const [savingType, setSavingType] = useState(false);

  // 🔧 SOLUTION DÉFINITIVE: Ref pour tracker si on doit afficher le toast
  const pendingToastRef = useRef(false);

  // 🔧 useEffect pour afficher le toast APRÈS le refetch complet
  useEffect(() => {
    if (pendingToastRef.current && variantGroup && !loading) {
      pendingToastRef.current = false;
      toast({
        title: 'Produit mis à jour',
        description: 'Les modifications ont été enregistrées avec succès',
      });
    }
  }, [variantGroup, loading, toast]);

  const handleEditGroup = useCallback(() => {
    setShowEditModal(true);
  }, []);

  const handleAddProducts = useCallback(() => {
    setShowAddProductsModal(true);
  }, []);

  const handleCreateProduct = useCallback(() => {
    setShowCreateProductModal(true);
  }, []);

  const handleCreateProductSubmit = useCallback(
    async (variantValue: string) => {
      if (!variantGroup) return false;
      return await createProductInGroup(
        groupId,
        variantValue,
        variantGroup.variant_type || 'color'
      );
    },
    [groupId, variantGroup, createProductInGroup]
  );

  const handleRemoveProduct = useCallback(
    async (productId: string, productName: string) => {
      if (
        !confirm(
          `Êtes-vous sûr de vouloir retirer "${productName}" de ce groupe ?`
        )
      )
        return;

      const result = await removeProductFromGroup(productId);
      if (result) {
        toast({
          title: 'Produit retiré',
          description: `"${productName}" a été retiré du groupe`,
        });
        // Recharger la page pour actualiser les données
        window.location.reload();
      }
    },
    [removeProductFromGroup, toast]
  );

  const handleModalSubmit = () => {
    setShowEditModal(false);
    setShowAddProductsModal(false);
    // Recharger la page pour actualiser les données
    window.location.reload();
  };

  // Handler pour ajout multiple produits
  // Mémoiser excludeProductIds pour éviter re-renders
  const excludeProductIds = useMemo(
    () => variantGroup?.products?.map(p => p.id) || [],
    [variantGroup?.products]
  );

  const handleProductsSelect = useCallback(
    async (products: SelectedProduct[]) => {
      if (!variantGroup || products.length === 0) {
        toast({
          title: 'Aucun produit sélectionné',
          description: 'Veuillez sélectionner au moins un produit',
          variant: 'destructive',
        });
        return;
      }

      try {
        const productIds = products.map(p => p.id);

        const success = await addProductsToGroup({
          variant_group_id: variantGroup.id,
          product_ids: productIds,
        });

        if (success) {
          toast({
            title: 'Produits ajoutés',
            description: `${products.length} produit(s) ajouté(s) au groupe "${variantGroup.name}"`,
          });

          await refetch();
          setShowAddProductsModal(false);
        }
      } catch (error) {
        console.error('Erreur ajout produits au groupe:', error);
        toast({
          title: 'Erreur',
          description: "Erreur lors de l'ajout des produits",
          variant: 'destructive',
        });
      }
    },
    [variantGroup?.id, variantGroup?.name, addProductsToGroup, refetch, toast]
  );

  // Édition inline du nom
  const handleStartEditName = useCallback(() => {
    setEditedName(variantGroup?.name ?? '');
    setEditingName(true);
  }, [variantGroup?.name]);

  const handleSaveName = useCallback(async () => {
    if (!editedName.trim() || editedName === variantGroup?.name) {
      setEditingName(false);
      return;
    }

    setSavingName(true);
    const success = await updateVariantGroup(groupId, {
      name: editedName.trim(),
    });

    if (success) {
      window.location.reload();
    }
    setSavingName(false);
  }, [editedName, groupId, variantGroup?.name, updateVariantGroup]);

  const handleCancelEditName = useCallback(() => {
    setEditingName(false);
    setEditedName('');
  }, []);

  // Édition inline du type
  const handleStartEditType = useCallback(() => {
    setEditedType(variantGroup?.variant_type || 'color');
    setEditingType(true);
  }, [variantGroup?.variant_type]);

  const handleSaveType = useCallback(
    async (newType: 'color' | 'size' | 'material' | 'pattern') => {
      if (newType === variantGroup?.variant_type) {
        setEditingType(false);
        return;
      }

      setSavingType(true);
      const success = await updateVariantGroup(groupId, {
        variant_type: newType,
      });

      if (success) {
        window.location.reload();
      }
      setSavingType(false);
    },
    [groupId, variantGroup?.variant_type, updateVariantGroup]
  );

  const handleCancelEditType = useCallback(() => {
    setEditingType(false);
  }, []);

  // Édition du produit (modal unifié)
  const handleEditProduct = useCallback((product: VariantProduct) => {
    setSelectedProductForEdit(product);
    setShowEditProductModal(true);
  }, []);

  const handleCloseEditProductModal = useCallback(() => {
    setShowEditProductModal(false);
    setSelectedProductForEdit(null);
  }, []);

  const handleProductUpdated = useCallback(async () => {
    // 🎯 SOLUTION DÉFINITIVE React-Safe:
    // 1. Modal se ferme (onClose) et démonte ses composants
    // 2. Ce callback est appelé
    // 3. On active le flag pour le toast
    // 4. On refetch les données
    // 5. Le useEffect détecte le changement de variantGroup + flag actif
    // 6. Le toast s'affiche APRÈS que React ait terminé tous les rendus

    // Activer le flag AVANT le refetch
    pendingToastRef.current = true;

    // Refetch les données (va déclencher le useEffect)
    await refetch();
  }, [refetch]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6" />
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !variantGroup) {
    return (
      <div className="container mx-auto px-4 py-6">
        <ButtonV2
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Retour
        </ButtonV2>
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Groupe de variantes introuvable
          </h2>
          <p className="text-gray-600">
            {error || "Ce groupe n'existe pas ou a été supprimé."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header avec navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <ButtonV2
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Retour
          </ButtonV2>
          <div>
            <div className="flex items-center gap-3">
              {getVariantTypeIcon(variantGroup.variant_type ?? '')}
              {editingName ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    value={editedName}
                    onChange={e => setEditedName(e.target.value)}
                    onBlur={() => {
                      void handleSaveName().catch(error => {
                        console.error(
                          '[VariantGroup] Save name failed:',
                          error
                        );
                      });
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        void handleSaveName().catch(error => {
                          console.error(
                            '[VariantGroup] Save name failed:',
                            error
                          );
                        });
                      }
                      if (e.key === 'Escape') handleCancelEditName();
                    }}
                    disabled={savingName}
                    className="text-2xl font-bold h-10"
                    autoFocus
                  />
                  {savingName && (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black" />
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {variantGroup.name}
                  </h1>
                  <button
                    onClick={handleStartEditName}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded"
                    title="Modifier le nom"
                  >
                    <Edit3 className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              )}
            </div>
            <p className="text-gray-600 text-sm mt-1">
              Type: {formatVariantType(variantGroup.variant_type)}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <ButtonV2
            variant="outline"
            size="sm"
            onClick={handleEditGroup}
            className="flex items-center"
          >
            <Edit3 className="w-4 h-4 mr-2" />
            Modifier les informations
          </ButtonV2>
          <ButtonV2
            size="sm"
            onClick={handleCreateProduct}
            className="bg-black text-white hover:bg-gray-800"
          >
            <Plus className="w-4 h-4 mr-2" />
            Créer un produit
          </ButtonV2>
          <ButtonV2
            variant="outline"
            size="sm"
            onClick={handleAddProducts}
            className="flex items-center"
          >
            <Package className="w-4 h-4 mr-2" />
            Importer existants
          </ButtonV2>
        </div>
      </div>

      {/* Informations du groupe */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produits</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {variantGroup.product_count || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Type</CardTitle>
            {getVariantTypeIcon(variantGroup.variant_type ?? '')}
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {formatVariantType(variantGroup.variant_type)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Créé</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {new Date(variantGroup.created_at).toLocaleDateString('fr-FR')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Modifié</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {new Date(variantGroup.updated_at).toLocaleDateString('fr-FR')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Informations du groupe avec édition inline */}
      <Card className="p-6 mb-8">
        <h3 className="text-lg font-semibold mb-4">Informations du groupe</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Catégorisation */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Catégorisation
            </label>
            {variantGroup.subcategory ? (
              <p className="text-sm text-gray-900">
                <span className="font-medium">
                  {variantGroup.subcategory.category?.name}
                </span>
                {' → '}
                <span className="font-medium">
                  {variantGroup.subcategory.name}
                </span>
              </p>
            ) : (
              <p className="text-sm text-gray-500">Non définie</p>
            )}
          </div>

          {/* Type de variante */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Type de variante
            </label>
            {editingType ? (
              <div className="flex items-center gap-2">
                <select
                  value={editedType}
                  onChange={e => {
                    const newType = e.target.value as
                      | 'color'
                      | 'size'
                      | 'material'
                      | 'pattern';
                    setEditedType(newType);
                    void handleSaveType(newType).catch(error => {
                      console.error('[VariantGroup] Save type failed:', error);
                    });
                  }}
                  disabled={savingType}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                  autoFocus
                >
                  <option value="color">Couleur</option>
                  <option value="size">Taille</option>
                  <option value="material">Matériau</option>
                  <option value="pattern">Motif</option>
                </select>
                {savingType && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black" />
                )}
                <button
                  onClick={handleCancelEditType}
                  className="text-gray-500 hover:text-gray-700"
                  disabled={savingType}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                {getVariantTypeIcon(variantGroup.variant_type ?? '')}
                <span className="text-sm text-gray-900 font-medium">
                  {formatVariantType(variantGroup.variant_type)}
                </span>
                <button
                  onClick={handleStartEditType}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded"
                  title="Modifier le type"
                >
                  <Edit3 className="w-3 h-3 text-gray-600" />
                </button>
              </div>
            )}
          </div>

          {/* Dimensions communes si présentes */}
          {variantGroup.dimensions_length && (
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2 flex items-center gap-2">
                📐 Dimensions communes
                <Badge
                  variant="outline"
                  className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                >
                  Héritées par tous les produits
                </Badge>
              </label>
              <p className="text-sm text-gray-900 font-medium">
                L: {variantGroup.dimensions_length} × l:{' '}
                {variantGroup.dimensions_width} × H:{' '}
                {variantGroup.dimensions_height} {variantGroup.dimensions_unit}
              </p>
            </div>
          )}

          {/* Poids commun si présent */}
          {variantGroup.common_weight && (
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2 flex items-center gap-2">
                ⚖️ Poids commun
                <Badge
                  variant="outline"
                  className="text-xs bg-gray-50 text-gray-900 border-gray-300"
                >
                  Hérité par tous les produits
                </Badge>
              </label>
              <p className="text-sm text-gray-900 font-medium">
                {variantGroup.common_weight} kg
              </p>
            </div>
          )}

          {/* Prix d'achat + Éco-taxe commune */}
          {variantGroup.has_common_cost_price &&
            variantGroup.common_cost_price !== null &&
            variantGroup.common_cost_price !== undefined && (
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700 block mb-2 flex items-center gap-2">
                  💰 Prix d'achat commun + Éco-taxe
                  <Badge
                    variant="outline"
                    className="text-xs bg-gray-50 text-gray-900 border-gray-300"
                  >
                    Hérité par tous les produits
                  </Badge>
                </label>
                <div className="space-y-1">
                  <p className="text-sm text-gray-900 font-medium">
                    Prix d'achat HT: {variantGroup.common_cost_price.toFixed(2)}{' '}
                    €
                  </p>
                  <p className="text-sm text-gray-700">
                    🌿 Éco-taxe: {(variantGroup.common_eco_tax || 0).toFixed(2)}{' '}
                    €
                  </p>
                  <p className="text-sm text-gray-900 font-semibold">
                    Total:{' '}
                    {(
                      variantGroup.common_cost_price +
                      (variantGroup.common_eco_tax || 0)
                    ).toFixed(2)}{' '}
                    €
                  </p>
                </div>
              </div>
            )}

          {/* Style décoratif */}
          {variantGroup.style && (
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Style décoratif
              </label>
              <Badge
                variant="outline"
                className="bg-pink-50 text-pink-700 border-pink-200"
              >
                🎨 {formatStyle(variantGroup.style)}
              </Badge>
            </div>
          )}

          {/* Pièces compatibles */}
          {variantGroup.suitable_rooms &&
            variantGroup.suitable_rooms.length > 0 && (
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Pièces compatibles
                </label>
                <div className="flex flex-wrap gap-2">
                  {variantGroup.suitable_rooms.map((room, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="bg-gray-50 text-gray-900 border-gray-300"
                    >
                      <Home className="h-3 w-3 mr-1" />
                      {room}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

          {/* Fournisseur commun */}
          {variantGroup.has_common_supplier && variantGroup.supplier && (
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Fournisseur commun
              </label>
              <div className="flex items-center gap-2">
                <Link
                  href={`/contacts-organisations/suppliers/${variantGroup.supplier.id}`}
                >
                  <Badge
                    variant="outline"
                    className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 cursor-pointer transition-colors flex items-center gap-1.5"
                  >
                    🏢{' '}
                    {getOrganisationDisplayName(variantGroup.supplier as any)}
                    <ExternalLink className="h-3 w-3 opacity-60" />
                  </Badge>
                </Link>
                <span className="text-xs text-gray-600">
                  (appliqué automatiquement à tous les produits du groupe)
                </span>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Liste des produits */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Produits du groupe ({variantGroup.products?.length ?? 0})
        </h2>

        {variantGroup.products && variantGroup.products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 auto-rows-fr">
            {variantGroup.products.map(product => (
              <VariantProductCard
                key={product.id}
                product={product}
                variantType={variantGroup.variant_type ?? ''}
                hasCommonSupplier={variantGroup.has_common_supplier ?? false}
                groupDimensions={
                  variantGroup.dimensions_length
                    ? ({
                        length: variantGroup.dimensions_length,
                        width: variantGroup.dimensions_width ?? null,
                        height: variantGroup.dimensions_height ?? null,
                        unit: variantGroup.dimensions_unit ?? null,
                      } as any)
                    : null
                }
                onRemove={(id, name) => {
                  void handleRemoveProduct(id, name).catch(error => {
                    console.error(
                      '[VariantGroup] Remove product failed:',
                      error
                    );
                  });
                }}
                onEdit={handleEditProduct}
                router={router}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun produit
            </h3>
            <p className="text-gray-600 mb-4">
              Ce groupe ne contient pas encore de produits.
            </p>
            <ButtonV2
              onClick={handleAddProducts}
              className="bg-black text-white hover:bg-gray-800"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter des produits
            </ButtonV2>
          </div>
        )}
      </div>

      {/* Modal édition */}
      {showEditModal && variantGroup && (
        <VariantGroupEditModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSubmit={async (groupId, data) => {
            await updateVariantGroup(groupId, data);
          }}
          group={variantGroup}
        />
      )}

      {/* Modal ajout produits existants - UniversalProductSelectorV2 */}
      {showAddProductsModal && variantGroup && (
        <UniversalProductSelectorV2
          open={showAddProductsModal}
          onClose={() => setShowAddProductsModal(false)}
          onSelect={handleProductsSelect}
          mode="multi"
          context="variants"
          title={`Ajouter des produits au groupe "${variantGroup.name}"`}
          description="Sélectionnez les produits à ajouter comme variantes de ce groupe"
          excludeProductIds={excludeProductIds}
          showImages
          showQuantity={false}
          showPricing={false}
        />
      )}

      {/* Modal création nouveau produit */}
      {showCreateProductModal && variantGroup && (
        <CreateProductInGroupModal
          isOpen={showCreateProductModal}
          onClose={() => setShowCreateProductModal(false)}
          variantGroup={variantGroup}
          onProductCreated={handleModalSubmit}
          onCreateProduct={handleCreateProductSubmit}
        />
      )}

      {/* Modal édition produit unifié */}
      {showEditProductModal && selectedProductForEdit && variantGroup && (
        <EditProductVariantModal
          isOpen={showEditProductModal}
          onClose={handleCloseEditProductModal}
          product={selectedProductForEdit}
          variantGroup={variantGroup}
          onSuccess={() => {
            void handleProductUpdated().catch(error => {
              console.error('[VariantGroup] Product update failed:', error);
            });
          }}
        />
      )}
    </div>
  );
}
