/**
 * VariantGroupCreationWizard - Wizard 3 étapes pour créer un groupe de variantes
 *
 * Aligné avec CollectionCreationWizard (Design System V2)
 * - Étape 1: Informations de base (name, SKU, catégorisation)
 * - Étape 2: Style & Attributs (style décoratif avec icônes Lucide, dimensions)
 * - Étape 3: Fournisseur & Options (fournisseur commun, poids, prix d'achat)
 *
 * @see src/components/business/collection-creation-wizard.tsx - Pattern de référence
 * @see src/types/variant-groups.ts - DECORATIVE_STYLES avec icônes Lucide
 */

'use client';

import * as React from 'react';
import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { Check, ArrowLeft, ArrowRight, Loader2, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { ButtonV2 } from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@verone/ui';
import { cn } from '@verone/utils';
import { createClient } from '@verone/utils/supabase/client';
import { useOrganisations } from '@verone/organisations/hooks';
import { useVariantGroups } from '@verone/products/hooks';
import type { DecorativeStyle, CreateVariantGroupData } from '@verone/types';

import { WizardStep1Basic } from './variant-group-creation/WizardStep1Basic';
import type { MatrixProductInfo } from './variant-group-creation/WizardStep1Basic';
import { deriveBaseSku } from './variant-group-creation/WizardStep1Basic';
import { WizardStep2Style } from './variant-group-creation/WizardStep2Style';
import { WizardStep3Supplier } from './variant-group-creation/WizardStep3Supplier';

// =====================================================================
// TYPES
// =====================================================================

type WizardStep = 1 | 2 | 3;

/**
 * Structure des dimensions jsonb dans la table `products`.
 * Les clés sont suffixées `_cm` (ex: length_cm, width_cm, height_cm).
 */
interface ProductDimensionsJsonb {
  length_cm?: number | null;
  width_cm?: number | null;
  height_cm?: number | null;
  diameter_cm?: number | null;
}

interface FormData {
  // Step 1: Informations de base
  name: string;
  base_sku: string;
  subcategory_id: string;

  // Produit témoin local (jamais envoyé au backend)
  matrix_product: MatrixProductInfo | null;

  // Step 2: Style & Attributs
  style: DecorativeStyle | '';
  suitable_rooms: string[];
  dimensions_length: number | '';
  dimensions_width: number | '';
  dimensions_height: number | '';
  dimensions_unit: 'cm' | 'm' | 'mm' | 'in';

  // Step 3: Fournisseur & Options
  has_common_supplier: boolean;
  supplier_id: string;
  common_weight: number | '';
  has_common_weight: boolean;
  has_common_cost_price: boolean;
  common_cost_price: number | '';
  common_eco_tax: number | '';
}

export interface VariantGroupCreationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (groupId: string) => void;
}

// =====================================================================
// HELPER MODULE-LEVEL — matrix product fetch & apply
// =====================================================================

/**
 * Extrait un champ scalaire d'un résultat de join Supabase
 * (objet direct ou tableau à 1 élément selon la syntaxe utilisée).
 */
function getVgField<T>(vg: unknown, field: string): T | null {
  if (!vg) return null;
  if (!Array.isArray(vg) && typeof vg === 'object' && field in vg)
    return (vg as Record<string, T>)[field] ?? null;
  if (
    Array.isArray(vg) &&
    vg.length > 0 &&
    typeof vg[0] === 'object' &&
    vg[0] !== null &&
    field in vg[0]
  )
    return (vg[0] as Record<string, T>)[field] ?? null;
  return null;
}

/**
 * Parse le JSONB dimensions d'un product (format `{length_cm, width_cm, height_cm}`)
 * et retourne des valeurs numériques séparées pour l'étape 2 du wizard.
 */
function parseDimensionsJsonb(raw: unknown): {
  length: number | '';
  width: number | '';
  height: number | '';
  unit: 'cm' | 'm' | 'mm' | 'in';
} {
  const empty = {
    length: '' as const,
    width: '' as const,
    height: '' as const,
    unit: 'cm' as const,
  };
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return empty;

  const d = raw as ProductDimensionsJsonb;

  const length =
    typeof d.length_cm === 'number' && d.length_cm !== null ? d.length_cm : '';
  const width =
    typeof d.width_cm === 'number' && d.width_cm !== null ? d.width_cm : '';
  const height =
    typeof d.height_cm === 'number' && d.height_cm !== null ? d.height_cm : '';

  // Si aucune dimension exploitable, ne pas pré-remplir
  if (length === '' && width === '' && height === '') return empty;

  return { length, width, height, unit: 'cm' };
}

/**
 * Fetche les données complètes du produit sélectionné (avec les 7 nouveaux champs
 * en plus des colonnes sprint 1), applique Q3 (blocage si déjà dans un groupe),
 * Q1 (dérivation base_sku) et Q2 (auto-cocher flags has_common_*),
 * puis met à jour le formData via le setter fourni.
 */
function fetchAndApplyMatrixProduct(
  partialProductId: string,
  setFormData: React.Dispatch<React.SetStateAction<FormData>>
): void {
  const supabase = createClient();

  const run = async () => {
    const { data, error } = await supabase
      .from('products')
      .select(
        'id, name, sku, subcategory_id, variant_group_id, variant_group:variant_groups!variant_group_id(id, name, base_sku), weight, dimensions, style, suitable_rooms, supplier_id, cost_price, eco_tax_default'
      )
      .eq('id', partialProductId)
      .single();

    if (error || !data) {
      toast.error('Impossible de charger les informations du produit.');
      return;
    }

    // Q3 : bloquer si le produit appartient déjà à un groupe
    if (data.variant_group_id) {
      const groupName =
        getVgField<string>(data.variant_group, 'name') ?? 'inconnu';
      toast.error(
        `Ce produit appartient déjà au groupe "${groupName}". Un produit ne peut être que dans une seule variante.`
      );
      setFormData(prev => ({ ...prev, matrix_product: null }));
      return;
    }

    // Récupérer le base_sku du groupe parent si présent (cas théorique,
    // bloqué par le test Q3 ci-dessus, mais helper doit rester correct)
    const parentBaseSku: string | null = getVgField<string>(
      data.variant_group,
      'base_sku'
    );

    // Parser les dimensions jsonb (format: {length_cm, width_cm, height_cm})
    const parsedDimensions = parseDimensionsJsonb(data.dimensions);

    // Extraire suitable_rooms (tableau ou null)
    const suitableRooms: string[] = Array.isArray(data.suitable_rooms)
      ? (data.suitable_rooms as string[])
      : [];

    // Extraire style (string ou null)
    const style =
      typeof data.style === 'string' && data.style ? data.style : null;

    // Extraire valeurs numériques
    const weight = typeof data.weight === 'number' ? data.weight : null;
    const costPrice =
      typeof data.cost_price === 'number' ? data.cost_price : null;
    const ecoTax =
      typeof data.eco_tax_default === 'number' ? data.eco_tax_default : null;
    const supplierId =
      typeof data.supplier_id === 'string' ? data.supplier_id : null;

    const enrichedProduct: MatrixProductInfo = {
      id: data.id,
      name: data.name,
      sku: data.sku ?? '',
      subcategory_id: data.subcategory_id ?? null,
      variant_group_id: data.variant_group_id ?? null,
      variant_group_name: null,
      variant_group_base_sku: parentBaseSku,
      // Nouveaux champs pour les chips hérités (étape 1)
      weight,
      dimensions: data.dimensions as ProductDimensionsJsonb | null,
      style,
      suitable_rooms: suitableRooms,
      cost_price: costPrice,
      supplier_id: supplierId,
    };

    // Q1 : dériver base_sku
    const derivedBaseSku = deriveBaseSku(enrichedProduct.sku, parentBaseSku);

    // Q2 : auto-cocher les flags has_common_* si le champ correspondant a une valeur
    const hasCommonWeight = weight !== null;
    const hasCommonCostPrice = costPrice !== null;
    const hasCommonSupplier = supplierId !== null;

    // Auto-remplir tous les champs (modifiables ensuite par Romeo)
    setFormData(prev => ({
      ...prev,
      // Step 1
      name: enrichedProduct.name,
      base_sku: derivedBaseSku,
      subcategory_id: enrichedProduct.subcategory_id ?? '',
      matrix_product: enrichedProduct,
      // Step 2 — style, rooms, dimensions
      style: (style as DecorativeStyle | null) ?? prev.style,
      suitable_rooms:
        suitableRooms.length > 0 ? suitableRooms : prev.suitable_rooms,
      dimensions_length: parsedDimensions.length,
      dimensions_width: parsedDimensions.width,
      dimensions_height: parsedDimensions.height,
      dimensions_unit: parsedDimensions.unit,
      // Step 3 — poids, fournisseur, prix d'achat
      has_common_weight: hasCommonWeight,
      common_weight: weight ?? prev.common_weight,
      has_common_supplier: hasCommonSupplier,
      supplier_id: supplierId ?? prev.supplier_id,
      has_common_cost_price: hasCommonCostPrice,
      common_cost_price: costPrice ?? prev.common_cost_price,
      common_eco_tax: ecoTax ?? prev.common_eco_tax,
    }));
  };

  void run().catch((err: unknown) => {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    console.error(
      '[VariantGroupCreationWizard] matrix product fetch:',
      message
    );
    toast.error('Erreur lors du chargement du produit témoin.');
  });
}

// =====================================================================
// COMPOSANT PRINCIPAL
// =====================================================================

export function VariantGroupCreationWizard({
  isOpen,
  onClose,
  onSuccess,
}: VariantGroupCreationWizardProps) {
  const router = useRouter();
  const { createVariantGroup } = useVariantGroups();
  const { organisations } = useOrganisations();

  // État du wizard
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [completedSteps, setCompletedSteps] = useState<Set<WizardStep>>(
    new Set()
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Données du formulaire
  const [formData, setFormData] = useState<FormData>({
    name: '',
    base_sku: '',
    subcategory_id: '',
    matrix_product: null,
    style: '',
    suitable_rooms: [],
    dimensions_length: '',
    dimensions_width: '',
    dimensions_height: '',
    dimensions_unit: 'cm',
    has_common_supplier: false,
    supplier_id: '',
    common_weight: '',
    has_common_weight: false,
    has_common_cost_price: false,
    common_cost_price: '',
    common_eco_tax: '',
  });

  // Fournisseurs actifs uniquement
  const suppliers = React.useMemo(() => {
    return (organisations ?? []).filter(
      org => org.type === 'supplier' && !org.archived_at
    );
  }, [organisations]);

  // ===================================================================
  // HELPERS
  // ===================================================================

  const updateFormData = (updates: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      base_sku: '',
      subcategory_id: '',
      matrix_product: null,
      style: '',
      suitable_rooms: [],
      dimensions_length: '',
      dimensions_width: '',
      dimensions_height: '',
      dimensions_unit: 'cm',
      has_common_supplier: false,
      supplier_id: '',
      common_weight: '',
      has_common_weight: false,
      has_common_cost_price: false,
      common_cost_price: '',
      common_eco_tax: '',
    });
    setCurrentStep(1);
    setCompletedSteps(new Set());
  };

  // ===================================================================
  // HANDLER PRODUIT TEMOIN
  // ===================================================================

  const handleMatrixProductChange = (
    partialProduct: MatrixProductInfo | null
  ) => {
    if (!partialProduct) {
      setFormData(prev => ({ ...prev, matrix_product: null }));
      return;
    }
    fetchAndApplyMatrixProduct(partialProduct.id, setFormData);
  };

  // ===================================================================
  // VALIDATION PAR ÉTAPE
  // ===================================================================

  const canProceedFromStep1 = (): boolean => {
    return !!(
      formData.name.trim() &&
      formData.base_sku.trim() &&
      formData.subcategory_id
    );
  };

  const canProceedFromStep2 = (): boolean => {
    // Optionnel: style et dimensions, donc toujours true
    return true;
  };

  const canProceedFromStep3 = (): boolean => {
    // Si fournisseur commun activé, doit avoir un fournisseur sélectionné
    if (formData.has_common_supplier && !formData.supplier_id) {
      return false;
    }
    return true;
  };

  // ===================================================================
  // NAVIGATION
  // ===================================================================

  const handleNext = () => {
    // Validation selon l'étape actuelle
    if (currentStep === 1 && !canProceedFromStep1()) {
      toast.error('Veuillez remplir tous les champs requis');
      return;
    }

    if (currentStep === 2 && !canProceedFromStep2()) {
      toast.error('Veuillez remplir les informations de style');
      return;
    }

    if (currentStep === 3) {
      void handleSubmit().catch(console.error);
      return;
    }

    // Marquer l'étape comme complétée et passer à la suivante
    setCompletedSteps(prev => new Set(prev).add(currentStep));
    setCurrentStep(prev => (prev + 1) as WizardStep);
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => (prev - 1) as WizardStep);
    }
  };

  // ===================================================================
  // SOUMISSION
  // ===================================================================

  const handleSubmit = async () => {
    if (!canProceedFromStep3()) {
      toast.error(
        "Veuillez sélectionner un fournisseur ou désactiver l'option"
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: CreateVariantGroupData = {
        name: formData.name.trim(),
        base_sku: formData.base_sku.trim(),
        subcategory_id: formData.subcategory_id,
      };

      // Ajouter style si défini
      if (formData.style) {
        payload.style = formData.style;
      }

      // Ajouter suitable_rooms si défini
      if (formData.suitable_rooms.length > 0) {
        payload.suitable_rooms = formData.suitable_rooms;
      }

      // Ajouter dimensions si définies
      if (
        formData.dimensions_length &&
        formData.dimensions_width &&
        formData.dimensions_height
      ) {
        payload.dimensions_length = Number(formData.dimensions_length);
        payload.dimensions_width = Number(formData.dimensions_width);
        payload.dimensions_height = Number(formData.dimensions_height);
        payload.dimensions_unit = formData.dimensions_unit;
      }

      // Ajouter fournisseur commun si activé
      if (formData.has_common_supplier) {
        payload.has_common_supplier = true;
        payload.supplier_id = formData.supplier_id;
      }

      // Ajouter poids commun — respecte le choix de la checkbox (has_common_weight)
      // Le flag est celui choisi par l'utilisateur, pas une dérivation forcée depuis la valeur.
      // Si la checkbox est décochée, on n'envoie pas has_common_weight=true même si common_weight
      // contient une valeur résiduelle.
      payload.has_common_weight = formData.has_common_weight;
      if (
        formData.has_common_weight &&
        formData.common_weight !== '' &&
        formData.common_weight !== undefined
      ) {
        payload.common_weight = Number(formData.common_weight);
      }

      // Ajouter prix d'achat commun si défini (Q1)
      if (formData.has_common_cost_price) {
        payload.has_common_cost_price = true;
        if (
          formData.common_cost_price !== '' &&
          formData.common_cost_price !== undefined
        ) {
          payload.common_cost_price = Number(formData.common_cost_price);
        }
        if (
          formData.common_eco_tax !== '' &&
          formData.common_eco_tax !== undefined
        ) {
          payload.common_eco_tax = Number(formData.common_eco_tax);
        }
      }

      const newGroup = await createVariantGroup(payload);

      toast.success('Groupe de variantes créé avec succès !');
      resetForm();
      onClose();

      if (onSuccess && newGroup?.id) {
        onSuccess(newGroup.id);
      } else if (newGroup?.id) {
        router.push(`/produits/catalogue/variantes/${newGroup.id}`);
      }
    } catch (error) {
      console.error('Error creating variant group:', error);
      toast.error('Erreur lors de la création du groupe de variantes');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ===================================================================
  // HANDLERS - Suitable Rooms
  // ===================================================================

  const toggleRoom = (room: string) => {
    setFormData(prev => ({
      ...prev,
      suitable_rooms: prev.suitable_rooms.includes(room)
        ? prev.suitable_rooms.filter(r => r !== room)
        : [...prev.suitable_rooms, room],
    }));
  };

  // ===================================================================
  // RENDER
  // ===================================================================

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Créer un groupe de variantes
          </DialogTitle>
          <DialogDescription>
            Créez un groupe pour organiser des produits similaires avec
            différentes options (couleurs, matériaux, etc.)
          </DialogDescription>
        </DialogHeader>

        {/* ===============================================================
            INDICATEURS D'ÉTAPES
        =============================================================== */}
        <div className="flex items-center justify-between py-4">
          {[1, 2, 3].map(step => {
            const isCompleted = completedSteps.has(step as WizardStep);
            const isCurrent = currentStep === step;

            return (
              <React.Fragment key={step}>
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors',
                      isCompleted && 'bg-black text-white',
                      isCurrent && !isCompleted && 'bg-gray-200 text-black',
                      !isCurrent && !isCompleted && 'bg-gray-100 text-gray-400'
                    )}
                  >
                    {isCompleted ? <Check className="h-5 w-5" /> : step}
                  </div>
                  <span className="text-xs mt-1 text-gray-600">
                    {step === 1 && 'Base'}
                    {step === 2 && 'Style'}
                    {step === 3 && 'Options'}
                  </span>
                </div>
                {step < 3 && (
                  <div
                    className={cn(
                      'flex-1 h-0.5 mx-2',
                      completedSteps.has(step as WizardStep)
                        ? 'bg-black'
                        : 'bg-gray-200'
                    )}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* ===============================================================
            CONTENU DES ÉTAPES
        =============================================================== */}
        <div className="space-y-6 py-4">
          {currentStep === 1 && (
            <WizardStep1Basic
              name={formData.name}
              baseSku={formData.base_sku}
              subcategoryId={formData.subcategory_id}
              matrixProduct={formData.matrix_product}
              onUpdate={updateFormData}
              onMatrixProductChange={handleMatrixProductChange}
            />
          )}

          {currentStep === 2 && (
            <WizardStep2Style
              style={formData.style}
              suitableRooms={formData.suitable_rooms}
              dimensionsLength={formData.dimensions_length}
              dimensionsWidth={formData.dimensions_width}
              dimensionsHeight={formData.dimensions_height}
              dimensionsUnit={formData.dimensions_unit}
              onUpdate={updateFormData}
              onToggleRoom={toggleRoom}
            />
          )}

          {currentStep === 3 && (
            <WizardStep3Supplier
              hasCommonSupplier={formData.has_common_supplier}
              supplierId={formData.supplier_id}
              commonWeight={formData.common_weight}
              hasCommonWeight={formData.has_common_weight}
              hasCommonCostPrice={formData.has_common_cost_price}
              commonCostPrice={formData.common_cost_price}
              commonEcoTax={formData.common_eco_tax}
              suppliers={suppliers}
              onUpdate={updateFormData}
            />
          )}
        </div>

        {/* ===============================================================
            FOOTER - Navigation
        =============================================================== */}
        <DialogFooter className="flex justify-between items-center border-t pt-4">
          <div className="flex gap-2">
            {currentStep > 1 && (
              <ButtonV2
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={isSubmitting}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </ButtonV2>
            )}
          </div>

          <div className="flex gap-2">
            <ButtonV2
              type="button"
              variant="ghost"
              onClick={() => {
                resetForm();
                onClose();
              }}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4 mr-2" />
              Annuler
            </ButtonV2>

            <ButtonV2
              type="button"
              onClick={handleNext}
              disabled={
                isSubmitting ||
                (currentStep === 1 && !canProceedFromStep1()) ||
                (currentStep === 3 && !canProceedFromStep3())
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : currentStep === 3 ? (
                'Créer le groupe'
              ) : (
                <>
                  Suivant
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </ButtonV2>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
