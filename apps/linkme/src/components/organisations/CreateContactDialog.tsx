'use client';

/**
 * CreateContactDialog
 *
 * Dialog de création d'un contact organisation (tous les champs BO)
 * Utilisé dans l'onglet Contacts de OrganisationDetailSheet
 *
 * @module CreateContactDialog
 * @since 2026-03-03
 */

import { useState } from 'react';

import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
  Label,
  Switch,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@verone/ui';
import { Loader2 } from 'lucide-react';

import {
  useCreateContact,
  type CreateContactInput,
} from '../../lib/hooks/use-organisation-contacts';

// ============================================================================
// SCHEMA
// ============================================================================

const contactSchema = z.object({
  first_name: z
    .string()
    .min(2, 'Le prénom doit contenir au moins 2 caractères')
    .max(100, 'Le prénom ne peut pas dépasser 100 caractères'),
  last_name: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  title: z.string().optional(),
  department: z.string().optional(),
  email: z.string().email('Email invalide'),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  secondary_email: z
    .string()
    .email('Email secondaire invalide')
    .optional()
    .or(z.literal('')),
  direct_line: z.string().optional(),
  is_primary_contact: z.boolean(),
  is_billing_contact: z.boolean(),
  is_technical_contact: z.boolean(),
  is_commercial_contact: z.boolean(),
  preferred_communication_method: z.enum(['email', 'phone', 'both']),
  accepts_marketing: z.boolean(),
  accepts_notifications: z.boolean(),
  language_preference: z.string(),
  notes: z.string().optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

// ============================================================================
// TYPES
// ============================================================================

interface CreateContactDialogProps {
  organisationId: string;
  organisationName: string;
  enseigneId?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ============================================================================
// DEFAULTS
// ============================================================================

const defaultFormData: ContactFormData = {
  first_name: '',
  last_name: '',
  title: '',
  department: '',
  email: '',
  phone: '',
  mobile: '',
  secondary_email: '',
  direct_line: '',
  is_primary_contact: false,
  is_billing_contact: false,
  is_technical_contact: false,
  is_commercial_contact: false,
  preferred_communication_method: 'email',
  accepts_marketing: false,
  accepts_notifications: true,
  language_preference: 'fr',
  notes: '',
};

// ============================================================================
// COMPONENT
// ============================================================================

export function CreateContactDialog({
  organisationId,
  organisationName,
  enseigneId,
  open,
  onOpenChange,
}: CreateContactDialogProps) {
  const [formData, setFormData] = useState<ContactFormData>(defaultFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const createContact = useCreateContact();

  const handleClose = () => {
    setFormData(defaultFormData);
    setErrors({});
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate with Zod
    const result = contactSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0];
        if (typeof field === 'string') {
          fieldErrors[field] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});

    const input: CreateContactInput = {
      organisationId,
      enseigneId,
      ...result.data,
    };

    await createContact.mutateAsync(input);
    handleClose();
  };

  const updateField = <K extends keyof ContactFormData>(
    field: K,
    value: ContactFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field error on change
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dialogSize="md" className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouveau contact</DialogTitle>
          <DialogDescription>
            Ajouter un contact pour {organisationName}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={e => {
            void handleSubmit(e).catch(error => {
              console.error('[CreateContactDialog] Submit failed:', error);
            });
          }}
          className="space-y-5"
        >
          {/* Section: Informations personnelles */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-gray-700">
              Informations personnelles
            </legend>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="cc-first-name">
                  Prénom <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="cc-first-name"
                  value={formData.first_name}
                  onChange={e => updateField('first_name', e.target.value)}
                  required
                />
                {errors.first_name && (
                  <p className="text-xs text-red-500">{errors.first_name}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="cc-last-name">
                  Nom <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="cc-last-name"
                  value={formData.last_name}
                  onChange={e => updateField('last_name', e.target.value)}
                  required
                />
                {errors.last_name && (
                  <p className="text-xs text-red-500">{errors.last_name}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="cc-title">Fonction</Label>
                <Input
                  id="cc-title"
                  value={formData.title}
                  onChange={e => updateField('title', e.target.value)}
                  placeholder="Ex: Directeur"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cc-department">Service</Label>
                <Input
                  id="cc-department"
                  value={formData.department}
                  onChange={e => updateField('department', e.target.value)}
                  placeholder="Ex: Comptabilité"
                />
              </div>
            </div>
          </fieldset>

          {/* Section: Coordonnées */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-gray-700">
              Coordonnées
            </legend>
            <div className="space-y-1">
              <Label htmlFor="cc-email">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="cc-email"
                type="email"
                value={formData.email}
                onChange={e => updateField('email', e.target.value)}
                required
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="cc-phone">Téléphone</Label>
                <Input
                  id="cc-phone"
                  type="tel"
                  value={formData.phone}
                  onChange={e => updateField('phone', e.target.value)}
                  placeholder="01 23 45 67 89"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cc-mobile">Mobile</Label>
                <Input
                  id="cc-mobile"
                  type="tel"
                  value={formData.mobile}
                  onChange={e => updateField('mobile', e.target.value)}
                  placeholder="06 12 34 56 78"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="cc-secondary-email">Email secondaire</Label>
                <Input
                  id="cc-secondary-email"
                  type="email"
                  value={formData.secondary_email}
                  onChange={e => updateField('secondary_email', e.target.value)}
                />
                {errors.secondary_email && (
                  <p className="text-xs text-red-500">
                    {errors.secondary_email}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="cc-direct-line">Ligne directe</Label>
                <Input
                  id="cc-direct-line"
                  type="tel"
                  value={formData.direct_line}
                  onChange={e => updateField('direct_line', e.target.value)}
                />
              </div>
            </div>
          </fieldset>

          {/* Section: Rôles */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-gray-700">Rôles</legend>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label
                  htmlFor="cc-primary"
                  className="text-sm font-normal cursor-pointer"
                >
                  Contact principal
                </Label>
                <Switch
                  id="cc-primary"
                  checked={formData.is_primary_contact}
                  onCheckedChange={v => updateField('is_primary_contact', v)}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label
                  htmlFor="cc-billing"
                  className="text-sm font-normal cursor-pointer"
                >
                  Facturation
                </Label>
                <Switch
                  id="cc-billing"
                  checked={formData.is_billing_contact}
                  onCheckedChange={v => updateField('is_billing_contact', v)}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label
                  htmlFor="cc-commercial"
                  className="text-sm font-normal cursor-pointer"
                >
                  Commercial
                </Label>
                <Switch
                  id="cc-commercial"
                  checked={formData.is_commercial_contact}
                  onCheckedChange={v => updateField('is_commercial_contact', v)}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label
                  htmlFor="cc-technical"
                  className="text-sm font-normal cursor-pointer"
                >
                  Technique
                </Label>
                <Switch
                  id="cc-technical"
                  checked={formData.is_technical_contact}
                  onCheckedChange={v => updateField('is_technical_contact', v)}
                />
              </div>
            </div>
          </fieldset>

          {/* Section: Préférences */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-gray-700">
              Préférences
            </legend>
            <div className="space-y-1">
              <Label htmlFor="cc-comm-method">Communication préférée</Label>
              <Select
                value={formData.preferred_communication_method}
                onValueChange={v =>
                  updateField(
                    'preferred_communication_method',
                    v as 'email' | 'phone' | 'both'
                  )
                }
              >
                <SelectTrigger id="cc-comm-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Téléphone</SelectItem>
                  <SelectItem value="both">Les deux</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label
                htmlFor="cc-marketing"
                className="text-sm font-normal cursor-pointer"
              >
                Accepte le marketing
              </Label>
              <Switch
                id="cc-marketing"
                checked={formData.accepts_marketing}
                onCheckedChange={v => updateField('accepts_marketing', v)}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label
                htmlFor="cc-notifications"
                className="text-sm font-normal cursor-pointer"
              >
                Accepte les notifications
              </Label>
              <Switch
                id="cc-notifications"
                checked={formData.accepts_notifications}
                onCheckedChange={v => updateField('accepts_notifications', v)}
              />
            </div>
          </fieldset>

          {/* Section: Notes */}
          <fieldset className="space-y-2">
            <Label htmlFor="cc-notes">Notes</Label>
            <Textarea
              id="cc-notes"
              value={formData.notes}
              onChange={e => updateField('notes', e.target.value)}
              placeholder="Notes libres..."
              rows={3}
            />
          </fieldset>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={createContact.isPending}>
              {createContact.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : (
                'Créer le contact'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default CreateContactDialog;
