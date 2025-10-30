'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { featureFlags, getModuleDeploymentStatus } from '@/lib/feature-flags';
import { createClient } from '@/lib/supabase/client';
import {
  InactiveModuleWrapper,
  PhaseIndicator,
} from '@/components/ui/phase-indicator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';
import {
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
// Phase 1: use-stock-alerts-count hook désactivé (Phase 2+)
// import { useStockAlertsCount } from "@/hooks/use-stock-alerts-count"
import {
  Home,
  Users,
  User,
  Activity,
  BookOpen,
  Package,
  Target,
  ShoppingBag,
  Truck,
  Wallet,
  Building2,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  Grid3x3,
  Tags,
  Layers,
  CheckCircle,
  MessageCircle,
  FileText,
  Banknote,
  RefreshCw,
} from 'lucide-react';

// Interface pour les éléments de navigation
interface NavItem {
  title: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  badge?: number;
  badgeVariant?: 'default' | 'urgent';
  children?: NavItem[];
}

// Navigation principale - Dashboard + Modules
const getNavItems = (stockAlertsCount: number): NavItem[] => [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: Home,
  },
  {
    title: 'Organisations & Contacts',
    href: '/organisation',
    icon: Building2,
  },
  // ============ PHASE 2+ MODULES ============
  {
    title: 'Produits',
    href: '/produits',
    icon: Package,
    children: [
      {
        title: 'Catalogue',
        href: '/produits/catalogue',
        icon: BookOpen,
      },
      {
        title: 'Sourcing',
        href: '/produits/sourcing',
        icon: Target,
      },
      {
        title: 'Collections',
        href: '/produits/catalogue/collections',
        icon: Layers,
      },
      {
        title: 'Catégories',
        href: '/produits/catalogue/categories',
        icon: Tags,
      },
      {
        title: 'Variantes',
        href: '/produits/catalogue/variantes',
        icon: Grid3x3,
      },
    ],
  },
  {
    title: 'Stocks',
    href: '/stocks',
    icon: Layers,
    children: [
      {
        title: 'Alertes',
        href: '/stocks/alertes',
        icon: Activity,
      },
      {
        title: 'Ajustements',
        href: '/stocks/ajustements',
        icon: RefreshCw,
      },
      {
        title: 'Entrées',
        href: '/stocks/entrees',
        icon: CheckCircle,
      },
      {
        title: 'Sorties',
        href: '/stocks/sorties',
        icon: LogOut,
      },
    ],
  },
  {
    title: 'Commandes',
    href: '/commandes',
    icon: ShoppingBag,
    children: [
      {
        title: 'Clients',
        href: '/commandes/clients',
        icon: Users,
      },
      {
        title: 'Fournisseurs',
        href: '/commandes/fournisseurs',
        icon: Building2,
      },
      {
        title: 'Expéditions',
        href: '/commandes/expeditions',
        icon: Truck,
      },
    ],
  },
  {
    title: 'Ventes',
    href: '/ventes',
    icon: Target,
  },
  {
    title: 'Consultations',
    href: '/consultations',
    icon: MessageCircle,
  },
  {
    title: 'Canaux Vente',
    href: '/canaux-vente',
    icon: Grid3x3,
    children: [
      {
        title: 'Google Merchant',
        href: '/canaux-vente/google-merchant',
        icon: ShoppingBag,
      },
    ],
  },
  {
    title: 'Finance',
    href: '/finance',
    icon: Wallet,
    children: [
      {
        title: 'Dépenses',
        href: '/finance/depenses',
        icon: Banknote,
      },
      {
        title: 'Rapprochement',
        href: '/finance/rapprochement',
        icon: CheckCircle,
      },
    ],
  },
  {
    title: 'Factures',
    href: '/factures',
    icon: FileText,
  },
  {
    title: 'Trésorerie',
    href: '/tresorerie',
    icon: Banknote,
  },
];

function SidebarContent() {
  const pathname = usePathname();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  // Phase 1 : Alertes stock désactivées (Phase 2+)
  const stockAlertsCount = 0; // Anciennement : useStockAlertsCount()

  // State persistence avec localStorage
  const [expandedItems, setExpandedItems] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('verone-sidebar-expanded');
      return saved ? JSON.parse(saved) : ['Administration']; // Administration section expanded by default
    }
    return ['Administration']; // Administration section expanded by default
  });

  // Theme toggle supprimé (Phase 1 - pas nécessaire)

  // Sauvegarder l'état dans localStorage
  useEffect(() => {
    localStorage.setItem(
      'verone-sidebar-expanded',
      JSON.stringify(expandedItems)
    );
  }, [expandedItems]);

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev =>
      prev.includes(title)
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  };

  const isActiveOrHasActiveChild = (item: NavItem): boolean => {
    if (
      item.href &&
      (pathname === item.href ||
        (item.href !== '/dashboard' && pathname.startsWith(item.href)))
    ) {
      return true;
    }
    if (item.children) {
      return item.children.some(child => isActiveOrHasActiveChild(child));
    }
    return false;
  };

  const getModuleName = (title: string): string => {
    const moduleMap: Record<string, string> = {
      Produits: 'catalogue',
      Catalogue: 'catalogue',
      Stocks: 'stocks',
      Sourcing: 'sourcing',
      Ventes: 'interactions',
      Achats: 'commandes',
      Finance: 'finance',
      Organisation: 'contacts',
    };
    return moduleMap[title] || title.toLowerCase();
  };

  // Nav items (avec count dynamique pour badges)
  const navItems = useMemo(() => {
    return getNavItems(stockAlertsCount);
  }, [stockAlertsCount]);

  // Fonction récursive pour rendre les enfants (support multi-niveaux)
  const renderChildNavItem = (
    child: NavItem,
    idx: number,
    isParentExpanded: boolean
  ): React.ReactNode => {
    const isChildActive =
      pathname === child.href ||
      (child.href !== '/dashboard' && pathname.startsWith(child.href!));
    const isChildExpanded = expandedItems.includes(child.title);

    if (child.children) {
      // Sous-menu avec enfants (ex: Sourcing)
      return (
        <li
          key={child.href || child.title}
          style={{
            animationDelay: `${idx * 50}ms`,
            animation: isParentExpanded
              ? 'slideIn 200ms ease-out forwards'
              : 'none',
          }}
        >
          <Collapsible
            open={isChildExpanded}
            onOpenChange={() => toggleExpanded(child.title)}
          >
            <div className="flex w-full items-center">
              <Link
                href={child.href!}
                prefetch={false}
                className={cn(
                  'nav-item flex flex-1 items-center gap-2 px-3 py-2 text-sm rounded-l relative',
                  'transition-all duration-150 ease-out',
                  'text-black/70 hover:text-black hover:bg-black/5 hover:scale-[1.02]',
                  isChildActive && 'bg-black text-white shadow-sm'
                )}
              >
                <child.icon className="h-4 w-4 flex-shrink-0" />
                <span className="font-medium">{child.title}</span>
              </Link>
              <CollapsibleTrigger
                className={cn(
                  'px-3 py-2 transition-all duration-150 ease-out rounded-r',
                  isChildActive
                    ? 'bg-black text-white shadow-sm'
                    : 'text-black/70 hover:text-black hover:bg-black/5'
                )}
              >
                <ChevronRight
                  className={cn(
                    'h-4 w-4 transition-transform duration-200',
                    isChildExpanded ? 'rotate-90' : 'rotate-0'
                  )}
                />
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="overflow-hidden transition-all duration-200">
              <ul className="mt-1 space-y-1 ml-4">
                {child.children.map((subChild, subIdx) =>
                  renderChildNavItem(subChild, subIdx, isChildExpanded)
                )}
              </ul>
            </CollapsibleContent>
          </Collapsible>
        </li>
      );
    }

    // Enfant simple (sans sous-menu)
    return (
      <li
        key={child.href}
        style={{
          animationDelay: `${idx * 50}ms`,
          animation: isParentExpanded
            ? 'slideIn 200ms ease-out forwards'
            : 'none',
        }}
      >
        <Link
          href={child.href!}
          prefetch={false}
          className={cn(
            'nav-item flex items-center gap-2 px-3 py-2 text-sm rounded-md relative',
            'transition-all duration-150 ease-out',
            'text-black/70 hover:text-black hover:bg-black/5 hover:scale-[1.02]',
            isChildActive && 'bg-black text-white shadow-sm'
          )}
        >
          <child.icon className="h-4 w-4 flex-shrink-0" />
          <span className="font-medium">{child.title}</span>
          {child.badge && (
            <Badge
              variant={
                child.badgeVariant === 'urgent' ? 'destructive' : 'default'
              }
              className="ml-auto"
            >
              {child.badge}
            </Badge>
          )}
        </Link>
      </li>
    );
  };

  const renderNavItem = (item: NavItem) => {
    const moduleName = getModuleName(item.title);
    const moduleStatus = getModuleDeploymentStatus(moduleName);
    const isExpanded = expandedItems.includes(item.title);
    const isActiveItem = isActiveOrHasActiveChild(item);

    const navContent = (
      <li key={item.title} className="relative">
        {item.children ? (
          <Collapsible
            open={isExpanded}
            onOpenChange={() =>
              moduleStatus === 'active' && toggleExpanded(item.title)
            }
          >
            <div className="flex w-full items-center">
              <Link
                href={moduleStatus === 'active' ? item.href! : '#'}
                onClick={e => moduleStatus !== 'active' && e.preventDefault()}
                prefetch={moduleStatus === 'active' ? undefined : false}
                className={cn(
                  'nav-item flex flex-1 items-center gap-2 px-3 py-2 text-sm rounded-l relative',
                  'transition-all duration-150 ease-out',
                  'text-black/70 hover:text-black hover:bg-black/5 hover:scale-[1.02]',
                  isActiveItem && 'bg-black text-white shadow-sm',
                  moduleStatus !== 'active' &&
                    'opacity-60 cursor-not-allowed hover:scale-100 hover:bg-transparent',
                  isCollapsed && 'justify-center px-2'
                )}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {!isCollapsed && (
                  <>
                    <span className="font-medium">{item.title}</span>
                    {moduleStatus !== 'active' && (
                      <PhaseIndicator
                        moduleName={moduleName}
                        variant="badge"
                        className="ml-auto scale-75"
                      />
                    )}
                    {item.badge && (
                      <Badge
                        variant={
                          item.badgeVariant === 'urgent'
                            ? 'destructive'
                            : 'default'
                        }
                        className="ml-auto"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </Link>

              {moduleStatus === 'active' && !isCollapsed && (
                <CollapsibleTrigger
                  className={cn(
                    'px-3 py-2 transition-all duration-150 ease-out rounded-r',
                    isActiveItem
                      ? 'bg-black text-white shadow-sm'
                      : 'text-black/70 hover:text-black hover:bg-black/5'
                  )}
                >
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 transition-transform duration-200',
                      isExpanded ? 'rotate-0' : '-rotate-90'
                    )}
                  />
                </CollapsibleTrigger>
              )}
            </div>

            {moduleStatus === 'active' && !isCollapsed && (
              <CollapsibleContent className="overflow-hidden transition-all duration-200 data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                <ul className="mt-1 space-y-1 ml-4">
                  {item.children.map((child, idx) =>
                    renderChildNavItem(child, idx, isExpanded)
                  )}
                </ul>
              </CollapsibleContent>
            )}
          </Collapsible>
        ) : (
          <Link
            href={moduleStatus === 'active' ? item.href! : '#'}
            onClick={e => moduleStatus !== 'active' && e.preventDefault()}
            prefetch={moduleStatus === 'active' ? undefined : false}
            className={cn(
              'nav-item flex items-center gap-2 px-3 py-2 text-sm rounded-md relative',
              'transition-all duration-150 ease-out',
              'text-black/70 hover:text-black hover:bg-black/5 hover:scale-[1.02]',
              isActiveItem && 'bg-black text-white shadow-sm',
              moduleStatus !== 'active' &&
                'opacity-60 cursor-not-allowed hover:scale-100 hover:bg-transparent',
              isCollapsed && 'justify-center px-2'
            )}
          >
            <item.icon className="h-4 w-4 flex-shrink-0" />
            {!isCollapsed && (
              <>
                <span className="font-medium">{item.title}</span>
                {moduleStatus !== 'active' && (
                  <PhaseIndicator
                    moduleName={moduleName}
                    variant="badge"
                    className="ml-auto scale-75"
                  />
                )}
                {item.badge && (
                  <Badge
                    variant={
                      item.badgeVariant === 'urgent' ? 'destructive' : 'default'
                    }
                    className="ml-auto"
                  >
                    {item.badge}
                  </Badge>
                )}
              </>
            )}
          </Link>
        )}
      </li>
    );

    // Wrap with tooltip if collapsed
    if (isCollapsed && moduleStatus === 'active') {
      return (
        <Tooltip key={item.title} delayDuration={300}>
          <TooltipTrigger asChild>{navContent}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            <p>{item.title}</p>
            {item.description && (
              <p className="text-xs opacity-70">{item.description}</p>
            )}
          </TooltipContent>
        </Tooltip>
      );
    }

    return navContent;
  };

  return (
    <aside
      className={cn(
        'flex h-screen flex-col border-r border-black bg-white transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo Vérone + Toggle */}
      <div
        className={cn(
          'flex h-16 items-center border-b border-black transition-all',
          isCollapsed ? 'justify-center px-2' : 'justify-between px-6'
        )}
      >
        {!isCollapsed && (
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="logo-black font-logo text-xl font-light tracking-wider">
              VÉRONE
            </div>
          </Link>
        )}
        <SidebarTrigger />
      </div>

      {/* Navigation principale */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {navItems.map(item => renderNavItem(item))}
        </ul>
      </nav>

      {/* Zone déconnexion */}
      <div className="border-t border-black p-4">
        <button
          onClick={async () => {
            const supabase = createClient();
            await supabase.auth.signOut();
            window.location.href = '/login';
          }}
          className={cn(
            'flex w-full items-center space-x-2 px-3 py-2 text-sm text-black opacity-70 hover:opacity-100 hover:bg-black hover:bg-opacity-5 transition-all duration-150 rounded-md',
            isCollapsed && 'justify-center'
          )}
        >
          <LogOut className="h-4 w-4" />
          {!isCollapsed && <span>Déconnexion</span>}
        </button>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </aside>
  );
}

export function AppSidebar({ className }: { className?: string }) {
  return <SidebarContent />;
}
