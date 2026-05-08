/**
 * ChannelTabs Component
 * Horizontal tab navigation for sales channels (LinkMe, Site Internet, Google Merchant)
 *
 * Features:
 * - Contextual tabs (only displays when in a sales channel)
 * - Breadcrumbs with back button to channels hub
 * - Grouped dropdown tabs (open on CLICK, not hover) for accessibility
 * - Active tab highlighting with bottom border
 */

'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@verone/utils';
import { ChevronDown, Settings } from 'lucide-react';

interface Tab {
  label: string;
  href: string;
}

interface TabGroup {
  label: string;
  icon?: 'settings';
  tabs: Tab[];
}

type TabItem = Tab | TabGroup;

function isGroup(item: TabItem): item is TabGroup {
  return 'tabs' in item;
}

const CHANNEL_TABS: Record<string, TabItem[]> = {
  linkme: [
    { label: 'Dashboard', href: '/canaux-vente/linkme' },
    {
      label: 'Réseau',
      tabs: [
        { label: 'Utilisateurs', href: '/canaux-vente/linkme/utilisateurs' },
        { label: 'Enseignes', href: '/canaux-vente/linkme/enseignes' },
        { label: 'Organisations', href: '/canaux-vente/linkme/organisations' },
      ],
    },
    {
      label: 'Commerce',
      tabs: [
        { label: 'Catalogue', href: '/canaux-vente/linkme/catalogue' },
        { label: 'Vedettes', href: '/canaux-vente/linkme/catalogue/vedettes' },
        {
          label: 'Fournisseurs',
          href: '/canaux-vente/linkme/catalogue/fournisseurs',
        },
        { label: 'Sélections', href: '/canaux-vente/linkme/selections' },
        { label: 'Commandes', href: '/canaux-vente/linkme/commandes' },
        { label: 'Approbations', href: '/canaux-vente/linkme/approbations' },
      ],
    },
    {
      label: 'Paiements',
      tabs: [
        { label: 'Commissions', href: '/canaux-vente/linkme/commissions' },
        {
          label: 'Demandes paiement',
          href: '/canaux-vente/linkme/demandes-paiement',
        },
      ],
    },
    { label: 'Stockage', href: '/canaux-vente/linkme/stockage' },
    {
      label: 'Config',
      icon: 'settings',
      tabs: [
        {
          label: 'Configuration',
          href: '/canaux-vente/linkme/configuration',
        },
        {
          label: 'Configuration prix',
          href: '/canaux-vente/linkme/catalogue/configuration',
        },
      ],
    },
  ],
  'site-internet': [
    { label: 'Dashboard', href: '/canaux-vente/site-internet' },
    { label: 'Analytique', href: '/canaux-vente/site-internet?tab=analytics' },
    {
      label: 'Catalogue',
      tabs: [
        { label: 'Produits', href: '/canaux-vente/site-internet?tab=products' },
        {
          label: 'Collections',
          href: '/canaux-vente/site-internet?tab=collections',
        },
        {
          label: 'Catégories',
          href: '/canaux-vente/site-internet?tab=categories',
        },
      ],
    },
    {
      label: 'Commerce',
      tabs: [
        { label: 'Clients', href: '/canaux-vente/site-internet?tab=customers' },
        { label: 'Promos', href: '/canaux-vente/site-internet?tab=promos' },
      ],
    },
    {
      label: 'Contenu',
      tabs: [
        { label: 'Pages', href: '/canaux-vente/site-internet?tab=content' },
        { label: 'Avis', href: '/canaux-vente/site-internet?tab=reviews' },
      ],
    },
    {
      label: 'Config',
      icon: 'settings',
      tabs: [
        {
          label: 'Configuration',
          href: '/canaux-vente/site-internet?tab=config',
        },
      ],
    },
  ],
  'google-merchant': [
    { label: 'Dashboard', href: '/canaux-vente/google-merchant' },
  ],
  meta: [{ label: 'Dashboard', href: '/canaux-vente/meta' }],
};

const CHANNEL_NAMES: Record<string, string> = {
  linkme: 'LinkMe',
  'site-internet': 'Site Internet',
  'google-merchant': 'Google Merchant',
  meta: 'Meta Commerce',
};

/**
 * DropdownTab — A tab that opens a dropdown menu on CLICK (not hover).
 * Closes on:
 *  - click outside (document listener)
 *  - link selection (item click)
 *  - Escape key
 */
function DropdownTab({
  group,
  pathname,
}: {
  group: TabGroup;
  pathname: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const isGroupActive = group.tabs.some(tab => pathname.startsWith(tab.href));

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(prev => !prev)}
        className={cn(
          'flex items-center gap-1 py-3 border-b-2 transition-colors whitespace-nowrap text-sm',
          isGroupActive
            ? 'border-black text-black font-medium'
            : 'border-transparent text-neutral-600 hover:text-neutral-900 hover:border-neutral-300'
        )}
      >
        {group.icon === 'settings' ? (
          <Settings className="h-4 w-4" />
        ) : (
          group.label
        )}
        <ChevronDown
          className={cn(
            'h-3 w-3 transition-transform',
            isOpen ? 'rotate-180' : ''
          )}
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute top-full left-0 z-50 mt-0 min-w-[200px] rounded-md border border-neutral-200 bg-white py-1 shadow-lg"
        >
          {group.tabs.map(tab => {
            const isActive = pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                role="menuitem"
                className={cn(
                  'block px-4 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-neutral-100 text-black font-medium'
                    : 'text-neutral-700 hover:bg-neutral-50 hover:text-black'
                )}
                onClick={() => setIsOpen(false)}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ChannelTabs() {
  const pathname = usePathname();

  let activeChannel: string | null = null;
  let tabItems: TabItem[] = [];

  if (pathname.startsWith('/canaux-vente/linkme')) {
    activeChannel = 'linkme';
    tabItems = CHANNEL_TABS.linkme;
  } else if (pathname.startsWith('/canaux-vente/site-internet')) {
    activeChannel = 'site-internet';
    tabItems = CHANNEL_TABS['site-internet'];
  } else if (pathname.startsWith('/canaux-vente/google-merchant')) {
    activeChannel = 'google-merchant';
    tabItems = CHANNEL_TABS['google-merchant'];
  } else if (pathname.startsWith('/canaux-vente/meta')) {
    activeChannel = 'meta';
    tabItems = CHANNEL_TABS.meta;
  }

  if (!activeChannel) return null;

  const channelName = CHANNEL_NAMES[activeChannel];

  return (
    <div className="border-b border-neutral-200 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        {/* Breadcrumbs + Back Button */}
        <div className="flex items-center gap-2 py-2 text-sm text-neutral-600">
          <Link
            href="/canaux-vente"
            className="hover:text-neutral-900 transition-colors"
          >
            &larr; Retour aux Canaux
          </Link>
          <span>/</span>
          <span className="text-neutral-900 font-medium">{channelName}</span>
        </div>

        {/* Tabs Navigation — flex-wrap au lieu de overflow-x-auto pour ne
            pas couper les dropdowns qui sortent vers le bas. */}
        <div className="flex flex-wrap gap-x-8 gap-y-0">
          {tabItems.map((item, index) => {
            if (isGroup(item)) {
              return (
                <DropdownTab
                  key={`group-${index}`}
                  group={item}
                  pathname={pathname}
                />
              );
            }

            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'py-3 border-b-2 transition-colors whitespace-nowrap text-sm',
                  isActive
                    ? 'border-black text-black font-medium'
                    : 'border-transparent text-neutral-600 hover:text-neutral-900 hover:border-neutral-300'
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
