'use client';

/**
 * PendingOrderCards
 *
 * Affiche les commandes en attente d'approbation sous forme de cartes riches.
 * Chaque carte montre les sections clés du formulaire (miroir des 8 étapes)
 * et est cliquable pour naviguer vers la page de détail.
 */

import { useRouter } from 'next/navigation';

import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@verone/ui';
import { formatCurrency } from '@verone/utils';
import {
  Building2,
  Calendar,
  CreditCard,
  Mail,
  MapPin,
  Package,
  Phone,
  Store,
  Truck,
  User,
} from 'lucide-react';

import {
  usePendingOrders,
  type PendingOrder,
} from '../hooks/use-linkme-order-actions';

function PendingOrderCard({ order }: { order: PendingOrder }) {
  const router = useRouter();
  const details = order.linkme_details;

  return (
    <Card
      className="cursor-pointer hover:shadow-md hover:border-blue-300 transition-all duration-200"
      onClick={() => router.push(`/canaux-vente/linkme/commandes/${order.id}`)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base">{order.order_number}</CardTitle>
            <Badge variant="destructive" className="text-xs">
              En attente
            </Badge>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold">
              {formatCurrency(order.total_ttc)} TTC
            </p>
            <p className="text-xs text-gray-500">
              {formatCurrency(order.total_ht)} HT
            </p>
          </div>
        </div>
        <p className="text-xs text-gray-500">
          {new Date(order.created_at).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Restaurant */}
          <div className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
            <Store className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] font-medium text-gray-500 uppercase">
                Restaurant
              </p>
              <p className="text-sm font-medium truncate">
                {order.organisation_name ?? 'Non renseigné'}
              </p>
              {order.enseigne_name && (
                <p className="text-xs text-gray-500 truncate">
                  {order.enseigne_name}
                </p>
              )}
              {details?.is_new_restaurant && (
                <Badge className="mt-1 text-[10px] bg-emerald-100 text-emerald-700">
                  Nouveau
                </Badge>
              )}
            </div>
          </div>

          {/* Responsable */}
          <div className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
            <User className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] font-medium text-gray-500 uppercase">
                Responsable
              </p>
              <p className="text-sm font-medium truncate">
                {details?.requester_name ?? order.requester_name ?? '-'}
              </p>
              {(details?.requester_email ?? order.requester_email) && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Mail className="h-3 w-3" />
                  <span className="truncate">
                    {details?.requester_email ?? order.requester_email}
                  </span>
                </div>
              )}
              {details?.requester_phone && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Phone className="h-3 w-3" />
                  <span>{details.requester_phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Produits */}
          <div className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
            <Package className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] font-medium text-gray-500 uppercase">
                Produits
              </p>
              <p className="text-sm font-medium">
                {order.items.length} article(s)
              </p>
              {order.items.slice(0, 2).map(item => (
                <p key={item.id} className="text-xs text-gray-500 truncate">
                  {item.products?.name ?? 'Produit'} ×{item.quantity}
                </p>
              ))}
              {order.items.length > 2 && (
                <p className="text-xs text-gray-400">
                  +{order.items.length - 2} autre(s)
                </p>
              )}
            </div>
          </div>

          {/* Facturation */}
          <div className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
            <CreditCard className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] font-medium text-gray-500 uppercase">
                Facturation
              </p>
              <p className="text-sm font-medium truncate">
                {details?.billing_name ?? '-'}
              </p>
              {details?.billing_email && (
                <p className="text-xs text-gray-500 truncate">
                  {details.billing_email}
                </p>
              )}
            </div>
          </div>

          {/* Livraison */}
          <div className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
            <Truck className="h-4 w-4 text-cyan-600 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] font-medium text-gray-500 uppercase">
                Livraison
              </p>
              {details?.desired_delivery_date ? (
                <div className="flex items-center gap-1 text-sm">
                  <Calendar className="h-3 w-3 text-gray-400" />
                  <span>
                    {new Date(details.desired_delivery_date).toLocaleDateString(
                      'fr-FR'
                    )}
                  </span>
                </div>
              ) : (
                <p className="text-sm text-gray-400">Date non renseignée</p>
              )}
              {details?.mall_form_required && (
                <div className="flex items-center gap-1 text-xs text-amber-600">
                  <Building2 className="h-3 w-3" />
                  <span>Centre commercial</span>
                </div>
              )}
            </div>
          </div>

          {/* Type demandeur */}
          <div className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
            <MapPin className="h-4 w-4 text-rose-600 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] font-medium text-gray-500 uppercase">
                Type
              </p>
              <Badge variant="outline" className="text-xs mt-0.5">
                {details?.requester_type === 'responsable_enseigne'
                  ? 'Resp. Enseigne'
                  : details?.requester_type === 'architecte'
                    ? 'Architecte'
                    : details?.requester_type === 'franchisee'
                      ? 'Franchisé'
                      : (order.requester_type ?? 'Non renseigné')}
              </Badge>
              {details?.owner_type && (
                <Badge variant="outline" className="text-xs mt-1 ml-1">
                  {details.owner_type === 'franchise' ? 'Franchise' : 'Propre'}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Footer : cliquer pour voir les détails */}
        <div className="mt-3 pt-2 border-t text-center">
          <span className="text-xs text-blue-600 font-medium">
            Cliquer pour voir les détails et approuver →
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export function PendingOrderCards() {
  const { data: orders, isLoading, error } = usePendingOrders();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-64" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm">
        Erreur lors du chargement des commandes en attente.
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
        <p className="text-lg font-medium">
          Aucune commande en attente d&apos;approbation
        </p>
        <p className="text-sm mt-1">
          Les nouvelles commandes des affiliés apparaîtront ici.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        {orders.length} commande(s) en attente d&apos;approbation
      </p>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {orders.map(order => (
          <PendingOrderCard key={order.id} order={order} />
        ))}
      </div>
    </div>
  );
}
