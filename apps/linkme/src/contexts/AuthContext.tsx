'use client';

/**
 * AuthContext - Contexte d'authentification LinkMe
 *
 * Gère la session utilisateur et le rôle LinkMe
 * Utilise Supabase pour l'authentification
 *
 * @module AuthContext
 * @since 2025-12-01
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';

import type { User, Session } from '@supabase/supabase-js';

// Client SSR-safe (singleton) - utilise cookies pour la session
// Cookie distinct 'sb-linkme-auth' pour isoler la session de LinkMe
import { createClient } from '@verone/utils/supabase/client';

const supabase = createClient('linkme');

// Types
export type LinkMeRole =
  | 'enseigne_admin'
  | 'organisation_admin'
  | 'org_independante'
  | 'client';

export interface LinkMeUserRole {
  id: string;
  user_id: string;
  role: LinkMeRole;
  enseigne_id: string | null;
  organisation_id: string | null;
  permissions: string[];
  is_active: boolean;
  enseigne_name: string | null;
  organisation_name: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  linkMeRole: LinkMeUserRole | null;
  initializing: boolean; // Verification initiale de session (silencieux)
  loading: boolean; // Action explicite en cours (connexion/deconnexion)
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: (redirectTo?: string) => Promise<void>;
  refreshLinkMeRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [linkMeRole, setLinkMeRole] = useState<LinkMeUserRole | null>(null);
  const [initializing, setInitializing] = useState(true); // Verification initiale
  const [loading, setLoading] = useState(false); // Actions explicites

  // Fonction pour récupérer le rôle LinkMe (ne dépend pas de supabase car c'est un singleton)
  const fetchLinkMeRole = useCallback(
    async (userId: string) => {
      const DEBUG = process.env.NEXT_PUBLIC_DEBUG_AUTH === '1';
      if (DEBUG) console.log('[AuthContext] fetchLinkMeRole START', { userId });

      try {
        // Utiliser la vue v_linkme_users qui join user_app_roles + user_profiles + enseignes + organisations
        if (DEBUG) console.log('[AuthContext] Fetching from v_linkme_users...');
        const { data, error } = await (supabase as any)
          .from('v_linkme_users')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (error) {
          // TOUJOURS logger les erreurs (pas de flag DEBUG pour les erreurs)
          console.error('[AuthContext] v_linkme_users ERROR', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint,
          });

          // Si la vue n'existe pas, essayer directement la table user_app_roles
          if (error.code === 'PGRST116' || error.code === '42P01') {
            if (DEBUG)
              console.log('[AuthContext] Fallback to user_app_roles table...');
            const { data: roleData, error: roleError } = await (supabase as any)
              .from('user_app_roles')
              .select(
                `
              id,
              user_id,
              role,
              enseigne_id,
              organisation_id,
              permissions,
              is_active,
              enseignes:enseigne_id(name),
              organisations:organisation_id(legal_name, trade_name)
            `
              )
              .eq('user_id', userId)
              .eq('app', 'linkme')
              .eq('is_active', true)
              .single();

            if (roleError || !roleData) {
              console.error('[AuthContext] user_app_roles FALLBACK ERROR', {
                code: roleError?.code,
                message: roleError?.message,
                status: roleError?.status,
              });
              setLinkMeRole(null);
              return;
            }

            console.log('[AuthContext] user_app_roles SUCCESS', {
              roleId: roleData.id,
              role: roleData.role,
            });

            setLinkMeRole({
              id: roleData.id,
              user_id: roleData.user_id,
              role: roleData.role as LinkMeRole,
              enseigne_id: roleData.enseigne_id,
              organisation_id: roleData.organisation_id,
              permissions: roleData.permissions || [],
              is_active: roleData.is_active,
              enseigne_name: roleData.enseignes?.name || null,
              organisation_name:
                roleData.organisations?.trade_name ||
                roleData.organisations?.legal_name ||
                null,
            });
            return;
          }
          console.error('[AuthContext] UNHANDLED ERROR', {
            code: error.code,
            message: error.message,
          });
          setLinkMeRole(null);
          return;
        }

        if (data) {
          console.log('[AuthContext] v_linkme_users SUCCESS', {
            userId: data.user_id,
            role: data.linkme_role,
          });

          setLinkMeRole({
            id: data.id || data.user_id,
            user_id: data.user_id,
            role: data.linkme_role as LinkMeRole,
            enseigne_id: data.enseigne_id,
            organisation_id: data.organisation_id,
            permissions: data.permissions || [],
            is_active: data.is_active ?? true,
            enseigne_name: data.enseigne_name,
            organisation_name: data.organisation_name,
          });
        } else {
          console.warn('[AuthContext] No data returned from v_linkme_users');
          setLinkMeRole(null);
        }
      } catch (err) {
        console.error('[AuthContext] fetchLinkMeRole EXCEPTION', err);
        setLinkMeRole(null);
      } finally {
        console.log('[AuthContext] fetchLinkMeRole END');
      }
    },
    [] // Pas de dépendance car supabase est un singleton
  );

  // Rafraîchir le rôle manuellement
  const refreshLinkMeRole = useCallback(async () => {
    if (user) {
      await fetchLinkMeRole(user.id);
    }
  }, [user, fetchLinkMeRole]);

  // Initialisation et écoute des changements d'auth
  useEffect(() => {
    let cancelled = false;

    // Récupérer la session initiale
    const initSession = async () => {
      const DEBUG = process.env.NEXT_PUBLIC_DEBUG_AUTH === '1';
      if (DEBUG) console.log('[AuthContext] initSession START');

      try {
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();

        if (DEBUG)
          console.log('[AuthContext] getSession result:', {
            hasSession: !!currentSession,
            userId: currentSession?.user?.id,
          });

        // Vérifier cancelled AVANT setState pour éviter les fuites mémoire
        if (cancelled) {
          if (DEBUG) console.log('[AuthContext] initSession CANCELLED');
          return;
        }

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          await fetchLinkMeRole(currentSession.user.id);
        }
      } catch (error) {
        console.error('[AuthContext] initSession ERROR:', error);
      } finally {
        // Toujours setInitializing(false), même si cancelled
        if (!cancelled) {
          if (DEBUG)
            console.log(
              '[AuthContext] initSession DONE - setInitializing(false)'
            );
          setInitializing(false);
        }
      }
    };

    initSession();

    // Écouter les changements d'auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        await fetchLinkMeRole(newSession.user.id);
      } else {
        setLinkMeRole(null);
      }

      // Si déconnexion, reset complet
      if (event === 'SIGNED_OUT') {
        setLinkMeRole(null);
      }
    });

    // Cleanup: marquer comme cancelled et unsub
    return () => {
      const DEBUG = process.env.NEXT_PUBLIC_DEBUG_AUTH === '1';
      if (DEBUG) console.log('[AuthContext] useEffect CLEANUP');
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [fetchLinkMeRole]); // supabase retiré car c'est un singleton stable

  // Connexion
  const signIn = async (
    email: string,
    password: string
  ): Promise<{ error: Error | null }> => {
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword(
        {
          email,
          password,
        }
      );

      if (authError) {
        return { error: authError };
      }

      if (!data.user) {
        return { error: new Error('Utilisateur non trouvé') };
      }

      // Vérifier que l'utilisateur a accès à LinkMe
      const { data: roleData, error: roleError } = await (supabase as any)
        .from('user_app_roles')
        .select('*')
        .eq('user_id', data.user.id)
        .eq('app', 'linkme')
        .eq('is_active', true)
        .single();

      if (roleError || !roleData) {
        // L'utilisateur n'a pas accès à LinkMe - déconnecter
        await supabase.auth.signOut();
        return {
          error: new Error(
            "Vous n'avez pas accès à LinkMe. Contactez votre administrateur."
          ),
        };
      }

      // Mettre a jour les states IMMEDIATEMENT avec les donnees retournees
      // (ne pas attendre onAuthStateChange qui peut etre lent)
      setSession(data.session);
      setUser(data.user);
      await fetchLinkMeRole(data.user.id);

      return { error: null };
    } catch (err) {
      return {
        error: err instanceof Error ? err : new Error('Erreur de connexion'),
      };
    }
  };

  // Déconnexion avec redirection
  const signOut = async (redirectTo?: string) => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setLinkMeRole(null);
    // Rediriger vers la page d'accueil apres deconnexion
    if (typeof window !== 'undefined') {
      window.location.href = redirectTo || '/';
    }
  };

  const value: AuthContextType = {
    user,
    session,
    linkMeRole,
    initializing,
    loading,
    signIn,
    signOut,
    refreshLinkMeRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook pour utiliser le contexte
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

// Helper pour vérifier si l'utilisateur est connecté
export function useIsAuthenticated() {
  const { user, loading } = useAuth();
  return { isAuthenticated: !!user, loading };
}

// Helper pour vérifier le rôle
export function useHasRole(requiredRoles: LinkMeRole[]) {
  const { linkMeRole, loading } = useAuth();

  const hasRole = linkMeRole ? requiredRoles.includes(linkMeRole.role) : false;

  return { hasRole, loading };
}
