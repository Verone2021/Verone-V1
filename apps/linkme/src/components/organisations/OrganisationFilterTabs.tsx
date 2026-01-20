'use client';

/**
 * OrganisationFilterTabs
 *
 * Onglets de filtrage pour la page organisations
 * - Tout / Succursale / Franchise / Incomplet / Vue Carte
 * - Affiche le nombre d'organisations par catégorie
 * - Séparé de la barre d'actions pour une meilleure organisation visuelle
 *
 * @module OrganisationFilterTabs
 * @since 2026-01-14
 */

import { Badge } from '@verone/ui';
import { cn } from '@verone/utils';
import { Store, Map, Users, Contact } from 'lucide-react';

type TabType = 'all' | 'succursale' | 'franchise' | 'incomplete' | 'map' | 'contacts';

interface ITabStats {
  all: number;
  succursale: number;
  franchise: number;
  incomplete: number;
}

interface IOrganisationFilterTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  stats: ITabStats;
  /** Afficher l'onglet Contacts (enseigne admin uniquement) */
  showContactsTab?: boolean;
  /** Nombre de contacts enseigne (pour le badge) */
  contactsCount?: number;
}

export function OrganisationFilterTabs({
  activeTab,
  onTabChange,
  stats,
  showContactsTab = false,
  contactsCount = 0,
}: IOrganisationFilterTabsProps): JSX.Element {
  const tabs = [
    {
      id: 'all' as const,
      label: 'Tout',
      icon: Users,
      count: stats.all,
    },
    {
      id: 'succursale' as const,
      label: 'Succursales',
      icon: Store,
      count: stats.succursale,
    },
    {
      id: 'franchise' as const,
      label: 'Franchises',
      icon: Store,
      count: stats.franchise,
    },
    {
      id: 'incomplete' as const,
      label: 'À compléter',
      icon: Store,
      count: stats.incomplete,
    },
    {
      id: 'map' as const,
      label: 'Vue Carte',
      icon: Map,
      count: undefined,
    },
    // Onglet Contacts (conditionnel)
    ...(showContactsTab
      ? [
          {
            id: 'contacts' as const,
            label: 'Contacts Enseigne',
            icon: Contact,
            count: contactsCount,
          },
        ]
      : []),
  ];

  return (
    <div className="flex items-center gap-2 border-b border-gray-200 overflow-x-auto">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap',
              isActive
                ? 'border-linkme-turquoise text-linkme-turquoise'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <Badge
                variant={isActive ? 'default' : 'secondary'}
                className={cn(
                  'ml-1',
                  isActive
                    ? 'bg-linkme-turquoise text-white'
                    : 'bg-gray-100 text-gray-600'
                )}
              >
                {tab.count}
              </Badge>
            )}
          </button>
        );
      })}
    </div>
  );
}
