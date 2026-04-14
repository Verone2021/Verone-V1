'use client';

import { Settings, X } from 'lucide-react';

import { Badge } from '@verone/ui';
import { cn } from '@verone/utils';
import type { CollectionFormState, CollectionFormErrors } from '@verone/types';

interface IStepSettingsMetadataProps {
  formData: CollectionFormState;
  errors: CollectionFormErrors;
  updateFormData: (updates: Partial<CollectionFormState>) => void;
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
}

export function StepSettingsMetadata({
  formData,
  errors,
  updateFormData,
  addTag,
  removeTag,
}: IStepSettingsMetadataProps): React.ReactNode {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-4">
        <Settings className="h-5 w-5 text-green-600" />
        <h3 className="text-lg font-medium text-black">
          Paramètres et métadonnées
        </h3>
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-3">
          Visibilité
        </label>
        <p className="text-xs text-gray-600 mb-3">
          Les collections publiques seront visibles sur vos canaux de vente
        </p>
        <div className="grid grid-cols-2 gap-3">
          {(['private', 'public'] as const).map(vis => (
            <button
              key={vis}
              type="button"
              onClick={() => updateFormData({ visibility: vis })}
              className={cn(
                'p-3 rounded-lg border-2 text-center transition-all',
                formData.visibility === vis
                  ? 'border-black bg-black text-white'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <div className="font-medium text-sm">
                {vis === 'private' ? 'Privée' : 'Publique'}
              </div>
              <div
                className={cn(
                  'text-xs mt-1',
                  formData.visibility === vis
                    ? 'text-gray-200'
                    : 'text-gray-500'
                )}
              >
                {vis === 'private'
                  ? 'Visible uniquement dans le back-office'
                  : 'Visible sur les canaux de vente'}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-2">
          Tags thématiques
        </label>
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Tapez un tag et appuyez sur Entrée"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTag(e.currentTarget.value);
                e.currentTarget.value = '';
              }
            }}
          />
          <div className="flex flex-wrap gap-2">
            {formData.theme_tags.map(tag => (
              <Badge
                key={tag}
                variant="secondary"
                className="bg-gray-100 text-gray-700 cursor-pointer hover:bg-gray-200"
                onClick={() => removeTag(tag)}
              >
                {tag} <X className="h-3 w-3 ml-1" />
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium text-black">Référencement (SEO)</h4>
        <div>
          <label className="block text-sm font-medium text-black mb-2">
            Titre SEO
          </label>
          <input
            type="text"
            value={formData.meta_title}
            onChange={e => updateFormData({ meta_title: e.target.value })}
            placeholder="Titre optimisé pour les moteurs de recherche"
            className={cn(
              'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black',
              errors.meta_title ? 'border-red-500' : 'border-gray-300'
            )}
          />
          <div className="flex justify-between items-center mt-1">
            {errors.meta_title && (
              <p className="text-sm text-red-600">{errors.meta_title}</p>
            )}
            <p className="text-xs text-gray-500 ml-auto">
              {formData.meta_title.length}/60
            </p>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-black mb-2">
            Description SEO
          </label>
          <textarea
            value={formData.meta_description}
            onChange={e => updateFormData({ meta_description: e.target.value })}
            placeholder="Description optimisée pour les moteurs de recherche"
            rows={2}
            className={cn(
              'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black',
              errors.meta_description ? 'border-red-500' : 'border-gray-300'
            )}
          />
          <div className="flex justify-between items-center mt-1">
            {errors.meta_description && (
              <p className="text-sm text-red-600">{errors.meta_description}</p>
            )}
            <p className="text-xs text-gray-500 ml-auto">
              {formData.meta_description.length}/160
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
