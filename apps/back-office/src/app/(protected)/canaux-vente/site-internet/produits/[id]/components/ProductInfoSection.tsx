'use client';

/**
 * Composant: ProductInfoSection
 * Section informations générales du produit (éditable inline)
 */

import { useState } from 'react';

import { Badge, ButtonV2, Input, Label, Textarea } from '@verone/ui';
import { Edit2, Save, X } from 'lucide-react';

import { useUpdateMetadata } from '../../../hooks/use-update-metadata';
import type { SiteInternetProduct } from '../../../types';

interface ProductInfoSectionProps {
  product: SiteInternetProduct;
  channelId: string;
}

export default function ProductInfoSection({
  product,
  channelId,
}: ProductInfoSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    custom_description: product.description ?? '',
    custom_description_long: '',
    custom_technical_description: product.technical_description ?? '',
    custom_brand: product.brand ?? '',
    custom_selling_points: product.selling_points || [],
  });

  const updateMetadata = useUpdateMetadata();

  const handleSave = () => {
    updateMetadata.mutate(
      {
        product_id: product.product_id,
        channel_id: channelId,
        ...formData,
      },
      {
        onSuccess: () => {
          setIsEditing(false);
        },
      }
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Informations générales
        </h2>
        {!isEditing ? (
          <ButtonV2
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            <Edit2 className="h-4 w-4 mr-2" />
            Modifier
          </ButtonV2>
        ) : (
          <div className="flex items-center gap-2">
            <ButtonV2
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(false)}
            >
              <X className="h-4 w-4 mr-2" />
              Annuler
            </ButtonV2>
            <ButtonV2
              variant="default"
              size="sm"
              onClick={handleSave}
              disabled={updateMetadata.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              Enregistrer
            </ButtonV2>
          </div>
        )}
      </div>

      {/* Contenu */}
      <div className="space-y-6">
        {/* Description courte */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Label>Description courte</Label>
            <Badge variant="outline" className="text-xs">
              Waterfall: {product.description ? 'Catalogue' : 'Vide'}
            </Badge>
          </div>
          {isEditing ? (
            <Textarea
              value={formData.custom_description}
              onChange={e =>
                setFormData({ ...formData, custom_description: e.target.value })
              }
              rows={3}
              maxLength={500}
            />
          ) : (
            <p className="text-sm text-gray-700">
              {product.description || (
                <span className="text-gray-400 italic">Non renseigné</span>
              )}
            </p>
          )}
        </div>

        {/* Description technique */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Label>Description technique</Label>
            <Badge variant="outline" className="text-xs">
              Waterfall: {product.technical_description ? 'Catalogue' : 'Vide'}
            </Badge>
          </div>
          {isEditing ? (
            <Textarea
              value={formData.custom_technical_description}
              onChange={e =>
                setFormData({
                  ...formData,
                  custom_technical_description: e.target.value,
                })
              }
              rows={4}
              maxLength={2000}
            />
          ) : (
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {product.technical_description || (
                <span className="text-gray-400 italic">Non renseigné</span>
              )}
            </p>
          )}
        </div>

        {/* Marque */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Label>Marque</Label>
            <Badge variant="outline" className="text-xs">
              Waterfall: {product.brand || 'Vide'}
            </Badge>
          </div>
          {isEditing ? (
            <Input
              value={formData.custom_brand}
              onChange={e =>
                setFormData({ ...formData, custom_brand: e.target.value })
              }
              maxLength={100}
            />
          ) : (
            <p className="text-sm text-gray-700">
              {product.brand || (
                <span className="text-gray-400 italic">Non renseigné</span>
              )}
            </p>
          )}
        </div>

        {/* Selling Points */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Label>Points de vente</Label>
          </div>
          {product.selling_points.length > 0 ? (
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
              {product.selling_points.map((point, index) => (
                <li key={index}>{point}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400 italic">Aucun point de vente</p>
          )}
        </div>
      </div>
    </div>
  );
}
