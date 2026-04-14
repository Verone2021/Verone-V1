'use client';

import { Palette } from 'lucide-react';

import { cn } from '@verone/utils';
import type { CollectionFormState, CollectionFormErrors } from '@verone/types';
import { COLLECTION_STYLE_OPTIONS } from '@verone/types';

interface IStepStyleCategoryProps {
  formData: CollectionFormState;
  errors: CollectionFormErrors;
  updateFormData: (updates: Partial<CollectionFormState>) => void;
}

export function StepStyleCategory({
  formData,
  errors,
  updateFormData,
}: IStepStyleCategoryProps): React.ReactNode {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-4">
        <Palette className="h-5 w-5 text-purple-600" />
        <h3 className="text-lg font-medium text-black">Style et catégorie</h3>
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-3">
          Style décoratif *
        </label>
        <div className="grid grid-cols-2 gap-3">
          {COLLECTION_STYLE_OPTIONS.map(option => (
            <button
              key={option.value}
              onClick={() =>
                updateFormData({
                  style: option.value,
                  color_theme: option.color,
                })
              }
              className={cn(
                'p-3 rounded-lg border-2 text-left transition-all',
                formData.style === option.value
                  ? 'border-black bg-gray-50'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <div className="flex items-center space-x-3">
                <div
                  className="w-4 h-4 rounded-full border"
                  style={{ backgroundColor: option.color }}
                />
                <div>
                  <div className="font-medium text-sm">{option.label}</div>
                  <div className="text-xs text-gray-500">
                    {option.description}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
        {errors.style && (
          <p className="mt-2 text-sm text-red-600">{errors.style}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-3">
          Pièces de la maison compatibles
        </label>
        <p className="text-xs text-gray-600 mb-2">
          Sélectionnez les pièces où cette collection peut être utilisée
        </p>
      </div>
    </div>
  );
}
