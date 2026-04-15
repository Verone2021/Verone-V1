'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

import type { ContactBO } from '@verone/orders';
import {
  useEnseigneContactsBO,
  useOrganisationContactsBO,
} from '@verone/orders';
import { ButtonV2 } from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@verone/ui';
import { Building, Save, X } from 'lucide-react';

import type { ClientConsultation } from '@verone/consultations/hooks';

import {
  ConsultationClientSection,
  ConsultationContactSection,
  ConsultationProjectSection,
  ConsultationParamsSection,
  type EditFormData,
} from './EditConsultationSections';

interface EditConsultationModalProps {
  open: boolean;
  onClose: () => void;
  consultation: ClientConsultation;
  onUpdated: (updates: Partial<ClientConsultation>) => Promise<boolean>;
}

const DEFAULT_FORM: EditFormData = {
  enseigne_id: null,
  organisation_id: null,
  client_email: '',
  client_phone: '',
  descriptif: '',
  notes_internes: '',
  tarif_maximum: 0,
  estimated_response_date: '',
  priority_level: 2,
  source_channel: 'website',
};

export function EditConsultationModal({
  open,
  onClose,
  consultation,
  onUpdated,
}: EditConsultationModalProps) {
  const [formData, setFormData] = useState<EditFormData>(DEFAULT_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    null
  );

  const { data: enseigneContacts } = useEnseigneContactsBO(
    formData.enseigne_id
  );
  const { data: orgContacts } = useOrganisationContactsBO(
    formData.organisation_id
  );

  const contacts: ContactBO[] = useMemo(
    () => enseigneContacts?.contacts ?? orgContacts?.contacts ?? [],
    [enseigneContacts?.contacts, orgContacts?.contacts]
  );

  // Initialize form from consultation
  useEffect(() => {
    if (consultation) {
      setFormData({
        enseigne_id: consultation.enseigne_id ?? null,
        organisation_id: consultation.organisation_id ?? null,
        client_email: consultation.client_email ?? '',
        client_phone: consultation.client_phone ?? '',
        descriptif: consultation.descriptif ?? '',
        notes_internes: consultation.notes_internes ?? '',
        tarif_maximum: consultation.tarif_maximum ?? 0,
        estimated_response_date: consultation.estimated_response_date
          ? new Date(consultation.estimated_response_date)
              .toISOString()
              .split('T')[0]
          : '',
        priority_level: consultation.priority_level ?? 2,
        source_channel: consultation.source_channel ?? 'website',
      });
      setSelectedContactId(null);
    }
  }, [consultation]);

  // Auto-select contact matching consultation email
  useEffect(() => {
    if (
      contacts.length > 0 &&
      consultation.client_email &&
      !selectedContactId
    ) {
      const matchingContact = contacts.find(
        c => c.email === consultation.client_email
      );
      if (matchingContact) {
        setSelectedContactId(matchingContact.id);
      }
    }
  }, [contacts, consultation.client_email, selectedContactId]);

  const handleEnseigneChange = useCallback(
    (
      enseigneId: string | null,
      _enseigneName: string | null,
      _parentOrgId: string | null
    ) => {
      setFormData(prev => ({
        ...prev,
        enseigne_id: enseigneId,
        organisation_id: null,
        client_email: '',
        client_phone: '',
      }));
      setSelectedContactId(null);
      if (errors.client) {
        setErrors(prev => ({ ...prev, client: '' }));
      }
    },
    [errors.client]
  );

  const handleOrganisationChange = useCallback(
    (organisationId: string | null, _organisationName: string | null) => {
      setFormData(prev => ({
        ...prev,
        organisation_id: organisationId,
        enseigne_id: null,
        client_email: '',
        client_phone: '',
      }));
      setSelectedContactId(null);
      if (errors.client) {
        setErrors(prev => ({ ...prev, client: '' }));
      }
    },
    [errors.client]
  );

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

  const handleFieldChange = useCallback(
    (field: keyof EditFormData, value: string | number) => {
      setFormData(prev => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleClearError = useCallback((field: string) => {
    setErrors(prev => ({ ...prev, [field]: '' }));
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.enseigne_id && !formData.organisation_id) {
      newErrors.client =
        'Veuillez sélectionner une enseigne ou une organisation';
    }

    if (!formData.client_email.trim()) {
      newErrors.client_email = "L'email client est obligatoire";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.client_email)) {
      newErrors.client_email = "Format d'email invalide";
    }

    if (!formData.descriptif.trim()) {
      newErrors.descriptif = 'La description est obligatoire';
    }

    if (formData.tarif_maximum && formData.tarif_maximum < 0) {
      newErrors.tarif_maximum = 'Le budget ne peut pas être négatif';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const updates: Partial<ClientConsultation> = {
        enseigne_id: formData.enseigne_id ?? undefined,
        organisation_id: formData.organisation_id ?? undefined,
        client_email: formData.client_email,
        client_phone: formData.client_phone || undefined,
        descriptif: formData.descriptif,
        notes_internes: formData.notes_internes || undefined,
        tarif_maximum:
          formData.tarif_maximum > 0 ? formData.tarif_maximum : undefined,
        estimated_response_date: formData.estimated_response_date || undefined,
        priority_level: formData.priority_level,
        source_channel: formData.source_channel,
      };

      const success = await onUpdated(updates);

      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('Erreur mise à jour consultation:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xs font-bold flex items-center gap-1">
              <Building className="h-3 w-3" />
              Modifier la consultation
            </DialogTitle>
            <ButtonV2 variant="ghost" size="sm" onClick={onClose}>
              <X className="h-3 w-3" />
            </ButtonV2>
          </div>
          <DialogDescription>
            Modifiez les informations de la consultation client
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={e => {
            void handleSubmit(e).catch((submitError: unknown) => {
              console.error(
                '[EditConsultationModal] Submit failed:',
                submitError
              );
            });
          }}
          className="space-y-4 mt-2"
        >
          <ConsultationClientSection
            formData={formData}
            contacts={contacts}
            selectedContactId={selectedContactId}
            errors={errors}
            onEnseigneChange={handleEnseigneChange}
            onOrganisationChange={handleOrganisationChange}
            onContactSelect={handleContactSelect}
          />

          <ConsultationContactSection
            formData={formData}
            errors={errors}
            onChange={handleFieldChange}
            onClearError={handleClearError}
          />

          <ConsultationProjectSection
            formData={formData}
            errors={errors}
            onChange={handleFieldChange}
            onClearError={handleClearError}
          />

          <ConsultationParamsSection
            formData={formData}
            errors={errors}
            onChange={handleFieldChange}
            onClearError={handleClearError}
          />

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <div className="text-xs text-gray-500">* Champs obligatoires</div>

            <div className="flex items-center space-x-3">
              <ButtonV2
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Annuler
              </ButtonV2>

              <ButtonV2
                type="submit"
                disabled={isSubmitting}
                className="bg-black hover:bg-gray-800 text-white"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="h-3 w-3 mr-2" />
                    Enregistrer les modifs
                  </>
                )}
              </ButtonV2>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
