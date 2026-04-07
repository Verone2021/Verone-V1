'use client';

import { useMemo } from 'react';

import { cn } from '@verone/utils';
import { featureFlags } from '@verone/utils/feature-flags';
import {
  useSidebarCounts,
  useDatabaseNotifications,
} from '@verone/notifications';

import { getNavItems } from './sidebar-nav-items';
import { useHoverExpand, useSidebarState } from './use-sidebar-state';
import { SidebarNavItemExpanded } from './SidebarNavItemExpanded';
import { SidebarNavItemCompact } from './SidebarNavItemCompact';
import { SidebarLogo } from './SidebarLogo';
import { SidebarFooter } from './SidebarFooter';

function SidebarContent() {
  // Hover expansion UX 2026 (Linear pattern)
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
    if (!featureFlags.financeEnabled) {
      return items.filter(item => item.title !== 'Finance');
    }

    return items;
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

  return (
    <aside
      className={cn(
        'flex h-screen flex-col border-r border-black bg-white',
        'transition-all duration-300 ease-smooth-out',
        isExpanded ? 'w-60' : 'w-16'
      )}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onFocus={onFocus}
      role="complementary"
      aria-label="Navigation principale"
    >
      <SidebarLogo isExpanded={isExpanded} />

      {/* Navigation principale */}
      <nav className="flex-1 p-4 overflow-y-auto" role="navigation">
        <ul className="space-y-2" role="menubar">
          {navItems.map(item =>
            isExpanded ? (
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

      <SidebarFooter isExpanded={isExpanded} />

      <style jsx>{`
        /* Animations UX 2026 - GPU accelerated */
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

        /* Badge pulse pour urgence visuelle */
        @keyframes pulse-urgent {
          0%,
          100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.85;
            transform: scale(1.05);
          }
        }

        /* Hover micro-interaction (translateX + shadow) */
        .nav-item:hover {
          box-shadow: -2px 0 0 0 rgba(0, 0, 0, 0.1);
        }

        /* Badge urgent animation */
        .badge-urgent {
          animation: pulse-urgent 2s ease-in-out infinite;
        }

        /* Respect prefers-reduced-motion (WCAG 2.1) */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }

        /* GPU acceleration pour sidebar width transition */
        aside {
          will-change: width;
          transform: translateZ(0);
        }
      `}</style>
    </aside>
  );
}

export function AppSidebar({ className: _className }: { className?: string }) {
  return <SidebarContent />;
}
