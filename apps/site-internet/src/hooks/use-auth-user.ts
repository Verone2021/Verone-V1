import { useQuery } from '@tanstack/react-query';

import { createClient } from '@/lib/supabase/client';

interface AuthUser {
  id: string;
  email: string | undefined;
  user_metadata: Record<string, string | undefined>;
}

export function useAuthUser() {
  const supabase = createClient();

  const { data: user, ...query } = useQuery({
    queryKey: ['auth-user'],
    queryFn: async (): Promise<AuthUser | null> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      return {
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata as Record<string, string | undefined>,
      };
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  return { user, ...query };
}
