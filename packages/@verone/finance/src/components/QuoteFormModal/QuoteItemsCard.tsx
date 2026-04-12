'use client';

import { ButtonV2, Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { Plus } from 'lucide-react';

import type { QuoteItemLocal } from './types';
import { QuoteServiceRow } from './QuoteServiceRow';

interface QuoteItemsCardProps {
  items: QuoteItemLocal[];
  onAddServiceLine: () => void;
  onRemoveItem: (id: string) => void;
  onItemChange: (
    id: string,
    field: keyof QuoteItemLocal,
    value: string | number
  ) => void;
}

export function QuoteItemsCard({
  items,
  onAddServiceLine,
  onRemoveItem,
  onItemChange,
}: QuoteItemsCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Prestations</CardTitle>
          <ButtonV2
            type="button"
            variant="outline"
            size="sm"
            onClick={onAddServiceLine}
          >
            <Plus className="h-4 w-4 mr-1" />
            Ajouter une ligne
          </ButtonV2>
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">Aucune prestation ajoutee</p>
          </div>
        ) : (
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
        )}
      </CardContent>
    </Card>
  );
}
