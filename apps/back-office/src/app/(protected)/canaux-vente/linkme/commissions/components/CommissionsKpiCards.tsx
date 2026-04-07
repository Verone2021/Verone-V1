'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { formatPrice } from '@verone/utils';

import { TABS_CONFIG } from '../constants';
import type { TabType } from '../types';

interface CommissionsKpiCardsProps {
  activeTab: TabType;
  tabCounts: Record<TabType, { count: number; total: number }>;
  onTabChange: (tab: TabType) => void;
}

export function CommissionsKpiCards({
  activeTab,
  tabCounts,
  onTabChange,
}: CommissionsKpiCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {(Object.keys(TABS_CONFIG) as TabType[]).map(tab => {
        const config = TABS_CONFIG[tab];
        const Icon = config.icon;
        const data = tabCounts[tab];

        return (
          <Card
            key={tab}
            className={`cursor-pointer transition-all hover:shadow-md ${
              activeTab === tab ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => onTabChange(tab)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${config.color}`} />
                <CardTitle className="text-sm font-medium">
                  {config.label}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${config.color}`}>
                {formatPrice(data.total)}
              </div>
              <p className="text-xs text-muted-foreground">
                {data.count} commande{data.count > 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
