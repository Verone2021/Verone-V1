'use client';

import { Tooltip, TooltipContent, TooltipTrigger } from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import { LogOut } from 'lucide-react';

interface SidebarFooterProps {
  isExpanded: boolean;
}

/**
 * Zone déconnexion — Adaptive (bouton texte expanded / icône compact).
 * Seul endroit dans la sidebar avec un appel Supabase (auth.signOut).
 */
export function SidebarFooter({ isExpanded }: SidebarFooterProps) {
  const handleSignOut = () => {
    const supabase = createClient();
    void supabase.auth.signOut().then(() => {
      window.location.href = '/login';
    });
  };

  return (
    <div className="border-t border-black p-4">
      {isExpanded ? (
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 px-3 py-3 text-sm text-black/70 hover:text-black hover:bg-black/5 transition-all duration-200 rounded-md"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          <span className="font-medium">Déconnexion</span>
        </button>
      ) : (
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <button
              onClick={handleSignOut}
              className="flex w-full items-center justify-center p-3 text-sm text-black opacity-70 hover:opacity-100 hover:bg-black hover:bg-opacity-5 transition-all duration-150 rounded-md"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Déconnexion</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
