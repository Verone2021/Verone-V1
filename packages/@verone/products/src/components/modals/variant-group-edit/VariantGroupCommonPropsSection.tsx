'use client';

import { Checkbox, Input, Label } from '@verone/ui';
import {
  MATERIAL_OPTIONS,
  NAME_POSITION_LABELS,
  type NamePosition,
} from '@verone/types';

interface ColorOption {
  name: string;
  hex_code?: string | null;
  is_predefined?: boolean | null;
}

interface VariantGroupCommonPropsSectionProps {
  hasCommonWeight: boolean;
  setHasCommonWeight: (v: boolean) => void;
  commonWeight: number | undefined;
  setCommonWeight: (v: number | undefined) => void;
  hasCommonCostPrice: boolean;
  setHasCommonCostPrice: (v: boolean) => void;
  commonCostPrice: number | undefined;
  setCommonCostPrice: (v: number | undefined) => void;
  commonEcoTax: number;
  setCommonEcoTax: (v: number) => void;
  // Matière commune
  hasCommonMaterial: boolean;
  setHasCommonMaterial: (v: boolean) => void;
  commonMaterial: string;
  setCommonMaterial: (v: string) => void;
  // Couleur commune
  hasCommonColor: boolean;
  setHasCommonColor: (v: boolean) => void;
  commonColor: string;
  setCommonColor: (v: string) => void;
  colors: ColorOption[];
  // Positions dans le nom
  materialNamePosition: NamePosition;
  setMaterialNamePosition: (v: NamePosition) => void;
  colorNamePosition: NamePosition;
  setColorNamePosition: (v: NamePosition) => void;
  groupName?: string;
}

export function VariantGroupCommonPropsSection({
  hasCommonWeight,
  setHasCommonWeight,
  commonWeight,
  setCommonWeight,
  hasCommonCostPrice,
  setHasCommonCostPrice,
  commonCostPrice,
  setCommonCostPrice,
  commonEcoTax,
  setCommonEcoTax,
  hasCommonMaterial,
  setHasCommonMaterial,
  commonMaterial,
  setCommonMaterial,
  hasCommonColor,
  setHasCommonColor,
  commonColor,
  setCommonColor,
  colors,
  materialNamePosition,
  setMaterialNamePosition,
  colorNamePosition,
  setColorNamePosition,
  groupName,
}: VariantGroupCommonPropsSectionProps) {
  return (
    <>
      {/* Poids commun */}
      <div className="space-y-4 pt-4 border-t">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="has-common-weight"
            checked={hasCommonWeight}
            onCheckedChange={checked => {
              setHasCommonWeight(checked as boolean);
              if (!checked) setCommonWeight(undefined);
            }}
          />
          <Label
            htmlFor="has-common-weight"
            className="text-sm font-medium cursor-pointer"
          >
            Meme poids pour tous les produits
          </Label>
        </div>
        <p className="text-xs text-gray-600 ml-6">
          Si cochee, tous les produits du groupe heriteront automatiquement du
          poids saisi
        </p>

        {hasCommonWeight && (
          <div className="ml-6 space-y-2">
            <Label htmlFor="common_weight" className="text-sm font-medium">
              Poids commun <span className="text-red-500">*</span>
            </Label>
            <div className="flex items-end space-x-2">
              <Input
                id="common_weight"
                type="number"
                step="0.01"
                min="0"
                value={commonWeight ?? ''}
                onChange={e =>
                  setCommonWeight(
                    e.target.value ? parseFloat(e.target.value) : undefined
                  )
                }
                placeholder="0.00"
                className="flex-1"
              />
              <span className="text-sm text-gray-600 mb-2 min-w-[30px]">
                kg
              </span>
            </div>
            <p className="text-xs text-blue-700 bg-blue-50 p-2 rounded border border-blue-200">
              Ce poids sera applique automatiquement a tous les produits du
              groupe
            </p>
          </div>
        )}
      </div>

      {/* Prix d'achat commun */}
      <div className="space-y-3 pt-4 border-t">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="has-common-cost-price"
            checked={hasCommonCostPrice}
            onCheckedChange={checked => {
              setHasCommonCostPrice(checked as boolean);
              if (!checked) {
                setCommonCostPrice(undefined);
                setCommonEcoTax(0);
              }
            }}
          />
          <Label
            htmlFor="has-common-cost-price"
            className="text-sm font-medium cursor-pointer"
          >
            Meme prix d&apos;achat pour tous les produits
          </Label>
        </div>
        <p className="text-xs text-gray-600 ml-6">
          Si cochee, tous les produits du groupe heriteront automatiquement du
          prix d&apos;achat saisi
        </p>

        {hasCommonCostPrice && (
          <div className="ml-6 space-y-2">
            <Label htmlFor="common_cost_price" className="text-sm font-medium">
              Prix d&apos;achat commun <span className="text-red-500">*</span>
            </Label>
            <div className="flex items-end space-x-2">
              <Input
                id="common_cost_price"
                type="number"
                step="0.01"
                min="0.01"
                value={commonCostPrice ?? ''}
                onChange={e =>
                  setCommonCostPrice(
                    e.target.value ? parseFloat(e.target.value) : undefined
                  )
                }
                placeholder="0.00"
                className="flex-1"
              />
              <span className="text-sm text-gray-600 mb-2 min-w-[30px]">
                EUR
              </span>
            </div>
            <p className="text-xs text-blue-700 bg-blue-50 p-2 rounded border border-blue-200">
              Ce prix d&apos;achat sera applique automatiquement a tous les
              produits du groupe
            </p>

            {/* Eco-taxe */}
            <div className="mt-4 space-y-2 bg-orange-50 p-3 rounded-lg border border-orange-200">
              <Label
                htmlFor="common_eco_tax"
                className="text-sm font-medium text-orange-800"
              >
                Taxe eco-responsable commune
              </Label>
              <div className="flex items-end space-x-2">
                <Input
                  id="common_eco_tax"
                  type="number"
                  step="0.01"
                  min="0"
                  value={commonEcoTax}
                  onChange={e =>
                    setCommonEcoTax(
                      e.target.value ? parseFloat(e.target.value) : 0
                    )
                  }
                  placeholder="0.00"
                  className="flex-1 border-orange-300 focus:ring-orange-500"
                />
                <span className="text-sm text-orange-700 mb-2 min-w-[30px]">
                  EUR
                </span>
              </div>
              <p className="text-xs text-orange-700">
                S&apos;additionne au prix d&apos;achat fournisseur (peut etre 0
                EUR)
              </p>
              <p className="text-xs text-orange-600 font-medium">
                Total cout d&apos;achat = {(commonCostPrice ?? 0).toFixed(2)}{' '}
                EUR + {commonEcoTax.toFixed(2)} EUR ={' '}
                {((commonCostPrice ?? 0) + commonEcoTax).toFixed(2)} EUR
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Matiere commune */}
      <div className="space-y-3 pt-4 border-t">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="has-common-material"
            checked={hasCommonMaterial}
            onCheckedChange={checked => {
              setHasCommonMaterial(checked as boolean);
              if (!checked) setCommonMaterial('');
            }}
          />
          <Label
            htmlFor="has-common-material"
            className="text-sm font-medium cursor-pointer"
          >
            Meme matiere pour tous les produits
          </Label>
        </div>
        <p className="text-xs text-gray-600 ml-6">
          Si cochee, tous les produits du groupe heriteront automatiquement de
          la matiere choisie (typique quand variant_type=&apos;color&apos;)
        </p>

        {hasCommonMaterial && (
          <div className="ml-6 space-y-2">
            <Label
              htmlFor="common_material_edit"
              className="text-sm font-medium"
            >
              Matiere commune <span className="text-red-500">*</span>
            </Label>
            <select
              id="common_material_edit"
              value={commonMaterial}
              onChange={e => setCommonMaterial(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-black focus:border-black"
            >
              <option value="">Selectionner une matiere</option>
              {MATERIAL_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-blue-700 bg-blue-50 p-2 rounded border border-blue-200">
              Cette matiere sera appliquee automatiquement a tous les produits
              du groupe
            </p>

            <div className="space-y-1">
              <Label
                htmlFor="material_name_position"
                className="text-sm font-medium"
              >
                Position de la matiere dans le nom des produits
              </Label>
              <select
                id="material_name_position"
                value={materialNamePosition}
                onChange={e =>
                  setMaterialNamePosition(e.target.value as NamePosition)
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-black focus:border-black"
              >
                {(Object.keys(NAME_POSITION_LABELS) as NamePosition[]).map(
                  pos => (
                    <option key={pos} value={pos}>
                      {NAME_POSITION_LABELS[pos]}
                    </option>
                  )
                )}
              </select>
              <p className="text-xs text-gray-600">
                Apercu :{' '}
                <code className="bg-gray-100 px-1 rounded">
                  {previewName(
                    groupName ?? 'Nom du groupe',
                    'Bleu',
                    commonMaterial,
                    materialNamePosition,
                    null,
                    'none'
                  )}
                </code>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Couleur commune */}
      <div className="space-y-3 pt-4 border-t">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="has-common-color"
            checked={hasCommonColor}
            onCheckedChange={checked => {
              setHasCommonColor(checked as boolean);
              if (!checked) setCommonColor('');
            }}
          />
          <Label
            htmlFor="has-common-color"
            className="text-sm font-medium cursor-pointer"
          >
            Meme couleur pour tous les produits
          </Label>
        </div>
        <p className="text-xs text-gray-600 ml-6">
          Si cochee, tous les produits du groupe heriteront de la couleur
          choisie (typique quand variant_type=&apos;material&apos;)
        </p>

        {hasCommonColor && (
          <div className="ml-6 space-y-2">
            <Label htmlFor="common_color_edit" className="text-sm font-medium">
              Couleur commune <span className="text-red-500">*</span>
            </Label>
            <select
              id="common_color_edit"
              value={commonColor}
              onChange={e => setCommonColor(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-black focus:border-black"
            >
              <option value="">Selectionner une couleur</option>
              {colors.map(c => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-blue-700 bg-blue-50 p-2 rounded border border-blue-200">
              Cette couleur sera appliquee automatiquement a toutes les
              variantes du groupe
            </p>

            <div className="space-y-1">
              <Label
                htmlFor="color_name_position"
                className="text-sm font-medium"
              >
                Position de la couleur dans le nom des produits
              </Label>
              <select
                id="color_name_position"
                value={colorNamePosition}
                onChange={e =>
                  setColorNamePosition(e.target.value as NamePosition)
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-black focus:border-black"
              >
                {(Object.keys(NAME_POSITION_LABELS) as NamePosition[]).map(
                  pos => (
                    <option key={pos} value={pos}>
                      {NAME_POSITION_LABELS[pos]}
                    </option>
                  )
                )}
              </select>
              <p className="text-xs text-gray-600">
                Apercu :{' '}
                <code className="bg-gray-100 px-1 rounded">
                  {previewName(
                    groupName ?? 'Nom du groupe',
                    'metal',
                    null,
                    'none',
                    commonColor,
                    colorNamePosition
                  )}
                </code>
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// Helper pour calculer un apercu du nom selon les positions choisies.
// Reproduit la logique de buildVariantProductName (use-variant-products-create / VariantAddProductModal).
function previewName(
  groupName: string,
  variantValue: string,
  commonMaterial: string | null,
  materialPosition: NamePosition,
  commonColor: string | null,
  colorPosition: NamePosition
): string {
  let prefix = '';
  let suffix = groupName;
  let beforeVariant = '';

  const placeAttribute = (
    value: string | null,
    position: NamePosition
  ): void => {
    if (!value || position === 'none') return;
    const display =
      MATERIAL_OPTIONS.find(o => o.value === value)?.label ?? value;
    if (position === 'before_group') {
      prefix = prefix ? `${prefix} ${display}` : display;
    } else if (position === 'after_group') {
      suffix = `${suffix} ${display}`;
    } else if (position === 'before_variant') {
      beforeVariant = beforeVariant ? `${beforeVariant}, ${display}` : display;
    }
  };

  placeAttribute(commonMaterial, materialPosition);
  placeAttribute(commonColor, colorPosition);

  const head = prefix ? `${prefix} ${suffix}` : suffix;
  const tail = beforeVariant
    ? `${beforeVariant}, ${variantValue}`
    : variantValue;
  return `${head} - ${tail}`;
}
