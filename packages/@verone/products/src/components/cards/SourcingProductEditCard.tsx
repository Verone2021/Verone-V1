'use client';

import { useState } from 'react';

import Image from 'next/image';

import { useInlineEdit, type EditableSection } from '@verone/common/hooks';
import { SupplierSelector } from '@verone/suppliers';
import {
  Badge,
  ButtonV2,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from '@verone/ui';
import { cn, formatPrice } from '@verone/utils';
import {
  Package,
  Edit,
  Save,
  X,
  User,
  Building,
  Clock,
  Euro,
  ExternalLink,
  Globe,
  Camera,
  AlertCircle,
  Link as LinkIcon,
  FileText,
} from 'lucide-react';

// Types
interface SourcingProduct {
  id: string;
  name: string;
  sku: string;
  supplier_page_url: string | null;
  cost_price: number | null;
  eco_tax_default?: number | null;
  supplier_id: string | null;
  sourcing_type: 'client' | 'interne' | null;
  requires_sample: boolean;
  created_at: string;
  updated_at: string;
  supplier?: {
    id: string;
    name: string;
    website?: string | null;
  } | null;
  assigned_client?: {
    id: string;
    name: string;
    type: string;
  } | null;
}

interface ProductImage {
  id: string;
  public_url: string | null;
  alt_text?: string | null;
}

interface SourcingProductEditCardProps {
  product: SourcingProduct;
  primaryImage?: ProductImage | null;
  images?: ProductImage[];
  imagesLoading?: boolean;
  onProductUpdate: (updates: Partial<SourcingProduct>) => Promise<void>;
  onOpenPhotosModal: () => void;
  className?: string;
}

export function SourcingProductEditCard({
  product,
  primaryImage,
  images = [],
  imagesLoading = false,
  onProductUpdate,
  onOpenPhotosModal,
  className,
}: SourcingProductEditCardProps) {
  // Hook d'édition inline - gère indépendamment les 3 zones
  const {
    isEditing,
    isSaving,
    getError,
    getEditedData,
    startEdit,
    cancelEdit,
    updateEditedData,
    saveChanges,
    hasChanges,
  } = useInlineEdit({
    productId: product.id,
    onUpdate: updatedData => {
      onProductUpdate(updatedData);
    },
    onError: error => {
      console.error('❌ Erreur mise à jour sourcing:', error);
    },
  });

  // Formatters
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ZONE INFO - Nom + URL Fournisseur
  // ═══════════════════════════════════════════════════════════════════════════
  const infoSection: EditableSection = 'general';
  const infoData = getEditedData(infoSection);
  const infoError = getError(infoSection);

  const handleStartInfoEdit = () => {
    startEdit(infoSection, {
      name: product.name,
      supplier_page_url: product.supplier_page_url || '',
    });
  };

  const handleSaveInfo = async () => {
    if (!infoData?.name?.trim()) {
      alert('Le nom du produit est obligatoire');
      return;
    }
    if (infoData?.supplier_page_url?.trim()) {
      try {
        new URL(infoData.supplier_page_url);
      } catch {
        alert("Format d'URL invalide");
        return;
      }
    }
    const success = await saveChanges(infoSection);
    if (success) {
      console.log('✅ Informations mises à jour');
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ZONE PRIX - Prix d'achat + Éco-participation
  // ═══════════════════════════════════════════════════════════════════════════
  const pricingSection: EditableSection = 'pricing';
  const pricingData = getEditedData(pricingSection);
  const pricingError = getError(pricingSection);

  const handleStartPricingEdit = () => {
    startEdit(pricingSection, {
      cost_price: product.cost_price || 0,
      eco_tax_default: product.eco_tax_default || 0,
    });
  };

  const handleSavePricing = async () => {
    if (pricingData?.cost_price !== undefined && pricingData.cost_price <= 0) {
      alert("Le prix d'achat doit être supérieur à 0");
      return;
    }
    const success = await saveChanges(pricingSection);
    if (success) {
      console.log('✅ Tarification mise à jour');
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ZONE FOURNISSEUR - Sélection fournisseur
  // ═══════════════════════════════════════════════════════════════════════════
  const supplierSection: EditableSection = 'supplier';
  const supplierData = getEditedData(supplierSection);
  const supplierError = getError(supplierSection);

  const handleStartSupplierEdit = () => {
    startEdit(supplierSection, {
      supplier_id: product.supplier_id || null,
    });
  };

  const handleSaveSupplier = async () => {
    const success = await saveChanges(supplierSection);
    if (success) {
      console.log('✅ Fournisseur mis à jour');
    }
  };

  return (
    <Card className={cn('border-black', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-start gap-6">
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* IMAGE PRODUIT */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <div
            className="relative flex-shrink-0 w-32 h-32 bg-gray-100 rounded-lg overflow-hidden cursor-pointer group border border-gray-200"
            onClick={onOpenPhotosModal}
          >
            {primaryImage?.public_url && !imagesLoading ? (
              <Image
                src={primaryImage.public_url}
                alt={primaryImage.alt_text || product.name}
                fill
                className="object-contain"
                sizes="128px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                {imagesLoading ? (
                  <div className="animate-pulse">
                    <Package className="h-10 w-10 text-gray-300" />
                  </div>
                ) : (
                  <Package className="h-10 w-10 text-gray-400" />
                )}
              </div>
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="text-white text-xs font-medium flex items-center gap-1">
                <Camera className="h-4 w-4" />
                {images.length > 0 ? `${images.length} photo(s)` : 'Ajouter'}
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* ZONE INFO (Nom + URL) */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <div className="flex-1 min-w-0">
            {isEditing(infoSection) ? (
              // MODE ÉDITION INFO
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-700 flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    Informations Produit
                  </h3>
                  <div className="flex space-x-1">
                    <ButtonV2
                      variant="ghost"
                      size="sm"
                      onClick={() => cancelEdit(infoSection)}
                      disabled={isSaving(infoSection)}
                    >
                      <X className="h-4 w-4" />
                    </ButtonV2>
                    <ButtonV2
                      variant="default"
                      size="sm"
                      onClick={handleSaveInfo}
                      disabled={
                        isSaving(infoSection) || !hasChanges(infoSection)
                      }
                      className="bg-black hover:bg-gray-800 text-white"
                    >
                      {isSaving(infoSection) ? (
                        <span className="animate-spin">⏳</span>
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                    </ButtonV2>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="name" className="text-xs text-gray-600">
                      Nom du produit *
                    </Label>
                    <Input
                      id="name"
                      value={infoData?.name || ''}
                      onChange={e =>
                        updateEditedData(infoSection, { name: e.target.value })
                      }
                      placeholder="Nom du produit"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="supplier_page_url"
                      className="text-xs text-gray-600"
                    >
                      URL page fournisseur
                    </Label>
                    <div className="relative mt-1">
                      <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="supplier_page_url"
                        type="url"
                        value={infoData?.supplier_page_url || ''}
                        onChange={e =>
                          updateEditedData(infoSection, {
                            supplier_page_url: e.target.value,
                          })
                        }
                        placeholder="https://fournisseur.com/produit/123"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                {infoError && (
                  <p className="text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {infoError}
                  </p>
                )}
              </div>
            ) : (
              // MODE AFFICHAGE INFO
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-2xl text-black">
                      {product.name}
                    </CardTitle>
                    <p className="text-gray-600 mt-1">
                      <span className="font-medium">SKU:</span> {product.sku}
                    </p>
                    {product.supplier_page_url && (
                      <a
                        href={product.supplier_page_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-blue-600 hover:underline text-sm mt-1"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Page produit fournisseur
                      </a>
                    )}
                  </div>
                  <ButtonV2
                    variant="ghost"
                    size="sm"
                    onClick={handleStartInfoEdit}
                    className="text-gray-500 hover:text-black"
                  >
                    <Edit className="h-4 w-4" />
                  </ButtonV2>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {product.sourcing_type === 'client' && (
                    <Badge
                      variant="outline"
                      className="border-blue-300 text-blue-600"
                    >
                      <User className="h-3 w-3 mr-1" />
                      Sourcing Client
                    </Badge>
                  )}
                  {product.sourcing_type === 'interne' && (
                    <Badge
                      variant="outline"
                      className="border-black text-black"
                    >
                      <Building className="h-3 w-3 mr-1" />
                      Sourcing Interne
                    </Badge>
                  )}
                  {product.requires_sample && (
                    <Badge
                      variant="outline"
                      className="border-orange-300 text-orange-600"
                    >
                      <Package className="h-3 w-3 mr-1" />
                      Échantillon requis
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* ZONE PRIX (Prix d'achat + Éco-participation) */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="border-t border-gray-200 pt-4">
          {isEditing(pricingSection) ? (
            // MODE ÉDITION PRIX
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-700 flex items-center">
                  <Euro className="h-4 w-4 mr-2" />
                  Prix d'Achat
                </h3>
                <div className="flex space-x-1">
                  <ButtonV2
                    variant="ghost"
                    size="sm"
                    onClick={() => cancelEdit(pricingSection)}
                    disabled={isSaving(pricingSection)}
                  >
                    <X className="h-4 w-4" />
                  </ButtonV2>
                  <ButtonV2
                    variant="default"
                    size="sm"
                    onClick={handleSavePricing}
                    disabled={
                      isSaving(pricingSection) || !hasChanges(pricingSection)
                    }
                    className="bg-black hover:bg-gray-800 text-white"
                  >
                    {isSaving(pricingSection) ? (
                      <span className="animate-spin">⏳</span>
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                  </ButtonV2>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cost_price" className="text-xs text-gray-600">
                    Prix d'achat HT (€) *
                  </Label>
                  <div className="relative mt-1">
                    <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="cost_price"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={pricingData?.cost_price || ''}
                      onChange={e =>
                        updateEditedData(pricingSection, {
                          cost_price: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="250.00"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label
                    htmlFor="eco_tax_default"
                    className="text-xs text-gray-600"
                  >
                    Éco-participation (€)
                  </Label>
                  <div className="relative mt-1">
                    <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-orange-400" />
                    <Input
                      id="eco_tax_default"
                      type="number"
                      step="0.01"
                      min="0"
                      value={pricingData?.eco_tax_default || ''}
                      onChange={e =>
                        updateEditedData(pricingSection, {
                          eco_tax_default: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="2.50"
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Taxe éco-responsable (DEEE, mobilier...)
                  </p>
                </div>
              </div>

              {pricingError && (
                <p className="text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {pricingError}
                </p>
              )}
            </div>
          ) : (
            // MODE AFFICHAGE PRIX
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700 flex items-center">
                  <Euro className="h-4 w-4 mr-2" />
                  Prix d'Achat
                </h3>
                <ButtonV2
                  variant="ghost"
                  size="sm"
                  onClick={handleStartPricingEdit}
                  className="text-gray-500 hover:text-black"
                >
                  <Edit className="h-4 w-4" />
                </ButtonV2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                  <p className="text-xs text-red-600 font-medium mb-1">
                    Prix d'achat HT
                  </p>
                  <p className="text-xl font-bold text-red-900">
                    {product.cost_price
                      ? formatPrice(product.cost_price)
                      : 'Non défini'}
                  </p>
                </div>
                <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                  <p className="text-xs text-orange-600 font-medium mb-1">
                    Éco-participation
                  </p>
                  <p className="text-xl font-bold text-orange-900">
                    {product.eco_tax_default
                      ? formatPrice(product.eco_tax_default)
                      : '0,00 €'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* ZONE FOURNISSEUR */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="border-t border-gray-200 pt-4">
          {isEditing(supplierSection) ? (
            // MODE ÉDITION FOURNISSEUR
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-700 flex items-center">
                  <Building className="h-4 w-4 mr-2" />
                  Fournisseur
                </h3>
                <div className="flex space-x-1">
                  <ButtonV2
                    variant="ghost"
                    size="sm"
                    onClick={() => cancelEdit(supplierSection)}
                    disabled={isSaving(supplierSection)}
                  >
                    <X className="h-4 w-4" />
                  </ButtonV2>
                  <ButtonV2
                    variant="default"
                    size="sm"
                    onClick={handleSaveSupplier}
                    disabled={
                      isSaving(supplierSection) || !hasChanges(supplierSection)
                    }
                    className="bg-black hover:bg-gray-800 text-white"
                  >
                    {isSaving(supplierSection) ? (
                      <span className="animate-spin">⏳</span>
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                  </ButtonV2>
                </div>
              </div>

              <SupplierSelector
                selectedSupplierId={supplierData?.supplier_id || null}
                onSupplierChange={supplierId => {
                  updateEditedData(supplierSection, {
                    supplier_id: supplierId || null,
                  });
                }}
                label="Sélectionner un fournisseur"
                placeholder="Rechercher un fournisseur..."
                required={false}
              />

              {supplierError && (
                <p className="text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {supplierError}
                </p>
              )}
            </div>
          ) : (
            // MODE AFFICHAGE FOURNISSEUR
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700 flex items-center">
                  <Building className="h-4 w-4 mr-2" />
                  Fournisseur
                </h3>
                <ButtonV2
                  variant="ghost"
                  size="sm"
                  onClick={handleStartSupplierEdit}
                  className="text-gray-500 hover:text-black"
                >
                  <Edit className="h-4 w-4" />
                </ButtonV2>
              </div>

              {product.supplier ? (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-lg font-semibold text-blue-900 mb-2">
                    {product.supplier.name}
                  </p>
                  <div className="flex flex-col space-y-1">
                    <a
                      href={`/contacts-organisations/suppliers/${product.supplier.id}`}
                      className="inline-flex items-center text-blue-600 hover:underline text-sm"
                    >
                      <Building className="h-4 w-4 mr-2" />
                      Voir la fiche fournisseur
                    </a>
                    {product.supplier.website && (
                      <a
                        href={product.supplier.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-blue-600 hover:underline text-sm"
                      >
                        <Globe className="h-4 w-4 mr-2" />
                        Site web du fournisseur
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 text-center">
                  <Building className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 text-sm">
                    Aucun fournisseur assigné
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Cliquez sur l'icône de modification pour en ajouter un
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* CLIENT ASSIGNÉ (lecture seule) */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {product.assigned_client && (
          <div className="border-t border-gray-200 pt-4">
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center mb-2">
                <User className="h-5 w-5 text-purple-600 mr-2" />
                <h4 className="font-medium text-black">Client assigné</h4>
              </div>
              <p className="text-lg font-semibold text-purple-900">
                {product.assigned_client.name}
                {product.assigned_client.type === 'client'
                  ? ' (Client)'
                  : ` (${product.assigned_client.type})`}
              </p>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* MÉTADONNÉES */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center text-sm text-gray-600 space-x-4">
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              <span>Créé le {formatDate(product.created_at)}</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              <span>Modifié le {formatDate(product.updated_at)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
