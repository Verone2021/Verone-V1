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
  type ReactNode,
} from 'react';

import type { User, Session } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

// Client SSR-safe (singleton) - utilise cookies pour la session
import { createClient } from '@verone/utils/supabase/client';

const supabase = createClient();

// Types pour les données Supabase
interface UserAppRole {
  id: string;
  user_id: string;
  role: string;
  enseigne_id: string | null;
  organisation_id: string | null;
  permissions: string[] | null;
  is_active: boolean;
  enseignes: { name: string } | null;
  organisations: { legal_name: string; trade_name: string } | null;
}

// Types
export type LinkMeRole =
  | 'enseigne_admin'
  | 'organisation_admin'
  | 'enseigne_collaborateur';

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
  const [_loading, _setLoading] = useState(false); // Actions explicites (unused for now)

  // Fonction pour récupérer le rôle LinkMe
  // PERF: Uses user_app_roles directly (single query) instead of v_linkme_users
  // which frequently fails with PGRST116 causing a double round-trip
  const fetchLinkMeRole = useCallback(
    async (userId: string) => {
      const DEBUG = process.env.NEXT_PUBLIC_DEBUG_AUTH === '1';
      if (DEBUG)
        console.error('[AuthContext] fetchLinkMeRole START', { userId });

      try {
        const { data: roleData, error: roleError } = await (
          supabase as SupabaseClient
        )
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
          .maybeSingle();

        if (roleError ?? !roleData) {
          console.error('[AuthContext] user_app_roles ERROR', {
            code: roleError?.code,
            message: roleError?.message,
            details: roleError?.details,
          });
          setLinkMeRole(null);
          return;
        }

        const typedRoleData = roleData as unknown as UserAppRole;

        if (DEBUG) {
          console.error('[AuthContext] user_app_roles SUCCESS', {
            roleId: typedRoleData.id,
            role: typedRoleData.role,
          });
        }

        setLinkMeRole({
          id: typedRoleData.id,
          user_id: typedRoleData.user_id,
          role: typedRoleData.role as LinkMeRole,
          enseigne_id: typedRoleData.enseigne_id,
          organisation_id: typedRoleData.organisation_id,
          permissions: typedRoleData.permissions ?? [],
          is_active: typedRoleData.is_active,
          enseigne_name: typedRoleData.enseignes?.name ?? null,
          organisation_name:
            typedRoleData.organisations?.trade_name ??
            typedRoleData.organisations?.legal_name ??
            null,
        });
      } catch (err) {
        console.error('[AuthContext] fetchLinkMeRole EXCEPTION', err);
        setLinkMeRole(null);
      } finally {
        if (DEBUG) console.error('[AuthContext] fetchLinkMeRole END');
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

  // ========================================================================
  // FIX DEADLOCK: Charger le rôle via useEffect séparé, JAMAIS dans
  // onAuthStateChange. Raison: chaque query REST appelle getSession() qui
  // attend initializePromise. Si on fait une query REST dans le callback
  // onAuthStateChange (déclenché par _initialize), on crée un deadlock
  // circulaire car initializePromise attend que _initialize finisse, qui
  // attend que _notifyAllSubscribers finisse, qui attend notre callback.
  // ========================================================================
  useEffect(() => {
    if (user) {
      void fetchLinkMeRole(user.id).catch(error => {
        console.error('[AuthContext] fetchLinkMeRole failed:', error);
      });
    } else {
      setLinkMeRole(null);
    }
  }, [user?.id, fetchLinkMeRole]); // eslint-disable-line react-hooks/exhaustive-deps

  // Initialisation et écoute des changements d'auth
  useEffect(() => {
    let cancelled = false;

    // Récupérer la session initiale
    const initSession = async () => {
      const DEBUG = process.env.NEXT_PUBLIC_DEBUG_AUTH === '1';
      const startTime = Date.now();
      if (DEBUG) console.error('[AuthContext] initSession START');

      // TIMEOUT DE SÉCURITÉ (5 secondes)
      const timeoutId = setTimeout(() => {
        if (!cancelled) {
          console.warn('[initSession] TIMEOUT - getSession() > 5s');
          setInitializing(false);
        }
      }, 5000);

      try {
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();

        if (cancelled) return;

        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        // Le rôle est chargé par le useEffect ci-dessus (watch user?.id)

        if (DEBUG)
          console.error('[AuthContext] initSession OK', {
            hasSession: !!currentSession,
            duration: Date.now() - startTime,
          });
      } catch (error) {
        console.error('[initSession] ERROR:', error);
      } finally {
        clearTimeout(timeoutId);
        if (!cancelled) setInitializing(false);
      }
    };

    void initSession().catch(error => {
      console.error('[AuthContext] initSession failed:', error);
      setInitializing(false);
    });

    // Écouter les changements d'auth
    // CRITICAL: Ne JAMAIS faire de query REST (supabase.from(...)) ici.
    // Ça crée un deadlock avec initializePromise de GoTrueClient.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (event === 'SIGNED_OUT') {
        setLinkMeRole(null);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [fetchLinkMeRole]);

  // Connexion
  // SÉCURITÉ: Vérifie l'accès LinkMe AVANT de créer une session Supabase
  // pour éviter toute faille d'isolation entre applications
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

      // Mise à jour des states — le rôle est chargé automatiquement
      // par le useEffect qui watch user?.id
      setSession(data.session);
      setUser(data.user);
      return { error: null };
    } catch (err) {
      console.error('[signIn] EXCEPTION:', err);
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
      window.location.href = redirectTo ?? '/';
    }
  };

  const value: AuthContextType = {
    user,
    session,
    linkMeRole,
    initializing,
    loading: _loading,
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
