'use client';

import { useState } from 'react';

import {
  Card,
  CardContent,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import {
  AlertTriangle,
  Building2,
  Check,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Truck,
  XCircle,
} from 'lucide-react';

import type { OrderWithDetails } from '../types';

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

  return (
    <Card>
      <CardContent className="p-4">
        {order.organisation ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Building2 className="h-4 w-4 text-orange-600 flex-shrink-0" />
              <span className="font-semibold text-gray-900">
                {order.organisation.trade_name ?? order.organisation.legal_name}
              </span>
              {/* Badge ownership_type — complétable si vide, lecture seule si renseigné */}
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
            {/* Identifiants : SIRET / TVA — complétable si vide */}
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
            {/* Adresse de livraison (si différente) */}
            {order.organisation.has_different_shipping_address && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                {(order.organisation.shipping_address_line1 ??
                order.organisation.shipping_postal_code) ? (
                  <span className="flex items-center gap-1">
                    <Truck className="h-3 w-3 text-blue-500" />
                    Livraison :{' '}
                    {[
                      order.organisation.shipping_address_line1,
                      order.organisation.shipping_postal_code,
                      order.organisation.shipping_city,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                ) : (
                  <span className="text-amber-600 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Adresse livraison : Non renseignée
                  </span>
                )}
              </div>
            )}
            {/* Contact */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
              {order.organisation.email && (
                <a
                  href={`mailto:${order.organisation.email}`}
                  className="text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Mail className="h-3 w-3" />
                  {order.organisation.email}
                </a>
              )}
              {order.organisation.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {order.organisation.phone}
                </span>
              )}
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Organisation non renseignée</p>
        )}
      </CardContent>
    </Card>
  );
}
