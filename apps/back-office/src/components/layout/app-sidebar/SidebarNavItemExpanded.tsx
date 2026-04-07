'use client';

import Link from 'next/link';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@verone/ui';
import { cn } from '@verone/utils';
import { getModuleDeploymentStatus } from '@verone/utils/feature-flags';
import { ChevronRight } from 'lucide-react';

import { PhaseIndicator } from '@/components/ui/phase-indicator';

import { SidebarBadgeDropdown } from './SidebarBadgeDropdown';
import type { NavItem } from './sidebar-nav-items';

interface SidebarNavItemExpandedProps {
  item: NavItem;
  expandedItems: string[];
  toggleExpanded: (title: string) => void;
  isHrefActive: (href: string) => boolean;
  isActiveOrHasActiveChild: (item: NavItem) => boolean;
  getModuleName: (title: string) => string;
}

/**
 * Render item en mode EXPANDED (240px) - Accordion inline.
 * Texte visible, hiérarchie claire, pas de popover.
 * Clic sur le texte/icône = navigue vers href + ouvre les enfants.
 * Clic sur le chevron = toggle les enfants uniquement.
 */
export function SidebarNavItemExpanded({
  item,
  expandedItems,
  toggleExpanded,
  isHrefActive,
  isActiveOrHasActiveChild,
  getModuleName,
}: SidebarNavItemExpandedProps) {
  const moduleName = getModuleName(item.title);
  const moduleStatus = getModuleDeploymentStatus(moduleName);
  const isItemExpanded = expandedItems.includes(item.title);
  const isActiveItem = isActiveOrHasActiveChild(item);

  // Module inactif
  if (moduleStatus !== 'active') {
    return (
      <li key={item.title}>
        <div className="flex items-center gap-2 px-3 py-2 text-sm rounded-md opacity-60 cursor-not-allowed">
          <item.icon className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm font-medium">{item.title}</span>
          <PhaseIndicator
            moduleName={moduleName}
            variant="badge"
            className="ml-auto"
          />
        </div>
      </li>
    );
  }

  // Items avec enfants → Collapsible (Accordion inline)
  if (item.children && item.children.length > 0) {
    return (
      <li key={item.title}>
        <Collapsible
          open={isItemExpanded}
          onOpenChange={() => toggleExpanded(item.title)}
        >
          <div className="flex w-full items-center">
            <Link
              href={item.href ?? '#'}
              onClick={() => {
                if (!isItemExpanded) {
                  toggleExpanded(item.title);
                }
              }}
              className={cn(
                'nav-item flex-1 flex items-center gap-2 px-3 py-2 text-sm rounded-l-md relative',
                'transition-all duration-200 ease-out',
                'text-black/70 hover:text-black hover:bg-black/5 hover:translate-x-0.5',
                isActiveItem && 'bg-black text-white shadow-sm'
              )}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              <span className="font-medium flex-1 text-left">{item.title}</span>
              {item.badge && item.badge > 0 && (
                <SidebarBadgeDropdown title={item.title} count={item.badge} />
              )}
            </Link>
            <CollapsibleTrigger asChild>
              <button
                className={cn(
                  'px-1 py-2 rounded-r-md',
                  'transition-all duration-200 ease-out',
                  'text-black/70 hover:text-black hover:bg-black/5',
                  isActiveItem && 'bg-black text-white shadow-sm'
                )}
              >
                <ChevronRight
                  className={cn(
                    'h-4 w-4 transition-transform duration-200',
                    isItemExpanded ? 'rotate-90' : 'rotate-0'
                  )}
                />
              </button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent className="overflow-hidden transition-all duration-200">
            <ul className="mt-1 space-y-1 ml-8">
              {item.children.map(child => {
                const childHref = child.href ?? '#';
                const isChildActive = isHrefActive(childHref);
                return (
                  <li key={childHref}>
                    <Link
                      href={childHref}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 text-sm rounded-md',
                        'transition-all duration-200 ease-out',
                        'text-black/70 hover:text-black hover:bg-black/5 hover:translate-x-0.5',
                        isChildActive && 'bg-black text-white shadow-sm'
                      )}
                    >
                      <child.icon className="h-4 w-4 flex-shrink-0" />
                      <span className="font-medium">{child.title}</span>
                      {child.badge && child.badge > 0 && (
                        <SidebarBadgeDropdown
                          title={child.title}
                          count={child.badge}
                          className="ml-auto"
                        />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </CollapsibleContent>
        </Collapsible>
      </li>
    );
  }

  // Items simples (sans enfants)
  return (
    <li key={item.title}>
      <Link
        href={item.href!}
        className={cn(
          'nav-item flex items-center gap-2 px-3 py-2 text-sm rounded-md relative',
          'transition-all duration-200 ease-out',
          'text-black/70 hover:text-black hover:bg-black/5 hover:translate-x-0.5',
          isActiveItem && 'bg-black text-white shadow-sm'
        )}
      >
        <item.icon className="h-4 w-4 flex-shrink-0" />
        <span className="font-medium">{item.title}</span>
        {item.badge && item.badge > 0 && (
          <SidebarBadgeDropdown
            title={item.title}
            count={item.badge}
            className="ml-auto"
          />
        )}
      </Link>
    </li>
  );
}
