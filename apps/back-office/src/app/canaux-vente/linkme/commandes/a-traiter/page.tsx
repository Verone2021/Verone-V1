'use client';

/**
 * Page: Commandes Enseigne À Traiter
 *
 * Liste les commandes LinkMe avec:
 * - status = 'draft'
 * - sales_order_linkme_details présent (workflow Enseigne B2B)
 *
 * Actions rapides: voir détail, approuver, demander compléments, refuser
 */

import { useState, useEffect } from 'react';

import Link from 'next/link';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Skeleton,
} from '@verone/ui';
import { formatCurrency } from '@verone/utils';
import { createClient } from '@verone/utils/supabase/client';
import {
  Eye,
  AlertCircle,
  Building2,
  User,
  Calendar,
  RefreshCw,
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface IOrderToProcess {
  id: string;
  order_number: string;
  created_at: string;
  total_ttc: number;
  customer_id: string;
  // Source de la commande
  source: 'enseigne' | 'affiliate';
  // Details LinkMe (optionnels - uniquement pour commandes Enseigne)
  requester_name?: string;
  requester_email?: string;
  requester_type?: string;
  is_new_restaurant?: boolean;
  owner_email?: string | null;
  owner_contact_same_as_requester?: boolean | null;
  desired_delivery_date?: string | null;
  // Organisation
  organisation_name: string | null;
  // Affiliate (optionnel - uniquement pour commandes affiliés)
  affiliate_name?: string | null;
}

// ============================================
// PAGE COMPONENT
// ============================================

export default function LinkMeOrdersToProcessPage(): JSX.Element {
  const [orders, setOrders] = useState<IOrderToProcess[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    setIsLoading(true);
    setError(null);

    const supabase = createClient();

    try {
      // Récupérer TOUTES les commandes en attente d'approbation
      // (Enseigne via sales_order_linkme_details OU Affiliés via created_by_affiliate_id)
      const { data, error: fetchError } = await supabase
        .from('sales_orders')
        .select(
          `
          id,
          order_number,
          created_at,
          total_ttc,
          customer_id,
          created_by_affiliate_id,
          sales_order_linkme_details (
            requester_name,
            requester_email,
            requester_type,
            is_new_restaurant,
            owner_email,
            owner_contact_same_as_requester,
            desired_delivery_date
          )
        `
        )
        .eq('pending_admin_validation', true)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      // Mapper les données (Enseigne + Affiliés)
      const mapped: IOrderToProcess[] = (data ?? []).map((order: any) => {
        const details = order.sales_order_linkme_details?.[0];
        const affiliate = order.linkme_affiliates;
        const isEnseigne = !!details;

        return {
          id: order.id,
          order_number: order.order_number,
          created_at: order.created_at,
          total_ttc: order.total_ttc,
          customer_id: order.customer_id,
          source: isEnseigne ? 'enseigne' : 'affiliate',
          // Champs Enseigne (optionnels)
          requester_name: details?.requester_name,
          requester_email: details?.requester_email,
          requester_type: details?.requester_type,
          is_new_restaurant: details?.is_new_restaurant,
          owner_email: details?.owner_email,
          owner_contact_same_as_requester:
            details?.owner_contact_same_as_requester,
          desired_delivery_date: details?.desired_delivery_date,
          // Organisation (non récupérée pour simplifier)
          organisation_name: null,
          // Affiliate
          affiliate_name: affiliate?.name ?? null,
        };
      });

      setOrders(mapped);
    } catch (err) {
      console.error('Erreur fetch commandes:', err);
      setError(
        err instanceof Error ? err.message : 'Erreur lors du chargement'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Helper: badge type demandeur (Enseigne uniquement)
  const getRequesterTypeBadge = (type?: string): JSX.Element | null => {
    if (!type) return null;
    const labels: Record<string, string> = {
      responsable_enseigne: 'Responsable Enseigne',
      architecte: 'Architecte',
      franchisee: 'Franchisé',
    };
    return (
      <Badge variant="outline" className="text-xs">
        {labels[type] ?? type}
      </Badge>
    );
  };

  // Helper: badge source (Enseigne vs Affilié)
  const getSourceBadge = (order: IOrderToProcess): JSX.Element => {
    if (order.source === 'affiliate') {
      return (
        <Badge className="bg-teal-100 text-teal-800 text-xs">Affilié</Badge>
      );
    }
    return (
      <Badge className="bg-blue-100 text-blue-800 text-xs">Enseigne</Badge>
    );
  };

  // Helper: badge Étape 2 (Enseigne uniquement)
  const getStep2Badge = (order: IOrderToProcess): JSX.Element | null => {
    if (order.source !== 'enseigne') return null;
    const hasOwnerEmail =
      !!order.owner_contact_same_as_requester || !!order.owner_email;
    if (hasOwnerEmail) {
      return (
        <Badge className="bg-green-100 text-green-800 text-xs">
          Étape 2 OK
        </Badge>
      );
    }
    return (
      <Badge variant="destructive" className="text-xs">
        Étape 2 manquante
      </Badge>
    );
  };

  return (
    <div className="space-y-6 p-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Commandes à Traiter
          </h1>
          <p className="text-gray-600 mt-1">
            Commandes LinkMe en attente de validation (Enseigne + Affiliés)
          </p>
        </div>
        <Button
          variant="outline"
          onClick={fetchOrders}
          disabled={isLoading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total à traiter</CardDescription>
            <CardTitle className="text-2xl">{orders.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Commandes Enseigne</CardDescription>
            <CardTitle className="text-2xl text-blue-600">
              {orders.filter(o => o.source === 'enseigne').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Commandes Affiliés</CardDescription>
            <CardTitle className="text-2xl text-teal-600">
              {orders.filter(o => o.source === 'affiliate').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Nouveaux restaurants</CardDescription>
            <CardTitle className="text-2xl">
              {orders.filter(o => o.is_new_restaurant).length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Table des commandes */}
      <Card>
        <CardHeader>
          <CardTitle>Commandes en attente</CardTitle>
          <CardDescription>
            Cliquez sur une commande pour voir les détails et effectuer les
            actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg mb-4">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune commande en attente de validation</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Commande</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Demandeur / Affilié</TableHead>
                  <TableHead>Organisation</TableHead>
                  <TableHead>Montant TTC</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map(order => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      {order.order_number}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Calendar className="h-3 w-3" />
                        {new Date(order.created_at).toLocaleDateString('fr-FR')}
                      </div>
                    </TableCell>
                    <TableCell>{getSourceBadge(order)}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {order.source === 'enseigne' ? (
                          <>
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3 text-gray-400" />
                              <span className="text-sm">
                                {order.requester_name}
                              </span>
                            </div>
                            {getRequesterTypeBadge(order.requester_type)}
                          </>
                        ) : (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3 text-teal-500" />
                            <span className="text-sm font-medium text-teal-700">
                              {order.affiliate_name ?? 'Affilié inconnu'}
                            </span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {order.organisation_name ? (
                          <span className="text-sm">
                            {order.organisation_name}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">
                            Non défini
                          </span>
                        )}
                        {order.is_new_restaurant && (
                          <Badge
                            variant="outline"
                            className="text-xs text-blue-600 border-blue-300"
                          >
                            Nouveau
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(order.total_ttc)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/canaux-vente/linkme/commandes/${order.id}`}>
                        <Button variant="outline" size="sm" className="gap-1">
                          <Eye className="h-4 w-4" />
                          Détail
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
