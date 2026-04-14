'use client';

import { useState, useEffect } from 'react';

import { X, ArrowLeft, ArrowRight, Check } from 'lucide-react';

import { ButtonV2 } from '@verone/ui';
import { cn } from '@verone/utils';
import type {
  CollectionFormState,
  CollectionFormErrors,
  CreateCollectionInput,
} from '@verone/types';

export type { CreateCollectionInput };

import { StepBasicInfo } from './wizard-steps/StepBasicInfo';
import { StepStyleCategory } from './wizard-steps/StepStyleCategory';
import { StepSettingsMetadata } from './wizard-steps/StepSettingsMetadata';

interface IEditingCollectionData {
  id?: string;
  name?: string;
  description?: string;
  image_url?: string;
  style?: string | null;
  suitable_rooms?: string[];
  color_theme?: string;
  visibility?: string;
  theme_tags?: string[];
  meta_title?: string;
  meta_description?: string;
  display_order?: number;
}

interface ICollectionCreationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCollectionInput) => Promise<boolean>;
  loading?: boolean;
  editingCollection?: IEditingCollectionData;
}

type WizardStep = 1 | 2 | 3;

const STEPS = [
  { label: 'Infos de base' },
  { label: 'Style' },
  { label: 'Paramètres' },
];

const DEFAULT_FORM_DATA: CollectionFormState = {
  name: '',
  description: '',
  image_url: '',
  style: null,
  suitable_rooms: [],
  color_theme: '#FFFFFF',
  visibility: 'private',
  theme_tags: [],
  meta_title: '',
  meta_description: '',
  display_order: 0,
};

export function CollectionCreationWizard({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
  editingCollection,
}: ICollectionCreationWizardProps): React.ReactNode {
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [formData, setFormData] =
    useState<CollectionFormState>(DEFAULT_FORM_DATA);
  const [errors, setErrors] = useState<CollectionFormErrors>({});
  const [completedSteps, setCompletedSteps] = useState<Set<WizardStep>>(
    new Set()
  );
  const [collectionId, setCollectionId] = useState('');

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setCollectionId(editingCollection?.id ?? '');
      setFormData(
        editingCollection
          ? {
              name: editingCollection.name ?? '',
              description: editingCollection.description ?? '',
              image_url: editingCollection.image_url ?? '',
              style:
                (editingCollection.style as CollectionFormState['style']) ??
                null,
              suitable_rooms: editingCollection.suitable_rooms ?? [],
              color_theme: editingCollection.color_theme ?? '#FFFFFF',
              visibility:
                (editingCollection.visibility as CollectionFormState['visibility']) ??
                'private',
              theme_tags: editingCollection.theme_tags ?? [],
              meta_title: editingCollection.meta_title ?? '',
              meta_description: editingCollection.meta_description ?? '',
              display_order: editingCollection.display_order ?? 0,
            }
          : DEFAULT_FORM_DATA
      );
      setErrors({});
      setCompletedSteps(new Set());
    }
  }, [isOpen, editingCollection]);

  const updateFormData = (updates: Partial<CollectionFormState>): void => {
    setFormData(prev => ({ ...prev, ...updates }));
    const newErrors = { ...errors };
    Object.keys(updates).forEach(key => {
      delete newErrors[key as keyof CollectionFormErrors];
    });
    setErrors(newErrors);
  };

  const validateStep = (step: WizardStep): boolean => {
    const newErrors: CollectionFormErrors = {};
    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = 'Le nom est obligatoire';
      else if (formData.name.length < 3)
        newErrors.name = 'Le nom doit contenir au moins 3 caractères';
      if (formData.description.length > 500)
        newErrors.description =
          'La description ne peut pas dépasser 500 caractères';
    }
    if (step === 2 && !formData.style)
      newErrors.style = 'Veuillez sélectionner un style';
    if (step === 3) {
      if (formData.meta_title && formData.meta_title.length > 60)
        newErrors.meta_title =
          'Le titre SEO ne peut pas dépasser 60 caractères';
      if (formData.meta_description && formData.meta_description.length > 160)
        newErrors.meta_description =
          'La description SEO ne peut pas dépasser 160 caractères';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const canProceed = (step: WizardStep): boolean => {
    if (step === 1) return !!formData.name.trim();
    if (step === 2) return !!formData.style;
    return true;
  };

  const handleNext = (): void => {
    if (validateStep(currentStep)) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      if (currentStep < 3) setCurrentStep((currentStep + 1) as WizardStep);
    }
  };

  const handleSubmit = async (): Promise<void> => {
    if (!validateStep(3)) return;
    const submitData: CreateCollectionInput = {
      name: formData.name,
      description: formData.description ?? undefined,
      image_url: formData.image_url ?? undefined,
      style: formData.style ?? undefined,
      suitable_rooms:
        formData.suitable_rooms.length > 0
          ? formData.suitable_rooms
          : undefined,
      color_theme: formData.color_theme,
      visibility: formData.visibility,
      theme_tags: formData.theme_tags,
      meta_title: formData.meta_title || undefined,
      meta_description: formData.meta_description || undefined,
      display_order: formData.display_order,
    };
    const success = await onSubmit(submitData);
    if (success) onClose();
  };

  const addTag = (tag: string): void => {
    if (tag.trim() && !formData.theme_tags.includes(tag.trim())) {
      updateFormData({ theme_tags: [...formData.theme_tags, tag.trim()] });
    }
  };

  const removeTag = (tagToRemove: string): void => {
    updateFormData({
      theme_tags: formData.theme_tags.filter(tag => tag !== tagToRemove),
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-black">
              {editingCollection
                ? 'Modifier la collection'
                : 'Nouvelle collection'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {editingCollection
                ? 'Modifiez les informations de votre collection'
                : 'Créez une nouvelle collection de produits'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const stepNum = (index + 1) as WizardStep;
              const isCompleted = completedSteps.has(stepNum);
              const isCurrent = currentStep === stepNum;
              return (
                <div key={stepNum} className="flex items-center">
                  <div
                    className={cn(
                      'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-all',
                      isCurrent
                        ? 'bg-black text-white'
                        : isCompleted
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 text-gray-500'
                    )}
                  >
                    {isCompleted ? <Check className="h-4 w-4" /> : stepNum}
                  </div>
                  <span
                    className={cn(
                      'ml-2 text-sm hidden sm:block',
                      isCurrent ? 'font-medium text-black' : 'text-gray-500'
                    )}
                  >
                    {step.label}
                  </span>
                  {index < STEPS.length - 1 && (
                    <div
                      className={cn(
                        'mx-4 flex-1 h-px',
                        completedSteps.has(stepNum)
                          ? 'bg-green-500'
                          : 'bg-gray-200'
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-6 max-h-96 overflow-y-auto">
          {currentStep === 1 && (
            <StepBasicInfo
              formData={formData}
              errors={errors}
              collectionId={collectionId}
              updateFormData={updateFormData}
            />
          )}
          {currentStep === 2 && (
            <StepStyleCategory
              formData={formData}
              errors={errors}
              updateFormData={updateFormData}
            />
          )}
          {currentStep === 3 && (
            <StepSettingsMetadata
              formData={formData}
              errors={errors}
              updateFormData={updateFormData}
              addTag={addTag}
              removeTag={removeTag}
            />
          )}
        </div>

        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <ButtonV2
            variant="outline"
            onClick={
              currentStep === 1
                ? onClose
                : () => setCurrentStep((currentStep - 1) as WizardStep)
            }
            disabled={loading}
          >
            {currentStep === 1 ? (
              <>
                <X className="h-4 w-4 mr-2" />
                Annuler
              </>
            ) : (
              <>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Précédent
              </>
            )}
          </ButtonV2>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-500">
              Étape {currentStep} sur 3
            </span>
            {currentStep < 3 ? (
              <ButtonV2
                onClick={handleNext}
                disabled={!canProceed(currentStep) || loading}
                className="bg-black hover:bg-gray-800 text-white"
              >
                Suivant <ArrowRight className="h-4 w-4 ml-2" />
              </ButtonV2>
            ) : (
              <ButtonV2
                onClick={() => void handleSubmit()}
                disabled={loading}
                className="bg-black hover:bg-gray-800 text-white"
              >
                {loading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Création...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Créer la collection
                  </>
                )}
              </ButtonV2>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
