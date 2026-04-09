'use client';

import { useState, useEffect } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { ButtonV2 } from '@verone/ui';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@verone/ui';
import { Label } from '@verone/ui';
import { spacing, colors, componentShadows } from '@verone/ui';
import { Building2, Users } from 'lucide-react';
import { useForm, type SubmitHandler, type Resolver } from 'react-hook-form';

import { LogoUploadButton } from '../../buttons/LogoUploadButton';
import { OrganisationContactsManager } from '../organisation-contacts-manager';

import { AddressSection } from './AddressSection';
import { CommercialSection } from './CommercialSection';
import { EnseigneSection } from './EnseigneSection';
import { GeneralInfoSection } from './GeneralInfoSection';
import { LegalSection } from './LegalSection';
import { NotesSection } from './NotesSection';
import { getDefaultValues, getOrganisationTypeLabel } from './helpers';
import {
  baseOrganisationSchema,
  type OrganisationFormData,
  type UnifiedOrganisationFormProps,
} from './types';

// Re-export public types for consumers
export type { OrganisationType, OrganisationFormData } from './types';

export function UnifiedOrganisationForm({
  isOpen,
  onClose,
  onSubmit,
  onSuccess: _onSuccess,
  organisationType,
  organisation = null,
  mode = 'create',
  title,
  onLogoUploadSuccess,
  customSections,
  enseigneId,
}: UnifiedOrganisationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isCustomer = organisationType === 'customer';

  const form = useForm<OrganisationFormData>({
    // Cast via unknown to resolve zodResolver/react-hook-form type mismatch with .default() fields
    resolver: zodResolver(
      baseOrganisationSchema
    ) as unknown as Resolver<OrganisationFormData>,
    defaultValues: getDefaultValues(organisation),
  });

  useEffect(() => {
    if (isOpen) {
      form.reset(getDefaultValues(organisation));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- form.reset is stable, adding form causes infinite loop
  }, [isOpen, organisation]);

  const handleSubmit: SubmitHandler<OrganisationFormData> = async data => {
    setIsSubmitting(true);
    try {
      // Auto-fill country from billing_country (évite champ redondant)
      const enrichedData = {
        ...data,
        country: data.billing_country ?? data.country ?? 'FR',
      };
      await onSubmit(enrichedData, organisation?.id);
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      form.reset();
      onClose();
    }
  };

  const displayTitle =
    title ??
    `${mode === 'edit' ? 'Modifier' : 'Créer'} ${getOrganisationTypeLabel(organisationType)}`;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-5xl max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: colors.background.DEFAULT,
          borderColor: colors.border.DEFAULT,
          borderRadius: '10px',
          boxShadow: componentShadows.modal,
          transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Header */}
        <DialogHeader style={{ marginBottom: spacing[6] }}>
          <DialogTitle
            className="text-2xl font-semibold"
            style={{ color: colors.text.DEFAULT }}
          >
            {displayTitle}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={e => {
            void form.handleSubmit(handleSubmit)(e);
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: spacing[8],
            }}
          >
            {/* Logo Upload Section */}
            {organisation && (
              <div
                style={{
                  padding: spacing[6],
                  backgroundColor: colors.background.subtle,
                  borderRadius: '10px',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: colors.border.DEFAULT,
                  boxShadow: componentShadows.card,
                  transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <Label
                  className="text-sm font-medium flex items-center gap-2"
                  style={{
                    color: colors.text.DEFAULT,
                    marginBottom: spacing[4],
                  }}
                >
                  <Building2 className="h-4 w-4" />
                  Logo de l'organisation
                </Label>
                <LogoUploadButton
                  organisationId={organisation.id}
                  organisationName={organisation.name}
                  currentLogoUrl={organisation.logo_url}
                  onUploadSuccess={onLogoUploadSuccess}
                  size="xl"
                />
              </div>
            )}

            {/* Section 1: Informations générales */}
            <GeneralInfoSection form={form} isSubmitting={isSubmitting} />

            {/* Section 2: Adresse(s) */}
            <AddressSection
              form={form}
              isSubmitting={isSubmitting}
              isCustomer={isCustomer}
            />

            {/* Section 3bis: Rattachement Enseigne (clients B2B uniquement) */}
            {isCustomer && (
              <EnseigneSection
                form={form}
                isSubmitting={isSubmitting}
                lockedEnseigneId={enseigneId}
              />
            )}

            {/* Section 4: Informations légales */}
            <LegalSection form={form} isSubmitting={isSubmitting} />

            {/* Section 5: Informations commerciales */}
            <CommercialSection form={form} isSubmitting={isSubmitting} />

            {/* Section 6: Notes */}
            <NotesSection form={form} isSubmitting={isSubmitting} />

            {/* Section 7: Contacts */}
            <div>
              <h3
                className="text-lg font-semibold flex items-center gap-2"
                style={{
                  color: colors.text.DEFAULT,
                  marginBottom: spacing[4],
                }}
              >
                <Users className="h-5 w-5" />
                Contacts
              </h3>

              <OrganisationContactsManager
                organisationId={organisation?.id}
                mode={mode}
              />
            </div>

            {/* Custom Sections */}
            {customSections}

            {/* Footer Actions */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: spacing[3],
                paddingTop: spacing[6],
                borderTopWidth: '1px',
                borderTopStyle: 'solid',
                borderTopColor: colors.border.DEFAULT,
              }}
            >
              <ButtonV2
                type="button"
                variant="secondary"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Annuler
              </ButtonV2>
              <ButtonV2 type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting
                  ? 'Enregistrement...'
                  : mode === 'edit'
                    ? 'Mettre à jour'
                    : 'Créer'}
              </ButtonV2>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
