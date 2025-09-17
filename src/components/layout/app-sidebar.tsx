"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { cn } from "../../lib/utils"
import {
  Home,
  ShoppingCart,
  Package,
  Users,
  Settings,
  BookOpen,
  LogOut,
  ChevronDown,
  ChevronRight,
  Grid3x3,
  FolderOpen,
  Tags,
  Layers,
  Building2,
  Phone,
  Truck,
  UserCheck,
  BarChart3,
  ShoppingBag
} from "lucide-react"

// Interface pour les éléments de navigation hiérarchique
interface NavItem {
  title: string
  href?: string
  icon: React.ComponentType<{ className?: string }>
  description?: string
  children?: NavItem[]
}

// Configuration navigation hiérarchique selon bonnes pratiques e-commerce
const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
    description: "Vue d'ensemble et indicateurs"
  },
  {
    title: "Catalogue",
    icon: BookOpen,
    description: "Gestion produits et collections",
    children: [
      {
        title: "Produits",
        href: "/catalogue",
        icon: Grid3x3,
        description: "Liste et gestion des produits"
      },
      {
        title: "Catégories",
        href: "/catalogue/categories",
        icon: Tags,
        description: "Organisation par catégories"
      },
      {
        title: "Collections",
        href: "/catalogue/collections",
        icon: FolderOpen,
        description: "Collections thématiques"
      },
      {
        title: "Stocks",
        href: "/catalogue/stocks",
        icon: Package,
        description: "Inventaire et approvisionnement"
      }
    ]
  },
  {
    title: "Commandes",
    icon: ShoppingCart,
    description: "Gestion des commandes clients et fournisseurs",
    children: [
      {
        title: "Vue d'ensemble",
        href: "/commandes",
        icon: BarChart3,
        description: "Dashboard et statistiques commandes"
      },
      {
        title: "Commandes Clients",
        href: "/commandes/clients",
        icon: ShoppingBag,
        description: "Ventes et expéditions"
      },
      {
        title: "Commandes Fournisseurs",
        href: "/commandes/fournisseurs",
        icon: Package,
        description: "Achats et approvisionnements"
      }
    ]
  },
  {
    title: "Contacts & Organisations",
    icon: Building2,
    description: "Fournisseurs, clients et contacts",
    children: [
      {
        title: "Organisations",
        href: "/contacts-organisations",
        icon: Building2,
        description: "Dashboard fournisseurs et structures"
      },
      {
        title: "Clients Particuliers",
        href: "/contacts-organisations/customers?type=individual",
        icon: UserCheck,
        description: "Clients particuliers B2C"
      }
    ]
  },
  {
    title: "Paramètres",
    href: "/parametres",
    icon: Settings,
    description: "Configuration du système"
  }
]

interface AppSidebarProps {
  className?: string
}

export function AppSidebar({ className }: AppSidebarProps) {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<string[]>(['Catalogue', 'Commandes', 'Contacts & Organisations']) // Sections principales ouvertes par défaut

  // Fonction pour basculer l'état d'expansion d'un élément
  const toggleExpanded = (title: string) => {
    setExpandedItems(prev =>
      prev.includes(title)
        ? prev.filter(item => item !== title)
        : [...prev, title]
    )
  }

  // Fonction pour vérifier si un élément ou ses enfants sont actifs
  const isActiveOrHasActiveChild = (item: NavItem): boolean => {
    if (item.href && (pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href)))) {
      return true
    }
    if (item.children) {
      return item.children.some(child => isActiveOrHasActiveChild(child))
    }
    return false
  }

  return (
    <aside className={cn(
      "flex h-full w-64 flex-col border-r border-black bg-white",
      className
    )}>
      {/* Logo Vérone */}
      <div className="flex h-16 items-center border-b border-black px-6">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <div className="logo-black font-logo text-xl font-light tracking-wider">
            VÉRONE
          </div>
        </Link>
      </div>

      {/* Navigation principale */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const isExpanded = expandedItems.includes(item.title)
            const isActiveItem = isActiveOrHasActiveChild(item)

            return (
              <li key={item.title}>
                {/* Élément principal */}
                {item.children ? (
                  // Élément parent avec enfants (bouton d'expansion)
                  <button
                    onClick={() => toggleExpanded(item.title)}
                    className={cn(
                      // Base styles Vérone
                      "nav-item flex w-full items-center space-x-3 px-3 py-2.5 text-sm transition-all duration-150 ease-out",
                      "border border-transparent",
                      // État par défaut
                      "text-black hover:opacity-70",
                      // État actif si enfant sélectionné
                      isActiveItem && "bg-black text-white border-black"
                    )}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    <div className="flex flex-col flex-1">
                      <span className="font-medium">{item.title}</span>
                      {item.description && (
                        <span className={cn(
                          "text-xs opacity-70",
                          isActiveItem ? "text-white" : "text-black"
                        )}>
                          {item.description}
                        </span>
                      )}
                    </div>
                    {/* Icône d'expansion */}
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 flex-shrink-0" />
                    )}
                  </button>
                ) : (
                  // Élément simple sans enfants
                  <Link
                    href={item.href!}
                    className={cn(
                      // Base styles Vérone
                      "nav-item flex w-full items-center space-x-3 px-3 py-2.5 text-sm transition-all duration-150 ease-out",
                      "border border-transparent",
                      // État par défaut
                      "text-black hover:opacity-70",
                      // État actif selon charte
                      isActiveItem && "bg-black text-white border-black"
                    )}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-medium">{item.title}</span>
                      {item.description && (
                        <span className={cn(
                          "text-xs opacity-70",
                          isActiveItem ? "text-white" : "text-black"
                        )}>
                          {item.description}
                        </span>
                      )}
                    </div>
                  </Link>
                )}

                {/* Sous-menu (enfants) */}
                {item.children && isExpanded && (
                  <ul className="mt-1 space-y-1">
                    {item.children.map((child) => {
                      const isChildActive = pathname === child.href ||
                        (child.href !== '/dashboard' && pathname.startsWith(child.href!))

                      return (
                        <li key={child.href}>
                          <Link
                            href={child.href!}
                            className={cn(
                              // Base styles pour enfants (indentés)
                              "nav-item flex w-full items-center space-x-3 px-6 py-2 text-sm transition-all duration-150 ease-out",
                              "border border-transparent ml-4",
                              // État par défaut enfant
                              "text-black hover:opacity-70",
                              // État actif enfant
                              isChildActive && "bg-black text-white border-black"
                            )}
                          >
                            <child.icon className="h-4 w-4 flex-shrink-0" />
                            <div className="flex flex-col">
                              <span className="font-medium">{child.title}</span>
                              {child.description && (
                                <span className={cn(
                                  "text-xs opacity-70",
                                  isChildActive ? "text-white" : "text-black"
                                )}>
                                  {child.description}
                                </span>
                              )}
                            </div>
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Zone utilisateur */}
      <div className="border-t border-black p-4">
        <div className="flex items-center space-x-3 mb-3">
          <div className="h-8 w-8 bg-black rounded-full"></div>
          <div className="flex-1">
            <p className="text-sm font-medium text-black">Admin</p>
            <p className="text-xs text-black opacity-70">Owner</p>
          </div>
        </div>

        {/* Bouton déconnexion */}
        <button
          onClick={() => {
            // Supprimer le cookie d'authentification
            document.cookie = 'verone-auth=; path=/; max-age=0'
            // Redirection vers page d'accueil
            window.location.href = '/'
          }}
          className="flex w-full items-center space-x-2 px-3 py-2 text-sm text-black opacity-70 hover:opacity-100 hover:bg-black hover:bg-opacity-5 transition-all duration-150"
        >
          <LogOut className="h-4 w-4" />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  )
}