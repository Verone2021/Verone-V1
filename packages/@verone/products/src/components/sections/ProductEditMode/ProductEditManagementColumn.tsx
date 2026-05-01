'use client';

import {
  ButtonV2,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { Settings, BarChart3, DollarSign, Tags, Package } from 'lucide-react';

import { BrandsMultiSelect } from '../../forms/BrandsMultiSelect';
import type { ProductFormData } from './types';

interface ProductEditManagementColumnProps {
  formData: ProductFormData;
  onFieldChange: (field: string, value: unknown) => void;
}

export function ProductEditManagementColumn({
  formData,
  onFieldChange,
}: ProductEditManagementColumnProps) {
  const baseCost =
    typeof formData.base_cost === 'string'
      ? parseFloat(formData.base_cost)
      : formData.base_cost;
  const sellingPrice =
    typeof formData.selling_price === 'string'
      ? parseFloat(formData.selling_price)
      : formData.selling_price;
  const taxRate =
    typeof formData.tax_rate === 'string'
      ? parseFloat(formData.tax_rate)
      : formData.tax_rate;
  const hasPrices =
    formData.base_cost !== '' &&
    formData.selling_price !== '' &&
    !isNaN(baseCost) &&
    !isNaN(sellingPrice) &&
    baseCost > 0;

  return (
    <div className="xl:col-span-4 space-y-2">
      {/* Stock & Disponibilité */}
      <div className="bg-white border border-black p-2">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium flex items-center text-[10px]">
            <BarChart3 className="h-3 w-3 mr-1" />
            Stock & Disponibilité
          </h3>
          <ButtonV2 variant="outline" size="sm" className="h-5 text-[9px] px-1">
            <Settings className="h-2 w-2 mr-1" />
            Modifier
          </ButtonV2>
        </div>
        <div className="space-y-2">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <Label className="text-[9px] text-gray-600">Statut</Label>
              <Select
                value={formData.status}
                onValueChange={value => onFieldChange('status', value)}
              >
                <SelectTrigger className="h-6 text-[10px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft" className="text-[10px]">
                    Brouillon
                  </SelectItem>
                  <SelectItem value="active" className="text-[10px]">
                    Actif
                  </SelectItem>
                  <SelectItem value="archived" className="text-[10px]">
                    Archivé
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[9px] text-gray-600">Condition</Label>
              <Select
                value={formData.condition}
                onValueChange={value => onFieldChange('condition', value)}
              >
                <SelectTrigger className="h-6 text-[10px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new" className="text-[10px]">
                    Neuf
                  </SelectItem>
                  <SelectItem value="used" className="text-[10px]">
                    Occasion
                  </SelectItem>
                  <SelectItem value="refurbished" className="text-[10px]">
                    Reconditionné
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <Label className="text-[9px] text-gray-600">Quantité stock</Label>
              <Input
                type="number"
                value={formData.stock_quantity}
                onChange={e =>
                  onFieldChange('stock_quantity', parseInt(e.target.value))
                }
                className="h-6 text-[10px]"
              />
            </div>
            <div>
              <Label className="text-[9px] text-gray-600">Stock minimum</Label>
              <Input
                type="number"
                value={formData.min_stock}
                onChange={e =>
                  onFieldChange('min_stock', parseInt(e.target.value))
                }
                className="h-6 text-[10px]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tarification */}
      <div className="bg-white border border-black p-2">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium flex items-center text-[10px]">
            <DollarSign className="h-3 w-3 mr-1" />
            Tarification
          </h3>
          <ButtonV2 variant="outline" size="sm" className="h-5 text-[9px] px-1">
            <Settings className="h-2 w-2 mr-1" />
            Modifier
          </ButtonV2>
        </div>
        <div className="space-y-2">
          <div>
            <Label className="text-[9px] text-gray-600">
              Coût fournisseur HT
            </Label>
            <Input
              type="number"
              step="0.01"
              value={formData.base_cost}
              onChange={e =>
                onFieldChange('base_cost', parseFloat(e.target.value))
              }
              className="h-6 text-[10px]"
              placeholder="0.00"
            />
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <Label className="text-[9px] text-gray-600">Prix vente HT</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.selling_price}
                onChange={e =>
                  onFieldChange('selling_price', parseFloat(e.target.value))
                }
                className="h-6 text-[10px]"
                placeholder="0.00"
              />
            </div>
            <div>
              <Label className="text-[9px] text-gray-600">
                Prix minimum HT
              </Label>
              <Input
                type="number"
                step="0.01"
                value={formData.min_price}
                onChange={e =>
                  onFieldChange('min_price', parseFloat(e.target.value))
                }
                className="h-6 text-[10px]"
                placeholder="0.00"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <Label className="text-[9px] text-gray-600">Marge %</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.margin_percentage}
                onChange={e =>
                  onFieldChange('margin_percentage', parseFloat(e.target.value))
                }
                className="h-6 text-[10px] bg-gray-50"
                placeholder="0"
                disabled
              />
            </div>
            <div>
              <Label className="text-[9px] text-gray-600">TVA %</Label>
              <Input
                type="number"
                value={formData.tax_rate}
                onChange={e =>
                  onFieldChange('tax_rate', parseFloat(e.target.value))
                }
                className="h-6 text-[10px]"
                placeholder="20"
              />
            </div>
          </div>
          {hasPrices && (
            <div className="text-[9px] text-gray-600 bg-gray-50 p-1 rounded">
              <div className="flex justify-between">
                <span>Marge brute:</span>
                <span className="font-medium">
                  {(((sellingPrice - baseCost) / baseCost) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Prix TTC:</span>
                <span className="font-medium">
                  {(sellingPrice * (1 + taxRate / 100)).toFixed(2)}€
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Identifiants */}
      <div className="bg-white border border-black p-2">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium flex items-center text-[10px]">
            <Tags className="h-3 w-3 mr-1" />
            Identifiants
          </h3>
          <ButtonV2 variant="outline" size="sm" className="h-5 text-[9px] px-1">
            <Settings className="h-2 w-2 mr-1" />
            Modifier
          </ButtonV2>
        </div>
        <div className="space-y-2">
          <div>
            <Label className="text-[9px] text-gray-600">
              SKU (auto-généré)
            </Label>
            <Input
              value={formData.sku}
              disabled
              className="h-6 bg-gray-50 text-[10px]"
            />
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <Label className="text-[9px] text-gray-600">Fabricant</Label>
              <Input
                value={formData.manufacturer}
                onChange={e => onFieldChange('manufacturer', e.target.value)}
                className="h-6 text-[10px]"
                placeholder="Fabricant"
              />
            </div>
            <div>
              <Label className="text-[9px] text-gray-600">GTIN/EAN</Label>
              <Input
                value={formData.gtin}
                onChange={e => onFieldChange('gtin', e.target.value)}
                className="h-6 text-[10px]"
                placeholder="13 chiffres"
              />
            </div>
          </div>

          {/* Marques internes Vérone Group (brand_ids) */}
          <div>
            <Label className="text-[9px] text-gray-600">Marques internes</Label>
            <BrandsMultiSelect
              value={formData.brand_ids}
              onChange={nextIds => onFieldChange('brand_ids', nextIds)}
              emptyLabel="Aucune marque (white-label)"
            />
          </div>
        </div>
      </div>

      {/* Dimensions & Poids */}
      <div className="bg-white border border-black p-2">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium flex items-center text-[10px]">
            <Package className="h-3 w-3 mr-1" />
            Dimensions & Poids
          </h3>
          <ButtonV2 variant="outline" size="sm" className="h-5 text-[9px] px-1">
            <Settings className="h-2 w-2 mr-1" />
            Modifier
          </ButtonV2>
        </div>
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-1">
            <div>
              <Label className="text-[9px] text-gray-600">L</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.dimensions_length}
                onChange={e =>
                  onFieldChange('dimensions_length', parseFloat(e.target.value))
                }
                className="h-6 text-[10px]"
                placeholder="0"
              />
            </div>
            <div>
              <Label className="text-[9px] text-gray-600">l</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.dimensions_width}
                onChange={e =>
                  onFieldChange('dimensions_width', parseFloat(e.target.value))
                }
                className="h-6 text-[10px]"
                placeholder="0"
              />
            </div>
            <div>
              <Label className="text-[9px] text-gray-600">H</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.dimensions_height}
                onChange={e =>
                  onFieldChange('dimensions_height', parseFloat(e.target.value))
                }
                className="h-6 text-[10px]"
                placeholder="0"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <Label className="text-[9px] text-gray-600">Poids</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.weight}
                onChange={e =>
                  onFieldChange('weight', parseFloat(e.target.value))
                }
                className="h-6 text-[10px]"
                placeholder="0"
              />
            </div>
            <div>
              <Label className="text-[9px] text-gray-600">Unité</Label>
              <Select
                value={formData.weight_unit}
                onValueChange={value => onFieldChange('weight_unit', value)}
              >
                <SelectTrigger className="h-6 text-[10px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg" className="text-[10px]">
                    kg
                  </SelectItem>
                  <SelectItem value="g" className="text-[10px]">
                    g
                  </SelectItem>
                  <SelectItem value="lb" className="text-[10px]">
                    lb
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Gestion Échantillons */}
      <div className="bg-white border border-black p-2">
        <h3 className="font-medium mb-2 text-[10px]">Gestion Échantillons</h3>
        {/* FIXME: SampleRequirementSection component can't be imported from apps/back-office in package */}
        <div className="p-2 border rounded bg-gray-50">
          <p className="text-sm text-gray-600">
            Section échantillons (temporairement désactivée)
          </p>
        </div>
      </div>
    </div>
  );
}
