'use client';

import { Card, CardContent } from '@verone/ui';
import { colors, spacing } from '@verone/ui/design-system';

interface Stats {
  total: number;
  active: number;
  favorites: number;
  incomplete: number;
}

interface CustomerStatsCardsProps {
  stats: Stats;
  archivedCount: number;
}

export function CustomerStatsCards({
  stats,
  archivedCount,
}: CustomerStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent style={{ padding: spacing[4] }}>
          <div
            className="text-2xl font-bold"
            style={{ color: colors.text.DEFAULT }}
          >
            {stats.total}
          </div>
          <p className="text-sm" style={{ color: colors.text.subtle }}>
            Total clients
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent style={{ padding: spacing[4] }}>
          <div
            className="text-2xl font-bold"
            style={{ color: colors.success[500] }}
          >
            {stats.active}
          </div>
          <p className="text-sm" style={{ color: colors.text.subtle }}>
            Actifs
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent style={{ padding: spacing[4] }}>
          <div
            className="text-2xl font-bold"
            style={{ color: colors.text.DEFAULT }}
          >
            {archivedCount}
          </div>
          <p className="text-sm" style={{ color: colors.text.subtle }}>
            Archivés
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent style={{ padding: spacing[4] }}>
          <div
            className="text-2xl font-bold"
            style={{ color: colors.accent[500] }}
          >
            {stats.favorites}
          </div>
          <p className="text-sm" style={{ color: colors.text.subtle }}>
            Favoris
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
