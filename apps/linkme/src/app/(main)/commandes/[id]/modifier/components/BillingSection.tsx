'use client';

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Card,
  Input,
  Label,
  Separator,
  cn,
} from '@verone/ui';
import { CheckCircle, FileText, Plus, User } from 'lucide-react';

import { ContactCard } from '../../../../../../components/orders/steps/contacts/ContactCard';
import { AddressCard } from '../../../../../../components/orders/steps/contacts/AddressCard';
import type { OrganisationContact } from '../../../../../../lib/hooks/use-organisation-contacts';
import type { Address } from '../../../../../../lib/hooks/use-entity-addresses';
import type { ContactFormData } from '../types';

// ============================================================================
// TYPES
// ============================================================================

interface BillingSectionProps {
  resolvedBillingContact: { name: string; email: string; phone: string };
  allContacts: OrganisationContact[];
  billingContactMode: 'same' | 'existing' | 'new';
  selectedBillingContactId: string | null;
  billingContactForm: ContactFormData;
  billingAddresses: Address[];
  billingAddressMode: 'restaurant' | 'existing' | 'new';
  selectedBillingAddressId: string | null;
  onBillingSameAsResponsable: () => void;
  onSelectBillingContact: (contactId: string) => void;
  onNewBillingContact: () => void;
  onBillingContactFormChange: (form: ContactFormData) => void;
  onBillingAddressModeChange: (mode: 'restaurant' | 'existing' | 'new') => void;
  onSelectBillingAddress: (addressId: string) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function BillingSection({
  resolvedBillingContact,
  allContacts,
  billingContactMode,
  selectedBillingContactId,
  billingContactForm,
  billingAddresses,
  billingAddressMode,
  selectedBillingAddressId,
  onBillingSameAsResponsable,
  onSelectBillingContact,
  onNewBillingContact,
  onBillingContactFormChange,
  onBillingAddressModeChange: _onBillingAddressModeChange,
  onSelectBillingAddress,
}: BillingSectionProps) {
  return (
    <AccordionItem
      value="billing"
      className="bg-white rounded-xl border shadow-sm"
    >
      <AccordionTrigger className="px-6 py-4 hover:no-underline">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <FileText className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="text-left">
            <h2 className="text-base font-semibold text-[#183559]">
              Facturation
            </h2>
            <p className="text-sm text-gray-500">
              {resolvedBillingContact.name || 'Non renseigne'}
              {resolvedBillingContact.email
                ? ` | ${resolvedBillingContact.email}`
                : ''}
            </p>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-6 pb-6">
        <div className="space-y-6">
          {/* Contact facturation */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">
              Contact facturation
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Same as responsable card */}
              <Card
                className={cn(
                  'p-3 cursor-pointer transition-all hover:shadow-md',
                  billingContactMode === 'same'
                    ? 'border-2 border-green-500 bg-green-50/50'
                    : 'hover:border-gray-300'
                )}
                onClick={onBillingSameAsResponsable}
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                      billingContactMode === 'same'
                        ? 'bg-green-100'
                        : 'bg-gray-100'
                    )}
                  >
                    <User
                      className={cn(
                        'h-4 w-4',
                        billingContactMode === 'same'
                          ? 'text-green-600'
                          : 'text-gray-500'
                      )}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                        Meme que responsable
                      </h3>
                      {billingContactMode === 'same' && (
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 ml-auto" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Utiliser le contact responsable
                    </p>
                  </div>
                </div>
              </Card>

              {/* Existing contacts */}
              {allContacts.map(contact => (
                <ContactCard
                  key={contact.id}
                  contact={contact}
                  isSelected={
                    billingContactMode === 'existing' &&
                    selectedBillingContactId === contact.id
                  }
                  onClick={() => onSelectBillingContact(contact.id)}
                />
              ))}

              {/* Create new */}
              <Card
                className={cn(
                  'p-3 cursor-pointer transition-all hover:shadow-md border-dashed',
                  billingContactMode === 'new'
                    ? 'border-2 border-blue-500 bg-blue-50/50'
                    : 'hover:border-gray-400'
                )}
                onClick={onNewBillingContact}
              >
                <div className="flex items-center justify-center gap-2 h-full min-h-[60px]">
                  <Plus
                    className={cn(
                      'h-5 w-5',
                      billingContactMode === 'new'
                        ? 'text-blue-500'
                        : 'text-gray-400'
                    )}
                  />
                  <span
                    className={cn(
                      'font-medium text-sm',
                      billingContactMode === 'new'
                        ? 'text-blue-600'
                        : 'text-gray-600'
                    )}
                  >
                    Nouveau contact
                  </span>
                </div>
              </Card>
            </div>

            {/* New billing contact form */}
            {billingContactMode === 'new' && (
              <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Prenom</Label>
                    <Input
                      value={billingContactForm.firstName}
                      onChange={e =>
                        onBillingContactFormChange({
                          ...billingContactForm,
                          firstName: e.target.value,
                        })
                      }
                      placeholder="Service"
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Nom</Label>
                    <Input
                      value={billingContactForm.lastName}
                      onChange={e =>
                        onBillingContactFormChange({
                          ...billingContactForm,
                          lastName: e.target.value,
                        })
                      }
                      placeholder="Comptabilite"
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Email</Label>
                    <Input
                      type="email"
                      value={billingContactForm.email}
                      onChange={e =>
                        onBillingContactFormChange({
                          ...billingContactForm,
                          email: e.target.value,
                        })
                      }
                      placeholder="compta@restaurant.fr"
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Telephone</Label>
                    <Input
                      type="tel"
                      value={billingContactForm.phone}
                      onChange={e =>
                        onBillingContactFormChange({
                          ...billingContactForm,
                          phone: e.target.value,
                        })
                      }
                      placeholder="01 23 45 67 89"
                      className="h-9"
                    />
                  </div>
                </div>
              </Card>
            )}
          </div>

          <Separator />

          {/* Adresse facturation */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">
              Adresse de facturation
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Existing billing addresses */}
              {billingAddresses.map(address => (
                <AddressCard
                  key={address.id}
                  address={address}
                  isSelected={
                    billingAddressMode === 'existing' &&
                    selectedBillingAddressId === address.id
                  }
                  onClick={() => {
                    onSelectBillingAddress(address.id);
                  }}
                  badge={address.isDefault ? 'Defaut' : undefined}
                />
              ))}

              {billingAddresses.length === 0 && (
                <p className="text-sm text-gray-400 col-span-full py-4 text-center">
                  Aucune adresse de facturation enregistree
                </p>
              )}
            </div>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
