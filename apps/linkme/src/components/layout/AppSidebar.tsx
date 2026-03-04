'use client';

import { useState, useEffect, useCallback } from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  LayoutDashboard,
  Star,
  Package,
  ShoppingCart,
  Coins,
  BarChart3,
  Building2,
  LogOut,
  X,
  ChevronDown,
  ChevronRight,
  Share2,
  Users,
  Warehouse,
  HelpCircle,
  type LucideIcon,
} from 'lucide-react';

import { useAuth, type LinkMeRole } from '@/contexts/AuthContext';
import { ROUTE_PERMISSIONS } from '@/config/route-permissions';
import { cn } from '@/lib/utils';

import { useSidebar } from './SidebarProvider';

interface SidebarLink {
  type?: 'link';
  icon: LucideIcon;
  label: string;
  href: string;
  roles?: LinkMeRole[];
}

interface SidebarSubLink {
  label: string;
  href: string;
  icon: LucideIcon;
  roles?: LinkMeRole[];
}

interface SidebarGroup {
  type: 'group';
  label: string;
  icon: LucideIcon;
  subLinks: SidebarSubLink[];
}

type SidebarItem = SidebarLink | SidebarGroup;

// Hrefs appartenant au groupe Produits (pour auto-open)
const PRODUITS_HREFS = ['/ma-selection', '/mes-produits'];

// Hrefs appartenant au groupe Réseau (pour auto-open)
const RESEAU_HREFS = ['/organisations', '/contacts'];

const sidebarItems: SidebarItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  {
    type: 'group',
    label: 'Réseau',
    icon: Share2,
    subLinks: [
      {
        label: 'Organisations',
        href: '/organisations',
        icon: Building2,
        roles: ROUTE_PERMISSIONS['/organisations']?.roles,
      },
      {
        label: 'Contacts',
        href: '/contacts',
        icon: Users,
        roles: ROUTE_PERMISSIONS['/contacts']?.roles,
      },
    ],
  },
  {
    type: 'group',
    label: 'Produits',
    icon: Package,
    subLinks: [
      {
        label: 'Mes Sélections',
        href: '/ma-selection',
        icon: Star,
        roles: ROUTE_PERMISSIONS['/ma-selection']?.roles,
      },
      {
        label: 'Mes Produits',
        href: '/mes-produits',
        icon: Package,
        roles: ROUTE_PERMISSIONS['/mes-produits']?.roles,
      },
    ],
  },
  { icon: ShoppingCart, label: 'Commandes', href: '/commandes' },
  { icon: Coins, label: 'Commissions', href: '/commissions' },
  { icon: BarChart3, label: 'Statistiques', href: '/statistiques' },
  { icon: Warehouse, label: 'Stockage', href: '/stockage' },
  { icon: HelpCircle, label: 'Aide', href: '/aide' },
];

function isProduitsPath(pathname: string): boolean {
  return PRODUITS_HREFS.some(
    href => pathname === href || pathname.startsWith(`${href}/`)
  );
}

function isReseauPath(pathname: string): boolean {
  return RESEAU_HREFS.some(
    href => pathname === href || pathname.startsWith(`${href}/`)
  );
}

export function AppSidebar(): JSX.Element | null {
  const pathname = usePathname();
  const { isOpen, isMobile, close, setIsMobile } = useSidebar();
  const { user, linkMeRole, signOut } = useAuth();

  // Mémoriser le dernier rôle valide pour éviter les flashes visuels
  const [cachedRole, setCachedRole] = useState<typeof linkMeRole>(() => {
    if (typeof window === 'undefined') return null;
    const stored = sessionStorage.getItem('linkme_role_cache');
    return stored ? (JSON.parse(stored) as typeof linkMeRole) : null;
  });

  useEffect(() => {
    if (linkMeRole) {
      setCachedRole(linkMeRole);
      sessionStorage.setItem('linkme_role_cache', JSON.stringify(linkMeRole));
    }
  }, [linkMeRole]);

  const roleToUse = linkMeRole ?? cachedRole;

  // État ouverture des groupes collapsibles
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const initial: string[] = [];
    if (isProduitsPath(pathname)) initial.push('Produits');
    if (isReseauPath(pathname)) initial.push('Réseau');
    return new Set(initial);
  });

  // Auto-open groupe Produits quand pathname correspond
  useEffect(() => {
    if (isProduitsPath(pathname)) {
      setOpenGroups(prev => {
        if (prev.has('Produits')) return prev;
        return new Set([...prev, 'Produits']);
      });
    }
  }, [pathname]);

  // Auto-open groupe Réseau quand pathname correspond
  useEffect(() => {
    if (isReseauPath(pathname)) {
      setOpenGroups(prev => {
        if (prev.has('Réseau')) return prev;
        return new Set([...prev, 'Réseau']);
      });
    }
  }, [pathname]);

  const toggleGroup = useCallback((label: string): void => {
    setOpenGroups(prev => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  }, []);

  // Filtrer les items selon le rôle
  const filteredItems = sidebarItems.filter(item => {
    if (item.type === 'group') {
      // Afficher le groupe si au moins un sous-lien est accessible
      return item.subLinks.some(sub => {
        if (!sub.roles) return true;
        if (!roleToUse) return false;
        return sub.roles.includes(roleToUse.role);
      });
    }
    if (!item.roles) return true;
    if (!roleToUse) return false;
    return item.roles.includes(roleToUse.role);
  });

  // État pour le hover (desktop) - collapsible
  const [isExpanded, setIsExpanded] = useState(false);

  // Detect mobile on mount and resize
  useEffect(() => {
    const checkMobile = (): void => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return (): void => {
      window.removeEventListener('resize', checkMobile);
    };
  }, [setIsMobile]);

  // Close sidebar on route change (mobile only)
  useEffect(() => {
    if (isMobile) {
      close();
    }
  }, [pathname, isMobile, close]);

  const handleSignOut = useCallback(async (): Promise<void> => {
    await signOut('/');
  }, [signOut]);

  if (!user) {
    return null;
  }

  // ─── MOBILE ───────────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <>
        {isOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={close}
          />
        )}

        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-100 flex flex-col transition-transform duration-300 ease-in-out',
            !isOpen && '-translate-x-full'
          )}
        >
          <div className="h-16 flex items-center justify-end px-4 border-b border-gray-100">
            <button
              onClick={close}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {filteredItems.map(item => {
              if (item.type === 'group') {
                const isGroupOpen = openGroups.has(item.label);
                const accessibleSubLinks = item.subLinks.filter(sub => {
                  if (!sub.roles) return true;
                  if (!roleToUse) return false;
                  return sub.roles.includes(roleToUse.role);
                });
                const isGroupActive = accessibleSubLinks.some(
                  sub =>
                    pathname === sub.href || pathname.startsWith(`${sub.href}/`)
                );

                return (
                  <div key={item.label}>
                    <button
                      onClick={() => toggleGroup(item.label)}
                      className={cn(
                        'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                        isGroupActive
                          ? 'bg-linkme-turquoise/15 text-linkme-marine border-l-3 border-linkme-turquoise'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-linkme-marine'
                      )}
                    >
                      <item.icon
                        className={cn(
                          'h-5 w-5 flex-shrink-0',
                          isGroupActive
                            ? 'text-linkme-turquoise'
                            : 'text-gray-400'
                        )}
                      />
                      <span className="flex-1 text-left">{item.label}</span>
                      {isGroupOpen ? (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      )}
                    </button>

                    {isGroupOpen && (
                      <div className="mt-1 space-y-1">
                        {accessibleSubLinks.map(sub => {
                          const isActive =
                            pathname === sub.href ||
                            pathname.startsWith(`${sub.href}/`);
                          return (
                            <Link
                              key={sub.href}
                              href={sub.href}
                              className={cn(
                                'flex items-center gap-3 pl-8 pr-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                                isActive
                                  ? 'bg-linkme-turquoise/10 text-linkme-marine'
                                  : 'text-gray-500 hover:bg-gray-50 hover:text-linkme-marine'
                              )}
                            >
                              <sub.icon
                                className={cn(
                                  'h-3.5 w-3.5 flex-shrink-0',
                                  isActive
                                    ? 'text-linkme-turquoise'
                                    : 'text-gray-400'
                                )}
                              />
                              <span>{sub.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              // Lien simple
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-linkme-turquoise/15 text-linkme-marine border-l-3 border-linkme-turquoise'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-linkme-marine'
                  )}
                >
                  <item.icon
                    className={cn(
                      'h-5 w-5 flex-shrink-0',
                      isActive ? 'text-linkme-turquoise' : 'text-gray-400'
                    )}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-3 border-t border-gray-100">
            <button
              onClick={() => {
                void handleSignOut().catch(error => {
                  console.error('[AppSidebar] Sign out failed:', error);
                });
              }}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              <span>Se déconnecter</span>
            </button>
          </div>
        </aside>
      </>
    );
  }

  // ─── DESKTOP ──────────────────────────────────────────────────────────────
  return (
    <aside
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      className={cn(
        'fixed inset-y-0 left-0 z-20 bg-white border-r border-gray-100 flex flex-col transition-all duration-300 ease-in-out',
        isExpanded ? 'w-56' : 'w-16'
      )}
    >
      <div className="h-16 border-b border-gray-100" />

      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
        {filteredItems.map(item => {
          if (item.type === 'group') {
            const isGroupOpen = openGroups.has(item.label);
            const accessibleSubLinks = item.subLinks.filter(sub => {
              if (!sub.roles) return true;
              if (!roleToUse) return false;
              return sub.roles.includes(roleToUse.role);
            });
            const isGroupActive = accessibleSubLinks.some(
              sub =>
                pathname === sub.href || pathname.startsWith(`${sub.href}/`)
            );

            return (
              <div key={item.label}>
                <button
                  onClick={() => {
                    if (!isExpanded) {
                      // En mode compact, expand la sidebar ET ouvre le groupe
                      setIsExpanded(true);
                    }
                    toggleGroup(item.label);
                  }}
                  title={!isExpanded ? item.label : undefined}
                  className={cn(
                    'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                    isGroupActive
                      ? 'bg-linkme-turquoise/15 text-linkme-marine'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-linkme-marine'
                  )}
                >
                  <item.icon
                    className={cn(
                      'h-5 w-5 flex-shrink-0',
                      isGroupActive ? 'text-linkme-turquoise' : 'text-gray-400'
                    )}
                  />
                  {isExpanded && (
                    <>
                      <span className="flex-1 whitespace-nowrap overflow-hidden text-left">
                        {item.label}
                      </span>
                      {isGroupOpen ? (
                        <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      )}
                    </>
                  )}
                </button>

                {isExpanded && isGroupOpen && (
                  <div className="mt-1 space-y-1">
                    {accessibleSubLinks.map(sub => {
                      const isActive =
                        pathname === sub.href ||
                        pathname.startsWith(`${sub.href}/`);
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className={cn(
                            'flex items-center gap-3 pl-8 pr-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                            isActive
                              ? 'bg-linkme-turquoise/10 text-linkme-marine'
                              : 'text-gray-500 hover:bg-gray-50 hover:text-linkme-marine'
                          )}
                        >
                          <sub.icon
                            className={cn(
                              'h-3.5 w-3.5 flex-shrink-0',
                              isActive
                                ? 'text-linkme-turquoise'
                                : 'text-gray-400'
                            )}
                          />
                          <span className="whitespace-nowrap overflow-hidden">
                            {sub.label}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          // Lien simple
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={!isExpanded ? item.label : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-linkme-turquoise/15 text-linkme-marine'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-linkme-marine'
              )}
            >
              <item.icon
                className={cn(
                  'h-5 w-5 flex-shrink-0',
                  isActive ? 'text-linkme-turquoise' : 'text-gray-400'
                )}
              />
              {isExpanded && (
                <span className="whitespace-nowrap overflow-hidden">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-2 border-t border-gray-100">
        <button
          onClick={() => {
            void handleSignOut().catch(error => {
              console.error('[AppSidebar] Sign out failed:', error);
            });
          }}
          title={!isExpanded ? 'Se déconnecter' : undefined}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {isExpanded && (
            <span className="whitespace-nowrap">Se déconnecter</span>
          )}
        </button>
      </div>
    </aside>
  );
}
