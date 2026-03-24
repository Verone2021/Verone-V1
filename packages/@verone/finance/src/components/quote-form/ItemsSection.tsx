'use client';

import { ButtonV2 } from '@verone/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import { formatCurrency } from '@verone/utils';
import { Plus, X, Trash2 } from 'lucide-react';

import type { QuoteItemLocal } from './types';

// =====================================================================
// PROPS
// =====================================================================

export interface ItemsSectionProps {
  items: QuoteItemLocal[];
  isServiceMode: boolean;
  isLinkMeMode: boolean;
  onAddServiceLine: () => void;
  onAddProduct: () => void;
  onRemoveItem: (itemId: string) => void;
  onItemChange: (
    itemId: string,
    field: keyof QuoteItemLocal,
    value: string | number
  ) => void;
}

// =====================================================================
// COMPONENT
// =====================================================================

export function ItemsSection({
  items,
  isServiceMode,
  isLinkMeMode,
  onAddServiceLine,
  onAddProduct,
  onRemoveItem,
  onItemChange,
}: ItemsSectionProps): React.ReactNode {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            {isServiceMode
              ? 'Prestations'
              : isLinkMeMode
                ? 'Produits du devis'
                : 'Produits'}
          </CardTitle>
          {isServiceMode ? (
            <ButtonV2
              type="button"
              variant="outline"
              size="sm"
              onClick={onAddServiceLine}
            >
              <Plus className="h-4 w-4 mr-1" />
              Ajouter une ligne
            </ButtonV2>
          ) : !isLinkMeMode ? (
            <ButtonV2
              type="button"
              variant="outline"
              size="sm"
              onClick={onAddProduct}
            >
              <Plus className="h-4 w-4 mr-1" />
              Ajouter un produit
            </ButtonV2>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">
              {isServiceMode
                ? 'Aucune prestation ajoutée'
                : isLinkMeMode
                  ? 'Cliquez sur + pour ajouter des produits depuis la sélection'
                  : 'Aucun produit ajouté'}
            </p>
          </div>
        ) : isServiceMode ? (
          /* Service items - editable rows */
          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={item.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">
                    Ligne {index + 1}
                  </span>
                  {items.length > 1 && (
                    <ButtonV2
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveItem(item.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </ButtonV2>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <Label className="text-xs">Description</Label>
                    <Input
                      placeholder="Description de la prestation"
                      value={item.description}
                      onChange={e =>
                        onItemChange(item.id, 'description', e.target.value)
                      }
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <Label className="text-xs">Quantité</Label>
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={e =>
                          onItemChange(
                            item.id,
                            'quantity',
                            Number(e.target.value)
                          )
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Prix unitaire HT</Label>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={item.unit_price_ht}
                        onChange={e =>
                          onItemChange(
                            item.id,
                            'unit_price_ht',
                            Number(e.target.value)
                          )
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-xs">TVA %</Label>
                      <Select
                        value={String(item.tva_rate)}
                        onValueChange={v =>
                          onItemChange(item.id, 'tva_rate', Number(v))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0%</SelectItem>
                          <SelectItem value="5.5">5,5%</SelectItem>
                          <SelectItem value="10">10%</SelectItem>
                          <SelectItem value="20">20%</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Total HT</Label>
                      <div className="h-10 flex items-center text-sm font-medium">
                        {formatCurrency(item.quantity * item.unit_price_ht)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Product items - table */
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produit</TableHead>
                <TableHead className="w-20 text-right">Qté</TableHead>
                <TableHead className="w-28 text-right">Prix HT</TableHead>
                <TableHead className="w-20 text-right">Remise %</TableHead>
                <TableHead className="w-20 text-right">TVA %</TableHead>
                <TableHead className="w-28 text-right">Total HT</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(item => {
                const discountMultiplier =
                  1 - (item.discount_percentage ?? 0) / 100;
                const lineHt =
                  item.quantity * item.unit_price_ht * discountMultiplier +
                  (item.eco_tax ?? 0) * item.quantity;
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="text-sm font-medium">
                        {item.product?.name ?? item.description}
                      </div>
                      {item.product?.sku && (
                        <div className="text-xs text-gray-500">
                          SKU: {item.product.sku}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        min={1}
                        className="w-20 text-right"
                        value={item.quantity}
                        onChange={e =>
                          onItemChange(
                            item.id,
                            'quantity',
                            Number(e.target.value)
                          )
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        className="w-28 text-right"
                        value={item.unit_price_ht}
                        onChange={e =>
                          onItemChange(
                            item.id,
                            'unit_price_ht',
                            Number(e.target.value)
                          )
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        className="w-20 text-right"
                        value={item.discount_percentage}
                        onChange={e =>
                          onItemChange(
                            item.id,
                            'discount_percentage',
                            Number(e.target.value)
                          )
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Select
                        value={String(item.tva_rate)}
                        onValueChange={v =>
                          onItemChange(item.id, 'tva_rate', Number(v))
                        }
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0%</SelectItem>
                          <SelectItem value="5.5">5,5%</SelectItem>
                          <SelectItem value="10">10%</SelectItem>
                          <SelectItem value="20">20%</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(lineHt)}
                    </TableCell>
                    <TableCell>
                      <ButtonV2
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveItem(item.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </ButtonV2>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
