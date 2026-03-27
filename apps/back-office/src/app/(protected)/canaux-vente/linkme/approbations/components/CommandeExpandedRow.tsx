'use client';

import Image from 'next/image';

import { Package, User } from 'lucide-react';

import type {
  PendingOrder,
  PendingOrderItem,
  PendingOrderLinkMeDetails,
} from '../../hooks/use-linkme-order-actions';

// ============================================================================
// TYPES
// ============================================================================

type ContactRole = 'demandeur' | 'responsable' | 'facturation';

interface MergedContact {
  name: string;
  email: string | null;
  phone: string | null;
  roles: ContactRole[];
}

// ============================================================================
// HELPERS
// ============================================================================

function roleLabel(role: ContactRole): string {
  if (role === 'demandeur') return 'Dem.';
  if (role === 'responsable') return 'Resp.';
  return 'Fact.';
}

function buildMergedContacts(
  details: PendingOrderLinkMeDetails
): MergedContact[] {
  const contacts: MergedContact[] = [];
  const seen = new Map<string, number>();

  const addContact = (
    name: string | null,
    email: string | null,
    phone: string | null,
    role: ContactRole
  ) => {
    if (!name) return;
    const key = `${name}|${email ?? ''}`;
    if (seen.has(key)) {
      const idx = seen.get(key)!;
      const existing = contacts[idx];
      if (existing && !existing.roles.includes(role)) {
        existing.roles.push(role);
      }
    } else {
      seen.set(key, contacts.length);
      contacts.push({ name, email, phone, roles: [role] });
    }
  };

  addContact(
    details.requester_name,
    details.requester_email,
    details.requester_phone,
    'demandeur'
  );
  addContact(
    details.billing_name,
    details.billing_email,
    details.billing_phone,
    'facturation'
  );
  addContact(
    details.delivery_contact_name,
    details.delivery_contact_email,
    details.delivery_contact_phone,
    'responsable'
  );
  return contacts;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function ContactCard({ contact }: { contact: MergedContact }) {
  return (
    <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2 text-sm">
      <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
      <div className="min-w-0">
        <p className="font-medium text-gray-900 truncate">{contact.name}</p>
        {contact.email && (
          <p className="text-xs text-gray-500 truncate">{contact.email}</p>
        )}
      </div>
      <div className="flex gap-1 flex-shrink-0">
        {contact.roles.map(r => (
          <span
            key={r}
            className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200"
          >
            {roleLabel(r)}
          </span>
        ))}
      </div>
    </div>
  );
}

function ProductItem({ item }: { item: PendingOrderItem }) {
  return (
    <div className="flex items-center gap-4 text-sm py-2">
      <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden flex-shrink-0 relative">
        {item.products?.primary_image_url ? (
          <Image
            src={item.products.primary_image_url}
            alt=""
            fill
            className="object-cover"
          />
        ) : (
          <Package className="w-full h-full p-2 text-gray-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">
          {item.products?.name ?? 'Produit inconnu'}
        </p>
        <p className="text-xs text-gray-500">{item.products?.sku ?? '-'}</p>
      </div>
      <p className="text-gray-600 font-medium">x{item.quantity}</p>
      <p className="text-gray-500 text-xs w-20 text-right">
        {item.unit_price_ht.toFixed(2)} EUR
      </p>
      <p className="font-semibold text-gray-900 w-24 text-right">
        {item.total_ht.toFixed(2)} EUR HT
      </p>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface CommandeExpandedRowProps {
  order: PendingOrder;
}

export function CommandeExpandedRow({ order }: CommandeExpandedRowProps) {
  const details = order.linkme_details;
  const hasContacts =
    details && (details.requester_name ?? details.billing_name);
  const mergedContacts = details ? buildMergedContacts(details) : [];

  return (
    <tr className="bg-gray-50 hover:bg-gray-50">
      <td colSpan={7} className="p-0">
        {hasContacts && (
          <div className="px-6 pt-3 pb-1">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              Contacts
            </p>
            <div className="flex flex-wrap gap-3">
              {mergedContacts.map((c, i) => (
                <ContactCard key={i} contact={c} />
              ))}
            </div>
          </div>
        )}
        <div className="py-3 px-6 space-y-2">
          {order.items.map(item => (
            <ProductItem key={item.id} item={item} />
          ))}
        </div>
      </td>
    </tr>
  );
}
