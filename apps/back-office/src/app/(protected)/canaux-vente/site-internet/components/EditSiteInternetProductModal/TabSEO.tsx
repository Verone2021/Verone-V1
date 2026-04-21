'use client';

// =============================================================================
// Onglet SEO — meta_title + meta_description (produits), slug affiché
// SI-DESC-001 (2026-04-21) : retrait custom_title / custom_description.
// Le SEO vit directement dans products.meta_title / .meta_description.
// =============================================================================

import { Input, Label, Textarea } from '@verone/ui';

import type { TabSharedProps } from './types';

export function TabSEO({
  product,
  formData,
  setFormData,
  getError,
}: TabSharedProps) {
  const metaTitle = formData.meta_title ?? '';
  const metaDescription = formData.meta_description ?? '';

  return (
    <div className="space-y-6">
      {/* Meta title */}
      <div>
        <div className="flex items-center justify-between">
          <Label>Meta title</Label>
          <span
            className={`text-sm ${
              metaTitle.length < 30
                ? 'text-red-600'
                : metaTitle.length <= 60
                  ? 'text-green-600'
                  : 'text-gray-600'
            }`}
          >
            {metaTitle.length} / 60
          </span>
        </div>
        <Input
          value={metaTitle}
          onChange={e =>
            setFormData({
              ...formData,
              meta_title: e.target.value,
            })
          }
          placeholder="Titre SEO pour Google"
          maxLength={60}
        />
        {getError('meta_title') && (
          <p className="text-sm text-red-600 mt-1">
            {getError('meta_title')?.message}
          </p>
        )}
        <p className="text-xs text-gray-500 mt-1">
          Fallback : nom du produit si vide.
        </p>
      </div>

      {/* Meta description */}
      <div>
        <div className="flex items-center justify-between">
          <Label>Meta description</Label>
          <span
            className={`text-sm ${
              metaDescription.length < 80
                ? 'text-red-600'
                : metaDescription.length <= 160
                  ? 'text-green-600'
                  : 'text-gray-600'
            }`}
          >
            {metaDescription.length} / 160
          </span>
        </div>
        <Textarea
          value={metaDescription}
          onChange={e =>
            setFormData({
              ...formData,
              meta_description: e.target.value,
            })
          }
          placeholder="Description snippet Google (120-160 caractères)"
          maxLength={160}
          rows={3}
        />
        {getError('meta_description') && (
          <p className="text-sm text-red-600 mt-1">
            {getError('meta_description')?.message}
          </p>
        )}
        <p className="text-xs text-gray-500 mt-1">
          Fallback : 160 premiers caractères de la description produit.
        </p>
      </div>

      {/* Slug preview */}
      <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
        <div className="font-medium text-neutral-900 mb-1">Slug URL</div>
        <code className="text-sm text-neutral-700">
          veronecollections.fr/produit/{formData.slug ?? product.slug ?? '…'}
        </code>
      </div>
    </div>
  );
}
