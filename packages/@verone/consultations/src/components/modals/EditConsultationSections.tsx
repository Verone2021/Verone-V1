'use client';

/**
 * Section sub-components for EditConsultationModal
 * - ConsultationClientSection
 * - ConsultationContactSection
 * - ConsultationProjectSection
 * - ConsultationParamsSection
 */

import type { ContactBO } from '@verone/orders';
import { ContactCardBO } from '@verone/orders';
import { ClientOrEnseigneSelector } from '@verone/products';
import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { Textarea } from '@verone/ui';
import { cn } from '@verone/utils';
import { AlertCircle, Calendar, Mail, Phone, Users } from 'lucide-react';

export type SourceChannel = 'website' | 'email' | 'phone' | 'other';

export interface EditFormData {
  enseigne_id: string | null;
  organisation_id: string | null;
  client_email: string;
  client_phone: string;
  descriptif: string;
  notes_internes: string;
  tarif_maximum: number;
  estimated_response_date: string;
  priority_level: number;
  source_channel: SourceChannel;
}

// ============================================================================
// CLIENT SECTION
// ============================================================================

export function ConsultationClientSection({
  formData,
  contacts,
  selectedContactId,
  errors,
  onEnseigneChange,
  onOrganisationChange,
  onContactSelect,
}: {
  formData: EditFormData;
  contacts: ContactBO[];
  selectedContactId: string | null;
  errors: Record<string, string>;
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
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-black">Client</h3>

      <ClientOrEnseigneSelector
        enseigneId={formData.enseigne_id}
        organisationId={formData.organisation_id}
        onEnseigneChange={onEnseigneChange}
        onOrganisationChange={onOrganisationChange}
        label="Client (enseigne ou organisation)"
        required
        className={errors.client ? 'border-red-500' : ''}
      />
      {errors.client && (
        <p className="text-xs text-red-500 flex items-center">
          <AlertCircle className="h-3 w-3 mr-1" />
          {errors.client}
        </p>
      )}

      {contacts.length > 0 && (
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5 text-xs">
            <Users className="h-3 w-3" />
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
            Cliquez sur un contact pour pré-remplir email et téléphone
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// CONTACT SECTION
// ============================================================================

export function ConsultationContactSection({
  formData,
  errors,
  onChange,
  onClearError,
}: {
  formData: EditFormData;
  errors: Record<string, string>;
  onChange: (field: keyof EditFormData, value: string) => void;
  onClearError: (field: string) => void;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-black">Coordonnées contact</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="client-email" className="text-xs font-medium">
            Email client *
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
            <Input
              id="client-email"
              type="email"
              value={formData.client_email}
              onChange={e => {
                onChange('client_email', e.target.value);
                if (errors.client_email) onClearError('client_email');
              }}
              placeholder="client@example.com"
              className={cn(
                'pl-10',
                errors.client_email && 'border-red-300 focus:border-red-500'
              )}
            />
          </div>
          {errors.client_email && (
            <p className="text-xs text-red-600">{errors.client_email}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="client-phone" className="text-xs font-medium">
            Téléphone client
          </Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
            <Input
              id="client-phone"
              type="tel"
              value={formData.client_phone}
              onChange={e => onChange('client_phone', e.target.value)}
              placeholder="+33 6 12 34 56 78"
              className="pl-10"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// PROJECT SECTION
// ============================================================================

export function ConsultationProjectSection({
  formData,
  errors,
  onChange,
  onClearError,
}: {
  formData: EditFormData;
  errors: Record<string, string>;
  onChange: (field: keyof EditFormData, value: string) => void;
  onClearError: (field: string) => void;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-black">Projet</h3>

      <div className="space-y-1">
        <Label htmlFor="descriptif" className="text-xs font-medium">
          Description de la consultation *
        </Label>
        <Textarea
          id="descriptif"
          value={formData.descriptif}
          onChange={e => {
            onChange('descriptif', e.target.value);
            if (errors.descriptif) onClearError('descriptif');
          }}
          placeholder="Décrivez les besoins du client..."
          rows={4}
          className={cn(
            errors.descriptif && 'border-red-300 focus:border-red-500'
          )}
        />
        {errors.descriptif && (
          <p className="text-xs text-red-600">{errors.descriptif}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="notes-internes" className="text-xs font-medium">
          Notes internes
        </Label>
        <Textarea
          id="notes-internes"
          value={formData.notes_internes}
          onChange={e => onChange('notes_internes', e.target.value)}
          placeholder="Notes privées visibles uniquement par l'équipe..."
          rows={3}
        />
        <p className="text-xs text-gray-500">
          Ces notes ne sont pas visibles par le client
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// PARAMS SECTION
// ============================================================================

export function ConsultationParamsSection({
  formData,
  errors,
  onChange,
  onClearError,
}: {
  formData: EditFormData;
  errors: Record<string, string>;
  onChange: (field: keyof EditFormData, value: string | number) => void;
  onClearError: (field: string) => void;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-black">Paramètres</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="tarif-maximum" className="text-xs font-medium">
            Budget maximum (€)
          </Label>
          <Input
            id="tarif-maximum"
            type="number"
            step="0.01"
            min="0"
            value={formData.tarif_maximum || ''}
            onChange={e => {
              onChange('tarif_maximum', parseFloat(e.target.value) || 0);
              if (errors.tarif_maximum) onClearError('tarif_maximum');
            }}
            placeholder="5000"
            className={cn(
              errors.tarif_maximum && 'border-red-300 focus:border-red-500'
            )}
          />
          {errors.tarif_maximum && (
            <p className="text-xs text-red-600">{errors.tarif_maximum}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="source-channel" className="text-xs font-medium">
            Canal d'origine
          </Label>
          <Select
            value={formData.source_channel}
            onValueChange={(value: string) =>
              onChange('source_channel', value as SourceChannel)
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="website">Site web</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="phone">Téléphone</SelectItem>
              <SelectItem value="other">Autre</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="priority" className="text-xs font-medium">
            Niveau de priorité
          </Label>
          <Select
            value={formData.priority_level.toString()}
            onValueChange={value => onChange('priority_level', parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">Très urgent (5)</SelectItem>
              <SelectItem value="4">Urgent (4)</SelectItem>
              <SelectItem value="3">Normal+ (3)</SelectItem>
              <SelectItem value="2">Normal (2)</SelectItem>
              <SelectItem value="1">Faible (1)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="estimated-date" className="text-xs font-medium">
            Date de réponse estimée
          </Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
            <Input
              id="estimated-date"
              type="date"
              value={formData.estimated_response_date}
              onChange={e =>
                onChange('estimated_response_date', e.target.value)
              }
              className="pl-10"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
