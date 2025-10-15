"use client"

import { Search, User, LogOut, Settings, Users, Activity } from "lucide-react"
import { ButtonV2 } from "@/components/ui/button"
import { cn } from "../../lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { NotificationsDropdown } from "../business/notifications-dropdown"

interface AppHeaderProps {
  className?: string
}

export function AppHeader({ className }: AppHeaderProps) {
  const router = useRouter()
  const [userRole, setUserRole] = useState<string | null>(null)

  // Récupérer le rôle de l'utilisateur au chargement
  useEffect(() => {
    const fetchUserRole = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('user_id', user.id)
          .single()

        setUserRole(profile?.role || null)
      }
    }

    fetchUserRole()
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

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
        {/* Notifications - Dropdown intelligent avec liste complète */}
        <NotificationsDropdown />

        {/* Menu Profil utilisateur */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <ButtonV2 variant="ghost" size="icon">
              <User className="h-5 w-5" />
              <span className="sr-only">Menu profil</span>
            </ButtonV2>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => router.push('/profile')}
            >
              <Settings className="mr-2 h-4 w-4" />
              <span>Mon Profil</span>
            </DropdownMenuItem>

            {/* Liens Owner uniquement */}
            {userRole === 'owner' && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => router.push('/admin/users')}
                >
                  <Users className="mr-2 h-4 w-4" />
                  <span>Administration</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => router.push('/admin/activite-utilisateurs')}
                >
                  <Activity className="mr-2 h-4 w-4" />
                  <span>Rapport d'Activité Équipe</span>
                </DropdownMenuItem>
              </>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-verone-black font-medium hover:bg-gray-100 focus:bg-gray-100"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Se déconnecter</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}