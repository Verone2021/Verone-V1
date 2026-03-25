'use client';

import { ButtonV2 } from '@verone/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import { formatCurrency } from '@verone/utils';
import Image from 'next/image';
import { Trash2 } from 'lucide-react';

import { QuantityInput } from './QuantityInput';

interface LinkMeCartItem {
  id: string;
  product_id: string;
  product_name: string;
  sku: string;
  quantity: number;
  unit_price_ht: number;
  base_price_ht: number;
  retrocession_rate: number;
  commission_rate: number;
  linkme_selection_item_id: string;
  product_image_url?: string | null;
}

interface LinkMeCartTotals {
  totalHt: number;
  totalTtc: number;
  totalRetrocession: number;
  fraisLinkMe: number;
  redevanceAffilie: number;
  caNetVerone: number;
}

interface LinkMeCartTableProps {
  cart: LinkMeCartItem[];
  cartTotals: LinkMeCartTotals;
  loading: boolean;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
}

export function LinkMeCartTable({
  cart,
  cartTotals,
  loading,
  onUpdateQuantity,
  onRemoveItem,
}: LinkMeCartTableProps) {
  if (cart.length === 0) return null;

  return (
    <Card className="border-purple-200 bg-purple-50/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Panier ({cart.length} article
          {cart.length > 1 ? 's' : ''})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produit</TableHead>
              <TableHead className="w-36">Qté</TableHead>
              <TableHead className="w-32">Prix</TableHead>
              <TableHead className="w-32">Total</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {cart.map(item => (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {item.product_image_url && (
                      <Image
                        src={item.product_image_url}
                        alt={item.product_name}
                        width={32}
                        height={32}
                        className="w-8 h-8 object-cover rounded"
                      />
                    )}
                    <div>
                      <p className="font-medium text-sm">{item.product_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.sku}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <QuantityInput
                    value={item.quantity}
                    onChange={val => onUpdateQuantity(item.id, val)}
                    disabled={loading}
                  />
                </TableCell>
                <TableCell className="text-sm">
                  {formatCurrency(item.unit_price_ht)}
                </TableCell>
                <TableCell className="font-medium text-sm">
                  {formatCurrency(item.quantity * item.unit_price_ht)}
                </TableCell>
                <TableCell>
                  <ButtonV2
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveItem(item.id)}
                    disabled={loading}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </ButtonV2>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Totaux */}
        <div className="mt-4 pt-4 border-t border-purple-200 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Total HT :</span>
            <span className="font-semibold">
              {formatCurrency(cartTotals.totalHt)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Total TTC (TVA 20%) :</span>
            <span className="font-semibold">
              {formatCurrency(cartTotals.totalTtc)}
            </span>
          </div>
          {cartTotals.totalRetrocession > 0 && (
            <div className="flex justify-between text-sm text-purple-700">
              <span>Commission affili&eacute; :</span>
              <span className="font-semibold">
                {formatCurrency(cartTotals.totalRetrocession)}
              </span>
            </div>
          )}
          {cartTotals.redevanceAffilie > 0 && (
            <div className="flex justify-between text-sm text-orange-600">
              <span>Redevance affili&eacute; :</span>
              <span className="font-semibold">
                {formatCurrency(cartTotals.redevanceAffilie)}
              </span>
            </div>
          )}
          {cartTotals.fraisLinkMe > 0 && (
            <div className="flex justify-between text-sm text-teal-700">
              <span>Frais LinkMe :</span>
              <span className="font-semibold">
                {formatCurrency(cartTotals.fraisLinkMe)}
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm text-green-700">
            <span>CA net Verone :</span>
            <span className="font-semibold">
              {formatCurrency(cartTotals.caNetVerone)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export type { LinkMeCartItem, LinkMeCartTotals };
