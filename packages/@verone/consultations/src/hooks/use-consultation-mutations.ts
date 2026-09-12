'use client';

import type { Dispatch, SetStateAction } from 'react';

import { createClient } from '@verone/utils/supabase/client';

import type {
  ClientConsultation,
  CreateConsultationData,
} from './consultations-types';

// ---------------------------------------------------------------------------
// Types internes
// ---------------------------------------------------------------------------

type ToastFn = (options: {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
}) => void;

export interface ConsultationMutationsDeps {
  setConsultations: Dispatch<SetStateAction<ClientConsultation[]>>;
  setError: Dispatch<SetStateAction<string | null>>;
  toast: ToastFn;
}

// ---------------------------------------------------------------------------
// Factory — mutations longues extraites de useConsultations
// Fonctions conservées intactes pour faciliter la fusion de [BO-PERF-S3-001]
// (ajout de invalidateMenuCounts après chaque écriture réussie).
// ---------------------------------------------------------------------------

export function createConsultationMutations(deps: ConsultationMutationsDeps) {
  const { setConsultations, setError, toast } = deps;
  const supabase = createClient();

  // Créer une nouvelle consultation
  const createConsultation = async (
    data: CreateConsultationData
  ): Promise<ClientConsultation | null> => {
    try {
      setError(null);

      const { data: newConsultation, error } = await supabase
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

      if (error) throw error;

      // Ajouter à la liste locale
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
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      });
      return null;
    }
  };

  // Valider une consultation (utilisée Phase 2 pour pricing)
  const validateConsultation = async (
    consultationId: string
  ): Promise<boolean> => {
    try {
      setError(null);

      const { error } = await supabase
        .from('client_consultations')
        .update({
          validated_at: new Date().toISOString(),
          status: 'terminee',
        })
        .eq('id', consultationId);

      if (error) throw error;

      // Mettre à jour la liste locale
      setConsultations(prev =>
        prev.map(consultation =>
          consultation.id === consultationId
            ? {
                ...consultation,
                validated_at: new Date().toISOString(),
                status: 'terminee' as const,
              }
            : consultation
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
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      });
      return false;
    }
  };

  // Dévalider une consultation : remet validated_at=null + status='en_cours'.
  // Permet de reprendre l'édition des items (prix, quantités, échantillons)
  // après une validation prématurée. Symétrique de validateConsultation.
  const unvalidateConsultation = async (
    consultationId: string
  ): Promise<boolean> => {
    try {
      setError(null);

      const { error } = await supabase
        .from('client_consultations')
        .update({
          validated_at: null,
          validated_by: null,
          status: 'en_cours',
        })
        .eq('id', consultationId);

      if (error) throw error;

      setConsultations(prev =>
        prev.map(consultation =>
          consultation.id === consultationId
            ? {
                ...consultation,
                validated_at: undefined,
                validated_by: undefined,
                status: 'en_cours' as const,
              }
            : consultation
        )
      );

      toast({
        title: 'Consultation dévalidée',
        description: 'Tu peux à nouveau modifier les prix et quantités',
      });

      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erreur lors de la dévalidation';
      setError(message);
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      });
      return false;
    }
  };

  // Supprimer une consultation + cascade: hard delete devis liés (Qonto + DB locale)
  // La confirmation doit être gérée par le composant appelant
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
          // Delete from Qonto API first
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
              // Continue even if Qonto delete fails
            }
          }

          // Hard delete items from local DB
          await supabase
            .from('financial_document_items')
            .delete()
            .eq('document_id', devis.id);

          // Hard delete devis from local DB
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
      const { error } = await supabase
        .from('client_consultations')
        .update({
          deleted_at: new Date().toISOString(),
        })
        .eq('id', consultationId);

      if (error) throw error;

      // Retirer de la liste locale
      setConsultations(prev =>
        prev.filter(consultation => consultation.id !== consultationId)
      );

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
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    createConsultation,
    validateConsultation,
    unvalidateConsultation,
    deleteConsultation,
  };
}
