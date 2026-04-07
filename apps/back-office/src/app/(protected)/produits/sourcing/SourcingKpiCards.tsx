'use client';

import { Card, CardContent } from '@verone/ui';
import { colors, spacing } from '@verone/ui/design-system';
import { AlertTriangle, Eye, Search, TrendingUp } from 'lucide-react';

interface SourcingStats {
  totalDrafts: number;
  pendingValidation: number;
  samplesOrdered: number;
  completedThisMonth: number;
}

interface SourcingKpiCardsProps {
  stats: SourcingStats;
  loading: boolean;
}

export function SourcingKpiCards({ stats, loading }: SourcingKpiCardsProps) {
  const display = (value: number) => (loading ? '...' : value);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent style={{ padding: spacing[4] }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: colors.text.subtle }}>
                Brouillons Actifs
              </p>
              <div
                className="text-2xl font-bold"
                style={{ color: colors.text.DEFAULT }}
              >
                {display(stats.totalDrafts)}
              </div>
              <p className="text-xs" style={{ color: colors.text.muted }}>
                produits en cours de sourcing
              </p>
            </div>
            <Search
              className="h-8 w-8"
              style={{ color: colors.primary[500] }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent style={{ padding: spacing[4] }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: colors.text.subtle }}>
                En Validation
              </p>
              <div
                className="text-2xl font-bold"
                style={{ color: colors.warning[500] }}
              >
                {display(stats.pendingValidation)}
              </div>
              <p className="text-xs" style={{ color: colors.text.muted }}>
                produits à valider
              </p>
            </div>
            <AlertTriangle
              className="h-8 w-8"
              style={{ color: colors.warning[500] }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent style={{ padding: spacing[4] }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: colors.text.subtle }}>
                Échantillons
              </p>
              <div
                className="text-2xl font-bold"
                style={{ color: colors.primary[500] }}
              >
                {display(stats.samplesOrdered)}
              </div>
              <p className="text-xs" style={{ color: colors.text.muted }}>
                commandes en cours
              </p>
            </div>
            <Eye className="h-8 w-8" style={{ color: colors.primary[500] }} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent style={{ padding: spacing[4] }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: colors.text.subtle }}>
                Complétés
              </p>
              <div
                className="text-2xl font-bold"
                style={{ color: colors.success[500] }}
              >
                {display(stats.completedThisMonth)}
              </div>
              <p className="text-xs" style={{ color: colors.text.muted }}>
                ce mois-ci
              </p>
            </div>
            <TrendingUp
              className="h-8 w-8"
              style={{ color: colors.success[500] }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
