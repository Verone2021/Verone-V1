'use client';

import { Info } from 'lucide-react';

import { cn } from '@verone/utils';
import type { CollectionFormState, CollectionFormErrors } from '@verone/types';

import { CollectionImageUpload } from '../CollectionImageUpload';

interface IStepBasicInfoProps {
  formData: CollectionFormState;
  errors: CollectionFormErrors;
  collectionId: string;
  updateFormData: (updates: Partial<CollectionFormState>) => void;
}

export function StepBasicInfo({
  formData,
  errors,
  collectionId,
  updateFormData,
}: IStepBasicInfoProps): React.ReactNode {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-4">
        <Info className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-medium text-black">Informations de base</h3>
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-2">
          Nom de la collection *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={e => updateFormData({ name: e.target.value })}
          placeholder="Ex: Salon minimaliste blanc"
          className={cn(
            'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black',
            errors.name ? 'border-red-500' : 'border-gray-300'
          )}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-2">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={e => updateFormData({ description: e.target.value })}
          placeholder="Décrivez l'ambiance et le style de cette collection..."
          rows={3}
          className={cn(
            'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black',
            errors.description ? 'border-red-500' : 'border-gray-300'
          )}
        />
        <div className="flex justify-between items-center mt-1">
          {errors.description && (
            <p className="text-sm text-red-600">{errors.description}</p>
          )}
          <p className="text-xs text-gray-500 ml-auto">
            {formData.description.length}/500
          </p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-2">
          Image de couverture {collectionId ? '' : '(après création)'}
        </label>
        <CollectionImageUpload
          collectionId={collectionId}
          disabled={!collectionId}
          onImageUpload={(imageId, _publicUrl) => {
            console.warn('Image collection uploadée:', imageId);
          }}
        />
        {!collectionId && (
          <p className="text-xs text-gray-500 mt-2">
            L'image pourra être ajoutée après la création de la collection
          </p>
        )}
      </div>
    </div>
  );
}
