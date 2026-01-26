'use client';

/**
 * Hook: useCurrentUser
 *
 * Cached authentication hook to reduce auth.getUser() calls.
 * Uses React Query with Infinity staleTime for session-long caching.
 *
 * Features:
 * - Single source of truth for current user
 * - Cached until logout (staleTime: Infinity)
 * - Automatic invalidation on auth state changes
 * - Type-safe user data
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, isLoading, isAuthenticated } = useCurrentUser();
 *
 *   if (isLoading) return <Spinner />;
 *   if (!isAuthenticated) return <LoginPrompt />;
 *
 *   return <div>Welcome, {user.email}</div>;
 * }
 * ```
 *
 * @see https://github.com/orgs/supabase/discussions/20905
 * @module use-current-user
 */

import { useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import type { User, AuthError } from '@supabase/supabase-js';

import { createClient } from '../supabase/client';

// Query keys
export const authKeys = {
  all: ['auth'] as const,
  currentUser: () => [...authKeys.all, 'current-user'] as const,
  session: () => [...authKeys.all, 'session'] as const,
};

/**
 * Fetch current user from Supabase Auth
 */
async function fetchCurrentUser(): Promise<User | null> {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    // Don't throw on auth errors (user not logged in)
    if (error.message?.includes('not authenticated')) {
      return null;
    }
    console.error('[useCurrentUser] Auth error:', error.message);
    return null;
  }

  return user;
}

/**
 * Hook to get the current authenticated user with caching
 *
 * The user is cached with Infinity staleTime, meaning it won't
 * refetch until explicitly invalidated (on logout/login).
 */
export function useCurrentUser() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  // Subscribe to auth state changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Update cache with new user data
        queryClient.setQueryData(authKeys.currentUser(), session?.user ?? null);
      } else if (event === 'SIGNED_OUT') {
        // Clear cache on logout
        queryClient.setQueryData(authKeys.currentUser(), null);
        queryClient.removeQueries({ queryKey: authKeys.all });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient, supabase.auth]);

  const query = useQuery({
    queryKey: authKeys.currentUser(),
    queryFn: fetchCurrentUser,
    staleTime: Infinity, // Never refetch automatically
    gcTime: Infinity, // Keep in cache until logout
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: false,
  });

  return {
    user: query.data ?? null,
    isLoading: query.isLoading,
    isAuthenticated: !!query.data,
    error: query.error as AuthError | null,
    // Expose refetch for manual refresh if needed
    refetch: query.refetch,
  };
}

/**
 * Hook to get just the user ID (most common use case)
 * More efficient than full user object when you only need the ID
 */
export function useCurrentUserId(): string | null {
  const { user } = useCurrentUser();
  return user?.id ?? null;
}

/**
 * Hook to handle logout with cache invalidation
 */
export function useLogout() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    onSuccess: () => {
      // Clear all auth-related queries
      queryClient.removeQueries({ queryKey: authKeys.all });
      // Clear other user-specific data
      queryClient.removeQueries({ queryKey: ['customers'] });
      queryClient.removeQueries({ queryKey: ['orders'] });
      queryClient.removeQueries({ queryKey: ['affiliate'] });
    },
  });
}

/**
 * Hook to invalidate auth cache
 * Useful after profile updates or role changes
 */
export function useInvalidateAuth() {
  const queryClient = useQueryClient();

  return {
    invalidateUser: () =>
      queryClient.invalidateQueries({ queryKey: authKeys.currentUser() }),
    invalidateAll: () =>
      queryClient.invalidateQueries({ queryKey: authKeys.all }),
    // Force refetch user data
    refetchUser: () =>
      queryClient.refetchQueries({ queryKey: authKeys.currentUser() }),
  };
}

/**
 * Prefetch current user (useful for SSR/initial load)
 */
export async function prefetchCurrentUser(
  queryClient: ReturnType<typeof useQueryClient>
) {
  await queryClient.prefetchQuery({
    queryKey: authKeys.currentUser(),
    queryFn: fetchCurrentUser,
    staleTime: Infinity,
  });
}
