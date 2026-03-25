'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@verone/ui';
import { Loader2, UserPlus, User } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useUpdateLinkMeDetails } from '../../hooks/use-linkme-order-actions';
import {
  useOrganisationContactsBO,
  useEnseigneContactsBO,
  useCreateContactBO,
  type ContactBO,
} from '../../hooks/use-organisation-contacts-bo';
import { ContactCardBO } from '../../components/contacts/ContactCardBO';
import { NewContactForm } from '../../components/contacts/NewContactForm';
import type { NewContactFormData } from '../../components/contacts/NewContactForm';
import type { OrderWithMissing } from './types';

interface ContactEditDialogProps {
  order: OrderWithMissing;
  contactFor: 'responsable' | 'billing' | 'delivery_contact';
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContactEditDialog({
  order,
  contactFor,
  open,
  onOpenChange,
}: ContactEditDialogProps) {
  const queryClient = useQueryClient();
  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    null
  );
  const [showNewForm, setShowNewForm] = useState(false);

  const isSuccursale =
    order.ownerType === 'propre' || order.ownerType === 'succursale';
  const { data: enseigneData } = useEnseigneContactsBO(
    isSuccursale ? order.enseigneId : null
  );
  const { data: orgData } = useOrganisationContactsBO(
    !isSuccursale ? order.organisationId : null
  );
  const availableContacts: ContactBO[] = useMemo(
    () => (isSuccursale ? enseigneData?.contacts : orgData?.contacts) ?? [],
    [isSuccursale, enseigneData?.contacts, orgData?.contacts]
  );

  const updateDetails = useUpdateLinkMeDetails();
  const createContactBO = useCreateContactBO();

  const DIALOG_TITLES: Record<typeof contactFor, string> = {
    responsable: 'Contact responsable',
    billing: 'Contact facturation',
    delivery_contact: 'Contact livraison',
  };

  const handleConfirmContact = useCallback(async () => {
    if (!selectedContactId) return;
    const contact = availableContacts.find(c => c.id === selectedContactId);
    if (!contact) return;

    const fullName = `${contact.firstName} ${contact.lastName}`;
    let updates: Record<string, string | null>;
    if (contactFor === 'responsable') {
      updates = {
        requester_name: fullName,
        requester_email: contact.email,
        requester_phone: contact.phone ?? null,
        requester_position: contact.title ?? null,
      };
    } else if (contactFor === 'delivery_contact') {
      updates = {
        delivery_contact_name: fullName,
        delivery_contact_email: contact.email,
        delivery_contact_phone: contact.phone ?? null,
      };
    } else {
      updates = {
        billing_name: fullName,
        billing_email: contact.email,
        billing_phone: contact.phone ?? null,
        billing_contact_source: 'custom',
      };
    }

    await updateDetails.mutateAsync({ orderId: order.id, updates });
    await queryClient.invalidateQueries({
      queryKey: ['orders-missing-fields'],
    });
    toast.success('Contact mis a jour');
    setSelectedContactId(null);
    onOpenChange(false);
  }, [
    selectedContactId,
    availableContacts,
    contactFor,
    updateDetails,
    order.id,
    queryClient,
    onOpenChange,
  ]);

  const handleCreateAndSelectContact = useCallback(
    async (contactData: NewContactFormData) => {
      await createContactBO.mutateAsync({
        organisationId: isSuccursale
          ? undefined
          : (order.organisationId ?? undefined),
        enseigneId: isSuccursale ? (order.enseigneId ?? undefined) : undefined,
        firstName: contactData.firstName,
        lastName: contactData.lastName,
        email: contactData.email,
        phone: contactData.phone || undefined,
        title: contactData.title || undefined,
        isPrimaryContact: contactFor === 'responsable',
        isBillingContact: contactFor === 'billing',
      });

      const fullName = `${contactData.firstName} ${contactData.lastName}`;
      let updates: Record<string, string | null>;
      if (contactFor === 'responsable') {
        updates = {
          requester_name: fullName,
          requester_email: contactData.email,
          requester_phone: contactData.phone || null,
          requester_position: contactData.title || null,
        };
      } else if (contactFor === 'delivery_contact') {
        updates = {
          delivery_contact_name: fullName,
          delivery_contact_email: contactData.email,
          delivery_contact_phone: contactData.phone || null,
        };
      } else {
        updates = {
          billing_name: fullName,
          billing_email: contactData.email,
          billing_phone: contactData.phone || null,
          billing_contact_source: 'custom',
        };
      }

      await updateDetails.mutateAsync({ orderId: order.id, updates });
      await queryClient.invalidateQueries({
        queryKey: ['orders-missing-fields'],
      });
      toast.success('Contact cree et assigne');
      setShowNewForm(false);
      onOpenChange(false);
    },
    [
      createContactBO,
      isSuccursale,
      order.organisationId,
      order.enseigneId,
      order.id,
      contactFor,
      updateDetails,
      queryClient,
      onOpenChange,
    ]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{DIALOG_TITLES[contactFor]}</DialogTitle>
          <DialogDescription>
            {order.order_number} — {order.organisationName ?? '-'}
            <br />
            Selectionnez un contact existant ou creez-en un nouveau.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {/* Left: New contact form */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <UserPlus className="h-4 w-4 text-purple-600" />
              <h4 className="font-semibold text-sm">Nouveau contact</h4>
            </div>
            {showNewForm ? (
              <NewContactForm
                onSubmit={handleCreateAndSelectContact}
                onCancel={() => setShowNewForm(false)}
                isSubmitting={
                  createContactBO.isPending || updateDetails.isPending
                }
                sectionLabel="Creer et assigner"
              />
            ) : (
              <Button
                variant="outline"
                className="w-full border-dashed h-20"
                onClick={() => {
                  setShowNewForm(true);
                  setSelectedContactId(null);
                }}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Creer un nouveau contact
              </Button>
            )}
          </div>

          {/* Right: Existing contacts */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <User className="h-4 w-4 text-gray-600" />
              <h4 className="font-semibold text-sm">
                Contacts disponibles ({availableContacts.length})
              </h4>
            </div>
            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
              {availableContacts.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">
                  Aucun contact trouve
                </p>
              ) : (
                availableContacts.map(contact => (
                  <ContactCardBO
                    key={contact.id}
                    contact={contact}
                    isSelected={selectedContactId === contact.id}
                    onClick={() => {
                      setSelectedContactId(
                        selectedContactId === contact.id ? null : contact.id
                      );
                      setShowNewForm(false);
                    }}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={() => {
              void handleConfirmContact().catch(err => {
                console.error('[ContactEditDialog] confirm failed:', err);
              });
            }}
            disabled={
              !selectedContactId ||
              updateDetails.isPending ||
              createContactBO.isPending
            }
          >
            {updateDetails.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              'Confirmer la selection'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
