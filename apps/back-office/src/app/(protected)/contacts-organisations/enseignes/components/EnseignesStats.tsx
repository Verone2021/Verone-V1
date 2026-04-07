'use client';

import { Card, CardContent } from '@verone/ui';
import { colors, spacing } from '@verone/ui/design-system';

interface EnseignesStatsProps {
  stats: {
    total: number;
    active: number;
    archived: number;
    totalMembers: number;
  };
}

export function EnseignesStats({ stats }: EnseignesStatsProps) {
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
            Total enseignes
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
            Actives
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent style={{ padding: spacing[4] }}>
          <div
            className="text-2xl font-bold"
            style={{ color: colors.text.muted }}
          >
            {stats.archived}
          </div>
          <p className="text-sm" style={{ color: colors.text.subtle }}>
            Archivées
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent style={{ padding: spacing[4] }}>
          <div
            className="text-2xl font-bold"
            style={{ color: colors.primary[500] }}
          >
            {stats.totalMembers}
          </div>
          <p className="text-sm" style={{ color: colors.text.subtle }}>
            Organisations membres
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
