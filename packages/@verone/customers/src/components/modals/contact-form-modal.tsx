'use client';

import { useState, useEffect } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@verone/ui';
import { Loader2, Users } from 'lucide-react';
import { useForm } from 'react-hook-form';

import type { Contact } from '@verone/customers/hooks';

import {
  contactSchema,
  DEFAULT_CONTACT_VALUES,
  type ContactFormData,
} from './contact-form-schema';
import {
  ContactPersonalSection,
  ContactMainSection,
  ContactSecondarySection,
  ContactRolesSection,
  ContactPreferencesSection,
  ContactNotesSection,
} from './contact-form-sections';

interface ContactFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (contactData: ContactFormData) => void;
  contact?: Contact | null;
  organisationId: string;
  organisationName: string;
}

export function ContactFormModal({
  isOpen,
  onClose,
  onSave,
  contact,
  organisationId: _organisationId,
  organisationName,
}: ContactFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!contact;

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: DEFAULT_CONTACT_VALUES,
  });

  useEffect(() => {
    if (isEditing && contact) {
      form.reset({
        first_name: contact.first_name ?? '',
        last_name: contact.last_name ?? '',
        title: contact.title ?? undefined,
        department: contact.department ?? undefined,
        email: contact.email ?? '',
        phone: contact.phone ?? undefined,
        mobile: contact.mobile ?? undefined,
        secondary_email: contact.secondary_email ?? undefined,
        direct_line: contact.direct_line ?? undefined,
        is_primary_contact: contact.is_primary_contact ?? false,
        is_billing_contact: contact.is_billing_contact ?? false,
        is_technical_contact: contact.is_technical_contact ?? false,
        preferred_communication_method:
          (contact.preferred_communication_method as
            | 'email'
            | 'phone'
            | 'both') ?? 'email',
        accepts_marketing: contact.accepts_marketing ?? true,
        accepts_notifications: contact.accepts_notifications ?? true,
        language_preference: contact.language_preference ?? 'fr',
        notes: contact.notes ?? undefined,
      });
    } else {
      form.reset(DEFAULT_CONTACT_VALUES);
    }
  }, [isEditing, contact, form]);

  const handleSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    try {
      onSave(data);
    } catch (error) {
      console.error('[ContactFormModal] Save failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {isEditing ? 'Modifier le contact' : 'Nouveau contact'}
            <span className="text-sm font-normal text-gray-600">
              • {organisationName}
            </span>
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={e => {
            void form
              .handleSubmit(handleSubmit)(e)
              .catch((error: unknown) => {
                console.error('[ContactFormModal] Submit failed:', error);
              });
          }}
          className="space-y-6"
        >
          <ContactPersonalSection form={form} />
          <ContactMainSection form={form} />
          <ContactSecondarySection form={form} />
          <ContactRolesSection form={form} />
          <ContactPreferencesSection form={form} />
          <ContactNotesSection form={form} />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-black text-white hover:bg-gray-800"
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isEditing ? 'Mettre à jour' : 'Créer le contact'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
