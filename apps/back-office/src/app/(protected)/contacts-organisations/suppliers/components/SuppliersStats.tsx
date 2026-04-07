'use client';

import { Card, CardContent } from '@verone/ui';
import { colors, spacing } from '@verone/ui/design-system';

interface SuppliersStatsProps {
  stats: {
    total: number;
    active: number;
    archived: number;
    favorites: number;
  };
}

export function SuppliersStats({ stats }: SuppliersStatsProps) {
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
            Total fournisseurs
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
            {stats.archived}
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
