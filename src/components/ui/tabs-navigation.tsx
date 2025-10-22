'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface Tab {
  id: string
  label: string
  icon?: React.ReactNode
  badge?: string | number
  disabled?: boolean
  disabledBadge?: string  // Badge affiché quand onglet disabled (ex: "Phase 2", "Bientôt")
}

interface TabsNavigationProps {
  tabs: Tab[]
  defaultTab?: string
  onTabChange?: (tabId: string) => void
  className?: string
}

export function TabsNavigation({
  tabs,
  defaultTab,
  onTabChange,
  className
}: TabsNavigationProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id)

  const handleTabClick = (tabId: string, disabled?: boolean) => {
    if (disabled) return
    setActiveTab(tabId)
    onTabChange?.(tabId)
  }

  return (
    <div className={cn("border-b border-gray-200", className)}>
      <nav className="flex space-x-8" aria-label="Onglets">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id, tab.disabled)}
            disabled={tab.disabled}
            className={cn(
              "whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors",
              "flex items-center gap-2",
              activeTab === tab.id
                ? "border-black text-black"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
              tab.disabled && "opacity-50 cursor-not-allowed"
            )}
            aria-current={activeTab === tab.id ? 'page' : undefined}
          >
            {tab.icon}
            <span>{tab.label}</span>

            {/* Badge normal (compteur) - Seulement si onglet actif */}
            {tab.badge && !tab.disabled && (
              <span className={cn(
                "ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-full",
                activeTab === tab.id
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-600"
              )}>
                {tab.badge}
              </span>
            )}

            {/* Badge disabled (Phase X, Bientôt) - Style amber */}
            {tab.disabled && tab.disabledBadge && (
              <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                {tab.disabledBadge}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  )
}

export function TabContent({
  activeTab,
  tabId,
  children,
  className
}: {
  activeTab: string
  tabId: string
  children: React.ReactNode
  className?: string
}) {
  if (activeTab !== tabId) return null

  return (
    <div className={cn("py-6", className)}>
      {children}
    </div>
  )
}