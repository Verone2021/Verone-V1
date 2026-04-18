'use client';

import { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { NotificationsDropdown } from '@verone/notifications';
import { Button, useSidebar } from '@verone/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@verone/ui';
import { cn } from '@verone/utils';
import { getUserSafe } from '@verone/utils';
import { createClient } from '@verone/utils/supabase/client';
import { User, LogOut, Settings, Users, Activity, Menu } from 'lucide-react';

function UserMenu({
  userRole,
  onLogout,
}: {
  userRole: string | null;
  onLogout: () => void;
}) {
  const router = useRouter();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <User className="h-5 w-5" />
          <span className="sr-only">Menu profil</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => router.push('/profile')}
        >
          <Settings className="mr-2 h-4 w-4" />
          <span>Mon Profil</span>
        </DropdownMenuItem>
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
          onClick={onLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Se déconnecter</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface AppHeaderProps {
  className?: string;
}

export function AppHeader({ className }: AppHeaderProps) {
  const [userRole, setUserRole] = useState<string | null>(null);
  const { toggleSidebar, isMobile } = useSidebar();

  // Récupérer le rôle de l'utilisateur au chargement
  useEffect(() => {
    const fetchUserRole = async () => {
      const {
        data: { user },
      } = await getUserSafe();

      if (user) {
        const supabase = createClient();
        const { data: userRole } = await supabase
          .from('user_app_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('app', 'back-office')
          .eq('is_active', true)
          .maybeSingle();

        setUserRole(userRole?.role ?? null);
      }
    };

    void fetchUserRole().catch(error => {
      console.error('[AppHeader] fetchUserRole failed:', error);
    });
  }, []);

  const handleLogout = () => {
    const supabase = createClient();
    void supabase.auth
      .signOut()
      .then(() => {
        // Hard navigation évite rerender pendant session cleanup
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      })
      .catch(error => {
        console.error('[AppHeader] Logout failed:', error);
        // Fallback: force redirect même si signOut échoue
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      });
  };

  return (
    <header
      className={cn(
        'flex h-16 items-center border-b border-black bg-white px-4 md:px-6',
        className
      )}
    >
      {/* Bouton hamburger — mobile uniquement (< md) */}
      {isMobile && (
        <Button
          variant="ghost"
          size="sm"
          className="h-11 w-11 md:hidden mr-2 flex-shrink-0"
          onClick={toggleSidebar}
          aria-label="Ouvrir le menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}

      {/* Spacer pour pousser les actions à droite */}
      <div className="flex-1" />

      {/* Actions utilisateur */}
      <div className="flex items-center space-x-2">
        {/* Date */}
        <div className="text-xs text-slate-600 px-3 border-r border-slate-200">
          {new Date().toLocaleDateString('fr-FR', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
          })}
        </div>

        {/* Notifications - Dropdown intelligent avec liste complète */}
        <NotificationsDropdown />

        <UserMenu userRole={userRole} onLogout={handleLogout} />
      </div>
    </header>
  );
}
