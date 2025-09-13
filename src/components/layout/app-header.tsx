"use client"

import { Bell, Search, User } from "lucide-react"
import { Button } from "../ui/button"
import { cn } from "../../lib/utils"

interface AppHeaderProps {
  className?: string
}

export function AppHeader({ className }: AppHeaderProps) {
  return (
    <header className={cn(
      "flex h-16 items-center justify-between border-b border-black bg-white px-6",
      className
    )}>
      {/* Zone de recherche */}
      <div className="flex flex-1 items-center space-x-4">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black opacity-50" />
          <input
            type="search"
            placeholder="Rechercher produits, collections..."
            className="w-full border border-black bg-white py-2 pl-10 pr-4 text-sm text-black placeholder:text-black placeholder:opacity-50 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
          />
        </div>
      </div>

      {/* Actions utilisateur */}
      <div className="flex items-center space-x-2">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
            3
          </span>
          <span className="sr-only">Notifications</span>
        </Button>

        {/* Profil utilisateur */}
        <Button variant="ghost" size="icon">
          <User className="h-5 w-5" />
          <span className="sr-only">Profil utilisateur</span>
        </Button>
      </div>
    </header>
  )
}