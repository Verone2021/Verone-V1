'use client';

import { createClient } from '@verone/utils/supabase/client';

import { type PendingOrganisation } from '../../hooks/use-organisation-approvals';

// ============================================================================
// DELETE HANDLER
// ============================================================================

export async function deleteOrganisationFromDB(orgId: string): Promise<void> {
  const supabase = createClient();
  await supabase.from('contacts').delete().eq('organisation_id', orgId);
  const { error } = await supabase
    .from('organisations')
    .delete()
    .eq('id', orgId);
  if (error) throw error;
}

// ============================================================================
// HANDLER TYPES
// ============================================================================

export interface OrgTabActions {
  selectedOrg: PendingOrganisation | null;
  rejectReason: string;
  deleteTarget: PendingOrganisation | null;
  setSelectedOrg: (org: PendingOrganisation | null) => void;
  setRejectReason: (reason: string) => void;
  setIsRejectDialogOpen: (open: boolean) => void;
  setDeleteTarget: (org: PendingOrganisation | null) => void;
  setIsDeleting: (v: boolean) => void;
  doRefetch: () => void;
}
