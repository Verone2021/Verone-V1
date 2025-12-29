'use client';

import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@verone/ui';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

import type {
  TreasuryEvolution,
  TreasuryForecast,
} from '../../hooks/use-treasury-stats';

interface TreasuryForecastChartProps {
  evolution: TreasuryEvolution[];
  forecasts: TreasuryForecast[];
  currentBalance: number;
  isLoading: boolean;
}

const formatCurrency = (value: number) => {
  if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(0)}k€`;
  }
  return `${value}€`;
};

const formatFullCurrency = (value: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const monthNames = [
  'Jan',
  'Fév',
  'Mar',
  'Avr',
  'Mai',
  'Juin',
  'Juil',
  'Août',
  'Sep',
  'Oct',
  'Nov',
  'Déc',
];

export function TreasuryForecastChart({
  evolution,
  forecasts,
  currentBalance,
  isLoading,
}: TreasuryForecastChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Prévisions Trésorerie
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  // Type pour les données du chart
  interface ChartDataPoint {
    date: string;
    label: string;
    balance: number;
    inbound: number;
    outbound: number;
    isForecast: boolean;
  }

  // Préparer les données pour le graphique
  const chartData: ChartDataPoint[] = evolution.map(item => {
    const [year, month] = item.date.split('-');
    const monthIndex = parseInt(month, 10) - 1;
    return {
      date: item.date,
      label: `${monthNames[monthIndex]} ${year.slice(2)}`,
      balance: item.balance,
      inbound: item.inbound,
      outbound: item.outbound,
      isForecast: false,
    };
  });

  // Ajouter les prévisions
  if (forecasts.length > 0 && currentBalance > 0) {
    const today = new Date();
    forecasts.forEach(forecast => {
      const days = parseInt(forecast.period.replace('d', ''), 10);
      const forecastDate = new Date(today);
      forecastDate.setDate(forecastDate.getDate() + days);

      const monthIndex = forecastDate.getMonth();
      const year = forecastDate.getFullYear().toString().slice(2);

      chartData.push({
        date: forecastDate.toISOString().split('T')[0],
        label: `${monthNames[monthIndex]} ${year}`,
        balance: currentBalance + forecast.projected_balance,
        inbound: forecast.expected_inbound,
        outbound: forecast.expected_outbound,
        isForecast: true,
      });
    });
  }

  // Trier par date
  chartData.sort((a, b) => a.date.localeCompare(b.date));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          Évolution & Prévisions Trésorerie
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatCurrency}
                width={50}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as ChartDataPoint;
                    return (
                      <div className="bg-background border rounded-lg shadow-lg p-3">
                        <p className="font-medium">{label}</p>
                        <p
                          className={
                            data.isForecast
                              ? 'text-muted-foreground italic'
                              : ''
                          }
                        >
                          {data.isForecast ? '(Prévision)' : '(Réel)'}
                        </p>
                        <p className="text-emerald-600">
                          Solde: {formatFullCurrency(data.balance)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Entrées: {formatFullCurrency(data.inbound)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Sorties: {formatFullCurrency(data.outbound)}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              {/* Ligne de référence à 0 */}
              <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />

              {/* Ligne du solde */}
              <Line
                type="monotone"
                dataKey="balance"
                stroke="#6366f1"
                strokeWidth={2}
                dot={false}
                name="Solde"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Légende personnalisée */}
        <div className="flex items-center justify-center gap-6 mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-primary" />
            <span>Réel</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-0.5 bg-primary border-dashed border-t-2 border-primary"
              style={{ borderStyle: 'dashed' }}
            />
            <span>Prévision</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
