'use client';

import Link from 'next/link';

import { Card } from '@verone/ui';
import { Badge } from '@verone/ui';
import { Edit3, Home, ExternalLink, X } from 'lucide-react';

import {
  getVariantTypeIcon,
  formatVariantType,
  formatStyle,
} from './variant-utils';

import type { VariantGroup, VariantType } from '@verone/types';

interface VariantGroupInfoCardProps {
  variantGroup: VariantGroup;
  editingType: boolean;
  editedType: VariantType;
  savingType: boolean;
  onStartEditType: () => void;
  onSaveType: (newType: VariantType) => Promise<void>;
  onCancelEditType: () => void;
  onEditedTypeChange: (value: VariantType) => void;
}

export function VariantGroupInfoCard({
  variantGroup,
  editingType,
  editedType,
  savingType,
  onStartEditType,
  onSaveType,
  onCancelEditType,
  onEditedTypeChange,
}: VariantGroupInfoCardProps) {
  return (
    <Card className="p-6 mb-8">
      <h3 className="text-lg font-semibold mb-4">Informations du groupe</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Catégorisation */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">
            Catégorisation
          </label>
          {variantGroup.subcategory ? (
            <p className="text-sm text-gray-900">
              <span className="font-medium">
                {variantGroup.subcategory.category?.name}
              </span>
              {' → '}
              <span className="font-medium">
                {variantGroup.subcategory.name}
              </span>
            </p>
          ) : (
            <p className="text-sm text-gray-500">Non définie</p>
          )}
        </div>

        {/* Type de variante */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">
            Type de variante
          </label>
          {editingType ? (
            <div className="flex items-center gap-2">
              <select
                value={editedType}
                onChange={e => {
                  const newType = e.target.value as VariantType;
                  onEditedTypeChange(newType);
                  void onSaveType(newType).catch(error => {
                    console.error('[VariantGroup] Save type failed:', error);
                  });
                }}
                disabled={savingType}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                autoFocus
              >
                <option value="color">Couleur</option>
                <option value="material">Matériau</option>
              </select>
              {savingType && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black" />
              )}
              <button
                onClick={onCancelEditType}
                className="text-gray-500 hover:text-gray-700"
                disabled={savingType}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 group">
              {getVariantTypeIcon(variantGroup.variant_type ?? '')}
              <span className="text-sm text-gray-900 font-medium">
                {formatVariantType(variantGroup.variant_type)}
              </span>
              <button
                onClick={onStartEditType}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded"
                title="Modifier le type"
              >
                <Edit3 className="w-3 h-3 text-gray-600" />
              </button>
            </div>
          )}
        </div>

        {/* Dimensions communes */}
        {variantGroup.dimensions_length && (
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2 flex items-center gap-2">
              📐 Dimensions communes
              <Badge
                variant="outline"
                className="text-xs bg-blue-50 text-blue-700 border-blue-200"
              >
                Héritées par tous les produits
              </Badge>
            </label>
            <p className="text-sm text-gray-900 font-medium">
              L: {variantGroup.dimensions_length} × l:{' '}
              {variantGroup.dimensions_width} × H:{' '}
              {variantGroup.dimensions_height} {variantGroup.dimensions_unit}
            </p>
          </div>
        )}

        {/* Poids commun */}
        {variantGroup.common_weight && (
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2 flex items-center gap-2">
              ⚖️ Poids commun
              <Badge
                variant="outline"
                className="text-xs bg-gray-50 text-gray-900 border-gray-300"
              >
                Hérité par tous les produits
              </Badge>
            </label>
            <p className="text-sm text-gray-900 font-medium">
              {variantGroup.common_weight} kg
            </p>
          </div>
        )}

        {/* Prix d'achat + Éco-taxe commune */}
        {variantGroup.has_common_cost_price &&
          variantGroup.common_cost_price != null && (
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700 block mb-2 flex items-center gap-2">
                💰 Prix d'achat commun + Éco-taxe
                <Badge
                  variant="outline"
                  className="text-xs bg-gray-50 text-gray-900 border-gray-300"
                >
                  Hérité par tous les produits
                </Badge>
              </label>
              <div className="space-y-1">
                <p className="text-sm text-gray-900 font-medium">
                  Prix d'achat HT: {variantGroup.common_cost_price.toFixed(2)} €
                </p>
                <p className="text-sm text-gray-700">
                  🌿 Éco-taxe: {(variantGroup.common_eco_tax ?? 0).toFixed(2)} €
                </p>
                <p className="text-sm text-gray-900 font-semibold">
                  Total:{' '}
                  {(
                    variantGroup.common_cost_price +
                    (variantGroup.common_eco_tax ?? 0)
                  ).toFixed(2)}{' '}
                  €
                </p>
              </div>
            </div>
          )}

        {/* Style décoratif */}
        {variantGroup.style && (
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Style décoratif
            </label>
            <Badge
              variant="outline"
              className="bg-pink-50 text-pink-700 border-pink-200"
            >
              🎨 {formatStyle(variantGroup.style)}
            </Badge>
          </div>
        )}

        {/* Pièces compatibles */}
        {variantGroup.suitable_rooms &&
          variantGroup.suitable_rooms.length > 0 && (
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Pièces compatibles
              </label>
              <div className="flex flex-wrap gap-2">
                {variantGroup.suitable_rooms.map((room, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="bg-gray-50 text-gray-900 border-gray-300"
                  >
                    <Home className="h-3 w-3 mr-1" />
                    {room}
                  </Badge>
                ))}
              </div>
            </div>
          )}

        {/* Fournisseur commun */}
        {variantGroup.has_common_supplier && variantGroup.supplier && (
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Fournisseur commun
            </label>
            <div className="flex items-center gap-2">
              <Link
                href={`/contacts-organisations/suppliers/${variantGroup.supplier.id}`}
              >
                <Badge
                  variant="outline"
                  className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  🏢 {variantGroup.supplier.name}
                  <ExternalLink className="h-3 w-3 opacity-60" />
                </Badge>
              </Link>
              <span className="text-xs text-gray-600">
                (appliqué automatiquement à tous les produits du groupe)
              </span>
            </div>
          </div>
        )}

        {/* Matière commune */}
        {variantGroup.has_common_material && variantGroup.common_material && (
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Matière commune
            </label>
            <Badge
              variant="outline"
              className="bg-blue-50 text-blue-700 border-blue-200"
            >
              {variantGroup.common_material}
            </Badge>
          </div>
        )}

        {/* Couleur commune */}
        {variantGroup.has_common_color && variantGroup.common_color && (
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Couleur commune
            </label>
            <Badge
              variant="outline"
              className="bg-blue-50 text-blue-700 border-blue-200"
            >
              {variantGroup.common_color}
            </Badge>
          </div>
        )}
      </div>
    </Card>
  );
}
