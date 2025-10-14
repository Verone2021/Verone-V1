/**
 * 📦 Products Chart - Produits Ajoutés par Semaine
 *
 * AreaChart Recharts affichant le nombre de produits ajoutés par semaine
 * Design Vérone : Remplissage gris dégradé, ligne noire, tooltip clean
 *
 * Date: 2025-10-14
 */

'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps
} from 'recharts'
import type { ProductsDataPoint } from '@/hooks/use-dashboard-analytics'

interface ProductsChartProps {
  data: ProductsDataPoint[]
  isLoading?: boolean
}

// Custom Tooltip
const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (!active || !payload || !payload.length) return null

  const count = payload[0].value || 0

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
      <p className="text-sm text-gray-600 mb-1">{payload[0].payload.week}</p>
      <p className="text-base font-semibold text-black">
        {count} produit{count > 1 ? 's' : ''}
      </p>
    </div>
  )
}

export function ProductsChart({ data, isLoading = false }: ProductsChartProps) {
  if (isLoading) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center bg-gray-50 rounded-lg animate-pulse">
        <div className="text-sm text-gray-400">Chargement des données...</div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-sm text-gray-500">Aucune donnée disponible</div>
      </div>
    )
  }

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
        >
          <defs>
            <linearGradient id="colorProducts" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#666666" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#666666" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
          <XAxis
            dataKey="week"
            tick={{ fontSize: 12, fill: '#666666' }}
            tickLine={{ stroke: '#E5E5E5' }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#666666' }}
            tickLine={{ stroke: '#E5E5E5' }}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#000000"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorProducts)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
