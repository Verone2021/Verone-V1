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

// Utiliser le singleton supabase (ne PAS créer une nouvelle instance à chaque render)
import { supabase } from '../lib/supabase';

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
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
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
  const [loading, setLoading] = useState(true);

  // Ref pour éviter les appels multiples lors de l'initialisation
  const initializedRef = useRef(false);

  // Fonction pour récupérer le rôle LinkMe (ne dépend pas de supabase car c'est un singleton)
  const fetchLinkMeRole = useCallback(
    async (userId: string) => {
      try {
        // Utiliser la vue v_linkme_users qui join user_app_roles + user_profiles + enseignes + organisations
        const { data, error } = await (supabase as any)
          .from('v_linkme_users')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (error) {
          // Si la vue n'existe pas, essayer directement la table user_app_roles
          if (error.code === 'PGRST116' || error.code === '42P01') {
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
              setLinkMeRole(null);
              return;
            }

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
          console.error('Erreur fetch LinkMe role:', error);
          setLinkMeRole(null);
          return;
        }

        if (data) {
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
          setLinkMeRole(null);
        }
      } catch (err) {
        console.error('Erreur fetchLinkMeRole:', err);
        setLinkMeRole(null);
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
    // Éviter les doubles initialisations (StrictMode React)
    if (initializedRef.current) return;
    initializedRef.current = true;

    // Récupérer la session initiale
    const initSession = async () => {
      try {
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          await fetchLinkMeRole(currentSession.user.id);
        }
      } catch (error) {
        console.error('Erreur initialisation session:', error);
      } finally {
        setLoading(false);
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

    return () => {
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

      return { error: null };
    } catch (err) {
      return {
        error: err instanceof Error ? err : new Error('Erreur de connexion'),
      };
    }
  };

  // Déconnexion
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setLinkMeRole(null);
  };

  const value: AuthContextType = {
    user,
    session,
    linkMeRole,
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
