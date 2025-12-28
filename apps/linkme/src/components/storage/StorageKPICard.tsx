/**
 * Composant StorageKPICard
 * Carte KPI réutilisable pour l'affichage des métriques de stockage
 *
 * @module StorageKPICard
 * @since 2025-12-22
 */

import { Loader2 } from 'lucide-react';

export interface StorageKPICardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
  subtitle?: string;
  isLoading?: boolean;
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-50',
    icon: 'text-blue-600',
    border: 'border-blue-100',
  },
  green: {
    bg: 'bg-green-50',
    icon: 'text-green-600',
    border: 'border-green-100',
  },
  purple: {
    bg: 'bg-purple-50',
    icon: 'text-purple-600',
    border: 'border-purple-100',
  },
  orange: {
    bg: 'bg-orange-50',
    icon: 'text-orange-600',
    border: 'border-orange-100',
  },
};

export function StorageKPICard({
  icon: Icon,
  label,
  value,
  color,
  subtitle,
  isLoading = false,
}: StorageKPICardProps) {
  const colors = colorClasses[color];

  return (
    <div
      className={`bg-white rounded-xl border ${colors.border} p-4 transition-shadow hover:shadow-sm`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2.5 rounded-lg ${colors.bg}`}>
          <Icon className={`h-5 w-5 ${colors.icon}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 font-medium truncate">{label}</p>
          {isLoading ? (
            <div className="flex items-center h-7">
              <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
            </div>
          ) : (
            <p className="text-xl font-bold text-gray-900 truncate">{value}</p>
          )}
          {subtitle && (
            <p className="text-[10px] text-gray-400 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}
