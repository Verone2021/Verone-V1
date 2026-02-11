'use client';

/**
 * Section affichage échantillons envoyés à un client
 * Utilisé dans page détail client - onglet Échantillons
 * Note: uniquement pour clients professionnels
 */

import { useEffect, useState, useCallback } from 'react';

import Link from 'next/link';

import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@verone/ui';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@verone/ui';
import { formatCurrency, formatDate } from '@verone/utils';
import { createClient } from '@verone/utils/supabase/client';
import {
  FlaskConical,
  Eye,
  Package,
  Calendar,
  Euro,
  ShoppingCart,
} from 'lucide-react';

interface SampleItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_price_ht: number;
  total_ht: number;
  product: {
    id: string;
    name: string;
    sku: string | null;
  } | null;
  sales_order: {
    id: string;
    order_number: string;
    status: string;
    created_at: string;
  } | null;
}

interface CustomerSamplesSectionProps {
  customerId: string;
  customerName: string;
  className?: string;
}

// Mapping statuts avec couleurs
const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: 'Brouillon', color: 'bg-gray-100 text-gray-800' },
  validated: { label: 'Validée', color: 'bg-blue-100 text-blue-800' },
  partially_shipped: {
    label: 'Partiellement expédiée',
    color: 'bg-purple-100 text-purple-800',
  },
  shipped: { label: 'Expédiée', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Annulée', color: 'bg-red-100 text-red-800' },
};

export function CustomerSamplesSection({
  customerId,
  customerName,
  className,
}: CustomerSamplesSectionProps) {
  const [samples, setSamples] = useState<SampleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les échantillons du client
  const fetchSamples = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Requête pour récupérer les items échantillons des commandes de ce client
      // On utilise une jointure interne avec sales_orders et on filtre par customer_id
      const { data, error: queryError } = await supabase
        .from('sales_order_items')
        .select(
          `
          id,
          product_id,
          quantity,
          unit_price_ht,
          total_ht,
          sales_order_id,
          product:products (
            id,
            name,
            sku
          ),
          sales_order:sales_orders!inner (
            id,
            order_number,
            status,
            created_at,
            customer_id
          )
        `
        )
        .eq('is_sample', true)
        .eq('sales_order.customer_id', customerId)
        .order('created_at', {
          ascending: false,
          referencedTable: 'sales_order',
        });

      if (queryError) {
        console.error('Erreur récupération échantillons:', queryError);
        setError('Erreur lors du chargement des échantillons');
        return;
      }

      // Mapper les données avec les bons types
      const mappedSamples: SampleItem[] = (data || []).map((item: any) => ({
        id: item.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price_ht: item.unit_price_ht,
        total_ht: item.total_ht,
        product: item.product,
        sales_order: item.sales_order,
      }));

      setSamples(mappedSamples);
    } catch (err) {
      console.error('Erreur fetchSamples:', err);
      setError('Erreur lors du chargement des échantillons');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchSamples();
  }, [fetchSamples]);

  // Calculer statistiques
  const stats = {
    totalItems: samples.length,
    totalProducts: new Set(samples.map(s => s.product_id)).size,
    totalQuantity: samples.reduce((sum, s) => sum + s.quantity, 0),
    totalValue: samples.reduce((sum, s) => sum + s.total_ht, 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-gray-500">
          Chargement des échantillons...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="text-center">
            <FlaskConical className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-black mb-2">Erreur</h3>
            <p className="text-gray-600">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (samples.length === 0) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="text-center">
            <FlaskConical className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-black mb-2">
              Aucun échantillon
            </h3>
            <p className="text-gray-600 mb-6">
              Aucun échantillon n'a été envoyé à {customerName}.
            </p>
            <p className="text-sm text-gray-500">
              Les échantillons sont marqués lors de la création d'une commande
              client en cochant la case "Échantillon" sur les lignes de produit.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FlaskConical className="h-5 w-5" />
                Échantillons envoyés
              </CardTitle>
              <CardDescription>
                {stats.totalItems} ligne(s) échantillon • {stats.totalProducts}{' '}
                produit(s) différent(s) • {formatCurrency(stats.totalValue)} HT
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Stats rapides */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {stats.totalItems}
              </div>
              <div className="text-xs text-gray-600">Lignes échantillon</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {stats.totalProducts}
              </div>
              <div className="text-xs text-gray-600">Produits différents</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {stats.totalQuantity}
              </div>
              <div className="text-xs text-gray-600">Quantité totale</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {formatCurrency(stats.totalValue)}
              </div>
              <div className="text-xs text-gray-600">Valeur HT</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des échantillons */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Historique des échantillons
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produit</TableHead>
                <TableHead className="text-center">Qté</TableHead>
                <TableHead className="text-right">Prix unit. HT</TableHead>
                <TableHead className="text-right">Total HT</TableHead>
                <TableHead>Commande</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {samples.map(sample => (
                <TableRow key={sample.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium text-black">
                        {sample.product?.name || 'Produit inconnu'}
                      </div>
                      {sample.product?.sku && (
                        <div className="text-xs text-gray-500">
                          SKU: {sample.product.sku}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {sample.quantity}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(sample.unit_price_ht)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(sample.total_ht)}
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm">
                      {sample.sales_order?.order_number || '-'}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {sample.sales_order?.created_at
                      ? formatDate(sample.sales_order.created_at)
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {sample.sales_order?.status && (
                      <Badge
                        className={
                          STATUS_CONFIG[sample.sales_order.status]?.color ||
                          'bg-gray-100 text-gray-800'
                        }
                      >
                        {STATUS_CONFIG[sample.sales_order.status]?.label ||
                          sample.sales_order.status}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {sample.sales_order?.id && (
                      <ButtonV2 variant="ghost" size="sm" asChild>
                        <Link
                          href={`/commandes/clients/${sample.sales_order.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      </ButtonV2>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
