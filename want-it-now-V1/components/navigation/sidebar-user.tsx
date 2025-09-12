'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, User, ChevronDown, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'
import { getRoleColor, getRoleLabel } from '@/lib/validations/utilisateurs'

interface SidebarUserProps {
  collapsed?: boolean
}

export function SidebarUser({ collapsed = false }: SidebarUserProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const { profile, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    const result = await signOut()
    if (result.success) {
      router.replace('/')
    }
    setDropdownOpen(false)
  }

  if (!profile) return null

  if (collapsed) {
    return (
      <div className="flex flex-col items-center space-y-2">
        <Button
          variant="ghost"
          
          className="h-8 w-8 p-0 rounded-full"
          onClick={() => router.push('/profile')}
          title={`${profile.prenom} ${profile.nom}`}
        >
          <div className="w-6 h-6 gradient-copper rounded-full flex items-center justify-center">
            <User className="h-3 w-3 text-white" />
          </div>
        </Button>
        
        <Button
          variant="ghost"
          
          className="h-6 w-6 p-0 text-red-600 hover:bg-red-50"
          onClick={handleSignOut}
          title="Déconnexion"
        >
          <LogOut className="h-3 w-3" />
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* User info */}
      <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
        <div className="w-8 h-8 gradient-copper rounded-full flex items-center justify-center">
          <User className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 truncate">
            {profile.prenom} {profile.nom}
          </div>
          <div className="flex items-center mt-1">
            <Badge className={getRoleColor((profile as any)?.role || '')} >
              {getRoleLabel((profile as any)?.role || '')}
            </Badge>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex space-x-1">
        <Button
          variant="ghost"
          
          className="flex-1 justify-start h-8 text-xs"
          onClick={() => router.push('/profile')}
        >
          <User className="h-3 w-3 mr-2" />
          Profil
        </Button>
        
        <Button
          variant="ghost"
          
          className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
          onClick={handleSignOut}
          title="Déconnexion"
        >
          <LogOut className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}