/**
 * 🔐 Layout Protégé - Pages INTERNES LinkMe
 *
 * Vérifie l'authentification côté serveur AVANT de render les pages enfants.
 * Design e-commerce moderne avec sidebar + header minimaliste.
 *
 * IMPORTANT (Best Practices 2025):
 * ================================
 * - Utilise getUser() PAS getSession() pour la sécurité
 * - getUser() valide le JWT avec le serveur Supabase
 * - getSession() lit seulement le cookie (peut être falsifié)
 *
 * @updated 2026-01-29 - Ajout protection server-side (post-suppression middleware)
 */

import { redirect } from 'next/navigation';

import { createServerClient } from '@/lib/supabase-server';

import { AppSidebar } from '../../components/layout/AppSidebar';
import { MinimalHeader } from '../../components/layout/MinimalHeader';
import { SidebarProvider } from '../../components/layout/SidebarProvider';
import { Providers } from '../../components/providers/Providers';

// Force dynamic rendering for all protected routes
// Prevents build-time errors when auth check fails (no session at build time)
export const dynamic = 'force-dynamic';

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerClient();

  // IMPORTANT: Utiliser getUser() pas getSession()
  // getUser() valide le JWT avec le serveur Supabase
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // Debug logs pour production (Vercel Function Logs)
  console.log('[MainLayout] Auth check:', {
    hasUser: !!user,
    userId: user?.id,
    email: user?.email,
    error: error?.message,
  });

  // Pas d'utilisateur ou erreur = redirection vers login
  if (error || !user) {
    console.error('[MainLayout] No user found, redirecting to login');
    redirect('/login');
  }

  // Vérifier que l'utilisateur a un rôle LinkMe actif
  const { data: linkmeRole, error: roleError } = await supabase
    .from('user_app_roles')
    .select('id')
    .eq('user_id', user.id)
    .eq('app', 'linkme')
    .eq('is_active', true)
    .maybeSingle();

  // Debug logs pour RLS check
  console.log('[MainLayout] LinkMe role check:', {
    hasRole: !!linkmeRole,
    roleId: linkmeRole?.id,
    userId: user.id,
    error: roleError?.message,
    errorDetails: roleError?.details,
    errorHint: roleError?.hint,
  });

  // Pas de rôle LinkMe = redirection vers login
  if (!linkmeRole) {
    console.error('[MainLayout] No LinkMe role found, redirecting to login');
    redirect('/login?error=no_linkme_access');
  }

  console.log('[MainLayout] Auth successful, rendering dashboard');

  // Utilisateur authentifié avec rôle LinkMe = render la page
  return (
    <Providers>
      <SidebarProvider>
        <div className="flex min-h-screen">
          {/* Sidebar Navigation */}
          <AppSidebar />

          {/* Main Content Area - ml-16 pour sidebar collapsible (w-16) */}
          <div className="flex-1 flex flex-col min-h-screen lg:ml-16">
            <MinimalHeader />
            <main className="flex-1 overflow-auto">{children}</main>
          </div>
        </div>
      </SidebarProvider>
    </Providers>
  );
}
