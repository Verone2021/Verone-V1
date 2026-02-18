'use client';

import { ButtonV2 } from '@verone/ui';
import { cn, formatPrice } from '@verone/utils';
import {
  DollarSign,
  Save,
  X,
  Edit,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

import { useInlineEdit, type EditableSection } from '@verone/common/hooks';

interface Product {
  id: string;
  variant_group_id?: string;
  // Tarification simplifiée
  cost_price?: number;
  eco_tax_default?: number;
  margin_percentage?: number;
  tax_rate?: number;
  selling_price?: number;
  // Prix d'achat enrichis (historique fournisseur)
  cost_price_avg?: number | null;
  cost_price_min?: number | null;
  cost_price_max?: number | null;
  cost_price_last?: number | null;
  cost_price_count?: number; // NOT NULL integer in DB, defaults to 0
  target_margin_percentage?: number | null;
}

interface VariantGroup {
  id: string;
  name: string;
  has_common_cost_price?: boolean | null;
  common_cost_price?: number | null;
  common_eco_tax?: number | null; // ✅ Taxe éco-responsable commune (liée au prix d'achat)
}

/** Channel pricing data joined with sales channel info */
interface ChannelPricingRow {
  channel_id: string;
  channel_name: string;
  channel_code: string;
  public_price_ht: number | null;
  custom_price_ht: number | null;
  discount_rate: number | null;
  markup_rate: number | null;
  suggested_margin_rate: number | null;
  is_active: boolean;
}

/** Typed shape for pricing edit data (avoids unsafe `any` from useInlineEdit) */
interface PricingEditData {
  cost_price?: number;
  eco_tax_default?: number;
  margin_percentage?: number;
  selling_price?: number;
}

interface SupplierVsPricingEditSectionProps {
  product: Product;
  variantGroup?: VariantGroup | null;
  onUpdate: (updatedProduct: Partial<Product>) => void;
  className?: string;
  /** Channel pricing data for this product (from channel_pricing + sales_channels) */
  channelPricing?: ChannelPricingRow[];
}

export function SupplierVsPricingEditSection({
  product,
  variantGroup,
  onUpdate,
  className,
  channelPricing,
}: SupplierVsPricingEditSectionProps) {
  // Verrouillage si cost_price géré par le groupe de variantes
  const isCostPriceManagedByGroup = !!(
    variantGroup?.has_common_cost_price && product.variant_group_id
  );
  // ✅ Verrouillage de l'éco-taxe si prix d'achat géré par le groupe
  // (car éco-taxe et prix d'achat sont TOUJOURS liés)
  const isEcoTaxManagedByGroup = isCostPriceManagedByGroup;

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
      onUpdate(updatedData as Partial<Product>);
    },
    onError: error => {
      console.error('❌ Erreur mise à jour pricing supplier/internal:', error);
    },
  });

  const section: EditableSection = 'pricing';
  const editData = getEditedData(section) as PricingEditData | null;
  const error = getError(section);

  // Récupération des données de tarification simplifiée
  // Si cost_price géré par le groupe, utiliser common_cost_price
  const currentCostPrice = isCostPriceManagedByGroup
    ? (variantGroup?.common_cost_price ?? 0)
    : (product.cost_price ?? 0);
  const currentMarginPercentage = product.margin_percentage ?? 25; // Défaut 25%

  // Calcul automatique du prix de vente minimum
  const calculateMinSellingPrice = (
    costPrice: number,
    ecoTax: number,
    marginPercentage: number
  ) => {
    if (!costPrice || costPrice <= 0) return 0;
    const totalCost = costPrice + (ecoTax || 0); // ✅ Ajouter éco-taxe au coût
    return totalCost * (1 + marginPercentage / 100);
  };

  // ✅ Si éco-taxe gérée par le groupe, utiliser common_eco_tax
  const currentEcoTax = isEcoTaxManagedByGroup
    ? (variantGroup?.common_eco_tax ?? 0)
    : (product.eco_tax_default ?? 0);
  const currentSellingPrice = calculateMinSellingPrice(
    currentCostPrice,
    currentEcoTax,
    currentMarginPercentage
  );

  const handleStartEdit = () => {
    startEdit(section, {
      cost_price: currentCostPrice,
      eco_tax_default: currentEcoTax, // ✅ Inclure éco-taxe
      margin_percentage: currentMarginPercentage,
    });
  };

  const handleSave = async () => {
    // Validation business rules avant sauvegarde
    if (editData?.cost_price && editData.cost_price <= 0) {
      alert("⚠️ Le prix d'achat doit être supérieur à 0");
      return;
    }

    if (editData?.margin_percentage && editData.margin_percentage < 5) {
      const confirmed = confirm(
        `⚠️ Marge très faible (${editData.margin_percentage}%). Continuer ?`
      );
      if (!confirmed) return;
    }

    // Calculer le prix de vente pour sauvegarde
    const sellingPrice = editData?.cost_price
      ? calculateMinSellingPrice(
          editData.cost_price,
          editData.eco_tax_default ?? 0,
          editData.margin_percentage ?? 25
        )
      : 0;

    const dataToSave = {
      cost_price: editData?.cost_price,
      eco_tax_default: editData?.eco_tax_default ?? 0, // ✅ Inclure éco-taxe
      margin_percentage: editData?.margin_percentage,
      selling_price: sellingPrice, // Prix calculé automatiquement
    };

    // Directement sauvegarder avec les données finales
    updateEditedData(section, dataToSave);

    // Attendre un cycle pour que l'état soit mis à jour
    setTimeout(() => {
      void saveChanges(section).catch(console.error);
    }, 0);
  };

  const handleCancel = () => {
    cancelEdit(section);
  };

  const handlePriceChange = (field: string, value: string) => {
    let numValue: number;

    if (field === 'margin_percentage') {
      numValue = parseFloat(value) || 0; // Garde le pourcentage tel quel
    } else {
      numValue = parseFloat(value) || 0; // Prix en euros
    }

    updateEditedData(section, { [field]: numValue });
  };

  // Calculer prix de vente en temps réel pendant l'édition
  const editSellingPrice = editData
    ? calculateMinSellingPrice(
        editData.cost_price ?? 0,
        editData.eco_tax_default ?? 0,
        editData.margin_percentage ?? 25
      )
    : currentSellingPrice;

  const editMarginAmount = editData
    ? editSellingPrice -
      ((editData.cost_price ?? 0) + (editData.eco_tax_default ?? 0))
    : currentSellingPrice - (currentCostPrice + currentEcoTax);

  if (isEditing(section)) {
    return (
      <div className={cn('card-verone p-4', className)}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-black flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Tarification Fournisseur vs Vérone
          </h3>
          <div className="flex space-x-1">
            <ButtonV2
              variant="outline"
              size="xs"
              onClick={handleCancel}
              disabled={isSaving(section)}
              className="text-xs px-2 py-1"
            >
              <X className="h-3 w-3 mr-1" />
              Annuler
            </ButtonV2>
            <ButtonV2
              variant="secondary"
              size="xs"
              onClick={() => {
                void handleSave().catch(console.error);
              }}
              disabled={!hasChanges(section) || isSaving(section)}
              className="text-xs px-2 py-1"
            >
              <Save className="h-3 w-3 mr-1" />
              {isSaving(section) ? 'Sauvegarde...' : 'Sauvegarder'}
            </ButtonV2>
          </div>
        </div>

        <div className="space-y-4">
          {/* PRIX D'ACHAT */}
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <h4 className="text-sm font-medium text-red-800 mb-3">
              📦 PRIX D'ACHAT FOURNISSEUR
            </h4>
            <div>
              <label className="block text-sm font-medium text-red-700 mb-1">
                Prix d'achat HT (en euros) *
              </label>
              <input
                type="number"
                value={editData?.cost_price ?? ''}
                onChange={e => handlePriceChange('cost_price', e.target.value)}
                className={cn(
                  'w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500',
                  isCostPriceManagedByGroup && 'bg-gray-100 cursor-not-allowed'
                )}
                step="0.01"
                min="0"
                placeholder="Prix d'achat chez le fournisseur"
                disabled={isCostPriceManagedByGroup}
                required={!isCostPriceManagedByGroup}
              />
              {editData?.cost_price && (
                <div className="text-xs text-red-600 mt-1">
                  💰 Coût: {formatPrice(editData.cost_price)}
                </div>
              )}
            </div>
          </div>

          {/* TAXE ÉCO-RESPONSABLE (facultatif) */}
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <h4 className="text-sm font-medium text-orange-800 mb-3">
              🌿 TAXE ÉCO-RESPONSABLE (facultatif)
            </h4>
            <div>
              <label className="block text-sm font-medium text-orange-700 mb-1">
                Éco-participation (en euros)
              </label>
              <input
                type="number"
                value={editData?.eco_tax_default ?? ''}
                onChange={e =>
                  handlePriceChange('eco_tax_default', e.target.value)
                }
                className={cn(
                  'w-full px-3 py-2 border border-orange-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500',
                  isEcoTaxManagedByGroup && 'bg-gray-100 cursor-not-allowed'
                )}
                step="0.01"
                min="0"
                placeholder="Montant éco-taxe (ex: 2.50)"
                disabled={isEcoTaxManagedByGroup}
              />
              {isEcoTaxManagedByGroup ? (
                <div className="text-xs text-orange-700 mt-1">
                  🔒 Éco-taxe liée au prix d'achat commun du groupe de variantes
                </div>
              ) : (
                <div className="text-xs text-orange-600 mt-1">
                  💡 S'additionne au prix d'achat fournisseur
                </div>
              )}
              {editData?.eco_tax_default && editData.eco_tax_default > 0 && (
                <div className="text-xs text-orange-600 mt-1">
                  🌿 Éco-taxe: {formatPrice(editData.eco_tax_default)}
                </div>
              )}
            </div>
          </div>

          {/* TAUX DE MARGE */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="text-sm font-medium text-blue-800 mb-3">
              📈 TAUX DE MARGE
            </h4>
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1">
                Taux de marge (%)
              </label>
              <input
                type="number"
                value={editData?.margin_percentage ?? ''}
                onChange={e =>
                  handlePriceChange('margin_percentage', e.target.value)
                }
                className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                step="1"
                min="0"
                max="500"
                placeholder="Taux de marge en %"
              />
              <div className="text-xs text-blue-600 mt-1">
                Exemple: 25% = prix de vente 25% supérieur au prix d'achat
              </div>
            </div>
          </div>

          {/* PRIX DE VENTE CALCULÉ AUTOMATIQUEMENT */}
          {editData?.cost_price && editData?.margin_percentage && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="text-sm font-medium text-green-800 mb-3">
                💰 PRIX MINIMUM DE VENTE (calculé)
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-green-700 font-medium">Prix HT:</span>
                  <span className="text-xl font-bold text-green-800">
                    {formatPrice(editSellingPrice)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-green-700">Marge brute:</span>
                  <span className="font-semibold text-green-700">
                    {formatPrice(editMarginAmount)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Alertes */}
          {editData?.margin_percentage && editData.margin_percentage < 5 && (
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <div className="flex items-center text-black text-sm">
                <AlertCircle className="h-4 w-4 mr-2" />
                ⚠️ Marge très faible (moins de 5%)
              </div>
            </div>
          )}
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="mt-3 text-sm text-red-600 bg-red-50 p-2 rounded">
            ❌ {error}
          </div>
        )}
      </div>
    );
  }

  // Mode affichage
  return (
    <div className={cn('card-verone p-4', className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium text-black flex items-center">
          <DollarSign className="h-5 w-5 mr-2" />
          Tarification
        </h3>
        <ButtonV2 variant="outline" size="sm" onClick={handleStartEdit}>
          <Edit className="h-3 w-3 mr-1" />
          Modifier
        </ButtonV2>
      </div>

      {/* Banner informatif si cost_price + éco-taxe gérés par groupe */}
      {isCostPriceManagedByGroup && (
        <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
          ℹ️ Le prix d'achat et l'éco-taxe sont communs à toutes les variantes
          du groupe "{variantGroup?.name}".{' '}
          <a
            href={`/produits/catalogue/variantes/${variantGroup?.id}`}
            className="underline font-medium hover:text-blue-900"
          >
            Modifier depuis la page du groupe
          </a>
        </div>
      )}

      <div className="space-y-4">
        {/* Prix d'achat */}
        {currentCostPrice > 0 && (
          <div className="bg-red-50 p-3 rounded-lg">
            <div className="text-xs text-red-600 font-medium mb-1">
              📦 PRIX D'ACHAT FOURNISSEUR
            </div>
            <div className="flex justify-between items-center">
              <span className="text-red-700 font-medium">Coût HT:</span>
              <span className="text-lg font-bold text-red-800">
                {formatPrice(currentCostPrice)}
              </span>
            </div>
          </div>
        )}

        {/* Éco-taxe */}
        {currentEcoTax > 0 && (
          <div className="bg-orange-50 p-3 rounded-lg">
            <div className="text-xs text-orange-600 font-medium mb-1">
              🌿 TAXE ÉCO-RESPONSABLE
            </div>
            <div className="flex justify-between items-center">
              <span className="text-orange-700 font-medium">
                Éco-participation:
              </span>
              <span className="text-lg font-bold text-orange-800">
                {formatPrice(currentEcoTax)}
              </span>
            </div>
          </div>
        )}

        {/* Taux de marge */}
        {currentMarginPercentage > 0 && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-xs text-blue-600 font-medium mb-1">
              📈 TAUX DE MARGE
            </div>
            <div className="flex justify-between items-center">
              <span className="text-blue-700 font-medium">Pourcentage:</span>
              <span
                className={cn(
                  'text-lg font-bold',
                  currentMarginPercentage > 20
                    ? 'text-green-600'
                    : currentMarginPercentage > 5
                      ? 'text-black'
                      : 'text-red-600'
                )}
              >
                {currentMarginPercentage}%
              </span>
            </div>
          </div>
        )}

        {/* Prix de vente calculé */}
        {currentCostPrice > 0 && currentMarginPercentage > 0 && (
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-xs text-green-600 font-medium mb-1">
              💰 PRIX MINIMUM DE VENTE
            </div>
            <div className="flex justify-between items-center">
              <span className="text-green-700 font-medium">Prix HT:</span>
              <span className="text-xl font-bold text-green-800">
                {formatPrice(currentSellingPrice)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-green-700">Marge brute:</span>
              <span className="font-semibold text-green-700">
                {formatPrice(currentSellingPrice - currentCostPrice)}
              </span>
            </div>
          </div>
        )}

        {/* Message si pas de données */}
        {(!currentCostPrice || !currentMarginPercentage) && (
          <div className="text-center text-gray-400 text-xs italic py-2">
            {!currentCostPrice && !currentMarginPercentage
              ? "Prix d'achat et taux de marge non renseignés"
              : !currentCostPrice
                ? "Prix d'achat non renseigné"
                : 'Taux de marge non renseigné'}
          </div>
        )}

        {/* Prix d'achat enrichis (historique fournisseur) */}
        {currentCostPrice > 0 &&
          (product.cost_price_avg != null ||
            product.cost_price_min != null ||
            product.cost_price_last != null) && (
            <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200">
              <div className="text-xs text-neutral-600 font-medium mb-2">
                <TrendingUp className="h-3 w-3 inline mr-1" />
                HISTORIQUE PRIX D'ACHAT
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {product.cost_price_avg != null && (
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Prix moyen:</span>
                    <span className="font-medium text-neutral-800">
                      {formatPrice(product.cost_price_avg)}
                    </span>
                  </div>
                )}
                {product.cost_price_last != null && (
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Dernier prix:</span>
                    <span className="font-medium text-neutral-800">
                      {formatPrice(product.cost_price_last)}
                    </span>
                  </div>
                )}
                {product.cost_price_min != null &&
                  product.cost_price_max != null && (
                    <div className="flex justify-between col-span-2">
                      <span className="text-neutral-600">Min / Max:</span>
                      <span className="font-medium text-neutral-800">
                        {formatPrice(product.cost_price_min)} /{' '}
                        {formatPrice(product.cost_price_max)}
                      </span>
                    </div>
                  )}
                {product.cost_price_count != null &&
                  product.cost_price_count > 0 && (
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Nb achats:</span>
                      <span className="font-medium text-neutral-800">
                        {product.cost_price_count}
                      </span>
                    </div>
                  )}
                {product.target_margin_percentage != null &&
                  product.target_margin_percentage !==
                    product.margin_percentage && (
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Marge cible:</span>
                      <span className="font-medium text-neutral-800">
                        {product.target_margin_percentage}%
                      </span>
                    </div>
                  )}
              </div>
            </div>
          )}

        {/* Prix par canal de vente */}
        {channelPricing && channelPricing.length > 0 && (
          <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200">
            <div className="text-xs text-neutral-600 font-medium mb-2">
              <DollarSign className="h-3 w-3 inline mr-1" />
              PRIX PAR CANAL DE VENTE
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-neutral-500 border-b border-neutral-200">
                    <th className="text-left py-1.5 pr-3 font-medium">Canal</th>
                    <th className="text-right py-1.5 px-2 font-medium">
                      Prix HT
                    </th>
                    <th className="text-right py-1.5 px-2 font-medium">
                      Remise
                    </th>
                    <th className="text-right py-1.5 px-2 font-medium">
                      Marge
                    </th>
                    <th className="text-right py-1.5 pl-2 font-medium">
                      Statut
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {channelPricing.map(ch => {
                    const price = ch.custom_price_ht ?? ch.public_price_ht;
                    const hasPrice = price != null && price > 0;
                    return (
                      <tr
                        key={ch.channel_id}
                        className="border-b border-neutral-100 last:border-0"
                      >
                        <td className="py-1.5 pr-3 text-neutral-800">
                          {ch.channel_name}
                        </td>
                        <td className="py-1.5 px-2 text-right text-neutral-700">
                          {hasPrice ? formatPrice(price) : '--'}
                        </td>
                        <td className="py-1.5 px-2 text-right text-neutral-700">
                          {ch.discount_rate != null
                            ? `${ch.discount_rate}%`
                            : '--'}
                        </td>
                        <td className="py-1.5 px-2 text-right text-neutral-700">
                          {ch.suggested_margin_rate != null
                            ? `${ch.suggested_margin_rate}%`
                            : '--'}
                        </td>
                        <td className="py-1.5 pl-2 text-right">
                          {ch.is_active && hasPrice ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                              Actif
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-neutral-100 text-neutral-500">
                              Non configure
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Composant de tarification avec séparation claire supplier vs internal
 *
 * PRIX CLARIFIÉS:
 * - supplier_price: Prix d'achat fournisseur HT (centimes)
 * - selling_price: Prix de vente Vérone HT (centimes)
 *
 * FONCTIONNALITÉS:
 * - Calcul automatique des marges
 * - Validation business rules (prix vente > prix achat)
 * - Alertes marge faible/négative
 * - Labels explicites pour chaque prix
 *
 * CONFORME À:
 * - Manifeste supplier-vs-internal-data.md
 * - Exigence "S'il y a un prix, je veux savoir c'est un prix de quoi"
 */
