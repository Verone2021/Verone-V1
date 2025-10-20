"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect, useMemo } from "react"
import { cn } from "@/lib/utils"
import { featureFlags, getModuleDeploymentStatus } from "@/lib/feature-flags"
import { InactiveModuleWrapper, PhaseIndicator } from "@/components/ui/phase-indicator"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { SidebarProvider, SidebarTrigger, SidebarInput, useSidebar } from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { useStockAlertsCount } from "@/hooks/use-stock-alerts-count"
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
  Search,
  CheckCircle,
  MessageCircle,
  FileText,
  Banknote,
  RefreshCw,
  X,
  Moon,
  Sun,
} from "lucide-react"

// Interface pour les éléments de navigation
interface NavItem {
  title: string
  href?: string
  icon: React.ComponentType<{ className?: string }>
  description?: string
  badge?: number
  badgeVariant?: "default" | "urgent"
  children?: NavItem[]
}

// SIDEBAR VIDE - Navigation sera reconstruite module par module
const getNavItems = (stockAlertsCount: number): NavItem[] => []

function SidebarContent() {
  const pathname = usePathname()
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  // Hook pour récupérer le nombre d'alertes stock
  const { count: stockAlertsCount } = useStockAlertsCount()

  // Search functionality
  const [searchQuery, setSearchQuery] = useState("")

  // State persistence avec localStorage
  const [expandedItems, setExpandedItems] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('verone-sidebar-expanded')
      return saved ? JSON.parse(saved) : ['Administration'] // Administration section expanded by default
    }
    return ['Administration'] // Administration section expanded by default
  })

  // Theme toggle
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('verone-theme') as 'light' | 'dark') || 'light'
    }
    return 'light'
  })

  // Sauvegarder l'état dans localStorage
  useEffect(() => {
    localStorage.setItem('verone-sidebar-expanded', JSON.stringify(expandedItems))
  }, [expandedItems])

  useEffect(() => {
    localStorage.setItem('verone-theme', theme)
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev =>
      prev.includes(title)
        ? prev.filter(item => item !== title)
        : [...prev, title]
    )
  }

  const isActiveOrHasActiveChild = (item: NavItem): boolean => {
    if (item.href && (pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href)))) {
      return true
    }
    if (item.children) {
      return item.children.some(child => isActiveOrHasActiveChild(child))
    }
    return false
  }

  const getModuleName = (title: string): string => {
    const moduleMap: Record<string, string> = {
      'Produits': 'catalogue',
      'Catalogue': 'catalogue',
      'Stocks': 'stocks',
      'Sourcing': 'sourcing',
      'Ventes': 'interactions',
      'Achats': 'commandes',
      'Finance': 'finance',
      'Organisation': 'contacts'
    }
    return moduleMap[title] || title.toLowerCase()
  }

  // Filter items based on search (avec count dynamique)
  const filteredItems = useMemo(() => {
    const navItems = getNavItems(stockAlertsCount)
    if (!searchQuery.trim()) return navItems

    return navItems.filter(item => {
      const matchTitle = item.title.toLowerCase().includes(searchQuery.toLowerCase())
      const matchDesc = item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchChildren = item.children?.some(child =>
        child.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        child.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      return matchTitle || matchDesc || matchChildren
    })
  }, [searchQuery, stockAlertsCount])

  // Fonction récursive pour rendre les enfants (support multi-niveaux)
  const renderChildNavItem = (child: NavItem, idx: number, isParentExpanded: boolean): React.ReactNode => {
    const isChildActive = pathname === child.href || (child.href !== '/dashboard' && pathname.startsWith(child.href!))
    const isChildExpanded = expandedItems.includes(child.title)

    if (child.children) {
      // Sous-menu avec enfants (ex: Sourcing)
      return (
        <li
          key={child.href || child.title}
          style={{
            animationDelay: `${idx * 50}ms`,
            animation: isParentExpanded ? 'slideIn 200ms ease-out forwards' : 'none'
          }}
        >
          <Collapsible open={isChildExpanded} onOpenChange={() => toggleExpanded(child.title)}>
            <div className="flex w-full items-center">
              <Link
                href={child.href!}
                className={cn(
                  "nav-item flex flex-1 items-center gap-3 px-3 py-2 text-sm transition-all duration-150 ease-out rounded-l relative",
                  "text-black hover:opacity-70",
                  isChildActive && "bg-black text-white"
                )}
              >
                <child.icon className="h-4 w-4 flex-shrink-0" />
                <div className="flex flex-col flex-1">
                  <span className="font-medium">{child.title}</span>
                  {child.description && (
                    <span className={cn("text-xs opacity-70", isChildActive ? "text-white" : "text-black")}>
                      {child.description}
                    </span>
                  )}
                </div>
              </Link>
              <CollapsibleTrigger
                className={cn(
                  "px-3 py-2 transition-all duration-200 rounded-r",
                  isChildActive ? "bg-black text-white" : "text-black hover:bg-black/5"
                )}
              >
                <ChevronRight
                  className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    isChildExpanded ? "rotate-90" : "rotate-0"
                  )}
                />
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="overflow-hidden transition-all duration-200">
              <ul className="mt-1 space-y-1 ml-4">
                {child.children.map((subChild, subIdx) => renderChildNavItem(subChild, subIdx, isChildExpanded))}
              </ul>
            </CollapsibleContent>
          </Collapsible>
        </li>
      )
    }

    // Enfant simple (sans sous-menu)
    return (
      <li
        key={child.href}
        style={{
          animationDelay: `${idx * 50}ms`,
          animation: isParentExpanded ? 'slideIn 200ms ease-out forwards' : 'none'
        }}
      >
        <Link
          href={child.href!}
          className={cn(
            "nav-item flex items-center gap-3 px-3 py-2 text-sm transition-all duration-150 ease-out rounded-md relative",
            "text-black hover:opacity-70",
            isChildActive && "bg-black text-white"
          )}
        >
          <child.icon className="h-4 w-4 flex-shrink-0" />
          <div className="flex flex-col flex-1">
            <span className="font-medium">{child.title}</span>
            {child.description && (
              <span className={cn("text-xs opacity-70", isChildActive ? "text-white" : "text-black")}>
                {child.description}
              </span>
            )}
          </div>
          {child.badge && (
            <Badge variant={child.badgeVariant === "urgent" ? "destructive" : "default"} className="ml-auto">
              {child.badge}
            </Badge>
          )}
        </Link>
      </li>
    )
  }

  const renderNavItem = (item: NavItem) => {
    const moduleName = getModuleName(item.title)
    const moduleStatus = getModuleDeploymentStatus(moduleName)
    const isExpanded = expandedItems.includes(item.title)
    const isActiveItem = isActiveOrHasActiveChild(item)

    const navContent = (
      <li key={item.title} className="relative">
        {item.children ? (
          <Collapsible open={isExpanded} onOpenChange={() => moduleStatus === 'active' && toggleExpanded(item.title)}>
            <div className="flex w-full items-center">
              <Link
                href={moduleStatus === 'active' ? item.href! : '#'}
                onClick={(e) => moduleStatus !== 'active' && e.preventDefault()}
                className={cn(
                  "nav-item flex flex-1 items-center gap-3 px-3 py-2.5 text-sm transition-all duration-150 ease-out rounded-l relative",
                  "text-black hover:opacity-70",
                  isActiveItem && "bg-black text-white",
                  moduleStatus !== 'active' && "opacity-60 cursor-not-allowed",
                  isCollapsed && "justify-center px-2"
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && (
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{item.title}</span>
                      {moduleStatus !== 'active' && (
                        <PhaseIndicator
                          moduleName={moduleName}
                          variant="badge"
                          className="ml-2 scale-75"
                        />
                      )}
                    </div>
                    {item.description && (
                      <span className={cn(
                        "text-xs opacity-70",
                        isActiveItem ? "text-white" : "text-black"
                      )}>
                        {item.description}
                      </span>
                    )}
                  </div>
                )}
                {item.badge && !isCollapsed && (
                  <Badge
                    variant={item.badgeVariant === "urgent" ? "destructive" : "default"}
                    className="ml-auto"
                  >
                    {item.badge}
                  </Badge>
                )}
              </Link>

              {moduleStatus === 'active' && !isCollapsed && (
                <CollapsibleTrigger
                  className={cn(
                    "px-3 py-2.5 transition-all duration-200 rounded-r",
                    isActiveItem ? "bg-black text-white" : "text-black hover:bg-black/5"
                  )}
                >
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform duration-200",
                      isExpanded ? "rotate-0" : "-rotate-90"
                    )}
                  />
                </CollapsibleTrigger>
              )}
            </div>

            {moduleStatus === 'active' && !isCollapsed && (
              <CollapsibleContent
                className="overflow-hidden transition-all duration-200 data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
              >
                <ul className="mt-1 space-y-1 ml-4">
                  {item.children.map((child, idx) => renderChildNavItem(child, idx, isExpanded))}
                </ul>
              </CollapsibleContent>
            )}
          </Collapsible>
        ) : (
          <Link
            href={moduleStatus === 'active' ? item.href! : '#'}
            onClick={(e) => moduleStatus !== 'active' && e.preventDefault()}
            className={cn(
              "nav-item flex items-center gap-3 px-3 py-2.5 text-sm transition-all duration-150 ease-out rounded-md relative",
              "text-black hover:opacity-70",
              isActiveItem && "bg-black text-white",
              moduleStatus !== 'active' && "opacity-60 cursor-not-allowed",
              isCollapsed && "justify-center px-2"
            )}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && (
              <div className="flex flex-col flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{item.title}</span>
                  {moduleStatus !== 'active' && (
                    <PhaseIndicator
                      moduleName={moduleName}
                      variant="badge"
                      className="ml-2 scale-75"
                    />
                  )}
                </div>
                {item.description && (
                  <span className={cn(
                    "text-xs opacity-70",
                    isActiveItem ? "text-white" : "text-black"
                  )}>
                    {item.description}
                  </span>
                )}
              </div>
            )}
            {item.badge && !isCollapsed && (
              <Badge
                variant={item.badgeVariant === "urgent" ? "destructive" : "default"}
                className="ml-auto"
              >
                {item.badge}
              </Badge>
            )}
          </Link>
        )}
      </li>
    )

    // Wrap with tooltip if collapsed
    if (isCollapsed && moduleStatus === 'active') {
      return (
        <Tooltip key={item.title} delayDuration={300}>
          <TooltipTrigger asChild>
            {navContent}
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            <p>{item.title}</p>
            {item.description && <p className="text-xs opacity-70">{item.description}</p>}
          </TooltipContent>
        </Tooltip>
      )
    }

    return navContent
  }

  return (
    <aside className={cn(
      "flex h-full flex-col border-r border-black bg-white transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Logo Vérone + Toggle */}
      <div className={cn(
        "flex h-16 items-center border-b border-black transition-all",
        isCollapsed ? "justify-center px-2" : "justify-between px-6"
      )}>
        {!isCollapsed && (
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="logo-black font-logo text-xl font-light tracking-wider">
              VÉRONE
            </div>
          </Link>
        )}
        <SidebarTrigger />
      </div>

      {/* Search Bar */}
      {!isCollapsed && (
        <div className="p-4 border-b border-black/10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black/50" />
            <SidebarInput
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-black/50 hover:text-black"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Navigation principale */}
      <nav className="flex-1 p-4 overflow-auto">
        <ul className="space-y-2">
          {filteredItems.map((item) => renderNavItem(item))}
        </ul>
      </nav>

      {/* Zone utilisateur + Theme toggle */}
      <div className="border-t border-black p-4">
        {!isCollapsed && (
          <div className="flex items-center justify-end mb-3">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-md hover:bg-black/5 transition-colors"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        )}

        <button
          onClick={() => {
            document.cookie = 'verone-auth=; path=/; max-age=0'
            window.location.href = '/'
          }}
          className={cn(
            "flex w-full items-center space-x-2 px-3 py-2 text-sm text-black opacity-70 hover:opacity-100 hover:bg-black hover:bg-opacity-5 transition-all duration-150 rounded-md",
            isCollapsed && "justify-center"
          )}
        >
          <LogOut className="h-4 w-4" />
          {!isCollapsed && <span>Déconnexion</span>}
        </button>
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
  )
}

export function AppSidebar({ className }: { className?: string }) {
  return <SidebarContent />
}
