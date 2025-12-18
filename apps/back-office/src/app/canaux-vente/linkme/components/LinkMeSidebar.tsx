'use client';

import { useState } from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@verone/utils';
import {
  LayoutDashboard,
  Package,
  Users,
  Layers,
  DollarSign,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Sliders,
  TrendingUp,
  Link2,
  FileText,
  Webhook,
  Star,
  Building2,
  Store,
  ShoppingCart,
  Banknote,
  PanelLeftClose,
  PanelLeft,
  type LucideIcon,
} from 'lucide-react';

import { usePaymentRequestsCounts } from '../hooks/use-payment-requests-admin';

interface LinkMeNavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
  disabled?: boolean;
  disabledLabel?: string;
  children?: LinkMeNavItem[];
}

const LINKME_NAV: LinkMeNavItem[] = [
  {
    title: 'Tableau de Bord',
    href: '/canaux-vente/linkme',
    icon: LayoutDashboard,
  },
  {
    title: 'Utilisateurs',
    href: '/canaux-vente/linkme/utilisateurs',
    icon: Users,
  },
  {
    title: 'Enseignes & Orgs',
    href: '/canaux-vente/linkme/enseignes',
    icon: Building2,
  },
  {
    title: 'Catalogue',
    href: '/canaux-vente/linkme/catalogue',
    icon: Package,
    children: [
      {
        title: 'Produits',
        href: '/canaux-vente/linkme/catalogue',
        icon: Package,
      },
      {
        title: 'Vedettes',
        href: '/canaux-vente/linkme/catalogue/vedettes',
        icon: Star,
      },
      {
        title: 'Fournisseurs',
        href: '/canaux-vente/linkme/catalogue/fournisseurs',
        icon: Store,
      },
      {
        title: 'Configuration Prix',
        href: '/canaux-vente/linkme/catalogue/configuration',
        icon: Sliders,
      },
    ],
  },
  {
    title: 'Sélections',
    href: '/canaux-vente/linkme/selections',
    icon: Layers,
  },
  {
    title: 'Commandes',
    href: '/canaux-vente/linkme/commandes',
    icon: ShoppingCart,
  },
  {
    title: 'Rémunération',
    href: '/canaux-vente/linkme/commissions',
    icon: DollarSign,
  },
  {
    title: 'Demandes paiement',
    href: '/canaux-vente/linkme/demandes-paiement',
    icon: Banknote,
  },
  {
    title: 'Analytics',
    href: '/canaux-vente/linkme/analytics',
    icon: BarChart3,
    children: [
      {
        title: "Vue d'ensemble",
        href: '/canaux-vente/linkme/analytics',
        icon: BarChart3,
      },
      {
        title: 'Performance',
        href: '/canaux-vente/linkme/analytics/performance',
        icon: TrendingUp,
      },
      {
        title: 'Rapports',
        href: '/canaux-vente/linkme/analytics/rapports',
        icon: FileText,
        disabled: true,
        disabledLabel: 'Bientôt',
      },
    ],
  },
  {
    title: 'Configuration',
    href: '/canaux-vente/linkme/configuration',
    icon: Settings,
    children: [
      {
        title: 'Paramètres',
        href: '/canaux-vente/linkme/configuration',
        icon: Settings,
      },
      {
        title: 'Commissions',
        href: '/canaux-vente/linkme/configuration/commissions',
        icon: DollarSign,
        disabled: true,
        disabledLabel: 'Bientôt',
      },
      {
        title: 'Intégrations',
        href: '/canaux-vente/linkme/configuration/integrations',
        icon: Webhook,
        disabled: true,
        disabledLabel: 'Bientôt',
      },
    ],
  },
];

interface NavItemProps {
  item: LinkMeNavItem;
  isActive: boolean;
  isChildActive: boolean;
  isExpanded: boolean;
}

function NavItemComponent({
  item,
  isActive,
  isChildActive,
  isExpanded,
}: NavItemProps) {
  const [isOpen, setIsOpen] = useState(isActive || isChildActive);
  const pathname = usePathname();
  const Icon = item.icon;
  const hasChildren = item.children && item.children.length > 0;
  const isExactActive = pathname === item.href;

  // En mode collapsed, ne pas afficher les children
  if (hasChildren) {
    return (
      <div className="space-y-1">
        <button
          onClick={() => isExpanded && setIsOpen(!isOpen)}
          className={cn(
            'w-full flex items-center justify-between rounded-lg text-sm font-medium transition-all duration-200',
            isExpanded ? 'px-3 py-2' : 'px-2 py-2 justify-center',
            isChildActive
              ? 'bg-black text-white'
              : 'text-gray-700 hover:bg-gray-100'
          )}
          title={!isExpanded ? item.title : undefined}
        >
          <div
            className={cn('flex items-center', isExpanded ? 'gap-3' : 'gap-0')}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            <span
              className={cn(
                'whitespace-nowrap transition-all duration-200',
                isExpanded
                  ? 'opacity-100 w-auto'
                  : 'opacity-0 w-0 overflow-hidden'
              )}
            >
              {item.title}
            </span>
          </div>
          {isExpanded &&
            (isOpen ? (
              <ChevronDown className="h-4 w-4 flex-shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 flex-shrink-0" />
            ))}
        </button>

        {isOpen && isExpanded && (
          <div className="ml-4 pl-3 border-l border-gray-200 space-y-1">
            {item.children!.map(child => {
              const ChildIcon = child.icon;
              const isChildExactActive = pathname === child.href;

              // Éléments désactivés (non cliquables, grisés)
              if (child.disabled) {
                return (
                  <div
                    key={child.href}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 cursor-not-allowed"
                    title="Fonctionnalité bientôt disponible"
                  >
                    <ChildIcon className="h-4 w-4" />
                    <span>{child.title}</span>
                    {child.disabledLabel && (
                      <span className="ml-auto bg-gray-200 text-gray-500 text-[10px] px-1.5 py-0.5 rounded">
                        {child.disabledLabel}
                      </span>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={child.href}
                  href={child.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                    isChildExactActive
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <ChildIcon className="h-4 w-4" />
                  <span>{child.title}</span>
                  {child.badge !== undefined && child.badge > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {child.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center rounded-lg text-sm font-medium transition-all duration-200',
        isExpanded ? 'px-3 py-2 gap-3' : 'px-2 py-2 justify-center',
        isExactActive
          ? 'bg-black text-white'
          : 'text-gray-700 hover:bg-gray-100'
      )}
      title={!isExpanded ? item.title : undefined}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span
        className={cn(
          'whitespace-nowrap transition-all duration-200',
          isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'
        )}
      >
        {item.title}
      </span>
      {item.badge !== undefined && item.badge > 0 && isExpanded && (
        <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
          {item.badge}
        </span>
      )}
      {item.badge !== undefined && item.badge > 0 && !isExpanded && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
          {item.badge > 9 ? '9+' : item.badge}
        </span>
      )}
    </Link>
  );
}

export function LinkMeSidebar() {
  const [isExpanded, setIsExpanded] = useState(true);
  const pathname = usePathname();
  const { data: counts } = usePaymentRequestsCounts();

  // Injecter le badge dynamique pour les demandes de paiement
  const navWithBadges = LINKME_NAV.map(item => {
    if (item.href === '/canaux-vente/linkme/demandes-paiement' && counts) {
      return { ...item, badge: counts.total_pending };
    }
    return item;
  });

  return (
    <aside
      className={cn(
        'h-full bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out',
        isExpanded ? 'w-64' : 'w-16'
      )}
    >
      {/* Header avec bouton toggle */}
      <div
        className={cn(
          'border-b border-gray-200 transition-all duration-200',
          isExpanded ? 'p-4' : 'p-2'
        )}
      >
        {isExpanded ? (
          <div className="flex items-center justify-between">
            <Link
              href="/canaux-vente/linkme"
              className="flex items-center gap-2 text-lg font-semibold"
            >
              <Link2 className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <span className="whitespace-nowrap">LinkMe CMS</span>
            </Link>
            {/* Bouton réduire */}
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              title="Réduire"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Link
              href="/canaux-vente/linkme"
              className="p-1"
              title="LinkMe CMS"
            >
              <Link2 className="h-6 w-6 text-blue-600" />
            </Link>
            {/* Bouton agrandir */}
            <button
              onClick={() => setIsExpanded(true)}
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              title="Agrandir"
            >
              <PanelLeft className="h-4 w-4" />
            </button>
          </div>
        )}
        {isExpanded && (
          <p className="text-xs text-gray-500 mt-1">
            Gestion de la plateforme d&apos;affiliation
          </p>
        )}
      </div>

      {/* Navigation */}
      <nav
        className={cn(
          'flex-1 space-y-1 overflow-y-auto overflow-x-hidden transition-all duration-200',
          isExpanded ? 'p-4' : 'p-2'
        )}
      >
        {navWithBadges.map(item => {
          const isActive = pathname === item.href;
          const isChildActive =
            item.children?.some(
              child =>
                pathname === child.href || pathname.startsWith(child.href + '/')
            ) || pathname.startsWith(item.href + '/');

          return (
            <div key={item.href} className="relative">
              <NavItemComponent
                item={item}
                isActive={isActive}
                isChildActive={isChildActive}
                isExpanded={isExpanded}
              />
            </div>
          );
        })}
      </nav>

      {/* Footer - Back to Channels */}
      <div
        className={cn(
          'border-t border-gray-200 transition-all duration-200',
          isExpanded ? 'p-4' : 'p-2'
        )}
      >
        <Link
          href="/canaux-vente"
          className={cn(
            'flex items-center text-sm text-gray-600 hover:text-gray-900 transition-all duration-200',
            isExpanded ? 'gap-2' : 'justify-center'
          )}
          title={!isExpanded ? 'Retour aux canaux' : undefined}
        >
          <ChevronLeft className="h-4 w-4 flex-shrink-0" />
          <span
            className={cn(
              'whitespace-nowrap transition-all duration-200',
              isExpanded
                ? 'opacity-100 w-auto'
                : 'opacity-0 w-0 overflow-hidden'
            )}
          >
            Retour aux canaux
          </span>
        </Link>
      </div>
    </aside>
  );
}
