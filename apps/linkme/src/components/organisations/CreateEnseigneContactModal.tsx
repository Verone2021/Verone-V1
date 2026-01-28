'use client';

/**
 * CreateEnseigneContactModal
 *
 * Modal de création d'un contact enseigne
 * Les contacts créés ici sont disponibles pour toutes les succursales
 *
 * @module CreateEnseigneContactModal
 * @since 2026-01-21
 */

import { useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Input,
  Label,
  Checkbox,
} from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

interface CreateEnseigneContactModalProps {
  /** ID de l'enseigne */
  enseigneId: string;
  /** Callback à la fermeture */
  onClose: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CreateEnseigneContactModal({
  enseigneId,
  onClose,
}: CreateEnseigneContactModalProps) {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    title: '',
    isBillingContact: false,
    isCommercialContact: false,
    isTechnicalContact: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.from('contacts').insert({
        enseigne_id: enseigneId,
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone || null,
        title: formData.title || null,
        is_billing_contact: formData.isBillingContact,
        is_commercial_contact: formData.isCommercialContact,
        is_technical_contact: formData.isTechnicalContact,
        is_active: true,
      });

      if (error) throw error;

      toast.success('Contact créé avec succès');
      await queryClient.invalidateQueries({
        queryKey: ['organisation-contacts'],
      });
      onClose();
    } catch (error) {
      console.error('Erreur création contact:', error);
      toast.error('Erreur lors de la création du contact');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent dialogSize="md">
        <DialogHeader>
          <DialogTitle>Nouveau Contact Enseigne</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={e => {
            void handleSubmit(e).catch(error => {
              console.error(
                '[CreateEnseigneContactModal] Submit failed:',
                error
              );
            });
          }}
          className="space-y-4"
        >
          {/* Nom et Prénom */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">
                Prénom <span className="text-red-500">*</span>
              </Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={e =>
                  setFormData(prev => ({ ...prev, firstName: e.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">
                Nom <span className="text-red-500">*</span>
              </Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={e =>
                  setFormData(prev => ({ ...prev, lastName: e.target.value }))
                }
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={e =>
                setFormData(prev => ({ ...prev, email: e.target.value }))
              }
              required
            />
          </div>

          {/* Téléphone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Téléphone</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={e =>
                setFormData(prev => ({ ...prev, phone: e.target.value }))
              }
              placeholder="06 12 34 56 78"
            />
          </div>

          {/* Fonction */}
          <div className="space-y-2">
            <Label htmlFor="title">Fonction</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={e =>
                setFormData(prev => ({ ...prev, title: e.target.value }))
              }
              placeholder="Ex: Responsable Facturation"
            />
          </div>

          {/* Rôles */}
          <div className="space-y-3">
            <Label>Rôles</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="isBillingContact"
                  checked={formData.isBillingContact}
                  onCheckedChange={checked =>
                    setFormData(prev => ({
                      ...prev,
                      isBillingContact: !!checked,
                    }))
                  }
                />
                <Label htmlFor="isBillingContact" className="font-normal">
                  Contact Facturation
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="isCommercialContact"
                  checked={formData.isCommercialContact}
                  onCheckedChange={checked =>
                    setFormData(prev => ({
                      ...prev,
                      isCommercialContact: !!checked,
                    }))
                  }
                />
                <Label htmlFor="isCommercialContact" className="font-normal">
                  Contact Commercial
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="isTechnicalContact"
                  checked={formData.isTechnicalContact}
                  onCheckedChange={checked =>
                    setFormData(prev => ({
                      ...prev,
                      isTechnicalContact: !!checked,
                    }))
                  }
                />
                <Label htmlFor="isTechnicalContact" className="font-normal">
                  Contact Technique
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Création...' : 'Créer le contact'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default CreateEnseigneContactModal;
