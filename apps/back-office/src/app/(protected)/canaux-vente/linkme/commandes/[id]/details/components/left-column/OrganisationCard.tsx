'use client';

import { useState } from 'react';

import Link from 'next/link';

import {
  Card,
  CardContent,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
} from '@verone/ui';
import {
  AlertTriangle,
  Building2,
  Check,
  ExternalLink,
  MapPin,
  Pencil,
  Truck,
  XCircle,
} from 'lucide-react';

import type { OrderWithDetails } from '../types';
import { OrgShippingModal } from './OrgShippingModal';

interface OrganisationCardProps {
  order: OrderWithDetails;
  details: { is_new_restaurant?: boolean | null } | null;
  onUpdateOrganisation?: (
    orgId: string,
    updates: Record<string, unknown>
  ) => Promise<void>;
}

export function OrganisationCard({
  order,
  details,
  onUpdateOrganisation,
}: OrganisationCardProps) {
  const org = order.organisation;
  const [editingOwnership, setEditingOwnership] = useState(false);
  const [editingOrgField, setEditingOrgField] = useState<'siret' | null>(null);
  const [editOrgValue, setEditOrgValue] = useState('');
  const [showShippingModal, setShowShippingModal] = useState(false);

  const isOrderDraft = order.status === 'draft';

  return (
    <Card>
      <CardContent className="p-4">
        {order.organisation ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Building2 className="h-4 w-4 text-orange-600 flex-shrink-0" />
              {/* Lien cliquable vers la fiche organisation */}
              <Link
                href={`/contacts-organisations/customers/${org?.id}`}
                className="font-semibold text-gray-900 hover:text-orange-600 hover:underline flex items-center gap-1"
              >
                {order.organisation.trade_name ?? order.organisation.legal_name}
                <ExternalLink className="h-3 w-3 opacity-60" />
              </Link>
              {/* Badge ownership_type */}
              {org?.ownership_type ? (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                    org.ownership_type === 'franchise'
                      ? 'bg-violet-100 text-violet-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {org.ownership_type === 'franchise'
                    ? 'Franchise'
                    : 'Succursale'}
                </span>
              ) : editingOwnership && org ? (
                <Select
                  value="none"
                  onValueChange={v => {
                    if (v === 'none') return;
                    if (onUpdateOrganisation) {
                      void onUpdateOrganisation(org.id, {
                        ownership_type: v,
                      }).then(() => setEditingOwnership(false));
                    }
                  }}
                >
                  <SelectTrigger className="h-6 text-xs w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Choisir...</SelectItem>
                    <SelectItem value="succursale">Succursale</SelectItem>
                    <SelectItem value="franchise">Franchise</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingOwnership(true)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-500 cursor-pointer hover:opacity-80"
                  title="Cliquer pour renseigner le type"
                >
                  Type ?
                  <Pencil className="h-2.5 w-2.5" />
                </button>
              )}
              {details?.is_new_restaurant && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700">
                  Nouveau
                </span>
              )}
              {order.organisation.approval_status === 'pending_validation' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
                  <AlertTriangle className="h-3 w-3" />
                  Validation
                </span>
              )}
            </div>
            {/* Identifiants : SIRET / TVA */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
              {(() => {
                const isFrench =
                  !order.organisation.country ||
                  order.organisation.country === 'FR';
                const label = isFrench ? 'SIRET' : 'TVA Intracommunautaire';
                const value = isFrench
                  ? order.organisation.siret
                  : order.organisation.vat_number;
                const dbField = isFrench ? 'siret' : 'vat_number';

                if (value) {
                  return (
                    <span>
                      {label} : {value}
                    </span>
                  );
                }

                if (editingOrgField === 'siret' && org) {
                  return (
                    <div className="flex items-center gap-1">
                      <span className="text-gray-600">{label} :</span>
                      <Input
                        className="h-6 text-xs w-[180px]"
                        value={editOrgValue}
                        onChange={e => setEditOrgValue(e.target.value)}
                        placeholder={label}
                        autoFocus
                        onKeyDown={e => {
                          if (e.key === 'Enter' && onUpdateOrganisation) {
                            void onUpdateOrganisation(org.id, {
                              [dbField]: editOrgValue || null,
                            }).then(() => setEditingOrgField(null));
                          }
                          if (e.key === 'Escape') setEditingOrgField(null);
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (onUpdateOrganisation && editOrgValue) {
                            void onUpdateOrganisation(org.id, {
                              [dbField]: editOrgValue,
                            }).then(() => setEditingOrgField(null));
                          }
                        }}
                        className="text-green-600 hover:text-green-800"
                      >
                        <Check className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingOrgField(null)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <XCircle className="h-3 w-3" />
                      </button>
                    </div>
                  );
                }

                return (
                  <button
                    type="button"
                    onClick={() => {
                      setEditOrgValue('');
                      setEditingOrgField('siret');
                    }}
                    className="text-amber-600 flex items-center gap-1 hover:text-amber-800 cursor-pointer"
                    title="Cliquer pour renseigner"
                  >
                    <AlertTriangle className="h-3 w-3" />
                    {label} : Non renseigne
                    <Pencil className="h-2.5 w-2.5" />
                  </button>
                );
              })()}
            </div>
            {/* Adresse principale */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
              {(order.organisation.address_line1 ??
              order.organisation.postal_code) ? (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {[
                    order.organisation.address_line1,
                    order.organisation.postal_code,
                    order.organisation.city,
                  ]
                    .filter(Boolean)
                    .join(', ')}
                </span>
              ) : (
                <span className="text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Adresse principale : Non renseignée
                </span>
              )}
            </div>
            {/* Adresse de facturation */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
              {(order.organisation.billing_address_line1 ??
              order.organisation.billing_postal_code) ? (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-orange-500" />
                  Facturation :{' '}
                  {[
                    order.organisation.billing_address_line1,
                    order.organisation.billing_postal_code,
                    order.organisation.billing_city,
                  ]
                    .filter(Boolean)
                    .join(', ')}
                </span>
              ) : (
                <span className="text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Adresse facturation : Non renseignée
                </span>
              )}
            </div>
            <Separator className="my-1" />
            {/* Adresse de livraison */}
            {(() => {
              // order.organisation est non-null ici : on est dans le branchement order.organisation ? (...)
              const shippingOrg = order.organisation;
              const norm = (v: string | null | undefined) =>
                (v ?? '').trim().toLowerCase();
              // Référence facturation : billing_address_line1 si renseigné, sinon address_line1
              const billingRef = norm(
                shippingOrg.billing_address_line1 ?? shippingOrg.address_line1
              );
              const shippingLine1 = norm(shippingOrg.shipping_address_line1);
              // Afficher l'adresse de livraison si le flag est actif OU si
              // shipping_address_line1 existe et diffère réellement de l'adresse de facturation
              const hasDifferentShipping =
                shippingOrg.has_different_shipping_address === true ||
                (shippingLine1.length > 0 && shippingLine1 !== billingRef);
              return (
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 items-center">
                  {hasDifferentShipping ? (
                    (shippingOrg.shipping_address_line1 ??
                    shippingOrg.shipping_postal_code) ? (
                      <span className="flex items-center gap-1">
                        <Truck className="h-3 w-3 text-blue-500" />
                        Livraison :{' '}
                        {[
                          shippingOrg.shipping_address_line1,
                          shippingOrg.shipping_postal_code,
                          shippingOrg.shipping_city,
                        ]
                          .filter(Boolean)
                          .join(', ')}
                      </span>
                    ) : (
                      <span className="text-amber-600 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Adresse livraison : Non renseignée
                      </span>
                    )
                  ) : (
                    <span className="flex items-center gap-1 text-gray-400">
                      <Truck className="h-3 w-3" />
                      Livraison : même que facturation
                    </span>
                  )}
                  {/* Bouton modifier adresse livraison — uniquement si commande draft */}
                  {isOrderDraft && onUpdateOrganisation && (
                    <button
                      type="button"
                      onClick={() => setShowShippingModal(true)}
                      className="ml-1 text-blue-500 hover:text-blue-700 flex items-center gap-0.5"
                      title="Modifier l'adresse de livraison"
                    >
                      <Pencil className="h-2.5 w-2.5" />
                      <span className="text-xs">Modifier</span>
                    </button>
                  )}
                </div>
              );
            })()}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Organisation non renseignée</p>
        )}
      </CardContent>

      {/* Modal modifier adresse de livraison — extrait dans OrgShippingModal */}
      {org && onUpdateOrganisation && (
        <OrgShippingModal
          open={showShippingModal}
          onOpenChange={setShowShippingModal}
          orgId={org.id}
          orgDisplayName={org.trade_name ?? org.legal_name ?? ''}
          onUpdateOrganisation={onUpdateOrganisation}
        />
      )}
    </Card>
  );
}
