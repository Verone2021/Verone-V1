'use client';

import { useState, useEffect } from 'react';

import { useRouter } from 'next/navigation';

import { createClient } from '@verone/utils/supabase/client';

import {
  markAsResolved,
  convertToOrder,
  convertToConsultation,
  convertToSourcing,
  convertToContact,
} from './actions';
import type { FormSubmission, FormType } from './types';

export function useSubmissionDetail(params: Promise<{ id: string }>) {
  const router = useRouter();
  const [id, setId] = useState<string>('');
  const [submission, setSubmission] = useState<FormSubmission | null>(null);
  const [formType, setFormType] = useState<FormType | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingStatus, setEditingStatus] = useState(false);
  const [editingPriority, setEditingPriority] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [newPriority, setNewPriority] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Unwrap params (Next.js 15 passes params as Promise for client components)
  useEffect(() => {
    void params
      .then(p => setId(p.id))
      .catch(error => {
        console.error('[ContactDetail] Params unwrap failed:', error);
      });
  }, [params]);

  // Fetch data
  useEffect(() => {
    if (!id) return;

    async function fetchData() {
      try {
        const supabase = createClient();

        const { data: sub, error: subError } = await supabase
          .from('form_submissions')
          .select(
            'id, form_type, first_name, last_name, email, phone, company_name, role, subject, message, source, status, priority, created_at, updated_at, sla_deadline, metadata, internal_notes'
          )
          .eq('id', id)
          .single()
          .returns<FormSubmission>();

        if (subError) throw subError;
        if (!sub) {
          router.push('/prises-contact');
          return;
        }

        setSubmission(sub);
        setNewStatus(sub.status);
        setNewPriority(sub.priority);
        setNewNotes(sub.internal_notes ?? '');

        const { data: type, error: typeError } = await supabase
          .from('form_types')
          .select('code, label, description, icon, sla_hours')
          .eq('code', sub.form_type)
          .single()
          .returns<FormType>();

        if (!typeError && type) {
          setFormType(type);
        }
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Unknown error';
        console.error('[ContactDetail] Error fetching submission:', message);
      } finally {
        setLoading(false);
      }
    }

    void fetchData().catch(error => {
      console.error('[ContactDetail] Fetch data failed:', error);
    });
  }, [id, router]);

  const saveStatus = async () => {
    if (!submission) return;

    setSaving(true);
    try {
      const supabase = createClient();

      const { error } = (await supabase
        .from('form_submissions')
        .update({ status: newStatus })
        .eq('id', submission.id)) as { error: unknown };

      if (error) throw error;

      setSubmission({ ...submission, status: newStatus });
      setEditingStatus(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('[ContactDetail] Error updating status:', message);
      alert('Erreur lors de la mise à jour du statut');
    } finally {
      setSaving(false);
    }
  };

  const savePriority = async () => {
    if (!submission) return;

    setSaving(true);
    try {
      const supabase = createClient();

      const { error } = (await supabase
        .from('form_submissions')
        .update({ priority: newPriority })
        .eq('id', submission.id)) as { error: unknown };

      if (error) throw error;

      setSubmission({ ...submission, priority: newPriority });
      setEditingPriority(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('[ContactDetail] Error updating priority:', message);
      alert('Erreur lors de la mise à jour de la priorité');
    } finally {
      setSaving(false);
    }
  };

  const saveNotes = async () => {
    if (!submission) return;

    setSaving(true);
    try {
      const supabase = createClient();

      const { error } = (await supabase
        .from('form_submissions')
        .update({ internal_notes: newNotes ?? null })
        .eq('id', submission.id)) as { error: unknown };

      if (error) throw error;

      setSubmission({ ...submission, internal_notes: newNotes ?? null });
      setEditingNotes(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('[ContactDetail] Error updating notes:', message);
      alert('Erreur lors de la mise à jour des notes');
    } finally {
      setSaving(false);
    }
  };

  const handleConvertToOrder = async () => {
    if (!submission) return;

    if (
      confirm(
        'Convertir cette soumission en commande ? Cette action fermera la soumission.'
      )
    ) {
      const result = await convertToOrder(submission.id, {});
      if (result.success) {
        alert(`Commande créée avec succès! ID: ${result.orderId}`);
        router.refresh();
      } else {
        alert(`Erreur: ${result.error}`);
      }
    }
  };

  const handleConvertToConsultation = async () => {
    if (!submission) return;

    if (
      confirm(
        'Créer une consultation pour cette soumission ? Cette action fermera la soumission.'
      )
    ) {
      const result = await convertToConsultation(submission.id, {});
      if (result.success) {
        alert(`Consultation créée avec succès! ID: ${result.consultationId}`);
        router.refresh();
      } else {
        alert(`Erreur: ${result.error}`);
      }
    }
  };

  const handleConvertToSourcing = async () => {
    if (!submission) return;

    const clientId = prompt("ID de l'organisation ou enseigne:");
    if (!clientId) return;

    const clientType = confirm(
      'Cliquez OK pour Organisation, Annuler pour Enseigne'
    )
      ? 'organisation'
      : 'enseigne';

    const result = await convertToSourcing(submission.id, {
      client_type: clientType,
      client_id: clientId,
    });

    if (result.success) {
      alert(`Sourcing créé avec succès! ID: ${result.productId}`);
      router.refresh();
    } else {
      alert(`Erreur: ${result.error}`);
    }
  };

  const handleConvertToContact = async () => {
    if (!submission) return;

    if (
      confirm(
        'Créer un contact CRM pour cette personne ? Cette action fermera la soumission.'
      )
    ) {
      const result = await convertToContact(submission.id);
      if (result.success) {
        alert(`Contact créé avec succès! ID: ${result.contactId}`);
        router.refresh();
      } else {
        alert(`Erreur: ${result.error}`);
      }
    }
  };

  const handleMarkAsResolved = async () => {
    if (!submission) return;

    if (confirm('Marquer cette soumission comme résolue ?')) {
      const result = await markAsResolved(submission.id);
      if (result.success) {
        alert('Soumission marquée comme résolue');
        router.refresh();
      } else {
        alert(`Erreur: ${result.error}`);
      }
    }
  };

  return {
    submission,
    formType,
    loading,
    editingStatus,
    editingPriority,
    editingNotes,
    newStatus,
    newPriority,
    newNotes,
    saving,
    setEditingStatus,
    setEditingPriority,
    setEditingNotes,
    setNewStatus,
    setNewPriority,
    setNewNotes,
    saveStatus,
    savePriority,
    saveNotes,
    handleConvertToOrder,
    handleConvertToConsultation,
    handleConvertToSourcing,
    handleConvertToContact,
    handleMarkAsResolved,
  };
}
