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
interface ViewLinkMeUser {
  user_id: string;
  user_role_id: string;
  linkme_role: string;
  enseigne_id: string | null;
  organisation_id: string | null;
  permissions: string[] | null;
  is_active: boolean | null;
  enseigne_name: string | null;
  organisation_name: string | null;
}

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
  const [_loading, _setLoading] = useState(false); // Actions explicites (unused for now)

  // Fonction pour récupérer le rôle LinkMe (ne dépend pas de supabase car c'est un singleton)
  const fetchLinkMeRole = useCallback(
    async (userId: string) => {
      const DEBUG = process.env.NEXT_PUBLIC_DEBUG_AUTH === '1';
      if (DEBUG)
        console.error('[AuthContext] fetchLinkMeRole START', { userId });

      try {
        // Utiliser la vue v_linkme_users qui join user_app_roles + user_profiles + enseignes + organisations
        if (DEBUG)
          console.error('[AuthContext] Fetching from v_linkme_users...');
        const { data, error } = await (
          supabase as unknown as SupabaseClient<{
            v_linkme_users: ViewLinkMeUser;
          }>
        )
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
              console.error(
                '[AuthContext] Fallback to user_app_roles table...'
              );
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
              .single();

            if (roleError ?? !roleData) {
              console.error('[AuthContext] user_app_roles FALLBACK ERROR', {
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
          const typedData = data as unknown as ViewLinkMeUser;

          if (DEBUG) {
            console.error('[AuthContext] v_linkme_users SUCCESS', {
              userId: typedData.user_id,
              userRoleId: typedData.user_role_id,
              role: typedData.linkme_role,
            });
          }

          setLinkMeRole({
            // FIX: Use user_role_id (from user_app_roles.id) instead of undefined data.id
            id: typedData.user_role_id ?? typedData.user_id,
            user_id: typedData.user_id,
            role: typedData.linkme_role as LinkMeRole,
            enseigne_id: typedData.enseigne_id,
            organisation_id: typedData.organisation_id,
            permissions: typedData.permissions ?? [],
            is_active: typedData.is_active ?? true,
            enseigne_name: typedData.enseigne_name,
            organisation_name: typedData.organisation_name,
          });
        } else {
          console.warn('[AuthContext] No data returned from v_linkme_users');
          setLinkMeRole(null);
        }
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

  // Initialisation et écoute des changements d'auth
  useEffect(() => {
    let cancelled = false;

    // Récupérer la session initiale
    const initSession = async () => {
      const DEBUG = process.env.NEXT_PUBLIC_DEBUG_AUTH === '1';
      const startTime = Date.now();
      console.warn('[initSession] START', {
        timestamp: new Date().toISOString(),
      });
      if (DEBUG) console.error('[AuthContext] initSession START');

      // TIMEOUT DE SÉCURITÉ (8 secondes)
      const timeoutId = setTimeout(() => {
        if (!cancelled) {
          const elapsed = Date.now() - startTime;
          console.error('[initSession] TIMEOUT - getSession() suspendu > 8s', {
            elapsed,
          });
          setInitializing(false);
        }
      }, 8000);

      try {
        const beforeGetSession = Date.now();
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();
        const afterGetSession = Date.now();
        console.warn('[initSession] getSession completed', {
          duration: afterGetSession - beforeGetSession,
          hasSession: !!currentSession,
          userId: currentSession?.user?.id,
          expired: currentSession?.expires_at
            ? new Date(currentSession.expires_at * 1000)
            : null,
        });

        if (DEBUG)
          console.error('[AuthContext] getSession result:', {
            hasSession: !!currentSession,
            userId: currentSession?.user?.id,
            expired: currentSession?.expires_at
              ? new Date(currentSession.expires_at * 1000)
              : null,
          });

        // Vérifier cancelled AVANT setState pour éviter les fuites mémoire
        if (cancelled) {
          if (DEBUG) console.error('[AuthContext] initSession CANCELLED');
          console.warn('[initSession] CANCELLED', {
            totalElapsed: Date.now() - startTime,
          });
          return;
        }

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          const beforeFetch = Date.now();
          await fetchLinkMeRole(currentSession.user.id);
          console.warn('[initSession] fetchLinkMeRole completed', {
            duration: Date.now() - beforeFetch,
          });
        }
      } catch (error) {
        console.error('[initSession] ERROR:', error);
      } finally {
        clearTimeout(timeoutId); // Nettoyer le timeout
        // TOUJOURS setInitializing(false) - critical pour sortir du loading
        const totalElapsed = Date.now() - startTime;
        console.warn('[initSession] END', { totalElapsed });
        if (DEBUG)
          console.error(
            '[AuthContext] initSession DONE - setInitializing(false)'
          );
        setInitializing(false);
      }
    };

    void initSession().catch(error => {
      console.error('[AuthContext] initSession failed:', error);
      setInitializing(false); // CRITIQUE - forcer initializing=false même en cas d'erreur
    });

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
      if (DEBUG) console.error('[AuthContext] useEffect CLEANUP');
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [fetchLinkMeRole]); // supabase retiré car c'est un singleton stable

  // Connexion
  // SÉCURITÉ: Vérifie l'accès LinkMe AVANT de créer une session Supabase
  // pour éviter toute faille d'isolation entre applications
  const signIn = async (
    email: string,
    password: string
  ): Promise<{ error: Error | null }> => {
    try {
      const startTime = Date.now();
      console.warn('[signIn] START', { timestamp: new Date().toISOString() });

      // ========================================================================
      // Authentification Supabase
      // Note: La vérification du rôle LinkMe est maintenant gérée par le
      // middleware (apps/linkme/src/middleware.ts) qui redirect vers
      // /unauthorized si l'utilisateur n'a pas de rôle LinkMe actif.
      // Pattern unifié avec back-office (cross-app protection).
      // ========================================================================
      console.warn('[signIn] Authentification Supabase');
      const beforePassword = Date.now();
      const { data, error: authError } = await supabase.auth.signInWithPassword(
        {
          email,
          password,
        }
      );
      const afterPassword = Date.now();
      console.warn('[signIn] signInWithPassword completed', {
        duration: afterPassword - beforePassword,
        hasUser: !!data.user,
        error: authError?.message,
      });

      if (authError) {
        console.warn('[signIn] END - authError', {
          totalElapsed: Date.now() - startTime,
        });
        return { error: authError };
      }

      if (!data.user) {
        console.warn('[signIn] END - no user', {
          totalElapsed: Date.now() - startTime,
        });
        return { error: new Error('Utilisateur non trouvé') };
      }

      // ========================================================================
      // ÉTAPE 3: Double vérification du rôle (sécurité additionnelle)
      // Nécessaire en cas de fallback ou de changement de rôle entre les 2 étapes
      // ========================================================================
      console.warn('[signIn] ÉTAPE 3: Double vérification rôle LinkMe');
      const beforeQuery = Date.now();
      const { data: roleData, error: roleError } = await (
        supabase as SupabaseClient
      )
        .from('user_app_roles')
        .select('id')
        .eq('user_id', data.user.id)
        .eq('app', 'linkme')
        .eq('is_active', true)
        .single();
      const afterQuery = Date.now();
      console.warn('[signIn] query user_app_roles completed', {
        duration: afterQuery - beforeQuery,
        hasRole: !!roleData,
        error: roleError?.message,
      });

      if (roleError ?? !roleData) {
        // L'utilisateur n'a pas accès à LinkMe - déconnecter immédiatement
        console.warn('[signIn] AVANT signOut (no access)');
        await supabase.auth.signOut();
        console.warn('[signIn] END - no access (post-auth check)', {
          totalElapsed: Date.now() - startTime,
        });
        return {
          error: new Error(
            "Vous n'avez pas accès à LinkMe. Contactez votre administrateur."
          ),
        };
      }

      // ========================================================================
      // ÉTAPE 4: Mise à jour des states et chargement du rôle complet
      // ========================================================================
      console.warn('[signIn] ÉTAPE 4: Mise à jour states + fetchLinkMeRole');
      setSession(data.session);
      setUser(data.user);
      const beforeFetch = Date.now();
      await fetchLinkMeRole(data.user.id);
      const afterFetch = Date.now();
      console.warn('[signIn] fetchLinkMeRole completed', {
        duration: afterFetch - beforeFetch,
      });

      const totalElapsed = Date.now() - startTime;
      console.warn('[signIn] END - SUCCESS', { totalElapsed });
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
