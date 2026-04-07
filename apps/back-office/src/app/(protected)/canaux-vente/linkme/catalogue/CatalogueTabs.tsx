'use client';

import Link from 'next/link';

import { Badge } from '@verone/ui';
import { cn } from '@verone/utils';
import { ShoppingBag, Users, UserPlus } from 'lucide-react';

interface CatalogueTabsProps {
  activeTab: 'general' | 'sourced' | 'affiliate';
  onTabChange: (tab: 'general' | 'sourced' | 'affiliate') => void;
  stats: {
    total: number;
    enabled: number;
    generalCount: number;
    sourcedCount: number;
    affiliateCount: number;
  };
  statusFilter: 'all' | 'enabled' | 'disabled';
  onStatusFilterChange: (filter: 'all' | 'enabled' | 'disabled') => void;
  pendingCount: number;
}

export function CatalogueTabs({
  activeTab,
  onTabChange,
  stats,
  statusFilter,
  onStatusFilterChange,
  pendingCount,
}: CatalogueTabsProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex gap-2">
        <button
          onClick={() => onTabChange('general')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
            activeTab === 'general'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          <ShoppingBag className="h-4 w-4" />
          Catalogue général
          <span
            className={cn(
              'px-2 py-0.5 rounded-full text-xs font-bold',
              activeTab === 'general'
                ? 'bg-white/20 text-white'
                : 'bg-gray-200 text-gray-700'
            )}
          >
            {stats.generalCount}
          </span>
        </button>

        <button
          onClick={() => onTabChange('sourced')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
            activeTab === 'sourced'
              ? 'bg-amber-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          <Users className="h-4 w-4" />
          Produits sur mesure
          <span
            className={cn(
              'px-2 py-0.5 rounded-full text-xs font-bold',
              activeTab === 'sourced'
                ? 'bg-white/20 text-white'
                : 'bg-gray-200 text-gray-700'
            )}
          >
            {stats.sourcedCount}
          </span>
        </button>

        <button
          onClick={() => onTabChange('affiliate')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
            activeTab === 'affiliate'
              ? 'bg-violet-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          <UserPlus className="h-4 w-4" />
          Produits des affiliés
          <span
            className={cn(
              'px-2 py-0.5 rounded-full text-xs font-bold',
              activeTab === 'affiliate'
                ? 'bg-white/20 text-white'
                : 'bg-gray-200 text-gray-700'
            )}
          >
            {stats.affiliateCount}
          </span>
          {pendingCount > 0 && (
            <Link
              href="/canaux-vente/linkme/approbations"
              onClick={e => e.stopPropagation()}
              className="ml-1"
            >
              <Badge
                variant="destructive"
                className="animate-pulse hover:scale-105 transition-transform"
              >
                {pendingCount} en attente
              </Badge>
            </Link>
          )}
        </button>
      </div>

      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => onStatusFilterChange('all')}
          className={cn(
            'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
            statusFilter === 'all'
              ? 'bg-white shadow-sm text-gray-900'
              : 'text-gray-600 hover:text-gray-900'
          )}
        >
          Tous
          <span className="ml-1.5 text-xs text-gray-500">{stats.total}</span>
        </button>
        <button
          onClick={() => onStatusFilterChange('enabled')}
          className={cn(
            'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
            statusFilter === 'enabled'
              ? 'bg-green-100 shadow-sm text-green-700'
              : 'text-gray-600 hover:text-gray-900'
          )}
        >
          Actifs
          <span className="ml-1.5 text-xs">{stats.enabled}</span>
        </button>
        <button
          onClick={() => onStatusFilterChange('disabled')}
          className={cn(
            'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
            statusFilter === 'disabled'
              ? 'bg-red-100 shadow-sm text-red-700'
              : 'text-gray-600 hover:text-gray-900'
          )}
        >
          Désactivés
          <span className="ml-1.5 text-xs">{stats.total - stats.enabled}</span>
        </button>
      </div>
    </div>
  );
}
