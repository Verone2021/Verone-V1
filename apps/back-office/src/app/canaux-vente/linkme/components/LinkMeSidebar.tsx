'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Popover, PopoverContent, PopoverTrigger } from '@verone/ui';
import { Tooltip, TooltipContent, TooltipTrigger } from '@verone/ui';
import { cn } from '@verone/utils';
import {
  LayoutDashboard,
  Package,
  Users,
  Layers,
  DollarSign,
  BarChart3,
  Settings,
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
  ClipboardCheck,
  Warehouse,
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
    title: 'Approbations',
    href: '/canaux-vente/linkme/approbations',
    icon: ClipboardCheck,
  },
  {
    title: 'Stockage',
    href: '/canaux-vente/linkme/stockage',
    icon: Warehouse,
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
}

/**
 * Composant de navigation compact
 * - Popover interactif pour items avec enfants (cliquable)
 * - Tooltip simple pour items sans enfants
 */
function NavItemComponent({ item, isActive, isChildActive }: NavItemProps) {
  const pathname = usePathname();
  const Icon = item.icon;
  const hasChildren = item.children && item.children.length > 0;
  const isExactActive = pathname === item.href;

  // Item avec sous-menu → Popover interactif
  if (hasChildren) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button
            className={cn(
              'w-full flex items-center justify-center rounded-lg p-2 text-sm font-medium transition-colors relative',
              isChildActive || isActive
                ? 'bg-black text-white'
                : 'text-gray-700 hover:bg-gray-100'
            )}
          >
            <Icon className="h-5 w-5" />
            {item.badge !== undefined && item.badge > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                {item.badge > 9 ? '9+' : item.badge}
              </span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent
          side="right"
          align="start"
          className="p-0 w-52"
          sideOffset={8}
        >
          <div className="font-semibold px-3 py-2 border-b bg-gray-50 text-sm">
            {item.title}
          </div>
          <div className="py-1">
            {item.children!.map(child => {
              const ChildIcon = child.icon;
              const isChildExactActive = pathname === child.href;

              if (child.disabled) {
                return (
                  <div
                    key={child.href}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 cursor-not-allowed"
                  >
                    <ChildIcon className="h-4 w-4" />
                    <span>{child.title}</span>
                    {child.disabledLabel && (
                      <span className="ml-auto text-[10px] bg-gray-200 px-1 rounded">
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
                    'flex items-center gap-2 px-3 py-2 text-sm transition-colors',
                    isChildExactActive
                      ? 'bg-black text-white'
                      : 'text-gray-700 hover:bg-gray-50'
                  )}
                >
                  <ChildIcon className="h-4 w-4" />
                  <span>{child.title}</span>
                </Link>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  // Item simple → Tooltip avec titre
  return (
    <Tooltip delayDuration={100}>
      <TooltipTrigger asChild>
        <Link
          href={item.href}
          className={cn(
            'relative flex items-center justify-center rounded-lg p-2 text-sm font-medium transition-colors',
            isExactActive
              ? 'bg-black text-white'
              : 'text-gray-700 hover:bg-gray-100'
          )}
        >
          <Icon className="h-5 w-5" />
          {item.badge !== undefined && item.badge > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
              {item.badge > 9 ? '9+' : item.badge}
            </span>
          )}
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={8}>
        {item.title}
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Sidebar LinkMe - Toujours compacte avec tooltips
 * Plus de hover expand/collapse - navigation rapide par tooltips
 */
export function LinkMeSidebar() {
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
    <aside className="h-full w-16 bg-white border-r border-gray-200 flex flex-col">
      {/* Header - Logo LinkMe avec tooltip */}
      <div className="border-b border-gray-200 p-2 flex justify-center">
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <Link
              href="/canaux-vente/linkme"
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Link2 className="h-6 w-6 text-blue-600" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            <p className="font-semibold">LinkMe CMS</p>
            <p className="text-xs text-gray-500">Plateforme d'affiliation</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Navigation - Icons avec tooltips */}
      <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden p-2">
        {navWithBadges.map(item => {
          const isActive = pathname === item.href;
          const isChildActive =
            item.children?.some(
              child =>
                pathname === child.href || pathname.startsWith(child.href + '/')
            ) ?? pathname.startsWith(item.href + '/');

          return (
            <div key={item.href} className="relative">
              <NavItemComponent
                item={item}
                isActive={isActive}
                isChildActive={isChildActive}
              />
            </div>
          );
        })}
      </nav>

      {/* Footer - Retour aux canaux avec tooltip */}
      <div className="border-t border-gray-200 p-2">
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <Link
              href="/canaux-vente"
              className="flex items-center justify-center p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            Retour aux canaux de vente
          </TooltipContent>
        </Tooltip>
      </div>
    </aside>
  );
}
