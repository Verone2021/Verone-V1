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
  Sliders,
  UserPlus,
  TrendingUp,
  CreditCard,
  FileSpreadsheet,
  Activity,
  Link2,
  FileText,
  Webhook,
  Star,
  Building2,
  Store,
  type LucideIcon,
} from 'lucide-react';

interface LinkMeNavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
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
    children: [
      {
        title: 'Liste',
        href: '/canaux-vente/linkme/utilisateurs',
        icon: Users,
      },
      {
        title: 'Demandes',
        href: '/canaux-vente/linkme/utilisateurs/demandes',
        icon: UserPlus,
      },
    ],
  },
  {
    title: 'Enseignes',
    href: '/canaux-vente/linkme/enseignes',
    icon: Building2,
    children: [
      {
        title: 'Liste',
        href: '/canaux-vente/linkme/enseignes',
        icon: Building2,
      },
      {
        title: 'Organisations',
        href: '/canaux-vente/linkme/enseignes/organisations',
        icon: Store,
      },
    ],
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
    children: [
      {
        title: 'Toutes',
        href: '/canaux-vente/linkme/selections',
        icon: Layers,
      },
      {
        title: 'Vedettes',
        href: '/canaux-vente/linkme/selections/vedettes',
        icon: Star,
      },
    ],
  },
  {
    title: 'Commissions',
    href: '/canaux-vente/linkme/commissions',
    icon: DollarSign,
    children: [
      {
        title: 'Suivi',
        href: '/canaux-vente/linkme/commissions',
        icon: DollarSign,
      },
      {
        title: 'Paiements',
        href: '/canaux-vente/linkme/commissions/paiements',
        icon: CreditCard,
      },
      {
        title: 'Export',
        href: '/canaux-vente/linkme/commissions/export',
        icon: FileSpreadsheet,
      },
    ],
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
        title: 'Tracking',
        href: '/canaux-vente/linkme/analytics/tracking',
        icon: Activity,
      },
      {
        title: 'Rapports',
        href: '/canaux-vente/linkme/analytics/rapports',
        icon: FileText,
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
      },
      {
        title: 'Intégrations',
        href: '/canaux-vente/linkme/configuration/integrations',
        icon: Webhook,
      },
    ],
  },
];

interface NavItemProps {
  item: LinkMeNavItem;
  isActive: boolean;
  isChildActive: boolean;
}

function NavItemComponent({ item, isActive, isChildActive }: NavItemProps) {
  const [isOpen, setIsOpen] = useState(isActive || isChildActive);
  const pathname = usePathname();
  const Icon = item.icon;
  const hasChildren = item.children && item.children.length > 0;

  // Check if this exact path is active (for items without children)
  const isExactActive = pathname === item.href;

  if (hasChildren) {
    return (
      <div className="space-y-1">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors',
            isChildActive
              ? 'bg-black text-white'
              : 'text-gray-700 hover:bg-gray-100'
          )}
        >
          <div className="flex items-center gap-3">
            <Icon className="h-4 w-4" />
            <span>{item.title}</span>
          </div>
          {isOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>

        {isOpen && (
          <div className="ml-4 pl-3 border-l border-gray-200 space-y-1">
            {item.children!.map(child => {
              const ChildIcon = child.icon;
              const isChildExactActive = pathname === child.href;
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
        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
        isExactActive
          ? 'bg-black text-white'
          : 'text-gray-700 hover:bg-gray-100'
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{item.title}</span>
      {item.badge !== undefined && item.badge > 0 && (
        <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

export function LinkMeSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-full bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <Link
          href="/canaux-vente/linkme"
          className="flex items-center gap-2 font-semibold text-lg"
        >
          <Link2 className="h-5 w-5 text-blue-600" />
          <span>LinkMe CMS</span>
        </Link>
        <p className="text-xs text-gray-500 mt-1">
          Gestion de la plateforme d'affiliation
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {LINKME_NAV.map(item => {
          // Check if current path is this item or any of its children
          const isActive = pathname === item.href;
          const isChildActive =
            item.children?.some(
              child =>
                pathname === child.href || pathname.startsWith(child.href + '/')
            ) || pathname.startsWith(item.href + '/');

          return (
            <NavItemComponent
              key={item.href}
              item={item}
              isActive={isActive}
              isChildActive={isChildActive}
            />
          );
        })}
      </nav>

      {/* Footer - Back to Channels */}
      <div className="p-4 border-t border-gray-200">
        <Link
          href="/canaux-vente"
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ChevronRight className="h-4 w-4 rotate-180" />
          <span>Retour aux canaux</span>
        </Link>
      </div>
    </aside>
  );
}
