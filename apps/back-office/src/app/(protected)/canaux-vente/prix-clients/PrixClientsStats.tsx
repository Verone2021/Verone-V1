'use client';

import { Card, CardContent } from '@verone/ui';
import { Euro, Users, TrendingDown, PercentIcon, Tag } from 'lucide-react';

import type { PrixClientsStats } from './types';

interface PrixClientsStatsProps {
  stats: PrixClientsStats;
}

export function PrixClientsStatsGrid({ stats }: PrixClientsStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
      <Card className="border-black">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Prix configurés</p>
              <p className="text-2xl font-bold text-black">
                {stats.total_pricing_rules}
              </p>
            </div>
            <Euro className="h-8 w-8 text-black" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-black">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Règles actives</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.active_rules}
              </p>
            </div>
            <Tag className="h-8 w-8 text-green-600" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-black">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Clients</p>
              <p className="text-2xl font-bold text-blue-600">
                {stats.customers_with_pricing}
              </p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-black">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Remise moyenne</p>
              <p className="text-2xl font-bold text-purple-600">
                {stats.avg_discount.toFixed(1)}%
              </p>
            </div>
            <TrendingDown className="h-8 w-8 text-purple-600" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-black">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ristourne totale</p>
              <p className="text-2xl font-bold text-orange-600">
                {stats.total_retrocession.toFixed(1)}%
              </p>
            </div>
            <PercentIcon className="h-8 w-8 text-orange-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
