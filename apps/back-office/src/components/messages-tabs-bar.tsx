'use client';

/**
 * MessagesTabsBar — barre d'onglets partagée entre /messages (Centre de
 * traitement) et /parametres/messagerie (Mails Gmail).
 *
 * Détecte le pathname actuel pour afficher le bon onglet actif. Sprint
 * BO-MSG-015 phase 2.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@verone/utils';
import { Inbox, Mail } from 'lucide-react';

const TABS = [
  {
    label: 'Centre de traitement',
    href: '/messages',
    icon: Inbox,
    matchExact: true,
  },
  {
    label: 'Mails',
    href: '/parametres/messagerie',
    icon: Mail,
    matchExact: false,
  },
] as const;

export function MessagesTabsBar(): JSX.Element {
  const pathname = usePathname() ?? '';

  return (
    <div className="border-b border-gray-200 bg-white">
      <nav className="flex items-center gap-1 px-2 sm:px-4">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = tab.matchExact
            ? pathname === tab.href
            : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                isActive
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
