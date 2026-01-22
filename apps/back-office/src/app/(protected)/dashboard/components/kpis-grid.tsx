/**
 * KPIsGrid Component
 * 9 key metrics using KPICardUnified (variant="elegant")
 *
 * Grid layout: 3 cols desktop → 2 cols tablet → 1 col mobile
 */

'use client';

import { useRouter } from 'next/navigation';
import { KPICardUnified } from '@verone/ui/components/ui/kpi-card-unified';
import {
  AlertTriangle,
  ShoppingCart,
  Link2,
  Package,
  MessageCircle,
  Users,
  Building2,
  DollarSign,
  PackageX,
} from 'lucide-react';
import type { DashboardMetrics } from '../actions/get-dashboard-metrics';

interface KPIsGridProps {
  data: DashboardMetrics['kpis'];
}

export function KPIsGrid({ data }: KPIsGridProps) {
  const router = useRouter();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* 1. Alertes Stock Critiques */}
      <KPICardUnified
        variant="elegant"
        title="Alertes Stock Critiques"
        value={data.alertsStock}
        icon={AlertTriangle}
        color="danger"
        description={
          data.alertsStock > 0
            ? `${data.alertsStock} alerte${data.alertsStock > 1 ? 's' : ''} urgente${data.alertsStock > 1 ? 's' : ''}`
            : 'Aucune alerte'
        }
        onClick={() => router.push('/stocks/alertes')}
      />

      {/* 2. Commandes à Traiter */}
      <KPICardUnified
        variant="elegant"
        title="Commandes à Traiter"
        value={data.ordersPending}
        icon={ShoppingCart}
        color="warning"
        description={
          data.ordersPending > 0
            ? `${data.ordersPending} commande${data.ordersPending > 1 ? 's' : ''} pending`
            : 'Toutes traitées'
        }
        onClick={() => router.push('/commandes/clients')}
      />

      {/* 3. Commandes LinkMe Pending */}
      <KPICardUnified
        variant="elegant"
        title="Commandes LinkMe"
        value={data.ordersLinkme}
        icon={Link2}
        color="accent"
        description={
          data.ordersLinkme > 0
            ? `${data.ordersLinkme} commande${data.ordersLinkme > 1 ? 's' : ''} affilié${data.ordersLinkme > 1 ? 's' : ''}`
            : 'Aucune commande'
        }
        onClick={() => router.push('/canaux-vente/linkme/commandes/a-traiter')}
      />

      {/* 4. Produits Catalogue */}
      <KPICardUnified
        variant="elegant"
        title="Produits Catalogue"
        value={data.products.total}
        icon={Package}
        color="primary"
        description={
          data.products.new_month > 0
            ? `+${data.products.new_month} ce mois`
            : 'Catalogue stable'
        }
        onClick={() => router.push('/produits/catalogue')}
      />

      {/* 5. Consultations Actives */}
      <KPICardUnified
        variant="elegant"
        title="Consultations Actives"
        value={data.consultations}
        icon={MessageCircle}
        color="warning"
        description={
          data.consultations > 0
            ? `${data.consultations} RFQ en cours`
            : 'Aucune consultation'
        }
        onClick={() => router.push('/consultations')}
      />

      {/* 6. Clients Actifs */}
      <KPICardUnified
        variant="elegant"
        title="Clients Actifs"
        value={data.customers}
        icon={Users}
        color="success"
        description={`${data.customers} particulier${data.customers > 1 ? 's' : ''} actif${data.customers > 1 ? 's' : ''}`}
        onClick={() =>
          router.push('/contacts-organisations/clients-particuliers')
        }
      />

      {/* 7. Organisations */}
      <KPICardUnified
        variant="elegant"
        title="Organisations"
        value={data.organisations.total}
        icon={Building2}
        color="primary"
        description={
          data.organisations.new_month > 0
            ? `+${data.organisations.new_month} nouvelles (30j)`
            : 'Base stable'
        }
        onClick={() => router.push('/contacts-organisations')}
      />

      {/* 8. Commissions Pending */}
      <KPICardUnified
        variant="elegant"
        title="Commissions Pending"
        value={data.commissions}
        icon={DollarSign}
        color="warning"
        description={
          data.commissions > 0
            ? `${data.commissions} commission${data.commissions > 1 ? 's' : ''} à valider`
            : 'Toutes validées'
        }
        onClick={() => router.push('/canaux-vente/linkme/commissions')}
      />

      {/* 9. Produits Rupture Stock */}
      <KPICardUnified
        variant="elegant"
        title="Rupture de Stock"
        value={data.outOfStock}
        icon={PackageX}
        color="danger"
        description={
          data.outOfStock > 0
            ? `${data.outOfStock} produit${data.outOfStock > 1 ? 's' : ''} à réapprovisionner`
            : 'Stock OK'
        }
        onClick={() => router.push('/stocks/inventaire')}
      />
    </div>
  );
}
