'use client'

import { cn } from '@/lib/utils'
import { SidebarItem } from './sidebar-item'
import type { NavSection } from '@/types/navigation'

interface SidebarSectionProps {
  section: NavSection
  collapsed?: boolean
  onItemClick?: () => void
}

export function SidebarSection({ section, collapsed = false, onItemClick }: SidebarSectionProps) {
  if (section.items.length === 0) return null

  return (
    <div className="mb-6">
      {!collapsed && (
        <div className="mb-2 px-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {section.label}
          </h3>
        </div>
      )}
      
      <nav className="space-y-1">
        {section.items.map((item) => (
          <SidebarItem
            key={item.id}
            item={item}
            collapsed={collapsed}
            onClick={onItemClick}
          />
        ))}
      </nav>
      
      {/* Separator line for visual grouping (except for last section) */}
      {!collapsed && (
        <div className="mt-4 px-3">
          <div className="border-t border-gray-200" />
        </div>
      )}
    </div>
  )
}