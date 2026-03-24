'use client';

import { TabsContent } from '@verone/ui';
import { Coins, Euro, Package } from 'lucide-react';

import { StatCard, OrderRow, formatCurrency } from './SharedComponents';
import type { useOrganisationDetail } from '../../../lib/hooks/use-organisation-detail';

// ============================================================================
// TYPES
// ============================================================================

type OrganisationDetailData = NonNullable<
  ReturnType<typeof useOrganisationDetail>['data']
>;

interface ActivityTabProps {
  data: OrganisationDetailData;
  canViewCommissions: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ActivityTab({ data, canViewCommissions }: ActivityTabProps) {
  return (
    <TabsContent value="activite" className="mt-4 space-y-4">
      {/* Stats */}
      <div
        className={`grid ${canViewCommissions ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}
      >
        <StatCard
          icon={Euro}
          label="CA HT"
          value={formatCurrency(data.stats.totalRevenueHT)}
          color="turquoise"
        />
        {canViewCommissions && (
          <StatCard
            icon={Coins}
            label="Commissions"
            value={formatCurrency(data.stats.totalCommissionsHT)}
            color="green"
          />
        )}
        <StatCard
          icon={Package}
          label="Commandes"
          value={data.stats.orderCount}
          color="purple"
        />
      </div>

      {/* Dernières commandes */}
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
          Dernières commandes
        </p>
        {data.recentOrders.length > 0 ? (
          <div className="bg-gray-50 rounded-lg p-2">
            {data.recentOrders.map(order => (
              <OrderRow key={order.id} order={order} />
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-400 bg-gray-50 rounded-lg">
            <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Aucune commande</p>
          </div>
        )}
      </div>
    </TabsContent>
  );
}
