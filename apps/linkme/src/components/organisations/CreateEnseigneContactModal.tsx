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

import { useState, useEffect } from 'react';

import { useQueryClient } from '@tanstack/react-query';
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
} from '@verone/ui';
import { Receipt, ShoppingBag, Building2 } from 'lucide-react';
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
  const [enseigneInfo, setEnseigneInfo] = useState<{
    name: string;
    logoUrl: string | null;
  } | null>(null);

  // Fetch enseigne name + logo
  useEffect(() => {
    const supabase = createClient();
    void supabase
      .from('enseignes')
      .select('name, logo_url')
      .eq('id', enseigneId)
      .single()
      .then(({ data }) => {
        if (!data) return;
        let logoUrl: string | null = null;
        if (data.logo_url) {
          if (data.logo_url.startsWith('http')) {
            logoUrl = data.logo_url;
          } else {
            const { data: storageData } = supabase.storage
              .from('organisation-logos')
              .getPublicUrl(data.logo_url);
            logoUrl = storageData?.publicUrl ?? null;
          }
        }
        setEnseigneInfo({ name: data.name, logoUrl });
      });
  }, [enseigneId]);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    title: '',
    isBillingContact: false,
    isCommercialContact: false,
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
          <div className="flex items-center gap-3">
            {enseigneInfo?.logoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={enseigneInfo.logoUrl}
                alt={enseigneInfo.name}
                className="h-[50px] w-[50px] rounded-lg object-contain"
              />
            ) : (
              <div className="flex h-[50px] w-[50px] items-center justify-center rounded-lg bg-linkme-turquoise/10">
                <Building2 className="h-6 w-6 text-linkme-turquoise" />
              </div>
            )}
            <div>
              <DialogTitle>Nouveau contact</DialogTitle>
              <DialogDescription>
                {enseigneInfo?.name
                  ? `Contact partagé avec tous les restaurants ${enseigneInfo.name}.`
                  : 'Ce contact sera partagé avec tous vos restaurants.'}
              </DialogDescription>
            </div>
          </div>
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
            <div className="grid grid-cols-2 gap-3">
              {/* Facturation */}
              <button
                type="button"
                onClick={() =>
                  setFormData(prev => ({
                    ...prev,
                    isBillingContact: !prev.isBillingContact,
                  }))
                }
                className={`flex flex-col items-center gap-2 rounded-lg border-2 p-3 text-center transition-all ${
                  formData.isBillingContact
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full ${
                    formData.isBillingContact
                      ? 'bg-green-100 text-green-600'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  <Receipt className="h-4 w-4" />
                </div>
                <span
                  className={`text-xs font-medium ${
                    formData.isBillingContact
                      ? 'text-green-600'
                      : 'text-gray-500'
                  }`}
                >
                  Facturation
                </span>
              </button>

              {/* Commercial */}
              <button
                type="button"
                onClick={() =>
                  setFormData(prev => ({
                    ...prev,
                    isCommercialContact: !prev.isCommercialContact,
                  }))
                }
                className={`flex flex-col items-center gap-2 rounded-lg border-2 p-3 text-center transition-all ${
                  formData.isCommercialContact
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full ${
                    formData.isCommercialContact
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  <ShoppingBag className="h-4 w-4" />
                </div>
                <span
                  className={`text-xs font-medium ${
                    formData.isCommercialContact
                      ? 'text-blue-600'
                      : 'text-gray-500'
                  }`}
                >
                  Commercial
                </span>
              </button>
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
