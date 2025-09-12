'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { NavItem } from '@/types/navigation'

interface SidebarItemProps {
  item: NavItem
  collapsed?: boolean
  onClick?: () => void
}

export function SidebarItem({ item, collapsed = false, onClick }: SidebarItemProps) {
  const pathname = usePathname()
  const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
  
  const IconComponent = item.icon

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        // Base styles
        'group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
        'hover:bg-gray-100 hover:text-gray-900',
        'focus:outline-none focus:ring-2 focus:ring-brand-copper/30 focus:ring-offset-1',
        
        // Active state
        isActive
          ? 'bg-gradient-to-r from-brand-copper/10 to-brand-copper/5 text-brand-copper border-r-2 border-brand-copper'
          : 'text-gray-700',
        
        // Disabled state
        item.disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
        
        // Collapsed adjustments
        collapsed ? 'justify-center px-2' : 'justify-start'
      )}
      title={collapsed ? item.label : undefined}
    >
      <IconComponent 
        className={cn(
          'h-5 w-5 transition-colors',
          isActive ? 'text-brand-copper' : 'text-gray-400 group-hover:text-gray-600',
          collapsed ? 'mx-auto' : 'mr-3'
        )} 
      />
      
      {!collapsed && (
        <span className="truncate">
          {item.label}
        </span>
      )}
      
      {!collapsed && isActive && (
        <div className="ml-auto">
          <div className="h-2 w-2 rounded-full bg-brand-copper" />
        </div>
      )}
    </Link>
  )
}