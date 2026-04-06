'use client';

import Link from 'next/link';

import type { Organisation } from '@verone/organisations';
import { getOrganisationDisplayName } from '@verone/organisations';
import { ButtonV2, Badge } from '@verone/ui';
import { cn } from '@verone/utils';
import { ArrowLeft, Building2, Archive, ArchiveRestore } from 'lucide-react';

import { getOwnershipBadge } from './customer-detail.types';

interface CustomerDetailHeaderProps {
  customer: Organisation;
  returnUrl: string | null;
  onArchive: () => void;
}

export function CustomerDetailHeader({
  customer,
  returnUrl,
  onArchive,
}: CustomerDetailHeaderProps) {
  return (
    <div className="flex justify-between items-start">
      <div>
        <div className="flex items-center gap-2 mb-2">
          {returnUrl ? (
            <Link href={decodeURIComponent(returnUrl)}>
              <ButtonV2
                variant="ghost"
                size="sm"
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Retour à LinkMe
              </ButtonV2>
            </Link>
          ) : (
            <Link href="/contacts-organisations/customers">
              <ButtonV2 variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Clients
              </ButtonV2>
            </Link>
          )}
        </div>
        <div className="flex items-center gap-3 mb-2">
          <Building2 className="h-5 w-5 text-black" />
          <h1 className="text-lg font-semibold text-black">
            {getOrganisationDisplayName(customer)}
          </h1>
          <div className="flex gap-2">
            <Badge
              variant={customer.is_active ? 'secondary' : 'secondary'}
              className={
                customer.is_active ? 'bg-green-100 text-green-800' : ''
              }
            >
              {customer.is_active ? 'Actif' : 'Inactif'}
            </Badge>
            {customer.archived_at && (
              <Badge variant="destructive" className="bg-red-100 text-red-800">
                Archivé
              </Badge>
            )}
            {customer.customer_type && (
              <Badge
                variant="outline"
                className="bg-blue-50 text-blue-700 border-blue-200"
              >
                {customer.customer_type === 'professional'
                  ? 'Client Professionnel'
                  : 'Client Particulier'}
              </Badge>
            )}
            {customer.ownership_type &&
              (() => {
                const badge = getOwnershipBadge(customer.ownership_type);
                return badge ? (
                  <Badge
                    variant="outline"
                    className={cn('border-gray-200', badge.className)}
                  >
                    {badge.label}
                  </Badge>
                ) : null;
              })()}
          </div>
        </div>
        <p className="text-sm text-gray-600">
          Entreprise •{' '}
          {customer.customer_type === 'professional' ? 'B2B' : 'B2C'} • ID:{' '}
          {customer.id.slice(0, 8)}
        </p>
      </div>

      <div className="flex gap-2">
        <ButtonV2
          variant={customer.archived_at ? 'success' : 'danger'}
          onClick={onArchive}
        >
          {customer.archived_at ? (
            <>
              <ArchiveRestore className="h-4 w-4 mr-2" />
              Restaurer
            </>
          ) : (
            <>
              <Archive className="h-4 w-4 mr-2" />
              Archiver
            </>
          )}
        </ButtonV2>
      </div>
    </div>
  );
}
