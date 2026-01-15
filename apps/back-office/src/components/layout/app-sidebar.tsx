'use client';

import { useState, useMemo } from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  Badge,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@verone/ui';
// Popover pour menus interactifs, Tooltip pour labels simples
import { Popover, PopoverContent, PopoverTrigger } from '@verone/ui';
import { Tooltip, TooltipContent, TooltipTrigger } from '@verone/ui';
import { cn } from '@verone/utils';
import {
  featureFlags,
  getModuleDeploymentStatus,
} from '@verone/utils/feature-flags';
import { createClient } from '@verone/utils/supabase/client';
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
  Globe,
  Link2,
  Warehouse,
  Calculator,
  LayoutDashboard,
  ArrowLeftRight,
  BookOpenCheck,
} from 'lucide-react';

import {
  InactiveModuleWrapper,
  PhaseIndicator,
} from '@/components/ui/phase-indicator';

// Phase 1: use-stock-alerts-count hook désactivé (Phase 2+)
// import { useStockAlertsCount } from '@verone/stock'

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
    title: 'Contacts & Clients',
    href: '/contacts-organisations',
    icon: Building2,
    children: [
      {
        title: 'Enseignes',
        href: '/contacts-organisations/enseignes',
        icon: Building2,
      },
      {
        title: 'Organisations',
        href: '/contacts-organisations',
        icon: Users,
      },
      {
        title: 'Clients Particuliers',
        href: '/contacts-organisations/clients-particuliers',
        icon: User,
      },
    ],
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
        title: 'Inventaire',
        href: '/stocks/inventaire',
        icon: Package,
      },
      {
        title: 'Stockage',
        href: '/stocks/stockage',
        icon: Warehouse,
      },
      {
        title: 'Mouvements de stock',
        href: '/stocks/mouvements',
        icon: RefreshCw,
      },
      {
        title: 'Réceptions',
        href: '/stocks/receptions',
        icon: Truck,
      },
      {
        title: 'Expéditions',
        href: '/stocks/expeditions',
        icon: Truck,
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
      {
        title: 'Site Internet',
        href: '/canaux-vente/site-internet',
        icon: Globe,
      },
      {
        title: 'LinkMe',
        href: '/canaux-vente/linkme',
        icon: Link2,
        children: [
          {
            title: 'Dashboard',
            href: '/canaux-vente/linkme',
            icon: LayoutDashboard,
          },
          {
            title: 'Enseignes',
            href: '/canaux-vente/linkme/enseignes',
            icon: Building2,
          },
          {
            title: 'Sélections',
            href: '/canaux-vente/linkme/selections',
            icon: Layers,
          },
          {
            title: 'Commandes',
            href: '/canaux-vente/linkme/commandes',
            icon: ShoppingBag,
          },
          {
            title: 'À traiter',
            href: '/canaux-vente/linkme/commandes/a-traiter',
            icon: CheckCircle,
          },
          {
            title: 'Catalogue',
            href: '/canaux-vente/linkme/catalogue',
            icon: BookOpen,
          },
          {
            title: 'Commissions',
            href: '/canaux-vente/linkme/commissions',
            icon: Wallet,
          },
        ],
      },
    ],
  },
  {
    title: 'Comptabilité',
    href: '/finance',
    icon: Calculator,
    children: [
      {
        title: 'Tableau de bord',
        href: '/finance',
        icon: LayoutDashboard,
      },
      {
        title: 'Transactions',
        href: '/finance/transactions',
        icon: ArrowLeftRight,
      },
      {
        title: 'Catégorisation',
        href: '/finance/depenses',
        icon: Banknote,
      },
      {
        title: 'Livres comptables',
        href: '/finance/livres',
        icon: BookOpenCheck,
      },
    ],
  },
  {
    title: 'Facturation',
    href: '/factures',
    icon: FileText,
  },
  {
    title: 'Livraisons',
    href: '/livraisons',
    icon: Truck,
  },
  {
    title: 'Trésorerie',
    href: '/tresorerie',
    icon: Banknote,
  },
];

function SidebarContent() {
  const pathname = usePathname();
  // Sidebar toujours compacte - tooltips au survol
  const isCollapsed = true;

  // Phase 1 : Alertes stock désactivées (Phase 2+)
  const stockAlertsCount = 0; // Anciennement : useStockAlertsCount()

  // State local pour les items expandés (pas besoin de persistence cross-tab)
  const [expandedItems, setExpandedItems] = useState<string[]>([
    'Administration',
  ]);

  // Theme toggle supprimé (Phase 1 - pas nécessaire)

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
      Comptabilité: 'finance',
      Finance: 'finance',
      Facturation: 'factures',
      Factures: 'factures',
      Devis: 'factures',
      Avoirs: 'factures',
      Trésorerie: 'tresorerie',
      Organisation: 'contacts',
    };
    return moduleMap[title] || title.toLowerCase();
  };

  // Nav items (avec count dynamique pour badges)
  // Filtrer les modules Finance si désactivés
  const navItems = useMemo(() => {
    const items = getNavItems(stockAlertsCount);

    // Masquer Comptabilité/Facturation/Trésorerie si financeEnabled = false
    if (!featureFlags.financeEnabled) {
      const financeModules = ['Comptabilité', 'Facturation', 'Trésorerie'];
      return items.filter(item => !financeModules.includes(item.title));
    }

    return items;
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

    // Mode compact avec Popover pour sous-menus ou Tooltip pour items simples
    if (moduleStatus !== 'active') {
      // Module inactif - simple icône disabled
      return (
        <li key={item.title}>
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <div className="nav-item flex items-center justify-center px-2 py-2 text-sm rounded-md opacity-60 cursor-not-allowed">
                <item.icon className="h-4 w-4" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="font-medium">{item.title}</p>
              <PhaseIndicator
                moduleName={moduleName}
                variant="badge"
                className="mt-1"
              />
            </TooltipContent>
          </Tooltip>
        </li>
      );
    }

    // Items avec enfants → Popover interactif
    if (item.children && item.children.length > 0) {
      return (
        <li key={item.title}>
          <Popover>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  'nav-item w-full flex items-center justify-center px-2 py-2 text-sm rounded-md relative',
                  'transition-all duration-150 ease-out',
                  'text-black/70 hover:text-black hover:bg-black/5',
                  isActiveItem && 'bg-black text-white shadow-sm'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.badge && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent
              side="right"
              align="start"
              className="w-56 p-0"
              sideOffset={8}
            >
              <div className="font-semibold px-3 py-2 border-b bg-gray-50 text-sm">
                {item.title}
              </div>
              <div className="py-1">
                {item.children.map(child => {
                  const childHref: string = child.href ?? '#';
                  const isChildActive =
                    pathname === childHref ||
                    pathname.startsWith(childHref + '/');
                  return (
                    <Link
                      key={childHref}
                      href={childHref}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 text-sm transition-colors',
                        isChildActive
                          ? 'bg-black text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      )}
                    >
                      <child.icon className="h-4 w-4" />
                      <span>{child.title}</span>
                      {child.badge && (
                        <Badge
                          variant={
                            child.badgeVariant === 'urgent'
                              ? 'destructive'
                              : 'default'
                          }
                          className="ml-auto"
                        >
                          {child.badge}
                        </Badge>
                      )}
                    </Link>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
        </li>
      );
    }

    // Items simples → Tooltip
    return (
      <li key={item.title}>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <Link
              href={item.href!}
              className={cn(
                'nav-item flex items-center justify-center px-2 py-2 text-sm rounded-md relative',
                'transition-all duration-150 ease-out',
                'text-black/70 hover:text-black hover:bg-black/5',
                isActiveItem && 'bg-black text-white shadow-sm'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.badge && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            <p>{item.title}</p>
            {item.description && (
              <p className="text-xs opacity-70">{item.description}</p>
            )}
          </TooltipContent>
        </Tooltip>
      </li>
    );
  };

  return (
    <aside className="flex h-screen w-16 flex-col border-r border-black bg-white">
      {/* Logo Vérone - Compact avec tooltip */}
      <div className="flex h-16 items-center justify-center border-b border-black px-2">
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <Link
              href="/dashboard"
              className="flex items-center justify-center p-2 rounded-md hover:bg-black/5 transition-colors"
            >
              <div className="logo-black font-logo text-sm font-light tracking-wider">
                V
              </div>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>VÉRONE - Dashboard</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Navigation principale */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {navItems.map(item => renderNavItem(item))}
        </ul>
      </nav>

      {/* Zone déconnexion avec tooltip */}
      <div className="border-t border-black p-4">
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <button
              onClick={() => {
                const supabase = createClient();
                void supabase.auth.signOut().then(() => {
                  window.location.href = '/login';
                });
              }}
              className="flex w-full items-center justify-center px-3 py-2 text-sm text-black opacity-70 hover:opacity-100 hover:bg-black hover:bg-opacity-5 transition-all duration-150 rounded-md"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Déconnexion</p>
          </TooltipContent>
        </Tooltip>
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
