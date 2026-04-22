'use client';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import {
  AlertCircle,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Send,
  UserPlus,
} from 'lucide-react';

import type { ContactRole, FusedContactGroup, OrderWithDetails } from './types';

// ============================================
// CONSTANTS
// ============================================

const ROLE_LABELS: Record<ContactRole, string> = {
  responsable: 'Resp.',
  billing: 'Fact.',
  delivery: 'Livr.',
};

const ROLE_BADGE_COLORS: Record<ContactRole, string> = {
  responsable: 'bg-blue-100 text-blue-700',
  billing: 'bg-green-100 text-green-700',
  delivery: 'bg-cyan-100 text-cyan-700',
};

const ROLE_FULL_LABELS: Record<ContactRole, string> = {
  responsable: 'Responsable',
  billing: 'Facturation',
  delivery: 'Livraison',
};

const ALL_ROLES: ContactRole[] = ['responsable', 'billing', 'delivery'];

// ============================================
// PROPS
// ============================================

interface ContactsUnifiedProps {
  order: OrderWithDetails;
  fusedContacts: FusedContactGroup[];
  locked: boolean;
  onOpenContactDialog: (role: 'responsable' | 'billing' | 'delivery') => void;
  onOpenRequestModal: (role: 'responsable' | 'billing' | 'delivery') => void;
}

// ============================================
// SUB-COMPONENTS
// ============================================

interface ContactCardRowProps {
  group: FusedContactGroup;
  order: OrderWithDetails;
  locked: boolean;
  onOpenContactDialog: (role: 'responsable' | 'billing' | 'delivery') => void;
}

function ContactCardRow({
  group,
  order,
  locked,
  onOpenContactDialog,
}: ContactCardRowProps) {
  const initials =
    `${group.contact.first_name[0] ?? ''}${group.contact.last_name[0] ?? ''}`.toUpperCase();
  const fullName = `${group.contact.first_name} ${group.contact.last_name}`;

  return (
    <div className="border rounded-lg p-3 space-y-1.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <span className="text-blue-700 font-bold text-[10px]">
              {initials}
            </span>
          </div>
          <span className="font-medium text-sm truncate">{fullName}</span>
        </div>
        <div className="flex items-center gap-1 flex-wrap shrink-0">
          {group.roles.map(role => (
            <span
              key={role}
              className={`px-1.5 py-0 text-[10px] font-semibold rounded-full leading-4 ${ROLE_BADGE_COLORS[role]}`}
            >
              {ROLE_LABELS[role]}
            </span>
          ))}
        </div>
      </div>

      {group.contact.title && (
        <p className="text-xs text-gray-500">{group.contact.title}</p>
      )}

      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
        {group.contact.email && (
          <a
            href={`mailto:${group.contact.email}`}
            className="inline-flex items-center gap-1 text-blue-600 hover:underline"
          >
            <Mail className="h-3 w-3" />
            {group.contact.email}
          </a>
        )}
        {group.contact.phone && (
          <span className="inline-flex items-center gap-1 text-gray-600">
            <Phone className="h-3 w-3" />
            {group.contact.phone}
          </span>
        )}
      </div>

      {/* Billing address if billing role */}
      {group.roles.includes('billing') && order.organisation && (
        <div className="flex items-center gap-1.5 mt-1 text-[11px] text-gray-500">
          <MapPin className="h-3 w-3 text-green-600 flex-shrink-0" />
          <span>
            {order.organisation.billing_address_line1
              ? [
                  order.organisation.billing_address_line1,
                  order.organisation.billing_postal_code,
                  order.organisation.billing_city,
                ]
                  .filter(Boolean)
                  .join(', ')
              : [
                  order.organisation.address_line1,
                  order.organisation.postal_code,
                  order.organisation.city,
                ]
                  .filter(Boolean)
                  .join(', ')}
          </span>
        </div>
      )}

      {/* Edit buttons per role — tiny, above content */}
      {!locked && (
        <div className="flex items-center justify-end gap-1 pt-0.5">
          {group.roles.length === 1 ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-11 md:h-5 text-xs md:text-[10px] px-2 md:px-1.5 text-gray-400 hover:text-gray-600"
              onClick={() => onOpenContactDialog(group.roles[0])}
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
                className="h-11 md:h-5 text-xs md:text-[10px] px-2 md:px-1.5 text-gray-400 hover:text-gray-600"
                onClick={() => onOpenContactDialog(role)}
              >
                <Pencil className="h-2.5 w-2.5 mr-0.5" />
                {ROLE_LABELS[role]}
              </Button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function ContactsUnified({
  order,
  fusedContacts,
  locked,
  onOpenContactDialog,
  onOpenRequestModal,
}: ContactsUnifiedProps) {
  const missingRoles = ALL_ROLES.filter(
    r => !fusedContacts.some(g => g.roles.includes(r))
  );

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Contacts</CardTitle>
          {!locked && (
            <Button
              variant="ghost"
              size="sm"
              className="h-11 md:h-9 gap-1 text-xs"
              onClick={() =>
                onOpenContactDialog(missingRoles[0] ?? 'responsable')
              }
            >
              <UserPlus className="h-3 w-3" />
              Ajouter
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0 space-y-3">
        {fusedContacts.length === 0 ? (
          <p className="text-sm text-gray-500 italic">Aucun contact assigné</p>
        ) : (
          fusedContacts.map(group => (
            <ContactCardRow
              key={group.contact.id}
              group={group}
              order={order}
              locked={locked}
              onOpenContactDialog={onOpenContactDialog}
            />
          ))
        )}

        {!locked && missingRoles.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs font-medium text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Rôles non assignés
            </p>
            <div className="space-y-1.5">
              {missingRoles.map(role => (
                <div
                  key={role}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="text-sm text-gray-700 flex items-center gap-1.5">
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 ${ROLE_BADGE_COLORS[role]}`}
                    >
                      {ROLE_LABELS[role]}
                    </Badge>
                    {ROLE_FULL_LABELS[role]}
                  </span>
                  <div className="flex gap-1.5 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-11 md:h-7 text-xs gap-1"
                      onClick={() => onOpenContactDialog(role)}
                    >
                      <Pencil className="h-3 w-3" />
                      Assigner
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-11 md:h-7 text-xs gap-1"
                      onClick={() => onOpenRequestModal(role)}
                    >
                      <Send className="h-3 w-3" />
                      Demander
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
