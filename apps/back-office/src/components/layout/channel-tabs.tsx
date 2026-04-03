/**
 * ChannelTabs Component
 * Horizontal tab navigation for sales channels (LinkMe, Site Internet, Google Merchant)
 *
 * Features:
 * - Contextual tabs (only displays when in a sales channel)
 * - Breadcrumbs with back button to channels hub
 * - Grouped dropdown tabs for channels with many pages (LinkMe)
 * - Active tab highlighting with bottom border
 *
 * @see /Users/romeodossantos/.claude/plans/greedy-chasing-hinton.md
 */

'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState, useRef } from 'react';
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

/**
 * Tab configuration per sales channel
 * LinkMe uses grouped tabs (dropdowns) to reduce from 13 to 6 visible items
 */
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
        { label: 'Sélections', href: '/canaux-vente/linkme/selections' },
        { label: 'Commandes', href: '/canaux-vente/linkme/commandes' },
      ],
    },
    { label: 'Commissions', href: '/canaux-vente/linkme/commissions' },
    { label: 'Messages', href: '/canaux-vente/linkme/messages' },
    {
      label: 'Config',
      icon: 'settings',
      tabs: [
        {
          label: 'Configuration',
          href: '/canaux-vente/linkme/configuration',
        },
        { label: 'Stockage', href: '/canaux-vente/linkme/stockage' },
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
        { label: 'Commandes', href: '/canaux-vente/site-internet/commandes' },
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
    { label: 'Flux', href: '/canaux-vente/google-merchant/flux' },
    {
      label: 'Synchronisation',
      href: '/canaux-vente/google-merchant/sync',
    },
  ],
  meta: [{ label: 'Dashboard', href: '/canaux-vente/meta' }],
};

/**
 * Channel display names for breadcrumbs
 */
const CHANNEL_NAMES: Record<string, string> = {
  linkme: 'LinkMe',
  'site-internet': 'Site Internet',
  'google-merchant': 'Google Merchant',
  meta: 'Meta Commerce',
};

/**
 * DropdownTab — A tab that opens a dropdown menu on hover
 */
function DropdownTab({
  group,
  pathname,
}: {
  group: TabGroup;
  pathname: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isGroupActive = group.tabs.some(tab => pathname.startsWith(tab.href));

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setIsOpen(false), 150);
  };

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
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
        <div className="absolute top-full left-0 z-50 mt-0 min-w-[180px] rounded-md border border-neutral-200 bg-white py-1 shadow-lg">
          {group.tabs.map(tab => {
            const isActive = pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
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

/**
 * ChannelTabs - Horizontal tab navigation for sales channels
 *
 * Only renders when user is inside a sales channel (/canaux-vente/*)
 * Includes breadcrumbs and back button for easy navigation
 */
export function ChannelTabs() {
  const pathname = usePathname();

  // Detect which channel is active
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

  // Only render tabs if user is in a sales channel
  if (!activeChannel) return null;

  const channelName = CHANNEL_NAMES[activeChannel];

  return (
    <div className="border-b border-neutral-200 bg-white">
      <div className="container mx-auto px-6">
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

        {/* Tabs Navigation */}
        <div className="flex gap-8 overflow-x-auto scrollbar-thin scrollbar-thumb-neutral-300 scrollbar-track-transparent">
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
