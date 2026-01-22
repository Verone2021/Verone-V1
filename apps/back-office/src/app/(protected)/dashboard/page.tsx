/**
 * Dashboard Page
 * Fixed simple dashboard with key metrics
 */

import { Building2, ShoppingCart, Users } from 'lucide-react';
import { DashboardHeader } from './components/dashboard-header';
import { SectionCard } from './components/section-card';
import { getDashboardData } from './actions/get-dashboard-data';

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="container mx-auto p-6">
      <DashboardHeader />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section Organisations */}
        <SectionCard
          title="Organisations"
          icon={<Building2 className="h-5 w-5" />}
          href="/organisations"
          kpis={[
            { label: 'Total', value: data.organisations.total },
            { label: 'Nouvelles (30j)', value: data.organisations.new_month },
            { label: 'Actives', value: data.organisations.active },
          ]}
        />

        {/* Section Commandes */}
        <SectionCard
          title="Commandes"
          icon={<ShoppingCart className="h-5 w-5" />}
          href="/commandes"
          kpis={[
            { label: 'Total', value: data.orders.total },
            { label: 'En cours', value: data.orders.in_progress },
            { label: 'Livrées', value: data.orders.delivered },
          ]}
        />

        {/* Section Contacts */}
        <SectionCard
          title="Contacts"
          icon={<Users className="h-5 w-5" />}
          href="/contacts"
          kpis={[
            { label: 'Total', value: data.contacts.total },
            { label: 'Nouveaux (30j)', value: data.contacts.new_month },
          ]}
        />
      </div>
    </div>
  );
}
