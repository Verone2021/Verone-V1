"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { cn } from "../../lib/utils"
import { featureFlags, getModuleDeploymentStatus } from "@/lib/feature-flags"
import { InactiveModuleWrapper, PhaseIndicator } from "@/components/ui/phase-indicator"
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
  ShoppingBag,
  MessageCircle,
  Search,
  Archive,
  TrendingUp,
  ArrowUpDown,
  ArrowDownToLine,
  ArrowUpFromLine,
  AlertTriangle,
  Target,
  Eye,
  CheckCircle,
  Plus,
  Globe,
  Store,
  Smartphone
} from "lucide-react"

// Interface pour les éléments de navigation hiérarchique
interface NavItem {
  title: string
  href?: string
  icon: React.ComponentType<{ className?: string }>
  description?: string
  children?: NavItem[]
}

// Configuration navigation optimisée selon best practices ERP 2025
const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
    description: "Vue d'ensemble et indicateurs"
  },
  {
    title: "Catalogue",
    href: "/catalogue", // Navigation directe vers la page produits
    icon: BookOpen,
    description: "Produits et collections",
    children: [
      {
        title: "Dashboard",
        href: "/catalogue/dashboard",
        icon: BarChart3,
        description: "Vue d'ensemble et KPIs"
      },
      {
        title: "Produits",
        href: "/catalogue",
        icon: Grid3x3,
        description: "Liste et gestion unifiée"
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
        title: "Variantes",
        href: "/catalogue/variantes",
        icon: Layers,
        description: "Couleurs, tailles, matériaux"
      },
      {
        title: "Nouveau Produit",
        href: "/catalogue/create",
        icon: Plus,
        description: "Création unifiée"
      }
    ]
  },
  {
    title: "Organisation",
    href: "/organisation",
    icon: Building2,
    description: "Entreprise, contacts et partenaires"
  },
  {
    title: "Stocks",
    icon: Package,
    description: "Inventaire et mouvements",
    children: [
      {
        title: "Vue d'Ensemble",
        href: "/stocks",
        icon: BarChart3,
        description: "Dashboard et statistiques"
      },
      {
        title: "Inventaire",
        href: "/stocks/inventaire",
        icon: Grid3x3,
        description: "Gestion des stocks"
      },
      {
        title: "Mouvements",
        href: "/stocks/mouvements",
        icon: ArrowUpDown,
        description: "Historique unifié"
      },
      {
        title: "Entrées",
        href: "/stocks/entrees",
        icon: ArrowDownToLine,
        description: "Réceptions"
      },
      {
        title: "Sorties",
        href: "/stocks/sorties",
        icon: ArrowUpFromLine,
        description: "Expéditions"
      },
      {
        title: "Alertes",
        href: "/stocks/alertes",
        icon: AlertTriangle,
        description: "Ruptures et seuils"
      }
    ]
  },
  {
    title: "Sourcing",
    icon: Target,
    description: "Approvisionnement et échantillons",
    children: [
      {
        title: "Dashboard",
        href: "/sourcing",
        icon: BarChart3,
        description: "Vue d'ensemble sourcing"
      },
      {
        title: "Produits à Sourcer",
        href: "/sourcing/produits",
        icon: Search,
        description: "Internes et clients"
      },
      {
        title: "Échantillons",
        href: "/sourcing/echantillons",
        icon: Eye,
        description: "Commandes et suivi"
      },
      {
        title: "Validation",
        href: "/sourcing/validation",
        icon: CheckCircle,
        description: "Passage au catalogue"
      }
    ]
  },
  {
    title: "Interactions Clients",
    icon: MessageCircle,
    description: "Consultations et commandes",
    children: [
      {
        title: "Dashboard Client",
        href: "/interactions/dashboard",
        icon: BarChart3,
        description: "Vue d'ensemble"
      },
      {
        title: "Consultations",
        href: "/consultations",
        icon: MessageCircle,
        description: "Demandes et devis"
      },
      {
        title: "Commandes Clients",
        href: "/commandes/clients",
        icon: ShoppingBag,
        description: "Ventes et suivi"
      }
    ]
  },
  {
    title: "Commandes Fournisseurs",
    href: "/commandes/fournisseurs",
    icon: Truck,
    description: "Achats et approvisionnements"
  },
  {
    title: "Canaux de Vente",
    href: "/canaux-vente",
    icon: ShoppingBag,
    description: "Dashboard tous canaux de distribution"
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
  const [expandedItems, setExpandedItems] = useState<string[]>(['Catalogue', 'Stocks', 'Sourcing', 'Interactions Clients', 'Canaux de Vente']) // Sections principales ouvertes par défaut

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

  // Helper pour obtenir le nom de module à partir du titre
  const getModuleName = (title: string): string => {
    const moduleMap: Record<string, string> = {
      'Catalogue': 'catalogue',
      'Stocks': 'stocks', 
      'Sourcing': 'sourcing',
      'Interactions Clients': 'interactions',
      'Commandes Fournisseurs': 'commandes',
      'Canaux de Vente': 'canaux-vente',
      'Contacts & Organisations': 'contacts'
    }
    return moduleMap[title] || title.toLowerCase()
  }

  // Fonction pour rendre un élément de navigation avec gestion des phases
  const renderNavItem = (item: NavItem) => {
    const moduleName = getModuleName(item.title)
    const moduleStatus = getModuleDeploymentStatus(moduleName)
    const isExpanded = expandedItems.includes(item.title)
    const isActiveItem = isActiveOrHasActiveChild(item)

    // Élément de navigation principal
    const navElement = (
      <>
        {item.children ? (
          // Élément parent avec enfants - Si href existe, navigation + expansion, sinon juste expansion
          item.href ? (
            // Élément avec href et children : lien cliquable + bouton chevron séparé
            <div className="flex w-full">
              <Link
                href={moduleStatus === 'active' ? item.href : '#'}
                onClick={(e) => moduleStatus !== 'active' && e.preventDefault()}
                className={cn(
                  // Base styles Vérone
                  "nav-item flex flex-1 items-center space-x-3 px-3 py-2.5 text-sm transition-all duration-150 ease-out",
                  "border border-transparent rounded-l",
                  // État par défaut
                  "text-black hover:opacity-70",
                  // État actif si enfant sélectionné
                  isActiveItem && "bg-black text-white border-black",
                  // État désactivé pour modules inactifs
                  moduleStatus !== 'active' && "opacity-60 cursor-not-allowed"
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
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
              </Link>
              {/* Bouton chevron séparé pour expansion */}
              {moduleStatus === 'active' && (
                <button
                  onClick={() => toggleExpanded(item.title)}
                  className={cn(
                    "px-2 border-l border-black/10 transition-all",
                    isActiveItem ? "bg-black text-white" : "text-black hover:bg-black/5"
                  )}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
          ) : (
            // Élément sans href : bouton d'expansion uniquement
            <button
              onClick={() => moduleStatus === 'active' ? toggleExpanded(item.title) : undefined}
              className={cn(
                // Base styles Vérone
                "nav-item flex w-full items-center space-x-3 px-3 py-2.5 text-sm transition-all duration-150 ease-out",
                "border border-transparent",
                // État par défaut
                "text-black hover:opacity-70",
                // État actif si enfant sélectionné
                isActiveItem && "bg-black text-white border-black",
                // État désactivé pour modules inactifs
                moduleStatus !== 'active' && "opacity-60 cursor-not-allowed"
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
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
              {/* Icône d'expansion */}
              {moduleStatus === 'active' && (
                <>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 flex-shrink-0" />
                  )}
                </>
              )}
            </button>
          )
        ) : (
          // Élément simple sans enfants
          <Link
            href={moduleStatus === 'active' ? item.href! : '#'}
            onClick={(e) => moduleStatus !== 'active' && e.preventDefault()}
            className={cn(
              // Base styles Vérone
              "nav-item flex w-full items-center space-x-3 px-3 py-2.5 text-sm transition-all duration-150 ease-out",
              "border border-transparent",
              // État par défaut
              "text-black hover:opacity-70",
              // État actif selon charte
              isActiveItem && "bg-black text-white border-black",
              // État désactivé pour modules inactifs
              moduleStatus !== 'active' && "opacity-60 cursor-not-allowed"
            )}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
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
          </Link>
        )}

        {/* Sous-menu (enfants) - seulement si module actif */}
        {item.children && isExpanded && moduleStatus === 'active' && (
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
      </>
    )

    return navElement
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
            return (
              <li key={item.title}>
                {renderNavItem(item)}
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Zone utilisateur */}
      <div className="border-t border-black p-4">
        <div className="flex items-center mb-3">
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