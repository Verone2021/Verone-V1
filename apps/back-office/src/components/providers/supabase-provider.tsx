/**
 * 🔐 SupabaseProvider - Context React pour Supabase Client
 *
 * Fournit une instance Supabase unique partagée dans toute l'application.
 * Pattern recommandé par Next.js 15 + Supabase (2025).
 *
 * Avantages:
 * - ✅ 1 seule instance partagée (singleton)
 * - ✅ Pas de recréation à chaque render
 * - ✅ Architecture propre et maintenable
 * - ✅ Élimine warnings "Multiple GoTrueClient instances"
 *
 * Usage:
 * ```tsx
 * import { useSupabase } from '@/components/providers/supabase-provider';
 *
 * function MyComponent() {
 *   const supabase = useSupabase();
 *   // utiliser supabase...
 * }
 * ```
 */
'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { createClient } from '@verone/utils/supabase/client';

// ============================================================================
// CONTEXT
// ============================================================================

type SupabaseClient = ReturnType<typeof createClient>;

const SupabaseContext = createContext<SupabaseClient | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

interface SupabaseProviderProps {
  children: ReactNode;
}

export function SupabaseProvider({ children }: SupabaseProviderProps) {
  // ✅ useMemo garantit qu'on crée l'instance qu'une seule fois
  // Combiné avec le singleton dans createClient(), on a une protection double couche
  const supabase = useMemo(() => createClient(), []);

  return (
    <SupabaseContext.Provider value={supabase}>
      {children}
    </SupabaseContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook pour accéder à l'instance Supabase dans n'importe quel composant enfant
 *
 * @throws {Error} Si utilisé en dehors de SupabaseProvider
 *
 * @example
 * ```tsx
 * const supabase = useSupabase();
 * const { data, error } = await supabase.from('products').select('*');
 * ```
 */
export function useSupabase(): SupabaseClient {
  const context = useContext(SupabaseContext);

  if (!context) {
    throw new Error(
      'useSupabase must be used within SupabaseProvider. ' +
        'Wrap your component tree with <SupabaseProvider>.'
    );
  }

  return context;
}
