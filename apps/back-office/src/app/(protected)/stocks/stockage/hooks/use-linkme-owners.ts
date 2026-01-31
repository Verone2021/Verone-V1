/**
 * Hook: useLinkMeOwners
 * Selecteur d'owners (enseignes + organisations) avec compte LinkMe actif
 *
 * @module use-linkme-owners
 * @since 2025-12-20
 */

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

export interface LinkMeOwner {
  id: string;
  name: string;
  type: 'enseigne' | 'organisation';
}

/**
 * Hook: recupere les owners avec un compte LinkMe actif
 */
export function useLinkMeOwners(searchTerm?: string) {
  return useQuery({
    queryKey: ['linkme-owners', searchTerm],
    queryFn: async (): Promise<LinkMeOwner[]> => {
      const supabase = createClient();

      // Get enseignes with LinkMe role
      const { data: enseigneRoles } = await supabase
        .from('user_app_roles')
        .select('enseigne_id')
        .eq('app', 'linkme')
        .eq('is_active', true)
        .not('enseigne_id', 'is', null);

      const enseigneIds = [
        ...new Set(
          enseigneRoles
            ?.map(r => r.enseigne_id)
            .filter((id): id is string => id !== null)
        ),
      ];

      // Get organisations with LinkMe role
      const { data: orgRoles } = await supabase
        .from('user_app_roles')
        .select('organisation_id')
        .eq('app', 'linkme')
        .eq('is_active', true)
        .not('organisation_id', 'is', null);

      const orgIds = [
        ...new Set(
          orgRoles
            ?.map(r => r.organisation_id)
            .filter((id): id is string => id !== null)
        ),
      ];

      const owners: LinkMeOwner[] = [];

      // Fetch enseignes
      if (enseigneIds.length > 0) {
        let query = supabase
          .from('enseignes')
          .select('id, name')
          .in('id', enseigneIds);

        if (searchTerm) {
          query = query.ilike('name', `%${searchTerm}%`);
        }

        const { data: enseignes } = await query.order('name').limit(50);

        if (enseignes) {
          for (const e of enseignes) {
            owners.push({
              id: e.id,
              name: e.name || 'Sans nom',
              type: 'enseigne',
            });
          }
        }
      }

      // Fetch organisations
      if (orgIds.length > 0) {
        let query = supabase
          .from('organisations')
          .select('id, trade_name, legal_name')
          .in('id', orgIds);

        if (searchTerm) {
          query = query.or(
            `trade_name.ilike.%${searchTerm}%,legal_name.ilike.%${searchTerm}%`
          );
        }

        const { data: orgs } = await query.limit(50);

        if (orgs) {
          for (const o of orgs) {
            owners.push({
              id: o.id,
              name: o.trade_name ?? o.legal_name ?? 'Sans nom',
              type: 'organisation',
            });
          }
        }
      }

      // Sort by name
      return owners.sort((a, b) => a.name.localeCompare(b.name));
    },
    staleTime: 60000,
  });
}
