'use client';

import Link from 'next/link';

import { Badge, Popover, PopoverContent, PopoverTrigger } from '@verone/ui';
import { Tooltip, TooltipContent, TooltipTrigger } from '@verone/ui';
import { cn } from '@verone/utils';
import { getModuleDeploymentStatus } from '@verone/utils/feature-flags';

import { PhaseIndicator } from '@/components/ui/phase-indicator';

import type { NavItem } from './sidebar-nav-items';

interface SidebarNavItemCompactProps {
  item: NavItem;
  expandedItems: string[];
  isHrefActive: (href: string) => boolean;
  isActiveOrHasActiveChild: (item: NavItem) => boolean;
  getModuleName: (title: string) => string;
}

/**
 * Render item en mode COMPACT (64px) - Popover + Tooltip.
 * Icônes uniquement, popover au click pour sous-menus.
 */
export function SidebarNavItemCompact({
  item,
  expandedItems: _expandedItems,
  isHrefActive,
  isActiveOrHasActiveChild,
  getModuleName,
}: SidebarNavItemCompactProps) {
  const moduleName = getModuleName(item.title);
  const moduleStatus = getModuleDeploymentStatus(moduleName);
  const isActiveItem = isActiveOrHasActiveChild(item);

  // Module inactif - simple icône disabled
  if (moduleStatus !== 'active') {
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
                const isChildActive = isHrefActive(childHref);
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
}
