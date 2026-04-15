'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { RefreshCw } from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import type { CategoryBreakdown } from '../../hooks/use-bank-transaction-stats';
import { DONUT_COLORS, formatCurrency } from './finance-dashboard-utils';
import { ResultRow } from './FinanceDashboardResultRow';

interface IFinanceDashboardResultProps {
  chiffreAffaires: number;
  charges: number;
  resultat: number;
  categoryBreakdown: CategoryBreakdown[];
  loading: boolean;
}

export function FinanceDashboardResult({
  chiffreAffaires,
  charges,
  resultat,
  categoryBreakdown,
  loading,
}: IFinanceDashboardResultProps): React.ReactNode {
  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Resultat</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resultat apres impot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ResultRow
              label="Chiffre d'affaires"
              value={chiffreAffaires}
              positive
            />
            <ResultRow label="Charges d'exploitation" value={-charges} />
            <div className="border-t pt-3">
              <ResultRow
                label="Resultat d'exploitation"
                value={resultat}
                bold
                positive={resultat >= 0}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Charges d&apos;exploitation
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex h-48 items-center justify-center">
                <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : categoryBreakdown.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-sm text-gray-500">
                Aucune donnee
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie
                      data={categoryBreakdown.slice(0, 7)}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      dataKey="totalAmount"
                      stroke="none"
                    >
                      {categoryBreakdown.slice(0, 7).map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={DONUT_COLORS[index % DONUT_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {categoryBreakdown.slice(0, 6).map((cat, index) => (
                    <div
                      key={cat.code}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2.5 w-2.5 rounded-full"
                          style={{
                            backgroundColor:
                              DONUT_COLORS[index % DONUT_COLORS.length],
                          }}
                        />
                        <span className="truncate text-gray-700">
                          {cat.label}
                        </span>
                      </div>
                      <span className="font-medium text-gray-900">
                        {formatCurrency(cat.totalAmount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
