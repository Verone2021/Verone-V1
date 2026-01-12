/**
 * Hook: useArchiveOrganisation
 * Archivage d'une organisation (soft delete)
 *
 * Le trigger DB `notify_affiliate_archive` créera automatiquement
 * une notification dans `affiliate_archive_requests` pour le back-office.
 *
 * @module use-archive-organisation
 * @since 2026-01-10
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';
import { toast } from 'sonner';

// =====================================================================
// HOOK
// =====================================================================

/**
 * Hook pour archiver une organisation
 *
 * @returns Mutation pour archiver une organisation
 *
 * @example
 * ```tsx
 * const { mutate: archive, isPending } = useArchiveOrganisation();
 * archive(orgId); // Archive l'org et notifie le back-office
 * ```
 */
export function useArchiveOrganisation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orgId: string) => {
      const supabase = createClient();

      const { error } = await supabase
        .from('organisations')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', orgId);

      if (error) {
        console.error('Error archiving organisation:', error);
        throw error;
      }

      return orgId;
    },
    onSuccess: () => {
      // Invalider les queries pour rafraîchir la liste
      queryClient.invalidateQueries({ queryKey: ['enseigne-organisations'] });
      queryClient.invalidateQueries({ queryKey: ['organisation-stats'] });
      toast.success("Organisation archivée. L'équipe Vérone a été notifiée.");
    },
    onError: (error: Error) => {
      console.error('Archive mutation error:', error);
      toast.error("Erreur lors de l'archivage de l'organisation");
    },
  });
}

export default useArchiveOrganisation;
