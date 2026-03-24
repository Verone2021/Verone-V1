'use client';

import { Button, Card, CardContent } from '@verone/ui';
import { MapPin, Pencil } from 'lucide-react';

import type { LinkMeOrderDetails } from '../../../hooks/use-linkme-order-actions';
import type { OrderWithDetails, ContactRole, FusedContactGroup } from './types';

interface ContactsPanelProps {
  fusedContacts: FusedContactGroup[];
  details: LinkMeOrderDetails | null;
  organisation: OrderWithDetails['organisation'];
  onChangeContact: (role: ContactRole) => void;
}

export function ContactsPanel({
  fusedContacts,
  details,
  organisation,
  onChangeContact,
}: ContactsPanelProps) {
  const roleLabels: Record<ContactRole, string> = {
    responsable: 'Resp.',
    billing: 'Fact.',
    delivery: 'Livr.',
  };
  const roleBadgeColors: Record<ContactRole, string> = {
    responsable: 'bg-blue-100 text-blue-700',
    billing: 'bg-green-100 text-green-700',
    delivery: 'bg-cyan-100 text-cyan-700',
  };

  if (fusedContacts.length > 0) {
    return (
      <>
        {fusedContacts.map(group => {
          const initials =
            `${group.contact.first_name[0] ?? ''}${group.contact.last_name[0] ?? ''}`.toUpperCase();
          const fullName = `${group.contact.first_name} ${group.contact.last_name}`;

          return (
            <Card key={group.contact.id}>
              <CardContent className="p-3">
                <div className="flex items-center justify-end gap-1 mb-1.5">
                  {group.roles.length === 1 ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 text-[10px] px-1.5 text-gray-400 hover:text-gray-600"
                      onClick={() => onChangeContact(group.roles[0])}
                    >
                      <Pencil className="h-2.5 w-2.5 mr-0.5" />
                      Changer
                    </Button>
                  ) : (
                    group.roles.map(role => (
                      <Button
                        key={role}
                        variant="ghost"
                        size="sm"
                        className="h-5 text-[10px] px-1.5 text-gray-400 hover:text-gray-600"
                        onClick={() => onChangeContact(role)}
                      >
                        <Pencil className="h-2.5 w-2.5 mr-0.5" />
                        {roleLabels[role]}
                      </Button>
                    ))
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-700 font-bold text-[10px]">
                      {initials}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900 leading-tight">
                        {fullName}
                      </span>
                      {group.roles.map(role => (
                        <span
                          key={role}
                          className={`px-1.5 py-0 text-[9px] font-semibold rounded-full leading-4 ${roleBadgeColors[role]}`}
                        >
                          {roleLabels[role]}
                        </span>
                      ))}
                      {group.contact.title && (
                        <span className="text-[10px] text-gray-400">
                          {group.contact.title}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0 text-xs text-gray-500">
                      {group.contact.email && (
                        <a
                          href={`mailto:${group.contact.email}`}
                          className="text-blue-600 hover:underline"
                        >
                          {group.contact.email}
                        </a>
                      )}
                      {group.contact.phone && (
                        <span>{group.contact.phone}</span>
                      )}
                    </div>
                  </div>
                </div>
                {group.roles.includes('billing') && organisation && (
                  <div className="flex items-center gap-1.5 mt-2 text-[11px] text-gray-500">
                    <MapPin className="h-3 w-3 text-green-600 flex-shrink-0" />
                    <span>
                      {organisation.billing_address_line1
                        ? [
                            organisation.billing_address_line1,
                            organisation.billing_postal_code,
                            organisation.billing_city,
                          ]
                            .filter(Boolean)
                            .join(', ')
                        : [
                            organisation.address_line1,
                            organisation.postal_code,
                            organisation.city,
                          ]
                            .filter(Boolean)
                            .join(', ')}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </>
    );
  }

  // Fallback: orders without FK - fusion by name+email
  type FallbackRole = 'responsable' | 'billing' | 'delivery';
  const fallbackRoleLabels: Record<FallbackRole, string> = {
    responsable: 'Dem.',
    billing: 'Fact.',
    delivery: 'Livr.',
  };
  const fallbackRoleBgColors: Record<FallbackRole, string> = {
    responsable: 'bg-blue-100 text-blue-700',
    billing: 'bg-green-100 text-green-700',
    delivery: 'bg-cyan-100 text-cyan-700',
  };
  const fallbackRoleDialogMap: Record<FallbackRole, ContactRole> = {
    responsable: 'responsable',
    billing: 'billing',
    delivery: 'delivery',
  };
  interface FallbackContact {
    name: string;
    email: string | null;
    phone: string | null;
    roles: FallbackRole[];
  }
  const fbContacts: FallbackContact[] = [];
  const fbSeen = new Map<string, number>();
  const addFb = (
    name: string | null,
    email: string | null,
    phone: string | null,
    role: FallbackRole
  ) => {
    if (!name) return;
    const key = `${name}|${email ?? ''}`;
    if (fbSeen.has(key)) {
      const existing = fbContacts[fbSeen.get(key)!];
      if (existing && !existing.roles.includes(role)) {
        existing.roles.push(role);
      }
    } else {
      fbSeen.set(key, fbContacts.length);
      fbContacts.push({ name, email, phone, roles: [role] });
    }
  };
  if (details) {
    addFb(
      details.requester_name,
      details.requester_email,
      details.requester_phone,
      'responsable'
    );
    addFb(
      details.billing_name,
      details.billing_email,
      details.billing_phone,
      'billing'
    );
    addFb(
      details.delivery_contact_name,
      details.delivery_contact_email,
      details.delivery_contact_phone,
      'delivery'
    );
  }

  if (fbContacts.length > 0) {
    return (
      <>
        {fbContacts.map((c, i) => {
          const initials = c.name
            .split(' ')
            .map(n => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();
          const primaryRole = c.roles[0];
          return (
            <Card key={i}>
              <CardContent className="p-3">
                <div className="flex items-center justify-end gap-1 mb-1.5">
                  {c.roles.map(role => (
                    <Button
                      key={role}
                      variant="ghost"
                      size="sm"
                      className="h-5 text-[10px] px-1.5 text-gray-400 hover:text-gray-600"
                      onClick={() =>
                        onChangeContact(fallbackRoleDialogMap[role])
                      }
                    >
                      <Pencil className="h-2.5 w-2.5 mr-0.5" />
                      {fallbackRoleLabels[role]}
                    </Button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${fallbackRoleBgColors[primaryRole]}`}
                  >
                    <span className="font-bold text-[10px]">{initials}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900 leading-tight">
                        {c.name}
                      </span>
                      {c.roles.map(role => (
                        <span
                          key={role}
                          className={`px-1.5 py-0 text-[9px] font-semibold rounded-full leading-4 ${fallbackRoleBgColors[role]}`}
                        >
                          {fallbackRoleLabels[role]}
                        </span>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0 text-xs text-gray-500">
                      {c.email && (
                        <a
                          href={`mailto:${c.email}`}
                          className="text-blue-600 hover:underline"
                        >
                          {c.email}
                        </a>
                      )}
                      {c.phone && <span>{c.phone}</span>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </>
    );
  }

  return <p className="text-gray-500 text-sm">Aucun contact disponible</p>;
}
