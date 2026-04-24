'use client';

import { Building2, MapPin, User } from 'lucide-react';

import type { SalesOrderForShipment } from '@verone/orders/hooks';

import { parseShippingAddress } from './parse-address';
import type { ShipmentContact } from './types';

interface StepAddressesProps {
  salesOrder: SalesOrderForShipment;
  allContacts: ShipmentContact[];
  contactsLoading: boolean;
  selectedContact: ShipmentContact | null;
  setSelectedContact: (contact: ShipmentContact | null) => void;
  onBack: () => void;
  onNext: () => void;
}

export function StepAddresses({
  salesOrder,
  allContacts,
  contactsLoading,
  selectedContact,
  setSelectedContact,
  onBack,
  onNext,
}: StepAddressesProps) {
  const addr = parseShippingAddress(salesOrder.shipping_address);

  return (
    <div className="space-y-4">
      {/* Bloc Expediteur */}
      <div className="rounded-lg border bg-gray-50 p-4">
        <div className="mb-2 flex items-center gap-2">
          <Building2 className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Expediteur</span>
        </div>
        <p className="text-sm font-semibold">Verone Collections</p>
        <p className="text-xs text-gray-500">4 rue du Perou, 91300 Massy</p>
      </div>

      {/* Bloc Destinataire — Adresse de livraison */}
      <div className="rounded-lg border p-4">
        <div className="mb-2 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            Adresse de livraison
          </span>
        </div>
        {addr ? (
          <div className="space-y-0.5 text-sm text-gray-800">
            {addr.address_line1 && <p>{addr.address_line1}</p>}
            {(addr.postal_code ?? addr.city) && (
              <p>{[addr.postal_code, addr.city].filter(Boolean).join(' ')}</p>
            )}
            {addr.country && addr.country !== 'FR' && <p>{addr.country}</p>}
          </div>
        ) : (
          <p className="text-sm italic text-gray-400">
            Aucune adresse de livraison renseignee
          </p>
        )}
      </div>

      {/* Bloc Destinataire — Contact */}
      <div className="rounded-lg border p-4">
        <div className="mb-3 flex items-center gap-2">
          <User className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            Contact destinataire
          </span>
          <span className="text-xs text-gray-400">
            (email + mobile utilises pour Packlink)
          </span>
        </div>

        {contactsLoading ? (
          <p className="text-sm text-gray-400">Chargement des contacts…</p>
        ) : allContacts.length === 0 ? (
          <p className="text-sm italic text-gray-400">
            Aucun contact disponible pour cette organisation.
          </p>
        ) : (
          <div className="space-y-2">
            {/* Option : aucun contact (email organisation par defaut) */}
            <label className="flex cursor-pointer items-start gap-3 rounded border p-2 transition-colors hover:bg-gray-50">
              <input
                type="radio"
                name="shipment-contact"
                className="mt-0.5"
                checked={selectedContact === null}
                onChange={() => setSelectedContact(null)}
              />
              <div>
                <p className="text-sm italic text-gray-500">
                  Aucun contact selectionne
                </p>
                <p className="text-xs text-gray-400">
                  Email par defaut de l&apos;organisation
                </p>
              </div>
            </label>

            {/* Liste des contacts */}
            {allContacts.map(contact => (
              <label
                key={contact.id}
                className={`flex cursor-pointer items-start gap-3 rounded border p-2 transition-colors hover:bg-blue-50 ${
                  selectedContact?.id === contact.id
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-200'
                }`}
              >
                <input
                  type="radio"
                  name="shipment-contact"
                  className="mt-0.5"
                  checked={selectedContact?.id === contact.id}
                  onChange={() => setSelectedContact(contact)}
                />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">
                      {contact.firstName} {contact.lastName}
                    </p>
                    {contact.isPrimaryContact && (
                      <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] text-blue-700">
                        Responsable
                      </span>
                    )}
                    {contact.isBillingContact && (
                      <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] text-purple-700">
                        Facturation
                      </span>
                    )}
                    {contact.source === 'enseigne' && (
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">
                        Siege
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-gray-500">
                    {contact.email}
                  </p>
                  {(contact.mobile ?? contact.phone) && (
                    <p className="text-xs text-gray-400">
                      {contact.mobile ?? contact.phone}
                    </p>
                  )}
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          onClick={onBack}
        >
          Annuler
        </button>
        <button
          type="button"
          className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          onClick={onNext}
        >
          Suivant
        </button>
      </div>
    </div>
  );
}
