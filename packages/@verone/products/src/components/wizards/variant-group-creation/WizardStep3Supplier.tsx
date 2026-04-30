'use client';

import Link from 'next/link';

import {
  Checkbox,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { ExternalLink } from 'lucide-react';

import { MATERIAL_OPTIONS } from '@verone/types';

interface Supplier {
  id: string;
  legal_name: string;
  trade_name: string | null;
}

interface ColorOption {
  name: string;
  hex_code?: string | null;
  is_predefined?: boolean | null;
}

interface WizardStep3SupplierProps {
  hasCommonSupplier: boolean;
  supplierId: string;
  commonWeight: number | '';
  hasCommonWeight: boolean;
  hasCommonCostPrice: boolean;
  commonCostPrice: number | '';
  commonEcoTax: number | '';
  hasCommonMaterial: boolean;
  commonMaterial: string;
  hasCommonColor: boolean;
  commonColor: string;
  suppliers: Supplier[];
  colors: ColorOption[];
  onUpdate: (updates: Record<string, unknown>) => void;
}

export function WizardStep3Supplier({
  hasCommonSupplier,
  supplierId,
  commonWeight,
  hasCommonWeight,
  hasCommonCostPrice,
  commonCostPrice,
  commonEcoTax,
  hasCommonMaterial,
  commonMaterial,
  hasCommonColor,
  commonColor,
  suppliers,
  colors,
  onUpdate,
}: WizardStep3SupplierProps) {
  return (
    <div className="space-y-4">
      {/* Fournisseur commun */}
      <div className="space-y-3">
        <label
          htmlFor="has-common-supplier"
          className="flex items-center gap-2 min-h-[44px] md:min-h-0 cursor-pointer"
        >
          <Checkbox
            id="has-common-supplier"
            checked={hasCommonSupplier}
            checkboxSize="lg"
            onCheckedChange={checked => {
              onUpdate({ has_common_supplier: checked as boolean });
              if (!checked) onUpdate({ supplier_id: '' });
            }}
          />
          <span className="text-sm font-medium">
            Meme fournisseur pour tous les produits
          </span>
        </label>

        {hasCommonSupplier && (
          <div>
            <Label htmlFor="supplier">
              Fournisseur <span className="text-red-500">*</span>
            </Label>
            <Select
              value={supplierId}
              onValueChange={value => onUpdate({ supplier_id: value })}
            >
              <SelectTrigger id="supplier" className="mt-1">
                <SelectValue placeholder="Selectionner un fournisseur" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map(supplier => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.legal_name ?? supplier.trade_name ?? 'Sans nom'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {supplierId && (
              <div className="mt-2">
                <Link
                  href={`/contacts-organisations/${supplierId}`}
                  target="_blank"
                  className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  Voir fiche fournisseur
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Ce fournisseur sera automatiquement assigne a tous les produits du
              groupe
            </p>
          </div>
        )}
      </div>

      {/* Poids commun */}
      <div className="space-y-3">
        <label
          htmlFor="has-common-weight"
          className="flex items-center gap-2 min-h-[44px] md:min-h-0 cursor-pointer"
        >
          <Checkbox
            id="has-common-weight"
            checked={hasCommonWeight}
            checkboxSize="lg"
            onCheckedChange={checked => {
              onUpdate({ has_common_weight: checked as boolean });
              if (!checked) onUpdate({ common_weight: '' });
            }}
          />
          <span className="text-sm font-medium">
            Meme poids pour tous les produits
          </span>
        </label>

        {hasCommonWeight && (
          <div>
            <Label htmlFor="common_weight">Poids commun (kg)</Label>
            <Input
              id="common_weight"
              type="number"
              value={commonWeight}
              onChange={e =>
                onUpdate({
                  common_weight: e.target.value ? Number(e.target.value) : '',
                })
              }
              placeholder="Ex: 12.5"
              min="0"
              step="0.1"
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Poids partage par tous les produits du groupe
            </p>
          </div>
        )}
      </div>

      {/* Prix d'achat commun (Q1) */}
      <div className="space-y-3">
        <label
          htmlFor="has-common-cost-price"
          className="flex items-center gap-2 min-h-[44px] md:min-h-0 cursor-pointer"
        >
          <Checkbox
            id="has-common-cost-price"
            checked={hasCommonCostPrice}
            checkboxSize="lg"
            onCheckedChange={checked => {
              onUpdate({ has_common_cost_price: checked as boolean });
              if (!checked) {
                onUpdate({ common_cost_price: '' });
                onUpdate({ common_eco_tax: '' });
              }
            }}
          />
          <span className="text-sm font-medium">
            Meme prix d&apos;achat pour tous les produits
          </span>
        </label>

        {hasCommonCostPrice && (
          <div className="space-y-3">
            <div>
              <Label htmlFor="common_cost_price">Prix d&apos;achat HT</Label>
              <Input
                id="common_cost_price"
                type="number"
                value={commonCostPrice}
                onChange={e =>
                  onUpdate({
                    common_cost_price: e.target.value
                      ? Number(e.target.value)
                      : '',
                  })
                }
                placeholder="Ex: 45.00"
                min="0"
                step="0.01"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Prix d&apos;achat indicatif partage par tous les produits du
                groupe
              </p>
            </div>

            <div>
              <Label htmlFor="common_eco_tax">
                Eco-taxe par defaut (optionnel)
              </Label>
              <Input
                id="common_eco_tax"
                type="number"
                value={commonEcoTax}
                onChange={e =>
                  onUpdate({
                    common_eco_tax: e.target.value
                      ? Number(e.target.value)
                      : '',
                  })
                }
                placeholder="Ex: 0.50"
                min="0"
                step="0.01"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Taxe eco-responsable commune (liee au prix d&apos;achat)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Matière commune (typique quand variant_type='color') */}
      <div className="space-y-3">
        <label
          htmlFor="has-common-material"
          className="flex items-center gap-2 min-h-[44px] md:min-h-0 cursor-pointer"
        >
          <Checkbox
            id="has-common-material"
            checked={hasCommonMaterial}
            checkboxSize="lg"
            onCheckedChange={checked => {
              onUpdate({ has_common_material: checked as boolean });
              if (!checked) onUpdate({ common_material: '' });
            }}
          />
          <span className="text-sm font-medium">
            Meme matiere pour tous les produits
          </span>
        </label>

        {hasCommonMaterial && (
          <div>
            <Label htmlFor="common_material">
              Matiere commune <span className="text-red-500">*</span>
            </Label>
            <Select
              value={commonMaterial}
              onValueChange={value => onUpdate({ common_material: value })}
            >
              <SelectTrigger id="common_material" className="mt-1">
                <SelectValue placeholder="Selectionner une matiere" />
              </SelectTrigger>
              <SelectContent>
                {MATERIAL_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              Matiere partagee par tous les produits du groupe (utile quand le
              type de variante est la couleur)
            </p>
          </div>
        )}
      </div>

      {/* Couleur commune (typique quand variant_type='material') */}
      <div className="space-y-3">
        <label
          htmlFor="has-common-color"
          className="flex items-center gap-2 min-h-[44px] md:min-h-0 cursor-pointer"
        >
          <Checkbox
            id="has-common-color"
            checked={hasCommonColor}
            checkboxSize="lg"
            onCheckedChange={checked => {
              onUpdate({ has_common_color: checked as boolean });
              if (!checked) onUpdate({ common_color: '' });
            }}
          />
          <span className="text-sm font-medium">
            Meme couleur pour tous les produits
          </span>
        </label>

        {hasCommonColor && (
          <div>
            <Label htmlFor="common_color">
              Couleur commune <span className="text-red-500">*</span>
            </Label>
            <Select
              value={commonColor}
              onValueChange={value => onUpdate({ common_color: value })}
            >
              <SelectTrigger id="common_color" className="mt-1">
                <SelectValue placeholder="Selectionner une couleur" />
              </SelectTrigger>
              <SelectContent>
                {colors.map(c => (
                  <SelectItem key={c.name} value={c.name}>
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="inline-block w-3 h-3 rounded-full border border-gray-300"
                        style={{
                          backgroundColor: c.hex_code ?? '#E5E7EB',
                        }}
                      />
                      {c.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              Couleur partagee par toutes les variantes du groupe (utile quand
              le type de variante est la matiere)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
