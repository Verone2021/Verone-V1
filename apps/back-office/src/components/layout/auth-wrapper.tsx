/**
 * 🔐 Auth Wrapper - Layout Conditionnel
 *
 * Détermine quel layout utiliser selon l'état d'authentification
 */

'use client';

import { useEffect, useState } from 'react';

import { usePathname } from 'next/navigation';

import type { User } from '@supabase/supabase-js';
import { SidebarProvider } from '@verone/ui';

import { AppHeader } from './app-header';
import { AppSidebar } from './app-sidebar';
import { ChannelTabs } from './channel-tabs';
import { PublicLayout } from './public-layout';
import { useSupabase } from '../providers/supabase-provider';

interface AuthWrapperProps {
  children: React.ReactNode;
}

// Pages publiques qui n'utilisent pas le layout authentifié
const PUBLIC_PAGES = ['/', '/login', '/unauthorized', '/module-inactive'];

export function AuthWrapper({ children }: AuthWrapperProps) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ Utiliser l'instance Supabase depuis le Context (singleton)
  const supabase = useSupabase();

  // Vérification authentification avec Supabase
  useEffect(() => {
    // Obtenir la session courante
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setIsLoading(false);
    };

    void getSession().catch(error => {
      console.error('[AuthWrapper] getSession failed:', error);
    });

    // Écouter les changements d'authentification
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]); // ✅ FIX: supabase singleton stable (supabase.auth = objet instable)

  // Renouvellement de la session au réveil de l'onglet.
  //
  // Le jeton se renouvelle tout seul via une minuterie du client Supabase.
  // Chrome suspend les minuteurs des onglets d'arrière-plan bien plus durement
  // que Safari : un onglet laissé de côté revient avec un accès expiré, et la
  // première navigation renvoie vers la page de connexion. C'est le « je ne
  // peux plus me connecter depuis Chrome » rapporté le 17/09.
  //
  // `getSession()` renouvelle le jeton s'il est périmé. On le déclenche au
  // retour sur l'onglet et au retour du réseau, avant que l'utilisateur ne
  // clique. [BO-AUTH-SESSION-002]
  useEffect(() => {
    const refreshIfNeeded = () => {
      if (document.visibilityState !== 'visible') return;
      void supabase.auth.getSession().catch(error => {
        console.error('[AuthWrapper] Renouvellement de session échoué:', error);
      });
    };

    document.addEventListener('visibilitychange', refreshIfNeeded);
    window.addEventListener('online', refreshIfNeeded);
    return () => {
      document.removeEventListener('visibilitychange', refreshIfNeeded);
      window.removeEventListener('online', refreshIfNeeded);
    };
  }, [supabase]);

  const isPublicPage = PUBLIC_PAGES.includes(pathname);
  // Session connue et absente sur une page protégée : ne jamais rendre la page.
  // Sinon le routeur Next suspend sur la redirection serveur et React lève #310.
  const mustRedirect = !isLoading && !user && !isPublicPage;

  useEffect(() => {
    if (mustRedirect) {
      // Navigation complète (pas router.push) : évite la suspension du routeur Next
      window.location.replace('/login');
    }
  }, [mustRedirect]);

  // Pendant le chargement ou la redirection, affichage minimal
  if (isLoading || mustRedirect) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="font-logo text-2xl font-light tracking-wider text-black">
          VÉRONE
        </div>
      </div>
    );
  }

  if (isPublicPage) {
    return <PublicLayout>{children}</PublicLayout>;
  }

  // Layout authentifié avec sidebar/header
  // Note: TooltipProvider est déjà dans layout.tsx — pas de doublon
  return (
    <SidebarProvider defaultOpen={false} className="h-screen overflow-hidden">
      {/* Sidebar fixe */}
      <AppSidebar />

      {/* Contenu principal avec scroll localisé.
          min-w-0 : sans lui, la colonne flex prend la largeur de son contenu le plus large
          (onglets, en-têtes) et la page défile horizontalement sur téléphone. */}
      <div className="flex min-w-0 flex-1 flex-col min-h-0">
        <AppHeader />
        <ChannelTabs />
        <main className="relative flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
