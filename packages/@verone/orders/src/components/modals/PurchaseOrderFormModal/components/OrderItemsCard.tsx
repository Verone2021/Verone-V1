'use client';

import type { OrderItem } from '@verone/orders/hooks';
import { ButtonV2 } from '@verone/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@verone/ui';
import { Plus } from 'lucide-react';

import type { LocalOrderItem } from '../types';
import { EditableOrderItemRow } from '../../editable-order-item-row';

interface OrderItemsCardProps {
  isEditMode: boolean;
  isBlocked: boolean;
  selectedSupplierId: string;
  displayItems: Array<OrderItem | LocalOrderItem>;
  itemsLoading: boolean;
  onAddProducts: () => void;
  onUpdateItem: (itemId: string, data: Partial<OrderItem>) => void;
  onRemoveItem: (itemId: string) => void;
}

export function OrderItemsCard({
  isEditMode,
  isBlocked,
  selectedSupplierId,
  displayItems,
  itemsLoading,
  onAddProducts,
  onUpdateItem,
  onRemoveItem,
}: OrderItemsCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Articles</CardTitle>
            <CardDescription>
              {displayItems.length} article(s){' '}
              {isEditMode ? 'dans la commande' : 'à ajouter'}
            </CardDescription>
          </div>
          {!isBlocked && (
            <ButtonV2
              type="button"
              variant="outline"
              onClick={onAddProducts}
              disabled={!selectedSupplierId}
              title={
                !selectedSupplierId
                  ? "Veuillez sélectionner un fournisseur d'abord"
                  : undefined
              }
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter des produits
            </ButtonV2>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isEditMode && itemsLoading ? (
          <div className="text-center py-8 text-gray-500">
            Chargement des articles...
          </div>
        ) : displayItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Aucun article. Cliquez sur "Ajouter des produits" pour commencer.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead>Quantité</TableHead>
                  <TableHead>Prix unitaire HT</TableHead>
                  <TableHead>Remise (%)</TableHead>
                  <TableHead>Éco-taxe (€)</TableHead>
                  <TableHead>Total HT</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayItems.map((item: OrderItem | LocalOrderItem) => (
                  <EditableOrderItemRow
                    key={item.id}
                    item={item as OrderItem}
                    orderType="purchase"
                    onUpdate={(id, data) => {
                      void onUpdateItem(id, data);
                    }}
                    onDelete={id => {
                      void onRemoveItem(id);
                    }}
                    readonly={isBlocked}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
