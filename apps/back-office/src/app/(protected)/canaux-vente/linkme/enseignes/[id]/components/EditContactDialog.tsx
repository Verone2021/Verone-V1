'use client';

import { useState, useEffect } from 'react';

import {
  Button,
  Input,
  Label,
  Checkbox,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@verone/ui';
import { Loader2, Mail, Phone, Save, X } from 'lucide-react';

import type { ContactBO } from '../../../hooks/use-organisation-contacts-bo';
import { useUpdateContactBO } from '../../../hooks/use-organisation-contacts-bo';

interface EditContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: ContactBO | null;
  enseigneId: string;
}

export function EditContactDialog({
  open,
  onOpenChange,
  contact,
  enseigneId,
}: EditContactDialogProps) {
  const updateMutation = useUpdateContactBO();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    title: '',
    isPrimaryContact: false,
    isBillingContact: false,
    isTechnicalContact: false,
  });

  // Pre-fill form when contact changes
  useEffect(() => {
    if (contact) {
      setForm({
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        phone: contact.phone ?? '',
        title: contact.title ?? '',
        isPrimaryContact: contact.isPrimaryContact,
        isBillingContact: contact.isBillingContact,
        isTechnicalContact: contact.isTechnicalContact,
      });
    }
  }, [contact]);

  if (!contact) return null;

  const handleSave = () => {
    if (!form.firstName || !form.lastName || !form.email) return;
    void updateMutation
      .mutateAsync({
        contactId: contact.id,
        enseigneId,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone || undefined,
        title: form.title || undefined,
        isPrimaryContact: form.isPrimaryContact,
        isBillingContact: form.isBillingContact,
        isTechnicalContact: form.isTechnicalContact,
      })
      .then(() => {
        onOpenChange(false);
      })
      .catch((error: unknown) => {
        console.error('[EditContactDialog] Update failed:', error);
      });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-blue-500" />
            Modifier le contact
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="edit-firstName">Prénom *</Label>
              <Input
                id="edit-firstName"
                value={form.firstName}
                onChange={e =>
                  setForm(prev => ({ ...prev, firstName: e.target.value }))
                }
                placeholder="Jean"
              />
            </div>
            <div>
              <Label htmlFor="edit-lastName">Nom *</Label>
              <Input
                id="edit-lastName"
                value={form.lastName}
                onChange={e =>
                  setForm(prev => ({ ...prev, lastName: e.target.value }))
                }
                placeholder="Dupont"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="edit-email">
              <Mail className="h-3.5 w-3.5 inline mr-1" />
              Email *
            </Label>
            <Input
              id="edit-email"
              type="email"
              value={form.email}
              onChange={e =>
                setForm(prev => ({ ...prev, email: e.target.value }))
              }
              placeholder="jean.dupont@example.com"
            />
          </div>
          <div>
            <Label htmlFor="edit-phone">
              <Phone className="h-3.5 w-3.5 inline mr-1" />
              Téléphone
            </Label>
            <Input
              id="edit-phone"
              value={form.phone}
              onChange={e =>
                setForm(prev => ({ ...prev, phone: e.target.value }))
              }
              placeholder="06 12 34 56 78"
            />
          </div>
          <div>
            <Label htmlFor="edit-title">Fonction</Label>
            <Input
              id="edit-title"
              value={form.title}
              onChange={e =>
                setForm(prev => ({ ...prev, title: e.target.value }))
              }
              placeholder="Directeur commercial"
            />
          </div>
          {/* Rôles */}
          <div>
            <Label className="mb-2 block">Rôles</Label>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.isPrimaryContact}
                  onCheckedChange={(checked: boolean) =>
                    setForm(prev => ({ ...prev, isPrimaryContact: checked }))
                  }
                />
                <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-green-100 text-green-700">
                  Responsable
                </span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.isBillingContact}
                  onCheckedChange={(checked: boolean) =>
                    setForm(prev => ({ ...prev, isBillingContact: checked }))
                  }
                />
                <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-blue-100 text-blue-700">
                  Facturation
                </span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.isTechnicalContact}
                  onCheckedChange={(checked: boolean) =>
                    setForm(prev => ({
                      ...prev,
                      isTechnicalContact: checked,
                    }))
                  }
                />
                <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-violet-100 text-violet-700">
                  Technique
                </span>
              </label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-1" />
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            disabled={
              !form.firstName ||
              !form.lastName ||
              !form.email ||
              updateMutation.isPending
            }
          >
            {updateMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
