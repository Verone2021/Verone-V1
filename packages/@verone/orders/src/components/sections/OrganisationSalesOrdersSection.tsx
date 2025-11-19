'use client';

/**
 * Section affichage commandes ventes (sales orders) pour une organisation
 * Utilisé dans page détail client - onglet Commandes
 */

import { useEffect, useState } from 'react';

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
import { formatCurrency, formatDate } from '@verone/utils';
import { ShoppingCart, Plus, Eye, Package, Calendar, Euro } from 'lucide-react';

import { useSalesOrders, type SalesOrder } from '@verone/orders/hooks';

interface OrganisationSalesOrdersSectionProps {
  organisationId: string;
  organisationName: string;
  onUpdate?: () => void;
  className?: string;
}

// Mapping statuts avec couleurs - Sales Orders
const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: 'Brouillon', color: 'bg-gray-100 text-gray-800' },
  confirmed: { label: 'Confirmée', color: 'bg-blue-100 text-blue-800' },
  partially_shipped: {
    label: 'Partiellement expédiée',
    color: 'bg-purple-100 text-purple-800',
  },
  shipped: { label: 'Expédiée', color: 'bg-yellow-100 text-yellow-800' },
  delivered: { label: 'Livrée', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Annulée', color: 'bg-red-100 text-red-800' },
  closed: { label: 'Clôturée', color: 'bg-gray-100 text-gray-800' },
};

export function OrganisationSalesOrdersSection({
  organisationId,
  organisationName,
  onUpdate,
  className,
}: OrganisationSalesOrdersSectionProps) {
  const { orders, loading, fetchOrders } = useSalesOrders();
  const [customerOrders, setCustomerOrders] = useState<SalesOrder[]>([]);

  // Charger les commandes du client
  useEffect(() => {
    fetchOrders({ customer_id: organisationId });
  }, [organisationId]);

  // Filtrer les commandes pour ce client
  useEffect(() => {
    const filtered = orders.filter(
      order => order.customer_id === organisationId
    );
    setCustomerOrders(filtered);
  }, [orders, organisationId]);

  // Calculer statistiques
  const stats = {
    total: customerOrders.length,
    draft: customerOrders.filter(o => o.status === 'draft').length,
    confirmed: customerOrders.filter(o => o.status === 'confirmed').length,
    shipped: customerOrders.filter(o => o.status === 'shipped').length,
    delivered: customerOrders.filter(o => o.status === 'delivered').length,
    totalValue: customerOrders.reduce((sum, o) => sum + o.total_ttc, 0),
  };

  if (loading && customerOrders.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-gray-500">
          Chargement des commandes...
        </div>
      </div>
    );
  }

  if (customerOrders.length === 0) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="text-center">
            <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-black mb-2">
              Aucune commande
            </h3>
            <p className="text-gray-600 mb-6">
              Aucune commande de vente trouvée pour {organisationName}.
            </p>
            <ButtonV2 asChild>
              <Link
                href={`/commandes/clients/create?customer_id=${organisationId}`}
              >
                <Plus className="h-4 w-4 mr-2" />
                Créer une commande
              </Link>
            </ButtonV2>
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
                <ShoppingCart className="h-5 w-5" />
                Commandes de vente
              </CardTitle>
              <CardDescription>
                {stats.total} commande(s) • {formatCurrency(stats.totalValue)}{' '}
                TTC
              </CardDescription>
            </div>
            <ButtonV2 asChild>
              <Link
                href={`/commandes/clients/create?customer_id=${organisationId}`}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle commande
              </Link>
            </ButtonV2>
          </div>
        </CardHeader>
        <CardContent>
          {/* Stats rapides */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-black">{stats.draft}</div>
              <div className="text-xs text-gray-600">Brouillons</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {stats.confirmed}
              </div>
              <div className="text-xs text-gray-600">Confirmées</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {stats.shipped}
              </div>
              <div className="text-xs text-gray-600">Expédiées</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {stats.delivered}
              </div>
              <div className="text-xs text-gray-600">Livrées</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des commandes */}
      <div className="grid gap-4">
        {customerOrders.map(order => (
          <Card key={order.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Numéro commande + Statut */}
                  <div className="flex items-center gap-3 mb-3">
                    <h4 className="text-lg font-semibold text-black">
                      {order.order_number}
                    </h4>
                    <Badge className={STATUS_CONFIG[order.status]?.color}>
                      {STATUS_CONFIG[order.status]?.label}
                    </Badge>
                  </div>

                  {/* Détails */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Euro className="h-4 w-4 text-gray-400" />
                      <div>
                        <div className="text-gray-600">Montant</div>
                        <div className="font-medium text-black">
                          {formatCurrency(order.total_ttc)} TTC
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-gray-400" />
                      <div>
                        <div className="text-gray-600">Articles</div>
                        <div className="font-medium text-black">
                          {order.sales_order_items?.length || 0} produit(s)
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <div>
                        <div className="text-gray-600">Créée le</div>
                        <div className="font-medium text-black">
                          {formatDate(order.created_at)}
                        </div>
                      </div>
                    </div>

                    {order.expected_delivery_date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="text-gray-600">Livraison prévue</div>
                          <div className="font-medium text-black">
                            {formatDate(order.expected_delivery_date)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <ButtonV2 variant="outline" size="sm" asChild>
                  <Link href={`/commandes/clients/${order.id}`}>
                    <Eye className="h-4 w-4 mr-2" />
                    Détails
                  </Link>
                </ButtonV2>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
