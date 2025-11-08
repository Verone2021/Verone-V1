/**
 * 🔐 Auth Wrapper - Layout Conditionnel
 *
 * Détermine quel layout utiliser selon l'état d'authentification
 */

'use client';

import { useEffect, useState } from 'react';

import { usePathname } from 'next/navigation';

import type { User } from '@supabase/supabase-js';

import { SidebarProvider } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { createClient } from '@verone/utils/supabase/client';

import { AppHeader } from './app-header';
import { AppSidebar } from './app-sidebar';
import { PublicLayout } from './public-layout';

interface AuthWrapperProps {
  children: React.ReactNode;
}

// Pages publiques qui n'utilisent pas le layout authentifié
const PUBLIC_PAGES = ['/', '/login'];

export function AuthWrapper({ children }: AuthWrapperProps) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Vérification authentification avec Supabase
  useEffect(() => {
    const supabase = createClient();

    // Obtenir la session courante
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setIsLoading(false);
    };

    getSession();

    // Écouter les changements d'authentification
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Pendant le chargement, affichage minimal
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="font-logo text-2xl font-light tracking-wider text-black">
          VÉRONE
        </div>
      </div>
    );
  }

  // Page publique OU utilisateur non authentifié
  const isPublicPage = PUBLIC_PAGES.includes(pathname);
  const shouldUsePublicLayout = isPublicPage || !user;

  if (shouldUsePublicLayout) {
    return <PublicLayout>{children}</PublicLayout>;
  }

  // Layout authentifié avec sidebar/header
  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen className="h-screen overflow-hidden">
        {/* Sidebar fixe */}
        <AppSidebar />

        {/* Contenu principal avec scroll localisé */}
        <div className="flex flex-1 flex-col min-h-0">
          <AppHeader />
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
}
