/**
 * 📊 Dashboard Modules Activité Utilisateur - Vérone
 *
 * Affiche le temps passé par module avec barres de progression
 * et pourcentages (total = 100%).
 *
 * ✅ CONNECTÉ AUX VRAIES DONNÉES via use-user-module-metrics
 */

'use client';

import React from 'react';

import {
  Home,
  BookOpen,
  Package,
  Target,
  ShoppingBag,
  Truck,
  Globe,
  Wallet,
  Building2,
  Settings,
  Loader2,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

import {
  useUserModuleMetrics,
  formatModuleTime,
  getProgressBarColor,
} from '@/shared/modules/dashboard/hooks/metrics';

interface UserModuleActivityDashboardProps {
  userId: string;
  days?: number;
}

/**
 * Map icons par nom d'icon string
 */
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Home: Home,
  BookOpen: BookOpen,
  Package: Package,
  Target: Target,
  ShoppingBag: ShoppingBag,
  Truck: Truck,
  Globe: Globe,
  Wallet: Wallet,
  Building2: Building2,
  Settings: Settings,
};

export function UserModuleActivityDashboard({
  userId,
  days = 30,
}: UserModuleActivityDashboardProps) {
  const { modules, total_time, total_page_views, loading, error } =
    useUserModuleMetrics(userId, days);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-black" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Erreur de chargement
            </h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (modules.length === 0) {
    return (
      <div className="text-center py-12">
        <TrendingUp className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <p className="text-sm text-gray-600">
          Aucune activité enregistrée sur les {days} derniers jours
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Les métriques par module apparaîtront ici dès que l'utilisateur
          navigue dans l'application
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec statistiques globales */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-black flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Temps passé par module</span>
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Analyse des {days} derniers jours - Total:{' '}
            {formatModuleTime(total_time)}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-black">
            {total_page_views}
          </div>
          <div className="text-xs text-gray-600">Pages vues</div>
        </div>
      </div>

      {/* Liste modules avec barres progression */}
      <div className="space-y-3">
        {modules.map(module => {
          const IconComponent = ICON_MAP[module.icon] || Home;
          const progressBarColor = getProgressBarColor(
            module.percentage,
            module.color
          );

          return (
            <div
              key={module.module}
              className="group p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all"
            >
              {/* Header: Icon + Module name + Time */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg bg-${module.color}-50`}>
                    <IconComponent
                      className={`h-5 w-5 text-${module.color}-600`}
                    />
                  </div>
                  <div>
                    <div className="font-semibold text-black">
                      {module.module}
                    </div>
                    <div className="text-xs text-gray-500">
                      {module.page_views} page{module.page_views > 1 ? 's' : ''}{' '}
                      vue{module.page_views > 1 ? 's' : ''}
                      {module.last_visited &&
                        ` • Dernière visite: ${formatRelativeTime(module.last_visited)}`}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-black">
                    {formatModuleTime(module.time_spent_minutes)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {module.total_actions} action
                    {module.total_actions > 1 ? 's' : ''}
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="flex items-center space-x-3">
                <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${progressBarColor} transition-all duration-500 ease-out rounded-full`}
                    style={{ width: `${module.percentage}%` }}
                  />
                </div>
                <div className="text-sm font-bold text-black w-12 text-right">
                  {module.percentage}%
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer info */}
      <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-200">
        Les pourcentages représentent la répartition du temps total (
        {formatModuleTime(total_time)}) passé dans l'application
      </div>
    </div>
  );
}

/**
 * Formater date relative (ex: "Il y a 2h", "Hier", etc.)
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "À l'instant";
  if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays === 1) return 'Hier';
  if (diffDays < 30) return `Il y a ${diffDays} jours`;

  return date.toLocaleDateString('fr-FR');
}
