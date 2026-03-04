/**
 * Engagement KPI cards for LinkMe user detail page.
 * Uses get_user_activity_stats RPC to display navigation/session metrics.
 */

'use client';

import { useEffect, useState } from 'react';

import { createClient } from '@verone/utils/supabase/client';
import { Activity, Clock, Monitor, Target } from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface EngagementStats {
  total_sessions: number;
  total_actions: number;
  avg_session_duration: number; // minutes
  most_used_module: string | null;
  engagement_score: number;
  last_activity: string | null;
}

interface UserEngagementCardsProps {
  userId: string;
}

// ============================================
// HELPERS
// ============================================

function formatDuration(minutes: number): string {
  if (minutes < 1) return '< 1 min';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0
    ? `${hours}h ${remainingMinutes}min`
    : `${hours}h`;
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

function getEngagementLevel(score: number) {
  if (score >= 80)
    return {
      level: 'Tres eleve',
      color: 'text-green-600',
      bgColor: 'bg-green-500',
    };
  if (score >= 60)
    return { level: 'Eleve', color: 'text-blue-600', bgColor: 'bg-blue-500' };
  if (score >= 40)
    return { level: 'Moyen', color: 'text-amber-600', bgColor: 'bg-amber-500' };
  if (score >= 20)
    return {
      level: 'Faible',
      color: 'text-orange-600',
      bgColor: 'bg-orange-500',
    };
  return { level: 'Tres faible', color: 'text-red-500', bgColor: 'bg-red-500' };
}

// ============================================
// COMPONENT
// ============================================

export function UserEngagementCards({ userId }: UserEngagementCardsProps) {
  const [stats, setStats] = useState<EngagementStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const fetchStats = async () => {
      setLoading(true);
      const supabase = createClient();

      const { data, error } = await supabase.rpc('get_user_activity_stats', {
        p_user_id: userId,
        p_days: 30,
      });

      if (error) {
        console.error('[UserEngagementCards] RPC error:', error);
        setStats(null);
        setHasData(false);
      } else if (data && Array.isArray(data) && data.length > 0) {
        const row = data[0] as EngagementStats;
        setStats(row);
        setHasData(row.total_sessions > 0);
      } else {
        setStats(null);
        setHasData(false);
      }
      setLoading(false);
    };

    void fetchStats().catch(error => {
      console.error('[UserEngagementCards] fetchStats failed:', error);
      setLoading(false);
    });
  }, [userId]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white border border-neutral-200 rounded-lg p-3 animate-pulse"
          >
            <div className="h-4 bg-neutral-100 rounded w-24 mb-2" />
            <div className="h-6 bg-neutral-100 rounded w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="bg-white border border-neutral-200 rounded-lg p-6 text-center">
        <Monitor className="h-10 w-10 mx-auto text-gray-300 mb-3" />
        <p className="text-sm text-gray-500">
          Aucune donnee de navigation disponible
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Les metriques s&apos;afficheront une fois que l&apos;utilisateur aura
          navigue sur LinkMe
        </p>
      </div>
    );
  }

  const engagement = getEngagementLevel(stats?.engagement_score ?? 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Sessions (30j) */}
      <div className="bg-white border border-neutral-200 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-neutral-600">Sessions (30j)</p>
            <p className="text-xl font-bold text-neutral-900">
              {stats?.total_sessions ?? 0}
            </p>
            <p className="text-[11px] text-neutral-500">
              Sessions enregistrees
            </p>
          </div>
          <div className="p-1.5 bg-neutral-50 border border-neutral-200 rounded">
            <Monitor className="h-5 w-5 text-neutral-500" />
          </div>
        </div>
      </div>

      {/* Duree moy. session */}
      <div className="bg-white border border-neutral-200 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-neutral-600">Duree moy. session</p>
            <p className="text-xl font-bold text-neutral-900">
              {formatDuration(stats?.avg_session_duration ?? 0)}
            </p>
            <p className="text-[11px] text-neutral-500">
              Temps moyen d&apos;utilisation
            </p>
          </div>
          <div className="p-1.5 bg-neutral-50 border border-neutral-200 rounded">
            <Clock className="h-5 w-5 text-neutral-500" />
          </div>
        </div>
      </div>

      {/* Derniere activite */}
      <div className="bg-white border border-neutral-200 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-neutral-600">Derniere activite</p>
            <p className="text-xl font-bold text-neutral-900">
              {stats?.last_activity
                ? formatRelativeTime(stats.last_activity)
                : '-'}
            </p>
            <p className="text-[11px] text-neutral-500">Navigation LinkMe</p>
          </div>
          <div className="p-1.5 bg-neutral-50 border border-neutral-200 rounded">
            <Activity className="h-5 w-5 text-neutral-500" />
          </div>
        </div>
      </div>

      {/* Engagement */}
      <div className="bg-white border border-neutral-200 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-neutral-600">Engagement</p>
            <p className={`text-xl font-bold ${engagement.color}`}>
              {engagement.level}
            </p>
            <div className="flex items-center gap-2">
              <div className="w-16 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${engagement.bgColor}`}
                  style={{
                    width: `${Math.min(stats?.engagement_score ?? 0, 100)}%`,
                  }}
                />
              </div>
              <span className="text-[11px] text-neutral-500">
                {stats?.engagement_score ?? 0}%
              </span>
            </div>
          </div>
          <div className="p-1.5 bg-neutral-50 border border-neutral-200 rounded">
            <Target className="h-5 w-5 text-neutral-500" />
          </div>
        </div>
      </div>
    </div>
  );
}
