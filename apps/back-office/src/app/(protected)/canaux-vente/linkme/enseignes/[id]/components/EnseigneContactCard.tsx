'use client';

import Link from 'next/link';

import { Card, cn } from '@verone/ui';
import {
  ExternalLink,
  Mail,
  Pencil,
  Phone,
  ShoppingCart,
  Smartphone,
  Trash2,
  User,
} from 'lucide-react';

import type { ContactBO } from '../../../hooks/use-organisation-contacts-bo';

interface EnseigneContactCardProps {
  contact: ContactBO;
  onEdit: (contact: ContactBO) => void;
  onDelete: (contact: ContactBO) => void;
}

interface RoleBadge {
  label: string;
  className: string;
}

const LINKME_ROLE_LABELS: Record<string, string> = {
  enseigne_admin: 'Admin Enseigne',
  org_independante: 'Org. Indépendante',
};

function getRoleBadges(contact: ContactBO): RoleBadge[] {
  const badges: RoleBadge[] = [];

  // LinkMe role first (most important for this context)
  if (contact.linkmeRole) {
    badges.push({
      label: LINKME_ROLE_LABELS[contact.linkmeRole] ?? contact.linkmeRole,
      className: 'bg-teal-100 text-teal-700',
    });
  }

  if (contact.isPrimaryContact) {
    badges.push({
      label: 'Responsable',
      className: 'bg-green-100 text-green-700',
    });
  }
  if (contact.isBillingContact) {
    badges.push({
      label: 'Facturation',
      className: 'bg-blue-100 text-blue-700',
    });
  }
  if (contact.isCommercialContact) {
    badges.push({
      label: 'Commercial',
      className: 'bg-orange-100 text-orange-700',
    });
  }
  if (contact.isTechnicalContact) {
    badges.push({
      label: 'Technique',
      className: 'bg-violet-100 text-violet-700',
    });
  }
  return badges;
}

export function EnseigneContactCard({
  contact,
  onEdit,
  onDelete,
}: EnseigneContactCardProps) {
  const isLinkmeUser = !!contact.linkmeUserId;
  const fullName = `${contact.firstName} ${contact.lastName}`;
  const badges = getRoleBadges(contact);

  return (
    <Card className="relative group p-3 transition-all hover:border-gray-300 min-h-[180px] flex flex-col">
      {/* Action buttons top-right */}
      {isLinkmeUser ? (
        <div className="absolute top-2 right-2 z-10">
          <Link
            href={`/canaux-vente/linkme/utilisateurs/${contact.linkmeUserId}`}
            className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded-full bg-teal-100 text-teal-700 hover:bg-teal-200 transition-colors"
          >
            Utilisateur LinkMe
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      ) : (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              onEdit(contact);
            }}
            className="p-1.5 rounded-md bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors"
            title="Modifier le contact"
          >
            <Pencil className="h-3.5 w-3.5 text-gray-500" />
          </button>
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              onDelete(contact);
            }}
            className="p-1.5 rounded-md bg-white border border-gray-200 shadow-sm hover:bg-red-50 transition-colors"
            title="Supprimer le contact"
          >
            <Trash2 className="h-3.5 w-3.5 text-gray-500 hover:text-red-500" />
          </button>
        </div>
      )}

      {/* Card content */}
      <div className="flex items-start gap-2.5 flex-1">
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-100">
          <User className="h-4 w-4 text-gray-500" />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1 flex flex-col">
          {/* Name */}
          <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate pr-20">
            {fullName}
          </h3>

          {/* Title / Function */}
          {contact.title ? (
            <p className="text-xs text-gray-500 mt-0.5 truncate">
              {contact.title}
            </p>
          ) : (
            <p className="text-xs text-gray-300 mt-0.5 italic">
              Pas de fonction
            </p>
          )}

          {/* Contact info */}
          <div className="mt-2 space-y-1">
            {/* Email */}
            <div className="flex items-center gap-1.5 text-xs text-gray-500 truncate">
              <Mail className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{contact.email}</span>
            </div>

            {/* Phone */}
            {contact.phone ? (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Phone className="h-3 w-3 flex-shrink-0" />
                <span>{contact.phone}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-gray-300">
                <Phone className="h-3 w-3 flex-shrink-0" />
                <span className="italic">Non renseigné</span>
              </div>
            )}

            {/* Mobile */}
            {contact.mobile && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Smartphone className="h-3 w-3 flex-shrink-0" />
                <span>{contact.mobile}</span>
              </div>
            )}
          </div>

          {/* Mini-stats for LinkMe contacts */}
          {isLinkmeUser && contact.affiliateOrdersCount !== null && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100">
              <ShoppingCart className="h-3 w-3 flex-shrink-0 text-blue-500" />
              <span>
                {contact.affiliateOrdersCount} commande
                {contact.affiliateOrdersCount !== 1 ? 's' : ''}
              </span>
              {contact.affiliateLastOrderDate && (
                <>
                  <span className="text-gray-300">|</span>
                  <span>
                    Derniere :{' '}
                    {new Date(
                      contact.affiliateLastOrderDate
                    ).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </>
              )}
            </div>
          )}

          {/* Badges - pushed to bottom */}
          <div className="flex flex-wrap gap-1 mt-auto pt-2">
            {badges.length > 0 ? (
              badges.map(badge => (
                <span
                  key={badge.label}
                  className={cn(
                    'px-1.5 py-0.5 text-[10px] font-medium rounded',
                    badge.className
                  )}
                >
                  {badge.label}
                </span>
              ))
            ) : (
              <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-gray-100 text-gray-400">
                Aucun rôle
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
