/**
 * KPI Card Component
 * Displays a single KPI with optional trend indicator
 */

interface KPICardProps {
  label: string;
  value: string | number;
  trend?: 'up' | 'down';
  trendValue?: string;
}

export function KPICard({ label, value, trend, trendValue }: KPICardProps) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {trend && trendValue && (
        <p
          className={`text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}
        >
          {trend === 'up' ? '↑' : '↓'} {trendValue}
        </p>
      )}
    </div>
  );
}
