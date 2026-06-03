'use client';

import { useState, useCallback } from 'react';

import { useRouter } from 'next/navigation';

import { useToast } from '@verone/common';
import type { CreateConsultationData } from '@verone/consultations';
import type { ContactBO } from '@verone/orders';
import {
  useEnseigneContactsBO,
  useOrganisationContactsBO,
} from '@verone/orders';
import { createClient } from '@verone/utils/supabase/client';

import { createConsultation as createConsultationAction } from '@/app/actions/consultations';

export const MAX_IMAGES = 5;

export interface UploadedImage {
  publicUrl: string;
  storagePath: string;
  fileName: string;
  fileSize: number;
}

export interface ConsultationFormData {
  enseigne_id: string | null;
  organisation_id: string | null;
  client_email: string;
  client_phone?: string;
  descriptif: string;
  tarif_maximum?: number;
  priority_level: number;
  source_channel: 'website' | 'email' | 'phone' | 'other';
  estimated_response_date?: string;
  notes_internes?: string;
}

interface UseCreateConsultationOptions {
  /** Si fourni, le produit sera lié à la consultation après création (B3, 2026-06-03) */
  presetProductId?: string | null;
}

export function useCreateConsultation(
  options: UseCreateConsultationOptions = {}
) {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();
  const { presetProductId = null } = options;

  const [loading, setLoading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [formData, setFormData] = useState<ConsultationFormData>({
    enseigne_id: null,
    organisation_id: null,
    client_email: '',
    client_phone: '',
    descriptif: '',
    tarif_maximum: undefined,
    priority_level: 2,
    source_channel: 'website',
    estimated_response_date: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    null
  );
  // Nom du client (enseigne ou organisation) pour affichage récap. Hors formData
  // pour éviter de toucher au contrat CreateConsultationData (BO-CONSULT-CORR-006).
  const [clientName, setClientName] = useState<string | null>(null);

  // Fetch contacts when enseigne or organisation is selected
  const { data: enseigneContacts } = useEnseigneContactsBO(
    formData.enseigne_id
  );
  const { data: orgContacts } = useOrganisationContactsBO(
    formData.organisation_id
  );

  const contacts: ContactBO[] =
    enseigneContacts?.contacts ?? orgContacts?.contacts ?? [];

  const handleContactSelect = useCallback(
    (contact: ContactBO) => {
      if (selectedContactId === contact.id) {
        setSelectedContactId(null);
        setFormData(prev => ({
          ...prev,
          client_email: '',
          client_phone: '',
        }));
      } else {
        setSelectedContactId(contact.id);
        setFormData(prev => ({
          ...prev,
          client_email: contact.email,
          client_phone: contact.phone ?? contact.mobile ?? '',
        }));
        setErrors(prev => ({
          ...prev,
          client_email: '',
          client_phone: '',
        }));
      }
    },
    [selectedContactId]
  );

  const handleInputChange = (
    field: keyof ConsultationFormData,
    value: ConsultationFormData[keyof ConsultationFormData]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleImageUploadSuccess = useCallback(
    (
      publicUrl: string,
      fileName: string,
      storagePath?: string,
      fileSize?: number
    ) => {
      setUploadedImages(prev => [
        ...prev,
        {
          publicUrl,
          fileName,
          storagePath: storagePath ?? '',
          fileSize: fileSize ?? 0,
        },
      ]);
    },
    []
  );

  const handleRemoveImage = useCallback(
    (index: number) => {
      const imageToRemove = uploadedImages[index];
      if (imageToRemove?.storagePath) {
        void supabase.storage
          .from('product-images')
          .remove([imageToRemove.storagePath])
          .catch((err: unknown) => {
            console.error(
              '[CreateConsultation] Failed to delete image from storage:',
              err
            );
          });
      }
      setUploadedImages(prev => prev.filter((_, i) => i !== index));
    },
    [uploadedImages, supabase.storage]
  );

  const handleEnseigneChange = (
    enseigneId: string | null,
    enseigneName: string | null,
    _parentOrgId: string | null
  ) => {
    setFormData(prev => ({
      ...prev,
      enseigne_id: enseigneId,
      client_email: '',
      client_phone: '',
    }));
    setClientName(enseigneName);
    setSelectedContactId(null);
    if (errors.client) {
      setErrors(prev => ({ ...prev, client: '' }));
    }
  };

  const handleOrganisationChange = (
    organisationId: string | null,
    organisationName: string | null
  ) => {
    setFormData(prev => ({
      ...prev,
      organisation_id: organisationId,
      client_email: '',
      client_phone: '',
    }));
    setClientName(organisationName);
    setSelectedContactId(null);
    if (errors.client) {
      setErrors(prev => ({ ...prev, client: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.enseigne_id && !formData.organisation_id) {
      newErrors.client =
        'Veuillez sélectionner une enseigne ou une organisation';
    }

    if (!formData.client_email.trim()) {
      newErrors.client_email = "L'email client est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.client_email)) {
      newErrors.client_email = 'Email invalide';
    }

    if (!formData.descriptif.trim()) {
      newErrors.descriptif = 'La description du projet est requise';
    }

    if (
      formData.client_phone?.trim() &&
      !/^[+]?[\d\s\-()]{8,}$/.test(formData.client_phone)
    ) {
      newErrors.client_phone = 'Numéro de téléphone invalide';
    }

    if (formData.tarif_maximum && formData.tarif_maximum < 0) {
      newErrors.tarif_maximum = 'Le budget doit être positif';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.id) {
        throw new Error('Utilisateur non authentifié');
      }

      const dataToSubmit: CreateConsultationData = {
        enseigne_id: formData.enseigne_id ?? undefined,
        organisation_id: formData.organisation_id ?? undefined,
        client_email: formData.client_email.trim(),
        descriptif: formData.descriptif.trim(),
        priority_level: formData.priority_level ?? 2,
        source_channel: formData.source_channel ?? 'website',
      };

      if (formData.client_phone?.trim()) {
        dataToSubmit.client_phone = formData.client_phone.trim();
      }

      if (uploadedImages.length > 0) {
        dataToSubmit.image_url = uploadedImages[0]?.publicUrl;
        dataToSubmit.images = uploadedImages;
      }

      if (formData.tarif_maximum && formData.tarif_maximum > 0) {
        dataToSubmit.tarif_maximum = formData.tarif_maximum;
      }

      if (formData.estimated_response_date) {
        dataToSubmit.estimated_response_date = formData.estimated_response_date;
      }

      if (formData.notes_internes?.trim()) {
        dataToSubmit.notes_internes = formData.notes_internes.trim();
      }

      const result = await createConsultationAction(dataToSubmit, user.id);

      if (!result.success) {
        throw new Error(result.error ?? 'Erreur lors de la création');
      }

      toast({
        title: 'Consultation créée',
        description: 'La consultation a été créée avec succès',
      });

      const newId = result.data?.id;

      // Lien automatique au produit pré-sélectionné (depuis fiche sourcing — B3)
      if (newId && presetProductId) {
        try {
          await fetch('/api/consultations/associations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              consultation_id: newId,
              product_id: presetProductId,
              quantity: 1,
              proposed_price: null,
              is_free: false,
            }),
          });
        } catch (linkErr) {
          console.error(
            '[CreateConsultation] Lien produit auto échoué:',
            linkErr
          );
          // On ne bloque pas — la consultation est créée, le lien peut être fait manuellement
        }
      }

      // Redirige vers la fiche détail (fallback liste si ID manquant)
      router.push(newId ? `/consultations/${newId}` : '/consultations');
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      toast({
        title: 'Erreur',
        description:
          error instanceof Error
            ? error.message
            : 'Impossible de créer la consultation',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateBack = () => {
    router.back();
  };

  return {
    // State
    loading,
    formData,
    errors,
    uploadedImages,
    selectedContactId,
    contacts,
    clientName,
    // Handlers
    handleContactSelect,
    handleInputChange,
    handleImageUploadSuccess,
    handleRemoveImage,
    handleEnseigneChange,
    handleOrganisationChange,
    handleSubmit,
    handleNavigateBack,
    toast,
  };
}
