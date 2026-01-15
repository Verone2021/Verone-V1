'use client';

/**
 * MetricCard - Carte KPI avec mini-graphique intégré
 * Style inspiré de NICNIC (21st.dev Modern Analytics Dashboard)
 *
 * Charte Graphique LinkMe :
 * - Turquoise: #5DBEBB (Commissions)
 * - Bleu Royal: #3976BB (Commandes)
 * - Mauve/Bleu: #7E84C0 (Organisations)
 * - Bleu Marine: #183559 (Produits)
 *
 * @module MetricCard
 * @since 2026-01-07
 */

import { Button, Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import {
  type LucideIcon,
  TrendingUp,
  TrendingDown,
  MoreHorizontal,
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

import { cn } from '@/lib/utils';

// Types des variantes de couleur - Charte graphique LinkMe
export type MetricCardVariant = 'turquoise' | 'royal' | 'mauve' | 'marine';

// Mapping des couleurs avec gradients
const variantStyles: Record<
  MetricCardVariant,
  {
    gradient: string;
    chartColor: string;
    chartColorLight: string;
  }
> = {
  turquoise: {
    gradient: 'bg-gradient-to-br from-[#5DBEBB] to-[#4AA8A5]',
    chartColor: '#ffffff',
    chartColorLight: 'rgba(255, 255, 255, 0.3)',
  },
  royal: {
    gradient: 'bg-gradient-to-br from-[#3976BB] to-[#2D5F99]',
    chartColor: '#ffffff',
    chartColorLight: 'rgba(255, 255, 255, 0.3)',
  },
  mauve: {
    gradient: 'bg-gradient-to-br from-[#7E84C0] to-[#6B71A8]',
    chartColor: '#ffffff',
    chartColorLight: 'rgba(255, 255, 255, 0.3)',
  },
  marine: {
    gradient: 'bg-gradient-to-br from-[#183559] to-[#0F2440]',
    chartColor: '#ffffff',
    chartColorLight: 'rgba(255, 255, 255, 0.3)',
  },
};

export interface IMetricCardProps {
  /** Titre de la carte */
  title: string;
  /** Icône principale */
  icon: LucideIcon;
  /** Variante de couleur */
  variant: MetricCardVariant;
  /** Valeur principale */
  value: string | number;
  /** Variation en % par rapport au mois précédent */
  trend?: number;
  /** Label de comparaison (ex: "Vs last month: 42") */
  trendLabel?: string;
  /** Données pour le graphique (array de {value: number}) */
  chartData?: Array<{ value: number }>;
  /** État de chargement */
  isLoading?: boolean;
  /** Callback pour le menu */
  onMenuClick?: () => void;
}

/**
 * Génère des données de graphique mockées
 */
export function generateChartData(
  points: number = 12
): Array<{ value: number }> {
  return Array.from({ length: points }, () => ({
    value: Math.floor(Math.random() * 100) + 50,
  }));
}

/**
 * MetricCard - Carte de métrique avec mini-graphique
 */
export function MetricCard({
  title,
  icon: Icon,
  variant,
  value,
  trend,
  trendLabel,
  chartData = generateChartData(),
  isLoading = false,
  onMenuClick,
}: IMetricCardProps): JSX.Element {
  const styles = variantStyles[variant];
  const isPositive = (trend ?? 0) >= 0;
  const uniqueId = `chart-gradient-${title.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <Card className={cn('relative overflow-hidden border-0', styles.gradient)}>
      {/* Header avec icône et menu */}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
            <Icon className="h-5 w-5 text-white" />
          </div>
          <CardTitle className="text-white/90 text-sm font-medium">
            {title}
          </CardTitle>
        </div>
        {onMenuClick && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
            onClick={onMenuClick}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>

      <CardContent className="pb-4">
        {/* Valeur principale + Badge tendance */}
        <div className="flex items-baseline gap-3 mb-1">
          <span className="text-3xl font-bold text-white tracking-tight">
            {isLoading ? '--' : value}
          </span>
          {trend !== undefined && !isLoading && (
            <span
              className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold',
                'bg-white/20 text-white'
              )}
            >
              {isPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {Math.abs(trend).toFixed(1)}%
            </span>
          )}
        </div>

        {/* Label de comparaison */}
        {trendLabel && (
          <p className="text-white/70 text-xs mb-3">{trendLabel}</p>
        )}

        {/* Mini Chart */}
        <div className="h-16 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id={uniqueId} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor={styles.chartColor}
                    stopOpacity={0.4}
                  />
                  <stop
                    offset="100%"
                    stopColor={styles.chartColor}
                    stopOpacity={0.05}
                  />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={styles.chartColor}
                strokeWidth={2}
                fill={`url(#${uniqueId})`}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export default MetricCard;
