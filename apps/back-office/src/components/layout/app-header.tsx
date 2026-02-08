'use client';

import { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { NotificationsDropdown } from '@verone/notifications';
import { Button } from '@verone/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@verone/ui';
import { cn } from '@verone/utils';
import { createClient } from '@verone/utils/supabase/client';
import { User, LogOut, Settings, Users, Activity } from 'lucide-react';

interface AppHeaderProps {
  className?: string;
}

export function AppHeader({ className }: AppHeaderProps) {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);

  // Récupérer le rôle de l'utilisateur au chargement
  useEffect(() => {
    const fetchUserRole = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
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

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <header
      className={cn(
        'flex h-16 items-center justify-end border-b border-black bg-white px-6',
        className
      )}
    >
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

        {/* Menu Profil utilisateur */}
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
              onClick={() => {
                void handleLogout().catch(error => {
                  console.error('[AppHeader] handleLogout failed:', error);
                });
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Se déconnecter</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
