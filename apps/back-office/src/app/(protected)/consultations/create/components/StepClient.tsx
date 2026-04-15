import { ClientOrEnseigneSelector } from '@verone/products';
import { ButtonUnified } from '@verone/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import { ContactCardBO } from '@verone/orders';
import type { ContactBO } from '@verone/orders';
import { AlertCircle, ArrowRight, User, Users } from 'lucide-react';

import type { ConsultationFormData } from '../use-create-consultation';

interface StepClientProps {
  formData: ConsultationFormData;
  errors: Record<string, string>;
  contacts: ContactBO[];
  selectedContactId: string | null;
  canGoNext: boolean;
  onEnseigneChange: (
    enseigneId: string | null,
    enseigneName: string | null,
    parentOrgId: string | null
  ) => void;
  onOrganisationChange: (
    organisationId: string | null,
    organisationName: string | null
  ) => void;
  onContactSelect: (contact: ContactBO) => void;
  onInputChange: (
    field: keyof ConsultationFormData,
    value: ConsultationFormData[keyof ConsultationFormData]
  ) => void;
  onNext: () => void;
}

export function StepClient({
  formData,
  errors,
  contacts,
  selectedContactId,
  canGoNext,
  onEnseigneChange,
  onOrganisationChange,
  onContactSelect,
  onInputChange,
  onNext,
}: StepClientProps) {
  return (
    <Card className="border-black">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <User className="h-5 w-5" />
          <span>Informations Client</span>
        </CardTitle>
        <CardDescription>
          Selectionnez le client et ses coordonnees
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <ClientOrEnseigneSelector
            enseigneId={formData.enseigne_id}
            organisationId={formData.organisation_id}
            onEnseigneChange={onEnseigneChange}
            onOrganisationChange={onOrganisationChange}
            label="Client (enseigne ou organisation) *"
            required
            className={errors.client ? 'border-red-500' : ''}
          />
          {errors.client && (
            <p className="text-xs text-red-500 flex items-center">
              <AlertCircle className="h-3 w-3 mr-1" />
              {errors.client}
            </p>
          )}
        </div>

        {contacts.length > 0 && (
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              Contacts existants
            </Label>
            <div className="grid grid-cols-1 gap-2">
              {contacts.map(contact => (
                <ContactCardBO
                  key={contact.id}
                  contact={contact}
                  isSelected={selectedContactId === contact.id}
                  onClick={() => onContactSelect(contact)}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Cliquez sur un contact pour pre-remplir email et telephone
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="client_email">
            Email client <span className="text-red-500">*</span>
          </Label>
          <Input
            id="client_email"
            type="email"
            value={formData.client_email}
            onChange={e => onInputChange('client_email', e.target.value)}
            placeholder="contact@entreprise.com"
            className={errors.client_email ? 'border-red-500' : ''}
          />
          {errors.client_email && (
            <p className="text-xs text-red-500 flex items-center">
              <AlertCircle className="h-3 w-3 mr-1" />
              {errors.client_email}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="client_phone">Telephone client</Label>
          <Input
            id="client_phone"
            type="tel"
            value={formData.client_phone}
            onChange={e => onInputChange('client_phone', e.target.value)}
            placeholder="+33 1 23 45 67 89"
          />
        </div>

        <div className="flex justify-end pt-4 border-t">
          <ButtonUnified onClick={onNext} disabled={!canGoNext}>
            Suivant
            <ArrowRight className="h-4 w-4 ml-2" />
          </ButtonUnified>
        </div>
      </CardContent>
    </Card>
  );
}
