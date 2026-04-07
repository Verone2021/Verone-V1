'use client';

import {
  ButtonV2,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import { Plus } from 'lucide-react';

import type { QuoteItemLocal } from './types';
import { QuoteProductRow } from './QuoteProductRow';
import { QuoteServiceRow } from './QuoteServiceRow';

interface QuoteItemsCardProps {
  items: QuoteItemLocal[];
  isServiceMode: boolean;
  isLinkMeMode: boolean;
  onAddServiceLine: () => void;
  onOpenAddProduct: () => void;
  onRemoveItem: (id: string) => void;
  onItemChange: (
    id: string,
    field: keyof QuoteItemLocal,
    value: string | number
  ) => void;
}

export function QuoteItemsCard({
  items,
  isServiceMode,
  isLinkMeMode,
  onAddServiceLine,
  onOpenAddProduct,
  onRemoveItem,
  onItemChange,
}: QuoteItemsCardProps) {
  const title = isServiceMode
    ? 'Prestations'
    : isLinkMeMode
      ? 'Produits du devis'
      : 'Produits';

  const emptyMessage = isServiceMode
    ? 'Aucune prestation ajoutée'
    : isLinkMeMode
      ? 'Cliquez sur + pour ajouter des produits depuis la sélection'
      : 'Aucun produit ajouté';

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
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
              onClick={onOpenAddProduct}
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
            <p className="text-sm">{emptyMessage}</p>
          </div>
        ) : isServiceMode ? (
          <div className="space-y-4">
            {items.map((item, index) => (
              <QuoteServiceRow
                key={item.id}
                item={item}
                index={index}
                showDelete={items.length > 1}
                onRemove={onRemoveItem}
                onChange={onItemChange}
              />
            ))}
          </div>
        ) : (
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
              {items.map(item => (
                <QuoteProductRow
                  key={item.id}
                  item={item}
                  onRemove={onRemoveItem}
                  onChange={onItemChange}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
