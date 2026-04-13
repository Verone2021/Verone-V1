'use client';

import { Checkbox, Input, Label } from '@verone/ui';

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
    </>
  );
}
