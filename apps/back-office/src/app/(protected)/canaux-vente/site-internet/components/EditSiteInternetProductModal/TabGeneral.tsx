'use client';

// =============================================================================
// Onglet Général — Publication + Éligibilité + Slug
// =============================================================================

import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import { Switch } from '@verone/ui';
import { AlertCircle } from 'lucide-react';

import type { TabSharedProps } from './types';

export function TabGeneral({
  product,
  formData,
  setFormData,
  getError,
}: TabSharedProps) {
  return (
    <div className="space-y-6">
      {/* Publication */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label>Publié sur le site internet</Label>
            <p className="text-sm text-gray-500">
              Rendre ce produit visible sur le site
            </p>
          </div>
          <Switch
            checked={formData.is_published_online}
            onCheckedChange={checked =>
              setFormData({
                ...formData,
                is_published_online: checked,
              })
            }
          />
        </div>

        {/* Éligibilité */}
        {!product.is_eligible && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-amber-900">
                  Produit non éligible
                </div>
                <ul className="text-sm text-amber-700 mt-2 space-y-1">
                  {product.ineligibility_reasons.map((reason, i) => (
                    <li key={i}>• {reason}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Slug */}
      <div>
        <Label>Slug URL</Label>
        <Input
          value={formData.slug ?? ''}
          onChange={e => setFormData({ ...formData, slug: e.target.value })}
          placeholder="mon-produit-slug"
          className="font-mono text-sm"
        />
        {getError('slug') && (
          <p className="text-sm text-red-600 mt-1">
            {getError('slug')?.message}
          </p>
        )}
        <p className="text-sm text-gray-500 mt-1">
          URL: https://verone.fr/produit/{formData.slug ?? 'slug'}
        </p>
      </div>
    </div>
  );
}
