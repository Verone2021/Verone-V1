/**
 * 📊 Activity Tracker Provider - Vérone
 * Provider React pour tracking automatique activité utilisateur
 * S'active uniquement pour utilisateurs authentifiés
 * ⏰ Tracking 24/7 (équipes internationales)
 */

'use client';

import { useEffect, useState } from 'react';

import { usePathname } from 'next/navigation';

import type { User } from '@supabase/supabase-js';
import { useUserActivityTracker } from '@verone/notifications';

import { useSupabase } from './supabase-provider';

interface ActivityTrackerProviderProps {
  children: React.ReactNode;
}

export function ActivityTrackerProvider({
  children,
}: ActivityTrackerProviderProps) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

  // ✅ Utiliser l'instance Supabase depuis le Context (singleton)
  const supabase = useSupabase();

  // Suivre l'authentification utilisateur
  useEffect(() => {
    // Obtenir session initiale
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };

    void getSession().catch(error => {
      console.error('[ActivityTracker] getSession failed:', error);
    });

    // Écouter changements authentification
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  // Initialiser tracker uniquement si user authentifié
  const {
    trackEvent,
    trackFormSubmit: _trackFormSubmit,
    trackSearch: _trackSearch,
    trackFilterApplied: _trackFilterApplied,
    currentSession: _currentSession,
    flushEvents,
  } = useUserActivityTracker();

  // Tracking automatique changement de page (24/7)
  useEffect(() => {
    if (user && pathname) {
      // Ne pas tracker pages publiques/auth
      const publicPaths = [
        '/login',
        '/signup',
        '/forgot-password',
        '/reset-password',
      ];
      const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

      if (!isPublicPath) {
        // Defer tracking to avoid setState during Router render
        setTimeout(() => {
          trackEvent({
            action: 'page_view',
            new_data: {
              page_url: pathname,
              page_title: document.title,
              referrer: document.referrer,
            },
          });
        }, 0);
      }
    }
    // Seulement pathname et user dans les dépendances pour éviter boucles infinies
  }, [pathname, user]);

  // Flush événements avant fermeture page
  useEffect(() => {
    const handleBeforeUnload = () => {
      void flushEvents().catch(error => {
        console.error('[ActivityTracker] flushEvents failed:', error);
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
    // Pas de dépendances - on veut installer le listener une seule fois
  }, []);

  // Rendre provider invisible (ne modifie pas le DOM)
  return <>{children}</>;
}
