'use client';

import { createClient } from '@verone/utils/supabase/client';

import type { AffiliateInsert, AffiliateUpdate, FormData } from './types';

interface MutationDeps {
  toast: (opts: {
    title: string;
    description?: string;
    variant?: 'destructive' | 'default';
  }) => void;
  fetchAffiliates: () => Promise<void>;
}

export async function createAffiliate(
  formData: FormData,
  deps: MutationDeps,
  setSaving: (v: boolean) => void,
  onSuccess: () => void
) {
  const supabase = createClient();
  setSaving(true);

  try {
    const insertData = {
      display_name: formData.display_name,
      slug: formData.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      affiliate_type: formData.affiliate_type,
      bio: formData.bio ?? null,
      status: 'pending' as const,
      organisation_id:
        formData.entity_type === 'organisation' && formData.entity_id
          ? formData.entity_id
          : null,
      enseigne_id:
        formData.entity_type === 'enseigne' && formData.entity_id
          ? formData.entity_id
          : null,
    };

    const { error } = await supabase
      .from('linkme_affiliates')
      .insert(insertData as AffiliateInsert);

    if (error) throw error;

    deps.toast({ title: 'Succès', description: 'Affilié créé avec succès' });
    onSuccess();
    void deps.fetchAffiliates().catch(err => {
      console.error('[Affiliates] Fetch failed:', err);
    });
  } catch (error) {
    console.error('Error creating affiliate:', error);
    deps.toast({
      title: 'Erreur',
      description: "Impossible de créer l'affilié",
      variant: 'destructive',
    });
  } finally {
    setSaving(false);
  }
}

export async function updateAffiliate(
  affiliateId: string,
  formData: FormData,
  deps: MutationDeps,
  setSaving: (v: boolean) => void,
  onSuccess: () => void
) {
  const supabase = createClient();
  setSaving(true);

  try {
    const updateData: AffiliateUpdate = {
      display_name: formData.display_name,
      slug: formData.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      affiliate_type: formData.affiliate_type,
      bio: formData.bio ?? null,
    };

    const { error } = await supabase
      .from('linkme_affiliates')
      .update(updateData)
      .eq('id', affiliateId);

    if (error) throw error;

    deps.toast({ title: 'Succès', description: 'Affilié mis à jour' });
    onSuccess();
    void deps.fetchAffiliates().catch(err => {
      console.error('[Affiliates] Fetch failed:', err);
    });
  } catch (error) {
    console.error('Error updating affiliate:', error);
    deps.toast({
      title: 'Erreur',
      description: "Impossible de mettre à jour l'affilié",
      variant: 'destructive',
    });
  } finally {
    setSaving(false);
  }
}

export async function changeAffiliateStatus(
  affiliateId: string,
  newStatus: 'active' | 'suspended',
  deps: MutationDeps
) {
  const supabase = createClient();

  try {
    const updateData: { status: string; verified_at?: string } = {
      status: newStatus,
    };

    if (newStatus === 'active') {
      updateData.verified_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('linkme_affiliates')
      .update(updateData as AffiliateUpdate)
      .eq('id', affiliateId);

    if (error) throw error;

    deps.toast({
      title: 'Succès',
      description:
        newStatus === 'active' ? 'Affilié activé' : 'Affilié suspendu',
    });

    void deps.fetchAffiliates().catch(err => {
      console.error('[Affiliates] Fetch failed:', err);
    });
  } catch (error) {
    console.error('Error updating status:', error);
    deps.toast({
      title: 'Erreur',
      description: 'Impossible de changer le statut',
      variant: 'destructive',
    });
  }
}

export async function deleteAffiliate(affiliateId: string, deps: MutationDeps) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer cet affilié ?')) return;

  const supabase = createClient();

  try {
    const { error } = await supabase
      .from('linkme_affiliates')
      .delete()
      .eq('id', affiliateId);

    if (error) throw error;

    deps.toast({ title: 'Succès', description: 'Affilié supprimé' });

    void deps.fetchAffiliates().catch(err => {
      console.error('[Affiliates] Fetch failed:', err);
    });
  } catch (error) {
    console.error('Error deleting affiliate:', error);
    deps.toast({
      title: 'Erreur',
      description: "Impossible de supprimer l'affilié",
      variant: 'destructive',
    });
  }
}
