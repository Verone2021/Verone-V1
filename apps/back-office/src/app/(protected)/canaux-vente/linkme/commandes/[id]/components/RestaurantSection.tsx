'use client';

import Link from 'next/link';

import { Card, CardContent } from '@verone/ui';
import {
  Building2,
  AlertTriangle,
  Mail,
  Phone,
  MapPin,
  Receipt,
  Truck,
  User,
  Pencil,
} from 'lucide-react';

import type { OrderWithDetails } from './types';
import type { LinkMeOrderDetails } from '../../../hooks/use-linkme-order-actions';

interface RestaurantSectionProps {
  organisation: OrderWithDetails['organisation'];
  details: LinkMeOrderDetails | null;
}

// ---- AddressLine sub-component ----

function AddressLine({
  label,
  icon: Icon,
  line1,
  line2,
  postalCode,
  city,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  line1: string | null;
  line2?: string | null;
  postalCode: string | null;
  city: string | null;
}) {
  const hasData = line1 ?? postalCode ?? city;
  return (
    <div className="text-xs">
      <div className="flex items-center gap-1 text-gray-500 font-medium mb-0.5">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      {hasData ? (
        <>
          <p className="text-gray-700">
            {[line1, line2].filter(Boolean).join(', ')}
          </p>
          <p className="text-gray-700">
            {[postalCode, city].filter(Boolean).join(' ')}
          </p>
        </>
      ) : (
        <span className="text-amber-500 italic">Non renseignee</span>
      )}
    </div>
  );
}

// ---- OrgIdentifiers sub-component ----

type Organisation = NonNullable<OrderWithDetails['organisation']>;

interface OrgIdentifiersProps {
  organisation: Organisation;
}

function OrgIdentifiers({ organisation }: OrgIdentifiersProps) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
      {organisation.siret && <span>SIRET : {organisation.siret}</span>}
      {organisation.vat_number && <span>TVA : {organisation.vat_number}</span>}
      {organisation.email && (
        <a
          href={`mailto:${organisation.email}`}
          className="text-blue-600 hover:underline flex items-center gap-1"
        >
          <Mail className="h-3 w-3" />
          {organisation.email}
        </a>
      )}
      {organisation.phone && (
        <span className="flex items-center gap-1">
          <Phone className="h-3 w-3" />
          {organisation.phone}
        </span>
      )}
    </div>
  );
}

// ---- OwnerCompanyBlock sub-component ----

interface OwnerCompanyBlockProps {
  details: LinkMeOrderDetails;
}

function OwnerCompanyBlock({ details }: OwnerCompanyBlockProps) {
  if (
    details.owner_type !== 'franchise' ||
    !(details.owner_company_legal_name ?? details.owner_company_trade_name)
  ) {
    return null;
  }
  const showLegalName =
    details.owner_company_legal_name &&
    details.owner_company_trade_name &&
    details.owner_company_legal_name !== details.owner_company_trade_name;

  return (
    <div className="p-2 bg-violet-50 rounded-lg text-xs space-y-1">
      <div className="flex items-center gap-1 text-violet-700 font-medium">
        <User className="h-3 w-3" />
        Proprietaire (franchise)
      </div>
      <p className="text-gray-700">
        {details.owner_company_trade_name ?? details.owner_company_legal_name}
        {showLegalName && (
          <span className="text-gray-400">
            {' '}
            ({details.owner_company_legal_name})
          </span>
        )}
      </p>
    </div>
  );
}

// ---- OrgHeader sub-component ----

interface OrgHeaderProps {
  organisation: Organisation;
  details: LinkMeOrderDetails | null;
}

function OrgHeader({ organisation, details }: OrgHeaderProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Building2 className="h-4 w-4 text-orange-600 flex-shrink-0" />
      <Link
        href={`/canaux-vente/linkme/organisations/${organisation.id}`}
        className="font-semibold text-gray-900 hover:text-blue-700 hover:underline"
      >
        {organisation.trade_name ?? organisation.legal_name}
      </Link>
      <Link
        href={`/canaux-vente/linkme/organisations/${organisation.id}`}
        className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-700"
      >
        <Pencil className="h-2.5 w-2.5" />
        Modifier
      </Link>
      {details?.owner_type && (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${
            details.owner_type === 'franchise'
              ? 'bg-violet-100 text-violet-700'
              : 'bg-blue-100 text-blue-700'
          }`}
        >
          {details.owner_type === 'propre'
            ? 'Propre'
            : details.owner_type === 'succursale'
              ? 'Succursale'
              : details.owner_type === 'franchise'
                ? 'Franchise'
                : details.owner_type}
        </span>
      )}
      {details?.is_new_restaurant && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700">
          Nouveau
        </span>
      )}
      {organisation.approval_status === 'pending_validation' && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
          <AlertTriangle className="h-3 w-3" />
          Validation
        </span>
      )}
    </div>
  );
}

// ---- RestaurantSection (main export) ----

export function RestaurantSection({
  organisation,
  details,
}: RestaurantSectionProps) {
  return (
    <Card>
      <CardContent className="p-4">
        {organisation ? (
          <div className="space-y-3">
            <OrgHeader organisation={organisation} details={details} />
            <OrgIdentifiers organisation={organisation} />
            {details && <OwnerCompanyBlock details={details} />}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-gray-100">
              <AddressLine
                label="Adresse siege"
                icon={MapPin}
                line1={organisation.address_line1}
                line2={organisation.address_line2}
                postalCode={organisation.postal_code}
                city={organisation.city}
              />
              <AddressLine
                label="Facturation"
                icon={Receipt}
                line1={organisation.billing_address_line1}
                line2={organisation.billing_address_line2}
                postalCode={organisation.billing_postal_code}
                city={organisation.billing_city}
              />
              <AddressLine
                label="Livraison"
                icon={Truck}
                line1={
                  organisation.has_different_shipping_address
                    ? organisation.shipping_address_line1
                    : organisation.address_line1
                }
                line2={
                  organisation.has_different_shipping_address
                    ? organisation.shipping_address_line2
                    : organisation.address_line2
                }
                postalCode={
                  organisation.has_different_shipping_address
                    ? organisation.shipping_postal_code
                    : organisation.postal_code
                }
                city={
                  organisation.has_different_shipping_address
                    ? organisation.shipping_city
                    : organisation.city
                }
              />
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Organisation non renseignee</p>
        )}
      </CardContent>
    </Card>
  );
}
