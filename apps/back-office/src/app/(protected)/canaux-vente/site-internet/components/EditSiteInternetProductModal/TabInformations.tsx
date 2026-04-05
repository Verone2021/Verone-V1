'use client';

// =============================================================================
// Onglet Informations — Champs éditables + Grille read-only catalogue
// =============================================================================

import { ButtonV2 } from '@verone/ui';
import { Badge } from '@verone/ui';
import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import { Textarea } from '@verone/ui';
import { Trash2 } from 'lucide-react';

import { PRODUCT_TYPE_LABELS, formatDimensions } from './schema';
import type { TabSharedProps } from './types';

export function TabInformations({
  product,
  formData,
  setFormData,
  getError,
}: TabSharedProps) {
  return (
    <div className="space-y-6">
      {/* Section 1: Champs éditables avec waterfall */}
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="font-medium text-blue-900 mb-2">
            📝 Champs éditables (priorité canal)
          </div>
          <p className="text-sm text-blue-700">
            Ces champs peuvent être personnalisés pour le site internet. Si non
            remplis, les valeurs du catalogue produit seront utilisées.
          </p>
        </div>

        {/* Description complète */}
        <div>
          <div className="flex items-center justify-between">
            <Label>Description complète</Label>
            <span className="text-sm text-gray-500">
              {formData.custom_description_long?.length ?? 0} / 5000
            </span>
          </div>
          <Textarea
            value={formData.custom_description_long ?? ''}
            onChange={e =>
              setFormData({
                ...formData,
                custom_description_long: e.target.value,
              })
            }
            placeholder="Description complète du produit pour le site internet..."
            maxLength={5000}
            rows={6}
            className="font-sans"
          />
          {getError('custom_description_long') && (
            <p className="text-sm text-red-600 mt-1">
              {getError('custom_description_long')?.message}
            </p>
          )}
          <p className="text-sm text-gray-500 mt-1">
            Waterfall: Custom canal →{' '}
            {product.description ? 'Description catalogue' : 'Vide'}
          </p>
        </div>

        {/* Description technique */}
        <div>
          <div className="flex items-center justify-between">
            <Label>Description technique</Label>
            <span className="text-sm text-gray-500">
              {formData.custom_technical_description?.length ?? 0} / 2000
            </span>
          </div>
          <Textarea
            value={formData.custom_technical_description ?? ''}
            onChange={e =>
              setFormData({
                ...formData,
                custom_technical_description: e.target.value,
              })
            }
            placeholder="Caractéristiques techniques du produit..."
            maxLength={2000}
            rows={4}
            className="font-sans"
          />
          {getError('custom_technical_description') && (
            <p className="text-sm text-red-600 mt-1">
              {getError('custom_technical_description')?.message}
            </p>
          )}
          <p className="text-sm text-gray-500 mt-1">
            Waterfall: Custom canal →{' '}
            {product.technical_description
              ? 'Description technique catalogue'
              : 'Vide'}
          </p>
        </div>

        {/* Marque */}
        <div>
          <Label>Marque</Label>
          <Input
            value={formData.custom_brand ?? ''}
            onChange={e =>
              setFormData({
                ...formData,
                custom_brand: e.target.value,
              })
            }
            placeholder="Nom de la marque"
            maxLength={100}
          />
          {getError('custom_brand') && (
            <p className="text-sm text-red-600 mt-1">
              {getError('custom_brand')?.message}
            </p>
          )}
          <p className="text-sm text-gray-500 mt-1">
            Waterfall: Custom canal → {product.brand ?? 'Vide'}
          </p>
        </div>

        {/* Selling Points */}
        <div>
          <Label>Points de vente (Selling Points)</Label>
          <div className="space-y-2 mt-2">
            {(formData.custom_selling_points ?? []).map((point, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={point}
                  onChange={e => {
                    const newPoints = [
                      ...(formData.custom_selling_points ?? []),
                    ];
                    newPoints[index] = e.target.value;
                    setFormData({
                      ...formData,
                      custom_selling_points: newPoints,
                    });
                  }}
                  placeholder={`Point ${index + 1}`}
                />
                <ButtonV2
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newPoints = (
                      formData.custom_selling_points ?? []
                    ).filter((_, i) => i !== index);
                    setFormData({
                      ...formData,
                      custom_selling_points: newPoints,
                    });
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </ButtonV2>
              </div>
            ))}
            <ButtonV2
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setFormData({
                  ...formData,
                  custom_selling_points: [
                    ...(formData.custom_selling_points ?? []),
                    '',
                  ],
                });
              }}
            >
              + Ajouter un point
            </ButtonV2>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Waterfall: Custom canal →{' '}
            {product.selling_points?.length > 0
              ? `${product.selling_points.length} points catalogue`
              : 'Vide'}
          </p>
        </div>
      </div>

      {/* Section 2: Champs READ-ONLY */}
      <div className="border-t pt-6 space-y-6">
        <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
          <div className="font-medium text-gray-900 mb-2">
            👁️ Informations catalogue (lecture seule)
          </div>
          <p className="text-sm text-gray-600">
            Ces informations proviennent du catalogue produit et ne peuvent pas
            être modifiées depuis ce canal.
          </p>
        </div>

        {/* Grille 2 colonnes pour READ-ONLY */}
        <div className="grid grid-cols-2 gap-4">
          {/* Dimensions */}
          <div className="bg-white border rounded-lg p-4">
            <Label className="text-gray-700">Dimensions</Label>
            <div className="text-sm text-gray-900 mt-2">
              {formatDimensions(product.dimensions)}
            </div>
          </div>

          {/* Poids */}
          <div className="bg-white border rounded-lg p-4">
            <Label className="text-gray-700">Poids</Label>
            <div className="text-sm text-gray-900 mt-2">
              {product.weight ? (
                <span>{product.weight} kg</span>
              ) : (
                <span className="text-gray-400 italic">Non défini</span>
              )}
            </div>
          </div>

          {/* Quantité minimale fournisseur */}
          <div className="bg-white border rounded-lg p-4">
            <Label className="text-gray-700">
              Quantité minimale fournisseur
            </Label>
            <div className="text-sm text-gray-900 mt-2">
              {product.supplier_moq ? (
                <Badge variant="secondary">
                  {product.supplier_moq}{' '}
                  {product.supplier_moq > 1 ? 'unités' : 'unité'}
                </Badge>
              ) : (
                <Badge variant="outline">1 unité (défaut)</Badge>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Quantité minimum de commande imposée par le fournisseur
            </p>
          </div>

          {/* Pièces compatibles */}
          <div className="bg-white border rounded-lg p-4">
            <Label className="text-gray-700">Pièces compatibles</Label>
            <div className="text-sm text-gray-900 mt-2">
              {product.suitable_rooms?.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {product.suitable_rooms.map((room, i) => (
                    <Badge key={i} variant="outline">
                      {room}
                    </Badge>
                  ))}
                </div>
              ) : (
                <span className="text-gray-400 italic">Aucune</span>
              )}
            </div>
          </div>

          {/* Sous-catégorie */}
          <div className="bg-white border rounded-lg p-4">
            <Label className="text-gray-700">Sous-catégorie</Label>
            <div className="text-sm text-gray-900 mt-2">
              {product.subcategory_name ? (
                <Badge variant="secondary">{product.subcategory_name}</Badge>
              ) : (
                <span className="text-gray-400 italic">Non définie</span>
              )}
            </div>
          </div>

          {/* Type produit */}
          <div className="bg-white border rounded-lg p-4">
            <Label className="text-gray-700">Type de produit</Label>
            <div className="text-sm text-gray-900 mt-2">
              {product.product_type &&
              PRODUCT_TYPE_LABELS[product.product_type] ? (
                <Badge
                  variant={PRODUCT_TYPE_LABELS[product.product_type].variant}
                >
                  {PRODUCT_TYPE_LABELS[product.product_type].label}
                </Badge>
              ) : (
                <span className="text-gray-400 italic">Non défini</span>
              )}
            </div>
          </div>

          {/* Vidéo URL */}
          <div className="bg-white border rounded-lg p-4">
            <Label className="text-gray-700">Vidéo URL</Label>
            <div className="text-sm text-gray-900 mt-2">
              {product.video_url ? (
                <a
                  href={product.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Voir la vidéo
                </a>
              ) : (
                <span className="text-gray-400 italic">Aucune vidéo</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
