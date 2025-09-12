'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageShellProps {
  children: ReactNode
  header?: ReactNode
  className?: string
  contentClassName?: string
}

export function PageShell({ 
  children, 
  header, 
  className = "",
  contentClassName = ""
}: PageShellProps) {
  return (
    <div className={cn("min-h-[calc(100vh-4rem)] flex flex-col", className)}>
      {header && (
        <header className="bg-white px-3 md:px-4 py-3 modern-shadow">
          {header}
        </header>
      )}
      <main className={cn("flex-1 px-3 md:px-4 py-4", contentClassName)}>
        {children}
      </main>
    </div>
  )
}

// Convenience wrapper for page headers
export function PageHeader({ 
  title, 
  description, 
  actions,
  className = ""
}: {
  title: string
  description?: string
  actions?: ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
        {description && (
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center space-x-3">
          {actions}
        </div>
      )}
    </div>
  )
}

// Utility classes for consistent grid layouts
export const GridLayouts = {
  // KPI Cards horizontal row (small squares side by side) 
  kpiRow: "grid grid-cols-2 md:grid-cols-4 gap-4 mb-6",
  kpiCard: "w-full h-[120px]",
  kpiCardLarge: "w-full h-[140px]",
  
  // KPI Cards vertical layout (fixed size square cards)
  kpiRowVertical: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-6",
  kpiCardVertical: "w-full max-w-[180px] h-[180px]",
  kpiCardVerticalLarge: "w-full max-w-[200px] h-[200px]",
  
  // Content sections
  fullWidth: "w-full",
  tableContainer: "w-full overflow-x-auto",
  
  // Responsive content grids
  contentGrid: "grid grid-cols-12 gap-6",
  contentMain: "col-span-12 lg:col-span-8",
  contentSidebar: "col-span-12 lg:col-span-4"
}