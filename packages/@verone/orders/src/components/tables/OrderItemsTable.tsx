'use client';

import { useState, useEffect } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { Package, Loader2 } from 'lucide-react';

import { Badge } from '@verone/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import { createClient } from '@/lib/supabase/client';

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_image_url?: string | null;
  quantity: number;
  unit_price: number;
  sku?: string;
}

interface OrderItemsTableProps {
  orderId: string;
  orderType: 'sales' | 'purchase';
}

export function OrderItemsTable({ orderId, orderType }: OrderItemsTableProps) {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrderItems() {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();

        // Déterminer la table selon le type de commande
        const itemsTable =
          orderType === 'purchase'
            ? 'purchase_order_items'
            : 'sales_order_items';

        // Query avec jointure produit + image primaire
        const { data, error: fetchError } = await supabase
          .from(itemsTable)
          .select(
            `
            id,
            product_id,
            quantity,
            unit_price_ht,
            products:product_id (
              name,
              sku,
              product_images!inner(public_url, is_primary)
            )
          `
          )
          .eq(
            orderType === 'purchase' ? 'purchase_order_id' : 'sales_order_id',
            orderId
          )
          .eq('products.product_images.is_primary', true);

        if (fetchError) throw fetchError;

        // Transformer les données
        const transformedItems: OrderItem[] = (data || []).map(item => {
          const product = item.products as any;
          const primaryImage = product?.product_images?.[0];

          return {
            id: item.id,
            product_id: item.product_id,
            product_name: product?.name || 'Produit inconnu',
            product_image_url: primaryImage?.public_url || null,
            sku: product?.sku,
            quantity: item.quantity,
            unit_price: item.unit_price_ht,
          };
        });

        setItems(transformedItems);
      } catch (err) {
        console.error('Error fetching order items:', err);
        setError('Erreur lors du chargement des produits');
      } finally {
        setLoading(false);
      }
    }

    fetchOrderItems();
  }, [orderId, orderType]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">
          Chargement des produits...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <Package className="h-10 w-10 text-red-300 mx-auto mb-2" />
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="h-10 w-10 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500">
          Aucun produit dans cette commande
        </p>
      </div>
    );
  }

  // Calculer le total
  const total = items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0
  );

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Produit</TableHead>
            <TableHead className="text-right">Quantité</TableHead>
            <TableHead className="text-right">Prix unitaire</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map(item => (
            <TableRow key={item.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  {item.product_image_url ? (
                    <Image
                      src={item.product_image_url}
                      alt={item.product_name}
                      width={40}
                      height={40}
                      className="rounded-lg object-cover border border-gray-200 flex-shrink-0"
                    />
                  ) : (
                    <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Package className="h-5 w-5 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/produits/catalogue/${item.product_id}`}
                      className="text-sm font-medium text-black hover:text-blue-600 hover:underline transition-colors block truncate"
                    >
                      {item.product_name}
                    </Link>
                    {item.sku && (
                      <p className="text-xs text-gray-500">{item.sku}</p>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Badge variant="outline" className="text-xs">
                  {item.quantity}
                </Badge>
              </TableCell>
              <TableCell className="text-right text-sm">
                {new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'EUR',
                }).format(item.unit_price)}
              </TableCell>
              <TableCell className="text-right text-sm font-medium">
                {new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'EUR',
                }).format(item.quantity * item.unit_price)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Total de la commande */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <span className="text-sm font-medium text-gray-700">
          Total de la commande
        </span>
        <span className="text-lg font-bold text-black">
          {new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
          }).format(total)}
        </span>
      </div>
    </div>
  );
}
