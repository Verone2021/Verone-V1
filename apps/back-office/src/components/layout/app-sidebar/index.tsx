'use client';

import { useMemo } from 'react';

import { useSidebar } from '@verone/ui';
import { cn } from '@verone/utils';
import { useCurrentBoRole } from '@verone/utils/hooks';
import { featureFlags } from '@verone/utils/feature-flags';
import {
  useSidebarCounts,
  useDatabaseNotifications,
} from '@verone/notifications';

import { getNavItems, filterNavItemsForRole } from './sidebar-nav-items';
import { useHoverExpand, useSidebarState } from './use-sidebar-state';
import { SidebarNavItemExpanded } from './SidebarNavItemExpanded';
import { SidebarNavItemCompact } from './SidebarNavItemCompact';
import { SidebarLogo } from './SidebarLogo';
import { SidebarFooter } from './SidebarFooter';

function SidebarContent() {
  // Mobile drawer state (via SidebarProvider from @verone/ui)
  const { isMobile, openMobile, setOpenMobile } = useSidebar();

  // Hover expansion UX 2026 (Linear pattern) — desktop only
  const { isExpanded, onMouseEnter, onMouseLeave, onFocus } =
    useHoverExpand(150);

  // Badges dynamiques — hook consolidé (1 auth + Promise.all + 7 canaux Realtime)
  const {
    stockAlerts: stockAlertsCount,
    consultations: consultationsCount,
    linkmePending: linkmePendingCount,
    productsIncomplete: productsIncompleteCount,
    ordersPending: ordersPendingCount,
    expeditionsPending: expeditionsPendingCount,
    transactionsUnreconciled: transactionsUnreconciledCount,
    linkmeApprovals: linkmeApprovalsCount,
    formSubmissions: formSubmissionsCount,
    linkmeMissingInfo: linkmeMissingInfoCount,
  } = useSidebarCounts();
  const { unreadCount: unreadNotificationsCount } = useDatabaseNotifications();

  // Current back-office role — drives RBAC filtering on the sidebar.
  // catalog_manager sees a strict whitelist; owner/admin see everything.
  const { role: currentBoRole } = useCurrentBoRole();

  // State local sidebar (expanded items, active helpers, module name)
  const {
    expandedItems,
    toggleExpanded,
    isHrefActive,
    isActiveOrHasActiveChild,
    getModuleName,
  } = useSidebarState();

  // Nav items (avec count dynamique pour badges)
  // Filtrer les modules Finance si désactivés
  const navItems = useMemo(() => {
    const items = getNavItems(
      stockAlertsCount,
      consultationsCount,
      linkmePendingCount,
      productsIncompleteCount,
      ordersPendingCount,
      expeditionsPendingCount,
      transactionsUnreconciledCount,
      linkmeApprovalsCount,
      formSubmissionsCount,
      linkmeMissingInfoCount,
      unreadNotificationsCount
    );

    // Masquer Finance si financeEnabled = false (module fusionné)
    const baseItems = !featureFlags.financeEnabled
      ? items.filter(item => item.title !== 'Finance')
      : items;

    // RBAC filtering — catalog_manager only sees Produits + Stocks + Paramètres
    return filterNavItemsForRole(baseItems, currentBoRole);
  }, [
    stockAlertsCount,
    consultationsCount,
    linkmePendingCount,
    productsIncompleteCount,
    ordersPendingCount,
    expeditionsPendingCount,
    transactionsUnreconciledCount,
    linkmeApprovalsCount,
    formSubmissionsCount,
    linkmeMissingInfoCount,
    unreadNotificationsCount,
    currentBoRole,
  ]);

  // Fonction récursive pour rendre les enfants (support multi-niveaux) - Reserved
  const _renderChildNavItem = (
    child: (typeof navItems)[number],
    idx: number,
    isParentExpanded: boolean
  ): React.ReactNode => {
    const isChildActive = child.href ? isHrefActive(child.href) : false;
    const isChildExpanded = expandedItems.includes(child.title);

    if (child.children) {
      return (
        <li
          key={child.href ?? child.title}
          style={{
            animationDelay: `${idx * 50}ms`,
            animation: isParentExpanded
              ? 'slideIn 200ms ease-out forwards'
              : 'none',
          }}
        >
          <div className="flex w-full items-center">
            <span
              className={cn(
                'nav-item flex flex-1 items-center gap-2 px-3 py-2 text-sm rounded-l relative',
                'transition-all duration-150 ease-out',
                'text-black/70',
                isChildActive && 'bg-black text-white shadow-sm'
              )}
            >
              <child.icon className="h-4 w-4 flex-shrink-0" />
              <span className="font-medium">{child.title}</span>
            </span>
          </div>
          {isChildExpanded && child.children && (
            <ul className="mt-1 space-y-1 ml-4">
              {child.children.map((subChild, subIdx) =>
                _renderChildNavItem(subChild, subIdx, isChildExpanded)
              )}
            </ul>
          )}
        </li>
      );
    }

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
        <span
          className={cn(
            'nav-item flex items-center gap-2 px-3 py-2 text-sm rounded-md relative',
            'transition-all duration-150 ease-out',
            'text-black/70',
            isChildActive && 'bg-black text-white shadow-sm'
          )}
        >
          <child.icon className="h-4 w-4 flex-shrink-0" />
          <span className="font-medium">{child.title}</span>
        </span>
      </li>
    );
  };

  const sharedProps = {
    expandedItems,
    toggleExpanded,
    isHrefActive,
    isActiveOrHasActiveChild,
    getModuleName,
  };

  // On mobile, force expanded mode inside the drawer
  const effectiveExpanded = isMobile ? true : isExpanded;

  const sidebarContent = (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-black bg-white',
        'transition-all duration-300 ease-smooth-out',
        // Desktop: shrink/expand on hover. Mobile: always full width in drawer.
        isMobile ? 'w-64' : isExpanded ? 'w-60' : 'w-16'
      )}
      onMouseEnter={isMobile ? undefined : onMouseEnter}
      onMouseLeave={isMobile ? undefined : onMouseLeave}
      onFocus={isMobile ? undefined : onFocus}
      role="complementary"
      aria-label="Navigation principale"
    >
      <SidebarLogo isExpanded={effectiveExpanded} />

      {/* Navigation principale */}
      <nav className="flex-1 p-4 overflow-y-auto" role="navigation">
        <ul className="space-y-2" role="menubar">
          {navItems.map(item =>
            effectiveExpanded ? (
              <SidebarNavItemExpanded
                key={item.title}
                item={item}
                {...sharedProps}
              />
            ) : (
              <SidebarNavItemCompact
                key={item.title}
                item={item}
                {...sharedProps}
              />
            )
          )}
        </ul>
      </nav>

      <SidebarFooter isExpanded={effectiveExpanded} />
    </aside>
  );

  // Mobile: drawer overlay (hidden by default, slides in when openMobile=true)
  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        {openMobile && (
          <div
            className="fixed inset-0 z-40 bg-black/50"
            aria-hidden="true"
            onClick={() => setOpenMobile(false)}
          />
        )}
        {/* Drawer */}
        <div
          className={cn(
            'fixed inset-y-0 left-0 z-50 h-screen',
            'transition-transform duration-300 ease-smooth-out',
            openMobile ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          {sidebarContent}
        </div>
      </>
    );
  }

  // Desktop: sidebar toujours visible dans le flux normal
  return <div className="h-screen flex-shrink-0">{sidebarContent}</div>;
}

export function AppSidebar({ className: _className }: { className?: string }) {
  return <SidebarContent />;
}
