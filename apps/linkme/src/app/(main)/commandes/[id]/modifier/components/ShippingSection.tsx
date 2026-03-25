'use client';

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Card,
  Input,
  Label,
  Separator,
  Switch,
  Textarea,
  cn,
} from '@verone/ui';
import { format } from 'date-fns';
import { AlertCircle, CalendarIcon, MapPin, Plus, Truck } from 'lucide-react';

import { ContactCard } from '../../../../../../components/orders/steps/contacts/ContactCard';
import { AddressCard } from '../../../../../../components/orders/steps/contacts/AddressCard';
import type { OrganisationContact } from '../../../../../../lib/hooks/use-organisation-contacts';
import type { Address } from '../../../../../../lib/hooks/use-entity-addresses';
import type { ContactFormData } from '../types';

// ============================================================================
// TYPES
// ============================================================================

interface ShippingSectionProps {
  resolvedDeliveryAddress: {
    address: string;
    postalCode: string;
    city: string;
  };
  desiredDeliveryDate: string;
  localContacts: OrganisationContact[];
  selectedDeliveryContactId: string | null;
  showDeliveryContactForm: boolean;
  deliveryContactForm: ContactFormData;
  shippingAddresses: Address[];
  deliveryAddressMode: 'restaurant' | 'existing' | 'new';
  selectedDeliveryAddressId: string | null;
  newDeliveryAddress: { address: string; postalCode: string; city: string };
  isMallDelivery: boolean;
  mallEmail: string;
  semiTrailerAccessible: boolean;
  deliveryNotes: string;
  onSelectDeliveryContact: (contactId: string) => void;
  onNewDeliveryContact: () => void;
  onDeliveryContactFormChange: (form: ContactFormData) => void;
  onDeliveryAddressModeChange: (
    mode: 'restaurant' | 'existing' | 'new'
  ) => void;
  onSelectDeliveryAddress: (addressId: string) => void;
  onNewDeliveryAddressChange: (address: {
    address: string;
    postalCode: string;
    city: string;
  }) => void;
  onDesiredDeliveryDateChange: (date: string) => void;
  onIsMallDeliveryChange: (checked: boolean) => void;
  onMallEmailChange: (email: string) => void;
  onSemiTrailerAccessibleChange: (checked: boolean) => void;
  onDeliveryNotesChange: (notes: string) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ShippingSection({
  resolvedDeliveryAddress,
  desiredDeliveryDate,
  localContacts,
  selectedDeliveryContactId,
  showDeliveryContactForm,
  deliveryContactForm,
  shippingAddresses,
  deliveryAddressMode,
  selectedDeliveryAddressId,
  newDeliveryAddress,
  isMallDelivery,
  mallEmail,
  semiTrailerAccessible,
  deliveryNotes,
  onSelectDeliveryContact,
  onNewDeliveryContact,
  onDeliveryContactFormChange,
  onDeliveryAddressModeChange,
  onSelectDeliveryAddress,
  onNewDeliveryAddressChange,
  onDesiredDeliveryDateChange,
  onIsMallDeliveryChange,
  onMallEmailChange,
  onSemiTrailerAccessibleChange,
  onDeliveryNotesChange,
}: ShippingSectionProps) {
  return (
    <AccordionItem
      value="shipping"
      className="bg-white rounded-xl border shadow-sm"
    >
      <AccordionTrigger className="px-6 py-4 hover:no-underline">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Truck className="h-5 w-5 text-purple-600" />
          </div>
          <div className="text-left">
            <h2 className="text-base font-semibold text-[#183559]">
              Livraison
            </h2>
            <p className="text-sm text-gray-500">
              {resolvedDeliveryAddress.address
                ? `${resolvedDeliveryAddress.address}, ${resolvedDeliveryAddress.postalCode} ${resolvedDeliveryAddress.city}`
                : 'Non renseignee'}
              {desiredDeliveryDate
                ? ` | ${format(new Date(desiredDeliveryDate), 'dd/MM/yyyy')}`
                : ''}
            </p>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-6 pb-6">
        <div className="space-y-6">
          {/* Contact livraison (local contacts only) */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">
              Contact livraison
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {localContacts.map(contact => (
                <ContactCard
                  key={contact.id}
                  contact={contact}
                  isSelected={selectedDeliveryContactId === contact.id}
                  onClick={() => onSelectDeliveryContact(contact.id)}
                />
              ))}

              {/* Create new */}
              <Card
                className={cn(
                  'p-3 cursor-pointer transition-all hover:shadow-md border-dashed',
                  showDeliveryContactForm
                    ? 'border-2 border-blue-500 bg-blue-50/50'
                    : 'hover:border-gray-400'
                )}
                onClick={onNewDeliveryContact}
              >
                <div className="flex items-center justify-center gap-2 h-full min-h-[60px]">
                  <Plus
                    className={cn(
                      'h-5 w-5',
                      showDeliveryContactForm
                        ? 'text-blue-500'
                        : 'text-gray-400'
                    )}
                  />
                  <span
                    className={cn(
                      'font-medium text-sm',
                      showDeliveryContactForm
                        ? 'text-blue-600'
                        : 'text-gray-600'
                    )}
                  >
                    Nouveau contact
                  </span>
                </div>
              </Card>
            </div>

            {/* New delivery contact form */}
            {showDeliveryContactForm && (
              <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Prenom</Label>
                    <Input
                      value={deliveryContactForm.firstName}
                      onChange={e =>
                        onDeliveryContactFormChange({
                          ...deliveryContactForm,
                          firstName: e.target.value,
                        })
                      }
                      placeholder="Prenom"
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Nom</Label>
                    <Input
                      value={deliveryContactForm.lastName}
                      onChange={e =>
                        onDeliveryContactFormChange({
                          ...deliveryContactForm,
                          lastName: e.target.value,
                        })
                      }
                      placeholder="Nom"
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Email</Label>
                    <Input
                      type="email"
                      value={deliveryContactForm.email}
                      onChange={e =>
                        onDeliveryContactFormChange({
                          ...deliveryContactForm,
                          email: e.target.value,
                        })
                      }
                      placeholder="livraison@restaurant.fr"
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Telephone</Label>
                    <Input
                      type="tel"
                      value={deliveryContactForm.phone}
                      onChange={e =>
                        onDeliveryContactFormChange({
                          ...deliveryContactForm,
                          phone: e.target.value,
                        })
                      }
                      placeholder="06 12 34 56 78"
                      className="h-9"
                    />
                  </div>
                </div>
              </Card>
            )}
          </div>

          <Separator />

          {/* Adresse livraison */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">
              Adresse de livraison
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Existing shipping addresses */}
              {shippingAddresses.map(address => (
                <AddressCard
                  key={address.id}
                  address={address}
                  isSelected={
                    deliveryAddressMode === 'existing' &&
                    selectedDeliveryAddressId === address.id
                  }
                  onClick={() => {
                    onDeliveryAddressModeChange('existing');
                    onSelectDeliveryAddress(address.id);
                  }}
                  badge={address.isDefault ? 'Defaut' : undefined}
                />
              ))}

              {/* New address card */}
              <Card
                className={cn(
                  'p-3 cursor-pointer transition-all hover:shadow-md border-dashed',
                  deliveryAddressMode === 'new'
                    ? 'border-2 border-blue-500 bg-blue-50/50'
                    : 'hover:border-gray-400'
                )}
                onClick={() => onDeliveryAddressModeChange('new')}
              >
                <div className="flex items-center justify-center gap-2 h-full min-h-[60px]">
                  <MapPin
                    className={cn(
                      'h-5 w-5',
                      deliveryAddressMode === 'new'
                        ? 'text-blue-500'
                        : 'text-gray-400'
                    )}
                  />
                  <span
                    className={cn(
                      'font-medium text-sm',
                      deliveryAddressMode === 'new'
                        ? 'text-blue-600'
                        : 'text-gray-600'
                    )}
                  >
                    Nouvelle adresse
                  </span>
                </div>
              </Card>
            </div>

            {/* New delivery address form */}
            {deliveryAddressMode === 'new' && (
              <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Adresse</Label>
                    <Input
                      value={newDeliveryAddress.address}
                      onChange={e =>
                        onNewDeliveryAddressChange({
                          ...newDeliveryAddress,
                          address: e.target.value,
                        })
                      }
                      placeholder="12 rue de la Paix"
                      className="h-9"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Code postal</Label>
                      <Input
                        value={newDeliveryAddress.postalCode}
                        onChange={e =>
                          onNewDeliveryAddressChange({
                            ...newDeliveryAddress,
                            postalCode: e.target.value,
                          })
                        }
                        placeholder="75001"
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <Label className="text-xs">Ville</Label>
                      <Input
                        value={newDeliveryAddress.city}
                        onChange={e =>
                          onNewDeliveryAddressChange({
                            ...newDeliveryAddress,
                            city: e.target.value,
                          })
                        }
                        placeholder="Paris"
                        className="h-9"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>

          <Separator />

          {/* Date souhaitee */}
          <div className="space-y-2">
            <Label htmlFor="desired-date" className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-gray-500" />
              Date de livraison souhaitee
            </Label>
            <Input
              id="desired-date"
              type="date"
              value={
                desiredDeliveryDate ? desiredDeliveryDate.split('T')[0] : ''
              }
              onChange={e => onDesiredDeliveryDateChange(e.target.value)}
              min={format(new Date(), 'yyyy-MM-dd')}
              className="max-w-xs"
            />
          </div>

          <Separator />

          {/* Options livraison */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">Options</h3>

            {/* Centre commercial */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Centre commercial
                </p>
                <p className="text-xs text-gray-500">
                  Livraison en centre commercial (formulaire d&apos;acces
                  requis)
                </p>
              </div>
              <Switch
                checked={isMallDelivery}
                onCheckedChange={onIsMallDeliveryChange}
              />
            </div>

            {isMallDelivery && (
              <div className="space-y-2 pl-4">
                <Label htmlFor="mall-email">
                  Email du centre commercial{' '}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="mall-email"
                  type="email"
                  value={mallEmail}
                  onChange={e => onMallEmailChange(e.target.value)}
                  placeholder="technique@centrecommercial.fr"
                />
              </div>
            )}

            {/* Semi-remorque */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Acces semi-remorque
                </p>
                <p className="text-xs text-gray-500">
                  Le lieu de livraison est-il accessible en semi-remorque ?
                </p>
              </div>
              <Switch
                checked={semiTrailerAccessible}
                onCheckedChange={onSemiTrailerAccessibleChange}
              />
            </div>

            {!semiTrailerAccessible && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-amber-700">
                  Des frais supplementaires peuvent s&apos;appliquer pour une
                  livraison sans acces semi-remorque.
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="delivery-notes">Notes de livraison</Label>
            <Textarea
              id="delivery-notes"
              value={deliveryNotes}
              onChange={e => onDeliveryNotesChange(e.target.value)}
              placeholder="Instructions speciales, code d'acces, horaires..."
              rows={3}
            />
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
