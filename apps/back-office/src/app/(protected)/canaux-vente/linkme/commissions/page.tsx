'use client';

import { Badge } from '@verone/ui';
import { Skeleton } from '@verone/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@verone/ui';

import { PaymentRequestModalAdmin } from '../components/PaymentRequestModalAdmin';
import { CommissionsHeader } from './components/CommissionsHeader';
import { CommissionsKpiCards } from './components/CommissionsKpiCards';
import { CommissionsTabContent } from './components/CommissionsTabContent';
import { useCommissionsPage } from './hooks/use-commissions-page';
import { TABS_CONFIG } from './constants';
import type { TabType } from './types';

export default function LinkMeCommissionsPage() {
  const state = useCommissionsPage();

  if (state.loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const selectedCommissions = state.commissions.filter(c =>
    state.selectedIds.includes(c.id)
  );
  const firstSelected = selectedCommissions[0];
  const affiliateId = firstSelected?.affiliate_id ?? '';
  const affiliateName = firstSelected?.affiliate?.display_name ?? 'Affilié';

  return (
    <div className="space-y-6">
      <CommissionsHeader onExportCSV={state.exportToCSV} />

      <CommissionsKpiCards
        activeTab={state.activeTab}
        tabCounts={state.tabCounts}
        onTabChange={tab => state.setActiveTab(tab)}
      />

      <Tabs
        value={state.activeTab}
        onValueChange={v => {
          state.setActiveTab(v as TabType);
          if (state.selectedIds.length > 0) {
            state.toggleSelectAll([]);
          }
          state.setCurrentPage(0);
        }}
      >
        <TabsList className="grid w-full grid-cols-4">
          {(Object.keys(TABS_CONFIG) as TabType[]).map(tab => {
            const config = TABS_CONFIG[tab];
            const Icon = config.icon;
            return (
              <TabsTrigger key={tab} value={tab} className="gap-2">
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{config.label}</span>
                <Badge variant="secondary" className="ml-1">
                  {state.tabCounts[tab].count}
                </Badge>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {(Object.keys(TABS_CONFIG) as TabType[]).map(tab => (
          <TabsContent key={tab} value={tab} className="mt-6">
            <CommissionsTabContent tab={tab} state={state} />
          </TabsContent>
        ))}
      </Tabs>

      <PaymentRequestModalAdmin
        isOpen={state.isPaymentModalOpen}
        onClose={() => state.setIsPaymentModalOpen(false)}
        selectedCommissions={selectedCommissions}
        affiliateId={affiliateId}
        affiliateName={affiliateName}
        onSuccess={state.handlePaymentSuccess}
      />
    </div>
  );
}
