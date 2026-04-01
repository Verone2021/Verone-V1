'use client';

import Link from 'next/link';

import { Card, CardContent } from '@verone/ui';
import {
  Building2,
  AlertTriangle,
  Mail,
  Phone,
  User,
  Pencil,
  Receipt,
  Truck,
  MapPin,
} from 'lucide-react';

import type { OrderWithDetails } from './types';
import type { LinkMeOrderDetails } from '../../../hooks/use-linkme-order-actions';

interface RestaurantSectionProps {
  organisation: OrderWithDetails['organisation'];
  details: LinkMeOrderDetails | null;
  orderId: string;
}

// ---- OrgIdentifiers sub-component ----

type Organisation = NonNullable<OrderWithDetails['organisation']>;

interface OrgIdentifiersProps {
  organisation: Organisation;
}

function OrgIdentifiers({ organisation }: OrgIdentifiersProps) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
      <span className={organisation.siret ? '' : 'text-amber-600 font-medium'}>
        SIRET : {organisation.siret ?? 'Non renseigne'}
      </span>
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

// ---- OrgAddresses sub-component ----

function formatAddress(
  line1: string | null,
  line2: string | null,
  postalCode: string | null,
  city: string | null
): string | null {
  const parts = [line1, line2, postalCode, city].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : null;
}

interface OrgAddressesProps {
  organisation: Organisation;
}

function OrgAddresses({ organisation }: OrgAddressesProps) {
  const mainAddress = formatAddress(
    organisation.address_line1,
    organisation.address_line2,
    organisation.postal_code,
    organisation.city
  );
  const billingAddress = formatAddress(
    organisation.billing_address_line1,
    organisation.billing_address_line2,
    organisation.billing_postal_code,
    organisation.billing_city
  );
  const shippingAddress = organisation.has_different_shipping_address
    ? formatAddress(
        organisation.shipping_address_line1,
        organisation.shipping_address_line2,
        organisation.shipping_postal_code,
        organisation.shipping_city
      )
    : null;

  return (
    <div className="space-y-1.5 text-xs">
      <div
        className={`flex items-start gap-1.5 ${mainAddress ? 'text-gray-600' : 'text-amber-600 font-medium'}`}
      >
        <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
        <span>{mainAddress ?? 'Adresse non renseignee'}</span>
      </div>
      <div
        className={`flex items-start gap-1.5 ${billingAddress ? 'text-gray-600' : 'text-amber-600 font-medium'}`}
      >
        <Receipt className="h-3 w-3 mt-0.5 flex-shrink-0 text-amber-500" />
        <span>
          <span className="font-medium">Facturation :</span>{' '}
          {billingAddress ?? 'Non renseignee'}
        </span>
      </div>
      {shippingAddress && (
        <div className="flex items-start gap-1.5 text-gray-600">
          <Truck className="h-3 w-3 mt-0.5 flex-shrink-0 text-blue-500" />
          <span>
            <span className="font-medium">Livraison :</span> {shippingAddress}
          </span>
        </div>
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
  orderId: string;
}

function OrgHeader({ organisation, details, orderId }: OrgHeaderProps) {
  const returnUrl = `/canaux-vente/linkme/commandes/${orderId}`;
  const orgUrl = `/canaux-vente/linkme/organisations/${organisation.id}?returnUrl=${encodeURIComponent(returnUrl)}`;
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Building2 className="h-4 w-4 text-orange-600 flex-shrink-0" />
      <Link
        href={orgUrl}
        className="font-semibold text-gray-900 hover:text-blue-700 hover:underline"
      >
        {organisation.trade_name ?? organisation.legal_name}
      </Link>
      <Link
        href={orgUrl}
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
  orderId,
}: RestaurantSectionProps) {
  return (
    <Card>
      <CardContent className="p-4">
        {organisation ? (
          <div className="space-y-3">
            <OrgHeader
              organisation={organisation}
              details={details}
              orderId={orderId}
            />
            <OrgIdentifiers organisation={organisation} />
            <OrgAddresses organisation={organisation} />
            {details && <OwnerCompanyBlock details={details} />}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Organisation non renseignee</p>
        )}
      </CardContent>
    </Card>
  );
}
