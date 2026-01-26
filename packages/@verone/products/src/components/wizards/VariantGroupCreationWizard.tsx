/**
 * VariantGroupCreationWizard - Wizard 3 étapes pour créer un groupe de variantes
 *
 * Aligné avec CollectionCreationWizard (Design System V2)
 * - Étape 1: Informations de base (name, SKU, catégorisation)
 * - Étape 2: Style & Attributs (style décoratif avec icônes Lucide, dimensions)
 * - Étape 3: Fournisseur & Options (fournisseur commun, poids)
 *
 * @see src/components/business/collection-creation-wizard.tsx - Pattern de référence
 * @see src/types/variant-groups.ts - DECORATIVE_STYLES avec icônes Lucide
 */

'use client';

import * as React from 'react';
import { useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  Check,
  ArrowLeft,
  ArrowRight,
  Loader2,
  X,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Checkbox } from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import { cn } from '@verone/utils';
import { CategoryFilterCombobox } from '@verone/categories/components/filters/CategoryFilterCombobox';
import { useOrganisations } from '@verone/organisations/hooks';
import { useVariantGroups } from '@verone/products/hooks';
import { ROOM_TYPES } from '@verone/types';
import { DECORATIVE_STYLES, type DecorativeStyle } from '@verone/types';

// =====================================================================
// TYPES
// =====================================================================

type WizardStep = 1 | 2 | 3;

interface FormData {
  // Step 1: Informations de base
  name: string;
  base_sku: string;
  subcategory_id: string;

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
}

export interface VariantGroupCreationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (groupId: string) => void;
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
    style: '',
    suitable_rooms: [],
    dimensions_length: '',
    dimensions_width: '',
    dimensions_height: '',
    dimensions_unit: 'cm',
    has_common_supplier: false,
    supplier_id: '',
    common_weight: '',
  });

  // Fournisseurs actifs uniquement
  const suppliers = React.useMemo(() => {
    return (organisations || []).filter(
      org => (org as any).organisation_type === 'supplier' && !org.archived_at
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
      style: '',
      suitable_rooms: [],
      dimensions_length: '',
      dimensions_width: '',
      dimensions_height: '',
      dimensions_unit: 'cm',
      has_common_supplier: false,
      supplier_id: '',
      common_weight: '',
    });
    setCurrentStep(1);
    setCompletedSteps(new Set());
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
      handleSubmit();
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
      const payload: any = {
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

      // Ajouter poids commun si défini
      if (formData.common_weight) {
        payload.common_weight = Number(formData.common_weight);
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
          {/* ÉTAPE 1: Informations de base */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">
                  Nom du groupe <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e => updateFormData({ name: e.target.value })}
                  placeholder="Ex: Fauteuil Milo"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Nom descriptif pour identifier le groupe de variantes
                </p>
              </div>

              <div>
                <Label htmlFor="base_sku">
                  SKU de base <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="base_sku"
                  value={formData.base_sku}
                  onChange={e =>
                    updateFormData({ base_sku: e.target.value.toUpperCase() })
                  }
                  placeholder="Ex: FAUT-MILO"
                  className="mt-1 uppercase"
                />
                <p className="text-xs text-gray-500 mt-1">
                  SKU de base pour la génération automatique des SKU produits
                  (ex: FAUT-MILO-001, FAUT-MILO-002)
                </p>
              </div>

              <div>
                <Label htmlFor="subcategory">
                  Catégorisation <span className="text-red-500">*</span>
                </Label>
                <CategoryFilterCombobox
                  value={formData.subcategory_id}
                  onValueChange={value =>
                    updateFormData({ subcategory_id: value || '' })
                  }
                  placeholder="Sélectionner une sous-catégorie"
                  entityType="variant_groups"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Famille {'>'} Catégorie {'>'} Sous-catégorie
                </p>
              </div>
            </div>
          )}

          {/* ÉTAPE 2: Style & Attributs */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {/* Style décoratif avec icônes Lucide */}
              <div>
                <Label>Style décoratif</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {DECORATIVE_STYLES.map(option => {
                    const Icon = option.icon;
                    const isSelected = formData.style === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => updateFormData({ style: option.value })}
                        className={cn(
                          'flex items-center space-x-3 p-3 rounded-lg border-2 transition-colors text-left',
                          isSelected
                            ? 'border-black bg-black text-white'
                            : 'border-gray-200 hover:border-gray-300'
                        )}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">
                            {option.label}
                          </div>
                          <div
                            className={cn(
                              'text-xs',
                              isSelected ? 'text-gray-200' : 'text-gray-500'
                            )}
                          >
                            {option.description}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pièces compatibles */}
              <div>
                <Label>Pièces compatibles</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {ROOM_TYPES.map(room => {
                    const isSelected = formData.suitable_rooms.includes(
                      room.value
                    );

                    return (
                      <Badge
                        key={room.value}
                        variant={isSelected ? 'secondary' : 'outline'}
                        className={cn(
                          'cursor-pointer transition-colors',
                          isSelected && 'bg-black hover:bg-black/90'
                        )}
                        onClick={() => toggleRoom(room.value)}
                      >
                        {room.emoji} {room.label}
                      </Badge>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Cliquez pour sélectionner les pièces adaptées
                </p>
              </div>

              {/* Dimensions communes */}
              <div>
                <Label>Dimensions communes (optionnel)</Label>
                <div className="grid grid-cols-4 gap-3 mt-2">
                  <div className="col-span-1">
                    <Input
                      type="number"
                      value={formData.dimensions_length}
                      onChange={e =>
                        updateFormData({
                          dimensions_length: e.target.value
                            ? Number(e.target.value)
                            : '',
                        })
                      }
                      placeholder="Longueur"
                      min="0"
                      step="0.1"
                    />
                  </div>
                  <div className="col-span-1">
                    <Input
                      type="number"
                      value={formData.dimensions_width}
                      onChange={e =>
                        updateFormData({
                          dimensions_width: e.target.value
                            ? Number(e.target.value)
                            : '',
                        })
                      }
                      placeholder="Largeur"
                      min="0"
                      step="0.1"
                    />
                  </div>
                  <div className="col-span-1">
                    <Input
                      type="number"
                      value={formData.dimensions_height}
                      onChange={e =>
                        updateFormData({
                          dimensions_height: e.target.value
                            ? Number(e.target.value)
                            : '',
                        })
                      }
                      placeholder="Hauteur"
                      min="0"
                      step="0.1"
                    />
                  </div>
                  <div className="col-span-1">
                    <Select
                      value={formData.dimensions_unit}
                      onValueChange={(value: any) =>
                        updateFormData({ dimensions_unit: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cm">cm</SelectItem>
                        <SelectItem value="m">m</SelectItem>
                        <SelectItem value="mm">mm</SelectItem>
                        <SelectItem value="in">in</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Dimensions partagées par tous les produits du groupe
                </p>
              </div>
            </div>
          )}

          {/* ÉTAPE 3: Fournisseur & Options */}
          {currentStep === 3 && (
            <div className="space-y-4">
              {/* Fournisseur commun */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has-common-supplier"
                    checked={formData.has_common_supplier}
                    onCheckedChange={checked => {
                      updateFormData({
                        has_common_supplier: checked as boolean,
                      });
                      if (!checked) updateFormData({ supplier_id: '' });
                    }}
                  />
                  <Label
                    htmlFor="has-common-supplier"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Même fournisseur pour tous les produits
                  </Label>
                </div>

                {formData.has_common_supplier && (
                  <div>
                    <Label htmlFor="supplier">
                      Fournisseur <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.supplier_id}
                      onValueChange={value =>
                        updateFormData({ supplier_id: value })
                      }
                    >
                      <SelectTrigger id="supplier" className="mt-1">
                        <SelectValue placeholder="Sélectionner un fournisseur" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map(supplier => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.legal_name ||
                              supplier.trade_name ||
                              'Sans nom'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formData.supplier_id && (
                      <div className="mt-2">
                        <Link
                          href={`/contacts-organisations/${formData.supplier_id}`}
                          target="_blank"
                          className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
                        >
                          Voir fiche fournisseur
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Ce fournisseur sera automatiquement assigné à tous les
                      produits du groupe
                    </p>
                  </div>
                )}
              </div>

              {/* Poids commun */}
              <div>
                <Label htmlFor="common_weight">Poids commun (kg)</Label>
                <Input
                  id="common_weight"
                  type="number"
                  value={formData.common_weight}
                  onChange={e =>
                    updateFormData({
                      common_weight: e.target.value
                        ? Number(e.target.value)
                        : '',
                    })
                  }
                  placeholder="Ex: 12.5"
                  min="0"
                  step="0.1"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Poids partagé par tous les produits (optionnel)
                </p>
              </div>
            </div>
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
