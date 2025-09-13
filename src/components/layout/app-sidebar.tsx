"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "../../lib/utils"
import {
  Home,
  ShoppingCart,
  Package,
  Users,
  Settings,
  BookOpen,
  LogOut
} from "lucide-react"

// Interface pour les éléments de navigation
interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  description?: string
}

// Configuration navigation selon charte Vérone
const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
    description: "Vue d'ensemble et indicateurs"
  },
  {
    title: "Catalogue",
    href: "/catalogue",
    icon: BookOpen,
    description: "Gestion produits et collections"
  },
  {
    title: "Commandes",
    href: "/commandes",
    icon: ShoppingCart,
    description: "Suivi des commandes clients"
  },
  {
    title: "Stocks",
    href: "/stocks",
    icon: Package,
    description: "Inventaire et approvisionnement"
  },
  {
    title: "Clients",
    href: "/clients",
    icon: Users,
    description: "Gestion de la clientèle"
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
            const isActive = pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href))

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    // Base styles Vérone
                    "nav-item flex w-full items-center space-x-3 px-3 py-2.5 text-sm transition-all duration-150 ease-out",
                    "border border-transparent",
                    // État par défaut
                    "text-black hover:opacity-70",
                    // État actif selon charte
                    isActive && "bg-black text-white border-black"
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-medium">{item.title}</span>
                    {item.description && (
                      <span className={cn(
                        "text-xs opacity-70",
                        isActive ? "text-white" : "text-black"
                      )}>
                        {item.description}
                      </span>
                    )}
                  </div>
                </Link>
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
            // Redirection vers login
            window.location.href = '/login'
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