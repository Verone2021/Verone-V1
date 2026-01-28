/**
 * ContactsSection
 * ===============
 * Affiche et permet de modifier les contacts d'une organisation
 * - Contact propriétaire (obligatoire)
 * - Contact facturation (peut être le même que propriétaire)
 *
 * Utilisé dans CreateOrderModal pour les restaurants existants
 */

'use client';

import { useState, useEffect } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { Button } from '@verone/ui';
import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import { Checkbox } from '@verone/ui';
import { Badge } from '@verone/ui';
import {
  User,
  Mail,
  Phone,
  Building2,
  Pencil,
  Check,
  X,
  AlertTriangle,
} from 'lucide-react';

import {
  useOrganisationContacts,
  useUpdateOrganisationContacts,
  type ContactFormData,
} from '@/lib/hooks/use-organisation-contacts';

interface ContactsSectionProps {
  organisationId: string;
  onContactsComplete: () => void;
  onContactsIncomplete: () => void;
  onContactsChange?: (data: {
    primaryContact: ContactFormData;
    billingContact: ContactFormData | null;
  }) => void;
}

interface ContactFormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  title: string;
}

const emptyContact: ContactFormState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  title: '',
};

export function ContactsSection({
  organisationId,
  onContactsComplete,
  onContactsIncomplete,
  onContactsChange,
}: ContactsSectionProps) {
  const { data, isLoading } = useOrganisationContacts(organisationId);
  const updateMutation = useUpdateOrganisationContacts();

  const [isEditing, setIsEditing] = useState(false);
  const [billingIsSameAsPrimary, setBillingIsSameAsPrimary] = useState(true);

  const [primaryForm, setPrimaryForm] =
    useState<ContactFormState>(emptyContact);
  const [billingForm, setBillingForm] =
    useState<ContactFormState>(emptyContact);

  // Initialiser les formulaires avec les données existantes
  useEffect(() => {
    if (data) {
      if (data.primaryContact) {
        setPrimaryForm({
          firstName: data.primaryContact.firstName || '',
          lastName: data.primaryContact.lastName || '',
          email: data.primaryContact.email || '',
          phone: data.primaryContact.phone ?? '',
          title: data.primaryContact.title ?? '',
        });
      }

      if (
        data.billingContact &&
        data.billingContact.id !== data.primaryContact?.id
      ) {
        setBillingIsSameAsPrimary(false);
        setBillingForm({
          firstName: data.billingContact.firstName || '',
          lastName: data.billingContact.lastName || '',
          email: data.billingContact.email || '',
          phone: data.billingContact.phone ?? '',
          title: data.billingContact.title ?? '',
        });
      } else {
        setBillingIsSameAsPrimary(true);
      }

      // Si pas complet, activer l'édition automatiquement
      if (!data.isComplete) {
        setIsEditing(true);
      }

      // Notifier le parent
      if (data.isComplete) {
        onContactsComplete();
      } else {
        onContactsIncomplete();
      }
    }
  }, [data, onContactsComplete, onContactsIncomplete]);

  // Notifier le parent quand les contacts changent
  useEffect(() => {
    if (onContactsChange && isEditing) {
      onContactsChange({
        primaryContact: {
          firstName: primaryForm.firstName,
          lastName: primaryForm.lastName,
          email: primaryForm.email,
          phone: primaryForm.phone,
          title: primaryForm.title,
        },
        billingContact: billingIsSameAsPrimary
          ? null
          : {
              firstName: billingForm.firstName,
              lastName: billingForm.lastName,
              email: billingForm.email,
              phone: billingForm.phone,
              title: billingForm.title,
            },
      });
    }
  }, [
    primaryForm,
    billingForm,
    billingIsSameAsPrimary,
    onContactsChange,
    isEditing,
  ]);

  const isPrimaryValid =
    primaryForm.firstName.trim() !== '' &&
    primaryForm.lastName.trim() !== '' &&
    primaryForm.email.trim() !== '';

  const isBillingValid =
    billingIsSameAsPrimary ||
    (billingForm.firstName.trim() !== '' &&
      billingForm.lastName.trim() !== '' &&
      billingForm.email.trim() !== '');

  const isFormValid = isPrimaryValid && isBillingValid;

  const handleSave = async () => {
    if (!isFormValid) return;

    try {
      await updateMutation.mutateAsync({
        organisationId,
        primaryContact: {
          firstName: primaryForm.firstName,
          lastName: primaryForm.lastName,
          email: primaryForm.email,
          phone: primaryForm.phone,
          title: primaryForm.title,
        },
        billingContact: billingIsSameAsPrimary
          ? null
          : {
              firstName: billingForm.firstName,
              lastName: billingForm.lastName,
              email: billingForm.email,
              phone: billingForm.phone,
              title: billingForm.title,
            },
      });
      setIsEditing(false);
      onContactsComplete();
    } catch {
      // Error handled by mutation
    }
  };

  const handleCancel = () => {
    // Réinitialiser avec les données originales
    if (data?.primaryContact) {
      setPrimaryForm({
        firstName: data.primaryContact.firstName || '',
        lastName: data.primaryContact.lastName || '',
        email: data.primaryContact.email || '',
        phone: data.primaryContact.phone ?? '',
        title: data.primaryContact.title ?? '',
      });
    }
    if (data?.billingContact) {
      setBillingForm({
        firstName: data.billingContact.firstName || '',
        lastName: data.billingContact.lastName || '',
        email: data.billingContact.email || '',
        phone: data.billingContact.phone ?? '',
        title: data.billingContact.title ?? '',
      });
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-10 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Contacts du restaurant
          </CardTitle>
          {!isEditing && data?.isComplete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="h-4 w-4 mr-1" />
              Modifier
            </Button>
          )}
        </div>
        {!data?.isComplete && (
          <div className="flex items-center gap-2 text-amber-600 text-sm mt-2">
            <AlertTriangle className="h-4 w-4" />
            Contacts incomplets - veuillez compléter les informations
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Contact Propriétaire */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Propriétaire / Responsable</span>
            <Badge variant="outline" className="text-xs">
              Obligatoire
            </Badge>
          </div>

          {isEditing ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prénom *</Label>
                <Input
                  value={primaryForm.firstName}
                  onChange={e =>
                    setPrimaryForm(prev => ({
                      ...prev,
                      firstName: e.target.value,
                    }))
                  }
                  placeholder="Prénom"
                />
              </div>
              <div className="space-y-2">
                <Label>Nom *</Label>
                <Input
                  value={primaryForm.lastName}
                  onChange={e =>
                    setPrimaryForm(prev => ({
                      ...prev,
                      lastName: e.target.value,
                    }))
                  }
                  placeholder="Nom"
                />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={primaryForm.email}
                  onChange={e =>
                    setPrimaryForm(prev => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="email@exemple.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Téléphone</Label>
                <Input
                  type="tel"
                  value={primaryForm.phone}
                  onChange={e =>
                    setPrimaryForm(prev => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="06 00 00 00 00"
                />
              </div>
            </div>
          ) : (
            <div className="bg-muted/50 rounded-lg p-4">
              {data?.primaryContact ? (
                <div className="flex flex-col gap-1">
                  <div className="font-medium">
                    {data.primaryContact.firstName}{' '}
                    {data.primaryContact.lastName}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    {data.primaryContact.email}
                  </div>
                  {data.primaryContact.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {data.primaryContact.phone}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-muted-foreground italic">
                  Non renseigné
                </div>
              )}
            </div>
          )}
        </div>

        {/* Séparateur */}
        <div className="border-t" />

        {/* Contact Facturation */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Responsable Facturation</span>
            <Badge variant="outline" className="text-xs">
              Obligatoire
            </Badge>
          </div>

          {isEditing && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="samePrimary"
                checked={billingIsSameAsPrimary}
                onCheckedChange={checked =>
                  setBillingIsSameAsPrimary(checked as boolean)
                }
              />
              <Label htmlFor="samePrimary" className="text-sm cursor-pointer">
                Même contact que le propriétaire
              </Label>
            </div>
          )}

          {isEditing && !billingIsSameAsPrimary ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prénom *</Label>
                <Input
                  value={billingForm.firstName}
                  onChange={e =>
                    setBillingForm(prev => ({
                      ...prev,
                      firstName: e.target.value,
                    }))
                  }
                  placeholder="Prénom"
                />
              </div>
              <div className="space-y-2">
                <Label>Nom *</Label>
                <Input
                  value={billingForm.lastName}
                  onChange={e =>
                    setBillingForm(prev => ({
                      ...prev,
                      lastName: e.target.value,
                    }))
                  }
                  placeholder="Nom"
                />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={billingForm.email}
                  onChange={e =>
                    setBillingForm(prev => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="email@exemple.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Téléphone</Label>
                <Input
                  type="tel"
                  value={billingForm.phone}
                  onChange={e =>
                    setBillingForm(prev => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="06 00 00 00 00"
                />
              </div>
            </div>
          ) : !isEditing ? (
            <div className="bg-muted/50 rounded-lg p-4">
              {data?.billingContact ? (
                <div className="flex flex-col gap-1">
                  {data.billingContact.id === data.primaryContact?.id ? (
                    <div className="text-muted-foreground italic">
                      Même contact que le propriétaire
                    </div>
                  ) : (
                    <>
                      <div className="font-medium">
                        {data.billingContact.firstName}{' '}
                        {data.billingContact.lastName}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {data.billingContact.email}
                      </div>
                      {data.billingContact.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {data.billingContact.phone}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : data?.primaryContact ? (
                <div className="text-muted-foreground italic">
                  Même contact que le propriétaire
                </div>
              ) : (
                <div className="text-muted-foreground italic">
                  Non renseigné
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Actions */}
        {isEditing && (
          <div className="flex justify-end gap-2 pt-4 border-t">
            {data?.isComplete && (
              <Button variant="outline" size="sm" onClick={handleCancel}>
                <X className="h-4 w-4 mr-1" />
                Annuler
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => {
                void handleSave().catch(error => {
                  console.error('[ContactsSection] Save failed:', error);
                });
              }}
              disabled={!isFormValid || updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <span className="animate-spin mr-1">...</span>
              ) : (
                <Check className="h-4 w-4 mr-1" />
              )}
              Enregistrer
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
