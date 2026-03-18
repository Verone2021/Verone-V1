/* eslint-disable @typescript-eslint/await-thenable, @typescript-eslint/no-explicit-any, @typescript-eslint/no-misused-promises, @typescript-eslint/no-unused-vars, @typescript-eslint/prefer-nullish-coalescing */
'use client';

/**
 * 🎨 Modal Édition Produit Variante - Vérone Back Office
 *
 * Modal unifié pour éditer un produit dans un groupe de variantes
 * Fusionne les fonctionnalités de modification d'attributs et de produit
 *
 * ✅ Affiche les attributs hérités du groupe (read-only)
 * ✅ Permet modification des attributs spécifiques au produit
 * ✅ Validation unicité des attributs variantes
 * ✅ Mise à jour automatique du nom produit
 * ✅ Design system Vérone (noir/blanc/gris)
 * ✅ Select pour couleur/matériau (pas texte libre)
 * ✅ Poids modifiable par produit
 */

import { useState, useEffect } from 'react';

import { AlertCircle, Save, X } from 'lucide-react';

import { ButtonV2 } from '@verone/ui';
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
import { Textarea } from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import { useToast } from '@verone/common/hooks';
import { useOrganisations } from '@verone/organisations/hooks';
import { SupplierSelector } from '@verone/organisations/components/suppliers';
import { COLLECTION_STYLE_OPTIONS } from '@verone/types';
import {
  COLOR_OPTIONS,
  MATERIAL_OPTIONS,
  type ProductColor,
  type ProductMaterial,
} from '@verone/types';
import type { VariantProduct, VariantGroup } from '@verone/types';

interface EditProductVariantModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: VariantProduct;
  variantGroup: VariantGroup;
  onSuccess: () => void;
}

export function EditProductVariantModal({
  isOpen,
  onClose,
  product,
  variantGroup,
  onSuccess,
}: EditProductVariantModalProps) {
  // États formulaire (SEULEMENT les champs modifiables du produit)
  const [variantValue, setVariantValue] = useState<string>('');
  const [costPrice, setCostPrice] = useState(0.01);
  const [weight, setWeight] = useState<number | null>(null);
  const [supplierId, setSupplierId] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();
  const { toast } = useToast();

  // Hook pour charger la liste des fournisseurs
  const { organisations: suppliers } = useOrganisations({
    type: 'supplier',
    is_active: true,
  });

  // Récupérer variant_type du groupe
  const variantType = variantGroup.variant_type ?? 'color';
  const variantTypeLabel = variantType === 'color' ? 'Couleur' : 'Matériau';

  // Options selon le type de variante
  const variantOptions =
    variantType === 'color' ? COLOR_OPTIONS : MATERIAL_OPTIONS;

  // Initialiser les valeurs depuis le produit
  useEffect(() => {
    if (isOpen) {
      setVariantValue(
        (product.variant_attributes as Record<string, string> | null)?.[
          variantType
        ] ?? ''
      );
      setCostPrice(
        typeof product.cost_price === 'string'
          ? parseFloat(product.cost_price)
          : product.cost_price || 0.01
      );
      setWeight(product.weight ?? null);
      setSupplierId(product.supplier_id ?? null);
      setError(null);
    }
  }, [isOpen, product, variantType]);

  // Formater le style pour affichage
  const formatStyle = (style?: string): string => {
    if (!style) return '';
    const styleOption = COLLECTION_STYLE_OPTIONS.find(s => s.value === style);
    return styleOption?.label || style;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation locale
    if (!variantValue.trim()) {
      setError(`L'attribut de variante (${variantTypeLabel}) est requis`);
      return;
    }

    if (!costPrice || costPrice <= 0) {
      setError('Le prix coûtant doit être supérieur à 0');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Validation unicité : vérifier qu'aucun autre produit du groupe n'a cet attribut
      const { data: existingProducts, error: checkError } = await supabase
        .from('products')
        .select('id, variant_attributes')
        .eq('variant_group_id', variantGroup.id)
        .neq('id', product.id); // Exclure le produit en cours d'édition

      if (checkError) {
        throw new Error('Erreur lors de la validation : ' + checkError.message);
      }

      // Vérifier l'unicité selon le variant_type du groupe
      if (existingProducts && existingProducts.length > 0) {
        for (const existing of existingProducts) {
          const existingAttrs = existing.variant_attributes as Record<
            string,
            any
          >;

          if (
            variantType === 'color' &&
            existingAttrs?.color === variantValue
          ) {
            setError(
              `Un produit avec la couleur "${variantValue}" existe déjà dans ce groupe. Chaque produit doit avoir une couleur unique.`
            );
            setIsSubmitting(false);
            return;
          } else if (
            variantType === 'material' &&
            existingAttrs?.material === variantValue
          ) {
            setError(
              `Un produit avec le matériau "${variantValue}" existe déjà dans ce groupe. Chaque produit doit avoir un matériau unique.`
            );
            setIsSubmitting(false);
            return;
          }
        }
      }

      // 2. Construire le nouveau nom du produit : "{groupe.name} - {variant_value}"
      // Utiliser directement la valeur saisie par l'utilisateur
      const newProductName = `${variantGroup.name} - ${variantValue}`;

      // 3. Update en base : SEULEMENT les champs du produit
      const { error: updateError } = await supabase
        .from('products')
        .update({
          name: newProductName, // Recalculé automatiquement avec label capitalisé
          variant_attributes: { [variantType]: variantValue }, // Valeur normalisée lowercase
          cost_price: costPrice,
          weight: weight,
          supplier_id: supplierId ?? null,
          updated_at: new Date().toISOString(),
          // ❌ PAS de dimensions, style, suitable_rooms, description
          // → Ces champs sont HÉRITÉS du groupe ou gérés dans la page détail produit
        })
        .eq('id', product.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      // ✅ SOLUTION DÉFINITIVE: Modal ne fait QUE fermer
      // Le parent gère TOUT: refetch + toast
      // Pas de toast dans le modal = pas d'erreur React

      // 1. Fermer le modal d'abord (démontage propre)
      onClose();

      // 2. Notifier le parent (qui fera refetch + toast)
      await onSuccess();
    } catch (err) {
      console.error('Erreur mise à jour produit:', err);
      setError(
        err instanceof Error ? err.message : 'Erreur lors de la sauvegarde'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setError(null);
    onClose();
  };

  // Calculer le nom du produit en temps réel pour preview
  const previewProductName = variantValue.trim()
    ? `${variantGroup.name} - ${variantValue}`
    : product.name;

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-light">
            <Save className="h-5 w-5 text-blue-600" />
            Modifier le produit
          </DialogTitle>
          <DialogDescription>
            Groupe: <span className="font-medium">{variantGroup.name}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          {/* Erreurs de validation */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Section 1: Informations Héritées du Groupe (Read-Only) */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center">
              ℹ️ Informations Héritées du Groupe
              <span className="ml-2 text-xs font-normal text-gray-600">
                (Non Modifiables)
              </span>
            </h3>

            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex justify-between items-start">
                <span className="text-gray-600">📦 Nom :</span>
                <span className="font-medium text-gray-900 text-right">
                  {previewProductName}
                </span>
              </div>

              <div className="flex justify-between items-start">
                <span className="text-gray-600">🏷️ SKU :</span>
                <span className="font-mono text-xs text-gray-700">
                  {product.sku}
                </span>
              </div>

              {variantGroup.common_dimensions?.length &&
                variantGroup.common_dimensions?.width &&
                variantGroup.common_dimensions?.height && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">📐 Dimensions :</span>
                    <span className="text-gray-900">
                      {variantGroup.common_dimensions.length} ×{' '}
                      {variantGroup.common_dimensions.width} ×{' '}
                      {variantGroup.common_dimensions.height}{' '}
                      {variantGroup.common_dimensions.unit ?? 'cm'}
                    </span>
                  </div>
                )}

              {variantGroup.style && (
                <div className="flex justify-between">
                  <span className="text-gray-600">🎨 Style :</span>
                  <span className="text-gray-900">
                    {formatStyle(variantGroup.style)}
                  </span>
                </div>
              )}

              {variantGroup.suitable_rooms &&
                variantGroup.suitable_rooms.length > 0 && (
                  <div className="flex justify-between items-start">
                    <span className="text-gray-600">🏠 Pièces :</span>
                    <span className="text-gray-900 text-right">
                      {variantGroup.suitable_rooms.join(', ')}
                    </span>
                  </div>
                )}

              {variantGroup.has_common_supplier && variantGroup.supplier && (
                <div className="flex justify-between items-start">
                  <span className="text-gray-600">🏢 Fournisseur :</span>
                  <span className="text-gray-900 text-right font-medium">
                    {variantGroup.supplier.name}
                  </span>
                </div>
              )}

              {variantGroup.has_common_weight && variantGroup.common_weight && (
                <div className="flex justify-between items-start">
                  <span className="text-gray-600">⚖️ Poids :</span>
                  <span className="text-gray-900 text-right font-medium">
                    {variantGroup.common_weight} kg
                  </span>
                </div>
              )}

              {variantGroup.has_common_cost_price &&
                variantGroup.common_cost_price && (
                  <div className="flex justify-between items-start">
                    <span className="text-gray-600">💰 Prix d'achat :</span>
                    <span className="text-gray-900 text-right font-medium">
                      {variantGroup.common_cost_price} €
                    </span>
                  </div>
                )}
            </div>

            <p className="text-xs text-blue-700 bg-blue-50 p-2 rounded border border-blue-200">
              💡 Pour modifier ces attributs, éditez le groupe depuis le bouton
              "Modifier les informations"
            </p>
          </div>

          {/* Section 2: Attributs Modifiables du Produit */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">
              ✏️ Attributs Spécifiques à ce Produit
            </h3>

            {/* Attribut de variante - SELECT au lieu d'INPUT */}
            <div className="space-y-2">
              <Label htmlFor="variant_value" className="text-sm font-medium">
                {variantType === 'color' ? '🎨' : '🧵'} {variantTypeLabel}
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="variant_value"
                type="text"
                value={variantValue}
                onChange={e => setVariantValue(e.target.value)}
                placeholder={`ex: ${variantType === 'color' ? 'Noir, Blanc Cassé, Gris Anthracite' : 'Chêne Massif, Métal Laqué, Tissu Velours'}`}
                required
                className="w-full"
              />
              <p className="text-xs text-purple-600">
                ✨ Vous pouvez créer une nouvelle{' '}
                {variantTypeLabel.toLowerCase()} en tapant directement
              </p>
              <p className="text-xs text-gray-600">
                ⚠️ Changer cette valeur met à jour automatiquement le nom du
                produit
              </p>
            </div>

            {/* Prix coûtant - Éditable SEULEMENT si pas géré par le groupe */}
            {!variantGroup.has_common_cost_price && (
              <div className="space-y-2">
                <Label htmlFor="cost_price" className="text-sm font-medium">
                  💰 Prix Coûtant (€) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="cost_price"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={costPrice}
                  onChange={e => setCostPrice(parseFloat(e.target.value))}
                  className="text-sm w-32"
                  required
                />
              </div>
            )}

            {/* Poids - Éditable SEULEMENT si pas géré par le groupe */}
            {!variantGroup.has_common_weight && (
              <div className="space-y-2">
                <Label htmlFor="weight" className="text-sm font-medium">
                  ⚖️ Poids (kg){' '}
                  <span className="text-gray-500">(optionnel)</span>
                </Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.01"
                  min="0"
                  value={weight ?? ''}
                  onChange={e =>
                    setWeight(
                      e.target.value ? parseFloat(e.target.value) : null
                    )
                  }
                  placeholder="Ex: 2.5"
                  className="text-sm w-32"
                />
                <p className="text-xs text-gray-600">
                  Peut varier selon le matériau/couleur (ex: bois vs plastique)
                </p>
              </div>
            )}

            {/* Fournisseur - Éditable SEULEMENT si pas géré par le groupe */}
            {!variantGroup.has_common_supplier && (
              <div className="space-y-2">
                <Label htmlFor="supplier" className="text-sm font-medium">
                  🏢 Fournisseur{' '}
                  <span className="text-gray-500">(optionnel)</span>
                </Label>
                <SupplierSelector
                  selectedSupplierId={supplierId}
                  onSupplierChange={setSupplierId}
                  required={false}
                />
                <p className="text-xs text-gray-600">
                  Peut varier selon la couleur/matériau (ex: différents
                  fournisseurs)
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <DialogFooter className="gap-2">
            <ButtonV2
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="flex items-center"
            >
              <X className="w-4 h-4 mr-2" />
              Annuler
            </ButtonV2>
            <ButtonV2
              type="submit"
              disabled={isSubmitting}
              className="bg-black text-white hover:bg-gray-800 flex items-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Enregistrer
                </>
              )}
            </ButtonV2>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
