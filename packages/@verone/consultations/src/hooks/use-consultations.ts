'use client';

import { useState, useCallback } from 'react';

import { useToast } from '@verone/common/hooks';
import { createClient } from '@verone/utils/supabase/client';

import { createConsultationMutations } from './use-consultation-mutations';

// Types publics — définis dans consultations-types.ts, re-exportés ici
// pour rétrocompatibilité (les consommateurs qui importent de 'use-consultations'
// ou de '@verone/consultations' continuent à obtenir ces types).
export type {
  ClientConsultation,
  ConsultationItem,
  ConsultationFilters,
  CreateConsultationData,
  CreateConsultationItemData,
  UpdateConsultationItemData,
} from './consultations-types';

import type {
  ClientConsultation,
  ConsultationFilters,
} from './consultations-types';

const supabase = createClient();

export function useConsultations() {
  const [consultations, setConsultations] = useState<ClientConsultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Charger toutes les consultations
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

        // Appliquer les filtres
        if (filters?.status && filters.status !== 'all') {
          query = query.eq('status', filters.status);
        }
        if (filters?.assigned_to) {
          query = query.eq('assigned_to', filters.assigned_to);
        }
        if (filters?.priority_level && filters.priority_level !== 'all') {
          query = query.eq('priority_level', filters.priority_level);
        }
        // Note: search_client is handled client-side after fetch
        // because organisation_name is not a column — it comes from joined tables
        if (filters?.source_channel && filters.source_channel !== 'all') {
          query = query.eq('source_channel', filters.source_channel);
        }
        if (filters?.date_range) {
          query = query
            .gte('created_at', filters.date_range.start)
            .lte('created_at', filters.date_range.end);
        }

        const { data, error } = await query;

        if (error) throw error;

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

  // Mettre à jour une consultation
  const updateConsultation = async (
    id: string,
    updates: Partial<ClientConsultation>
  ): Promise<boolean> => {
    try {
      setError(null);

      const { error } = await supabase
        .from('client_consultations')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      // Mettre à jour la liste locale
      setConsultations(prev =>
        prev.map(consultation =>
          consultation.id === id
            ? { ...consultation, ...updates }
            : consultation
        )
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
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      });
      return false;
    }
  };

  // Assigner une consultation à un utilisateur
  const assignConsultation = async (
    consultationId: string,
    userId: string
  ): Promise<boolean> => {
    return updateConsultation(consultationId, {
      assigned_to: userId,
      status: 'en_cours',
    });
  };

  // Changer le statut d'une consultation
  const updateStatus = async (
    consultationId: string,
    status: ClientConsultation['status']
  ): Promise<boolean> => {
    const updates: Partial<ClientConsultation> = { status };

    // Si terminée, marquer la date de réponse
    if (status === 'terminee') {
      updates.responded_at = new Date().toISOString();
    }

    return updateConsultation(consultationId, updates);
  };

  // Archiver une consultation
  const archiveConsultation = async (
    consultationId: string
  ): Promise<boolean> => {
    try {
      setError(null);

      const { error } = await supabase
        .from('client_consultations')
        .update({
          archived_at: new Date().toISOString(),
        })
        .eq('id', consultationId);

      if (error) throw error;

      // Mettre à jour la liste locale
      setConsultations(prev =>
        prev.map(consultation =>
          consultation.id === consultationId
            ? { ...consultation, archived_at: new Date().toISOString() }
            : consultation
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
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      });
      return false;
    }
  };

  // Désarchiver une consultation
  const unarchiveConsultation = async (
    consultationId: string
  ): Promise<boolean> => {
    try {
      setError(null);

      const { error } = await supabase
        .from('client_consultations')
        .update({ archived_at: null })
        .eq('id', consultationId);

      if (error) throw error;

      // Mettre à jour la liste locale
      setConsultations(prev =>
        prev.map(consultation =>
          consultation.id === consultationId
            ? { ...consultation, archived_at: undefined }
            : consultation
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
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      });
      return false;
    }
  };

  // Mutations longues extraites dans use-consultation-mutations.ts
  const {
    createConsultation,
    validateConsultation,
    unvalidateConsultation,
    deleteConsultation,
  } = createConsultationMutations({ setConsultations, setError, toast });

  return {
    // État
    consultations,
    loading,
    error,

    // Actions
    fetchConsultations,
    createConsultation,
    updateConsultation,
    assignConsultation,
    updateStatus,
    validateConsultation,
    unvalidateConsultation,
    archiveConsultation,
    unarchiveConsultation,
    deleteConsultation,
  };
}
