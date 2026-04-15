'use client';

import { useState, useCallback } from 'react';

import { useToast } from '@verone/common/hooks';
import { createClient } from '@verone/utils/supabase/client';

import type {
  ClientConsultation,
  ConsultationFilters,
  CreateConsultationData,
} from './consultations-types';

const supabase = createClient();

export function useConsultations() {
  const [consultations, setConsultations] = useState<ClientConsultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchConsultations = useCallback(
    async (filters?: ConsultationFilters) => {
      try {
        setLoading(true);
        setError(null);

        let query = supabase
          .from('client_consultations')
          .select(
            '*, enseigne:enseignes(id, name), organisation:organisations(id, legal_name, trade_name)'
          )
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        if (filters?.status && filters.status !== 'all') {
          query = query.eq('status', filters.status);
        }
        if (filters?.assigned_to) {
          query = query.eq('assigned_to', filters.assigned_to);
        }
        if (filters?.priority_level && filters.priority_level !== 'all') {
          query = query.eq('priority_level', filters.priority_level);
        }
        if (filters?.source_channel && filters.source_channel !== 'all') {
          query = query.eq('source_channel', filters.source_channel);
        }
        if (filters?.date_range) {
          query = query
            .gte('created_at', filters.date_range.start)
            .lte('created_at', filters.date_range.end);
        }

        const { data, error: queryError } = await query;

        if (queryError) throw queryError;

        setConsultations((data ?? []) as ClientConsultation[]);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Erreur lors du chargement des consultations';
        setError(message);
        console.error('Erreur fetchConsultations:', err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const createConsultation = async (
    data: CreateConsultationData
  ): Promise<ClientConsultation | null> => {
    try {
      setError(null);

      const { data: newConsultation, error: insertError } = await supabase
        .from('client_consultations')
        .insert([
          {
            enseigne_id: data.enseigne_id ?? null,
            organisation_id: data.organisation_id ?? null,
            client_email: data.client_email,
            client_phone: data.client_phone,
            descriptif: data.descriptif,
            image_url: data.image_url,
            tarif_maximum: data.tarif_maximum,
            priority_level: data.priority_level ?? 2,
            source_channel: data.source_channel ?? 'website',
            estimated_response_date: data.estimated_response_date,
          },
        ])
        .select(
          'id, enseigne_id, organisation_id, client_email, client_phone, descriptif, image_url, tarif_maximum, status, assigned_to, notes_internes, priority_level, source_channel, estimated_response_date, created_at, updated_at, created_by, responded_at, responded_by, validated_at, validated_by, archived_at, archived_by, deleted_at, deleted_by'
        )
        .single();

      if (insertError) throw insertError;

      setConsultations(prev => [
        newConsultation as ClientConsultation,
        ...prev,
      ]);

      toast({
        title: 'Consultation créée',
        description: 'La consultation a été créée avec succès',
      });

      return newConsultation as ClientConsultation;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Erreur lors de la création de la consultation';
      setError(message);
      toast({ title: 'Erreur', description: message, variant: 'destructive' });
      return null;
    }
  };

  const updateConsultation = async (
    id: string,
    updates: Partial<ClientConsultation>
  ): Promise<boolean> => {
    try {
      setError(null);

      const { error: updateError } = await supabase
        .from('client_consultations')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;

      setConsultations(prev =>
        prev.map(c => (c.id === id ? { ...c, ...updates } : c))
      );

      toast({
        title: 'Consultation mise à jour',
        description: 'Les modifications ont été enregistrées',
      });

      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erreur lors de la mise à jour';
      setError(message);
      toast({ title: 'Erreur', description: message, variant: 'destructive' });
      return false;
    }
  };

  const assignConsultation = async (
    consultationId: string,
    userId: string
  ): Promise<boolean> => {
    return updateConsultation(consultationId, {
      assigned_to: userId,
      status: 'en_cours',
    });
  };

  const updateStatus = async (
    consultationId: string,
    status: ClientConsultation['status']
  ): Promise<boolean> => {
    const updates: Partial<ClientConsultation> = { status };
    if (status === 'terminee') {
      updates.responded_at = new Date().toISOString();
    }
    return updateConsultation(consultationId, updates);
  };

  const validateConsultation = async (
    consultationId: string
  ): Promise<boolean> => {
    try {
      setError(null);

      const { error: validateError } = await supabase
        .from('client_consultations')
        .update({
          validated_at: new Date().toISOString(),
          status: 'terminee',
        })
        .eq('id', consultationId);

      if (validateError) throw validateError;

      setConsultations(prev =>
        prev.map(c =>
          c.id === consultationId
            ? {
                ...c,
                validated_at: new Date().toISOString(),
                status: 'terminee' as const,
              }
            : c
        )
      );

      toast({
        title: 'Consultation validée',
        description: 'La consultation a été marquée comme validée',
      });

      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erreur lors de la validation';
      setError(message);
      toast({ title: 'Erreur', description: message, variant: 'destructive' });
      return false;
    }
  };

  const archiveConsultation = async (
    consultationId: string
  ): Promise<boolean> => {
    try {
      setError(null);

      const { error: archiveError } = await supabase
        .from('client_consultations')
        .update({
          archived_at: new Date().toISOString(),
        } as Partial<ClientConsultation>)
        .eq('id', consultationId);

      if (archiveError) throw archiveError;

      setConsultations(prev =>
        prev.map(c =>
          c.id === consultationId
            ? { ...c, archived_at: new Date().toISOString() }
            : c
        )
      );

      toast({
        title: 'Consultation archivée',
        description: 'La consultation a été archivée',
      });

      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erreur lors de l'archivage";
      setError(message);
      toast({ title: 'Erreur', description: message, variant: 'destructive' });
      return false;
    }
  };

  const unarchiveConsultation = async (
    consultationId: string
  ): Promise<boolean> => {
    try {
      setError(null);

      const { error: unarchiveError } = await supabase
        .from('client_consultations')
        .update({ archived_at: null } as unknown as Partial<ClientConsultation>)
        .eq('id', consultationId);

      if (unarchiveError) throw unarchiveError;

      setConsultations(prev =>
        prev.map(c =>
          c.id === consultationId ? { ...c, archived_at: undefined } : c
        )
      );

      toast({
        title: 'Consultation désarchivée',
        description: 'La consultation a été désarchivée',
      });

      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erreur lors du désarchivage';
      setError(message);
      toast({ title: 'Erreur', description: message, variant: 'destructive' });
      return false;
    }
  };

  const deleteConsultation = async (
    consultationId: string
  ): Promise<boolean> => {
    try {
      setError(null);

      // 1. Fetch linked devis from local DB
      const { data: linkedDevis } = await supabase
        .from('financial_documents')
        .select('id, qonto_invoice_id, document_number')
        .eq('consultation_id', consultationId)
        .eq('document_type', 'customer_quote');

      // 2. Hard delete each devis from Qonto + local DB
      if (linkedDevis && linkedDevis.length > 0) {
        for (const devis of linkedDevis) {
          if (devis.qonto_invoice_id) {
            try {
              await fetch(`/api/qonto/quotes/${devis.qonto_invoice_id}`, {
                method: 'DELETE',
              });
            } catch (qontoErr) {
              console.warn(
                `[deleteConsultation] Qonto delete failed for ${devis.document_number}:`,
                qontoErr
              );
            }
          }

          await supabase
            .from('financial_document_items')
            .delete()
            .eq('document_id', devis.id);

          await supabase
            .from('financial_documents')
            .delete()
            .eq('id', devis.id);
        }

        console.warn(
          `[deleteConsultation] Deleted ${linkedDevis.length} devis for consultation ${consultationId}`
        );
      }

      // 3. Soft delete the consultation itself
      const { error: deleteError } = await supabase
        .from('client_consultations')
        .update({
          deleted_at: new Date().toISOString(),
        } as Partial<ClientConsultation>)
        .eq('id', consultationId);

      if (deleteError) throw deleteError;

      setConsultations(prev => prev.filter(c => c.id !== consultationId));

      const devisCount = linkedDevis?.length ?? 0;
      toast({
        title: 'Consultation supprimée',
        description:
          devisCount > 0
            ? `La consultation et ${devisCount} devis lié(s) ont été supprimés`
            : 'La consultation a été supprimée',
      });

      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erreur lors de la suppression';
      setError(message);
      toast({ title: 'Erreur', description: message, variant: 'destructive' });
      return false;
    }
  };

  return {
    consultations,
    loading,
    error,
    fetchConsultations,
    createConsultation,
    updateConsultation,
    assignConsultation,
    updateStatus,
    validateConsultation,
    archiveConsultation,
    unarchiveConsultation,
    deleteConsultation,
  };
}
