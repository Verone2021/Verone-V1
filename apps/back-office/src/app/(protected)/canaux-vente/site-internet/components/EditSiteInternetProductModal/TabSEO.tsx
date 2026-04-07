'use client';

// =============================================================================
// Onglet SEO — Titre custom, Description custom, Aperçu waterfall
// =============================================================================

import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import { Textarea } from '@verone/ui';

import type { TabSharedProps } from './types';

export function TabSEO({
  product,
  formData,
  setFormData,
  getError,
}: TabSharedProps) {
  return (
    <div className="space-y-6">
      {/* Custom Title */}
      <div>
        <div className="flex items-center justify-between">
          <Label>Titre SEO custom (priorité 1)</Label>
          <span
            className={`text-sm ${
              (formData.custom_title?.length ?? 0) < 30
                ? 'text-red-600'
                : (formData.custom_title?.length ?? 0) <= 60
                  ? 'text-green-600'
                  : 'text-gray-600'
            }`}
          >
            {formData.custom_title?.length ?? 0} / 60
          </span>
        </div>
        <Input
          value={formData.custom_title ?? ''}
          onChange={e =>
            setFormData({
              ...formData,
              custom_title: e.target.value,
            })
          }
          placeholder="Titre optimisé pour le site internet"
          maxLength={60}
        />
        {getError('custom_title') && (
          <p className="text-sm text-red-600 mt-1">
            {getError('custom_title')?.message}
          </p>
        )}
      </div>

      {/* Custom Description */}
      <div>
        <div className="flex items-center justify-between">
          <Label>Description SEO custom (priorité 1)</Label>
          <span
            className={`text-sm ${
              (formData.custom_description?.length ?? 0) < 80
                ? 'text-red-600'
                : (formData.custom_description?.length ?? 0) <= 160
                  ? 'text-green-600'
                  : 'text-gray-600'
            }`}
          >
            {formData.custom_description?.length ?? 0} / 160
          </span>
        </div>
        <Textarea
          value={formData.custom_description ?? ''}
          onChange={e =>
            setFormData({
              ...formData,
              custom_description: e.target.value,
            })
          }
          placeholder="Description optimisée pour le site internet"
          maxLength={160}
          rows={3}
        />
        {getError('custom_description') && (
          <p className="text-sm text-red-600 mt-1">
            {getError('custom_description')?.message}
          </p>
        )}
      </div>

      {/* Waterfall Preview */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="font-medium text-blue-900 mb-2">
          Aperçu final (waterfall)
        </div>
        <div className="space-y-2 text-sm">
          <div>
            <span className="text-blue-700 font-medium">Titre:</span>{' '}
            {formData.custom_title ?? product.seo_title}
          </div>
          <div>
            <span className="text-blue-700 font-medium">Description:</span>{' '}
            {formData.custom_description ?? product.seo_meta_description}
          </div>
        </div>
      </div>
    </div>
  );
}
