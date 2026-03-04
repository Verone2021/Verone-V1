/**
 * Detailed navigation statistics for a LinkMe user.
 * Shows top visited pages and detailed engagement stats.
 */

'use client';

import { useEffect, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import {
  BarChart3,
  Clock,
  Eye,
  Loader2,
  Monitor,
  MousePointer,
  Activity,
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface TopPage {
  page_url: string;
  count: number;
}

interface EngagementStats {
  total_sessions: number;
  total_actions: number;
  avg_session_duration: number;
  most_used_module: string | null;
  engagement_score: number;
  last_activity: string | null;
}

interface UserNavigationStatsProps {
  userId: string;
}

// ============================================
// CONSTANTS
// ============================================

const PAGE_LABELS: Record<string, string> = {
  '/dashboard': 'Tableau de bord',
  // LinkMe pages
  '/selections': 'Selections',
  '/commandes': 'Commandes',
  '/notifications': 'Notifications',
  '/parametres': 'Parametres',
  '/catalogue': 'Catalogue',
  '/profil': 'Profil',
  '/aide': 'Aide',
  // Back-office pages (tracked via app_source)
  '/produits/catalogue': 'Catalogue produits',
  '/commandes/clients': 'Commandes clients',
  '/commandes/fournisseurs': 'Commandes fournisseurs',
  '/stocks': 'Stocks',
  '/stocks/alertes': 'Alertes stock',
  '/stocks/mouvements': 'Mouvements stock',
  '/stocks/inventaire': 'Inventaire',
  '/contacts-organisations/customers': 'Clients',
  '/contacts-organisations/suppliers': 'Fournisseurs',
  '/contacts-organisations': 'Contacts & Organisations',
  '/finance/depenses': 'Depenses',
  '/finance/transactions': 'Transactions',
  '/factures': 'Factures',
  '/canaux-vente/linkme': 'LinkMe',
  '/canaux-vente/linkme/commandes': 'Commandes LinkMe',
  '/canaux-vente/linkme/commissions': 'Commissions LinkMe',
  '/canaux-vente/linkme/catalogue': 'Catalogue LinkMe',
  '/organisation': 'Organisation',
};

// ============================================
// HELPERS
// ============================================

function getPageLabel(url: string): string {
  if (!url) return 'Page inconnue';

  // Extract pathname for matching
  let pathname: string;
  try {
    pathname = url.startsWith('http') ? new URL(url).pathname : url;
  } catch {
    pathname = url;
  }

  // Exact match first
  if (PAGE_LABELS[pathname]) return PAGE_LABELS[pathname];

  // Longest prefix match (e.g. /commandes/clients before /commandes)
  const sortedPaths = Object.keys(PAGE_LABELS).sort(
    (a, b) => b.length - a.length
  );
  for (const path of sortedPaths) {
    if (pathname.startsWith(path) && path !== '/') {
      return PAGE_LABELS[path];
    }
  }

  // Fallback: extract last meaningful segment
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length > 0) {
    const last = segments[segments.length - 1];
    // If it looks like a UUID, use the previous segment
    if (last.length > 20 && segments.length > 1) {
      return (
        segments[segments.length - 2].charAt(0).toUpperCase() +
        segments[segments.length - 2].slice(1)
      );
    }
    return last.charAt(0).toUpperCase() + last.slice(1);
  }

  return pathname;
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "a l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `il y a ${days}j`;
  const months = Math.floor(days / 30);
  return `il y a ${months} mois`;
}

function formatDuration(minutes: number): string {
  if (minutes < 1) return '< 1 min';
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  return remainingMinutes > 0
    ? `${hours}h ${remainingMinutes}min`
    : `${hours}h`;
}

function getModuleLabel(module: string | null): string {
  if (!module) return '-';
  const labels: Record<string, string> = {
    dashboard: 'Tableau de bord',
    catalogue: 'Catalogue',
    selections: 'Selections',
    commandes: 'Commandes',
    notifications: 'Notifications',
    parametres: 'Parametres',
  };
  return labels[module] ?? module.charAt(0).toUpperCase() + module.slice(1);
}

// ============================================
// COMPONENT
// ============================================

export function UserNavigationStats({ userId }: UserNavigationStatsProps) {
  const [topPages, setTopPages] = useState<TopPage[]>([]);
  const [stats, setStats] = useState<EngagementStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      setLoading(true);
      const supabase = createClient();

      const [pagesResult, statsResult] = await Promise.all([
        // Top pages — fetch page_view logs, aggregate client-side
        supabase
          .from('user_activity_logs')
          .select('page_url')
          .eq('user_id', userId)
          .eq('action', 'page_view')
          .not('page_url', 'is', null)
          .order('created_at', { ascending: false })
          .limit(500),

        // Engagement stats via RPC
        supabase.rpc('get_user_activity_stats', {
          p_user_id: userId,
          p_days: 30,
        }),
      ]);

      // Process top pages
      if (pagesResult.data && !pagesResult.error) {
        const counts = new Map<string, number>();
        for (const row of pagesResult.data) {
          // Normalize "/" to "/dashboard" (same page, captured before redirect)
          const url =
            (row as { page_url: string }).page_url === '/'
              ? '/dashboard'
              : (row as { page_url: string }).page_url;
          counts.set(url, (counts.get(url) ?? 0) + 1);
        }
        const sorted = Array.from(counts.entries())
          .map(([page_url, count]) => ({ page_url, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);
        setTopPages(sorted);
      }

      // Process stats
      if (
        statsResult.data &&
        !statsResult.error &&
        Array.isArray(statsResult.data) &&
        statsResult.data.length > 0
      ) {
        setStats(statsResult.data[0] as EngagementStats);
      }

      setLoading(false);
    };

    void fetchData().catch(error => {
      console.error('[UserNavigationStats] fetchData failed:', error);
      setLoading(false);
    });
  }, [userId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasAnyData =
    topPages.length > 0 || (stats !== null && stats.total_sessions > 0);

  if (!hasAnyData) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <BarChart3 className="h-10 w-10 mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">
              Aucune donnee de navigation disponible
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Les statistiques detaillees apparaitront une fois que
              l&apos;utilisateur aura navigue sur LinkMe
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxPageCount = topPages.length > 0 ? topPages[0].count : 1;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-indigo-500" />
          Statistiques de navigation
          <span className="text-sm font-normal text-gray-500">(30j)</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Statistiques detaillees — grille 4 colonnes */}
        {stats && stats.total_sessions > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2 mb-1.5">
                <MousePointer className="h-3.5 w-3.5 text-gray-500" />
                <span className="text-xs font-medium text-gray-700">
                  Actions totales
                </span>
              </div>
              <div className="text-xl font-bold">{stats.total_actions}</div>
              <div className="text-[11px] text-gray-500">
                {stats.total_sessions > 0
                  ? `${Math.round(stats.total_actions / stats.total_sessions)} par session`
                  : 'Aucune session'}
              </div>
            </div>

            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2 mb-1.5">
                <Clock className="h-3.5 w-3.5 text-gray-500" />
                <span className="text-xs font-medium text-gray-700">
                  Duree moyenne
                </span>
              </div>
              <div className="text-xl font-bold">
                {formatDuration(stats.avg_session_duration)}
              </div>
              <div className="text-[11px] text-gray-500">Par session</div>
            </div>

            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2 mb-1.5">
                <Monitor className="h-3.5 w-3.5 text-gray-500" />
                <span className="text-xs font-medium text-gray-700">
                  Module prefere
                </span>
              </div>
              <div className="text-base font-bold">
                {getModuleLabel(stats.most_used_module)}
              </div>
              <div className="text-[11px] text-gray-500">Le plus utilise</div>
            </div>

            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2 mb-1.5">
                <Activity className="h-3.5 w-3.5 text-gray-500" />
                <span className="text-xs font-medium text-gray-700">
                  Derniere activite
                </span>
              </div>
              <div className="text-sm font-bold">
                {stats.last_activity
                  ? formatRelativeTime(stats.last_activity)
                  : 'Jamais'}
              </div>
              <div className="text-[11px] text-gray-500">
                {stats.last_activity
                  ? new Date(stats.last_activity).toLocaleString('fr-FR')
                  : 'Aucune activite'}
              </div>
            </div>
          </div>
        )}

        {/* Pages les plus consultees — barres horizontales */}
        {topPages.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <Eye className="h-4 w-4 text-blue-500" />
              Pages les plus consultees
            </h4>
            <div className="space-y-2.5">
              {topPages.map((page, index) => {
                const percentage = Math.round(
                  (page.count / maxPageCount) * 100
                );
                return (
                  <div key={page.page_url} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-gray-400 w-5 text-right shrink-0">
                          {index + 1}.
                        </span>
                        <span className="font-medium truncate">
                          {getPageLabel(page.page_url)}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 shrink-0 ml-2">
                        {page.count} vue{page.count > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="ml-7">
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
