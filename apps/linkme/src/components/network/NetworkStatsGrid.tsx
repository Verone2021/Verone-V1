'use client';

import { Card, Metric, Text, Flex, ProgressBar, Badge } from '@tremor/react';
import { Building2, Store, MapPin } from 'lucide-react';

import type { NetworkStats } from '@/lib/hooks/use-affiliate-network';

interface NetworkStatsGridProps {
  stats: NetworkStats;
  isLoading?: boolean;
}

export function NetworkStatsGrid({ stats, isLoading }: NetworkStatsGridProps) {
  const topRegions = stats.byRegion.slice(0, 3);
  const maxRegionCount = topRegions[0]?.count || 1;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
            <div className="h-8 bg-gray-200 rounded w-1/3" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Réseau */}
      <Card decoration="top" decorationColor="blue">
        <Flex alignItems="start">
          <div>
            <Text>Total Réseau</Text>
            <Metric>{stats.total}</Metric>
          </div>
          <Badge icon={Building2} color="blue">
            Établissements
          </Badge>
        </Flex>
      </Card>

      {/* Propres */}
      <Card decoration="top" decorationColor="emerald">
        <Flex alignItems="start">
          <div>
            <Text>Propres</Text>
            <Metric>{stats.propres}</Metric>
          </div>
          <Badge icon={Store} color="emerald">
            {stats.total > 0
              ? Math.round((stats.propres / stats.total) * 100)
              : 0}
            %
          </Badge>
        </Flex>
        <ProgressBar
          value={stats.total > 0 ? (stats.propres / stats.total) * 100 : 0}
          color="emerald"
          className="mt-3"
        />
      </Card>

      {/* Franchises */}
      <Card decoration="top" decorationColor="purple">
        <Flex alignItems="start">
          <div>
            <Text>Franchises</Text>
            <Metric>{stats.franchises}</Metric>
          </div>
          <Badge icon={Store} color="purple">
            {stats.total > 0
              ? Math.round((stats.franchises / stats.total) * 100)
              : 0}
            %
          </Badge>
        </Flex>
        <ProgressBar
          value={stats.total > 0 ? (stats.franchises / stats.total) * 100 : 0}
          color="purple"
          className="mt-3"
        />
      </Card>

      {/* Top Régions */}
      <Card decoration="top" decorationColor="amber">
        <Flex alignItems="start" className="mb-2">
          <Text>Top Régions</Text>
          <Badge icon={MapPin} color="amber">
            France
          </Badge>
        </Flex>
        <div className="space-y-2">
          {topRegions.length > 0 ? (
            topRegions.map(region => (
              <div key={region.regionCode}>
                <Flex>
                  <Text className="truncate text-xs">{region.region}</Text>
                  <Text className="text-xs font-medium">{region.count}</Text>
                </Flex>
                <ProgressBar
                  value={(region.count / maxRegionCount) * 100}
                  color="amber"
                  className="mt-1"
                />
              </div>
            ))
          ) : (
            <Text className="text-gray-400 text-sm">Aucune donnée</Text>
          )}
        </div>
      </Card>
    </div>
  );
}
