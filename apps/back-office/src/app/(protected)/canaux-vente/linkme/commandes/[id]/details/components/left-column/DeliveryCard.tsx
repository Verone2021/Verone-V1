'use client';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Separator,
} from '@verone/ui';
import {
  AlertTriangle,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  MapPin,
  Pencil,
  Truck,
} from 'lucide-react';

import type { LinkMeOrderDetails } from '../../../../../hooks/use-linkme-order-actions';
import type { FusedContactGroup, OrderWithDetails } from '../types';
import { renderStepBadge } from './helpers';

interface DeliveryCardProps {
  order: OrderWithDetails;
  details: LinkMeOrderDetails | null;
  locked: boolean;
  fusedContacts: FusedContactGroup[];
  deliveryAddressMatchesOrg: boolean;
  onUseOrgAddress: () => void;
  updateDetailsPending: boolean;
  isStep4Complete: boolean;
  onOpenEditDialog: (
    step: 'responsable' | 'billing' | 'delivery_address' | 'delivery_options'
  ) => void;
  onOpenContactDialog: (role: 'responsable' | 'billing' | 'delivery') => void;
}

export function DeliveryCard({
  order,
  details,
  locked,
  fusedContacts,
  deliveryAddressMatchesOrg,
  onUseOrgAddress,
  updateDetailsPending,
  isStep4Complete,
  onOpenEditDialog,
  onOpenContactDialog,
}: DeliveryCardProps) {
  const org = order.organisation;

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-cyan-600" />
          <CardTitle className="text-base">Livraison</CardTitle>
          {order.status === 'validated' && renderStepBadge(isStep4Complete)}
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        {details ? (
          <div className="space-y-3">
            {/* Contact livraison — only show if NOT already in fused cards */}
            {!fusedContacts.some(g => g.roles.includes('delivery')) && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact livraison
                  </p>
                  {!locked && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => onOpenContactDialog('delivery')}
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Changer
                    </Button>
                  )}
                </div>
                {details.delivery_contact_name ? (
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                    <span className="font-medium">
                      {details.delivery_contact_name}
                    </span>
                    {details.delivery_contact_email && (
                      <a
                        href={`mailto:${details.delivery_contact_email}`}
                        className="text-blue-600 hover:underline text-xs"
                      >
                        {details.delivery_contact_email}
                      </a>
                    )}
                    {details.delivery_contact_phone && (
                      <span className="text-xs text-gray-500">
                        {details.delivery_contact_phone}
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">
                    Aucun contact renseigné
                  </p>
                )}
              </div>
            )}

            {/* Adresse livraison */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Adresse
                </p>
                {!locked && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => onOpenEditDialog('delivery_address')}
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    Modifier
                  </Button>
                )}
              </div>
              {details.delivery_address ? (
                <div>
                  <p className="text-sm">
                    {details.delivery_address}
                    {details.delivery_postal_code &&
                      `, ${details.delivery_postal_code}`}
                    {details.delivery_city && ` ${details.delivery_city}`}
                  </p>
                  {org && (
                    <span
                      className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded text-xs font-medium ${
                        deliveryAddressMatchesOrg
                          ? 'bg-green-100 text-green-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}
                    >
                      {deliveryAddressMatchesOrg ? (
                        <>
                          <CheckCircle2 className="h-3 w-3" />
                          Adresse restaurant confirmée
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-3 w-3" />
                          Adresse différente du restaurant
                        </>
                      )}
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">
                  Aucune adresse renseignée
                </p>
              )}
              {!locked &&
                org &&
                (org.address_line1 ?? org.shipping_address_line1) &&
                !deliveryAddressMatchesOrg && (
                  <button
                    type="button"
                    disabled={updateDetailsPending}
                    className="w-full text-left p-2 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors text-xs"
                    onClick={onUseOrgAddress}
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3 text-blue-600 flex-shrink-0" />
                      <span className="text-blue-700 font-medium">
                        Utiliser adresse restaurant
                      </span>
                      <span className="text-gray-500 truncate">
                        {org.has_different_shipping_address
                          ? [
                              org.shipping_address_line1,
                              org.shipping_postal_code,
                              org.shipping_city,
                            ]
                              .filter(Boolean)
                              .join(', ')
                          : [org.address_line1, org.postal_code, org.city]
                              .filter(Boolean)
                              .join(', ')}
                      </span>
                    </div>
                  </button>
                )}
            </div>

            <Separator className="my-2" />

            {/* Options livraison — compact */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Options
                </p>
                {!locked && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => onOpenEditDialog('delivery_options')}
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    Modifier
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                <span>
                  Modalités :{' '}
                  <strong>
                    {details.delivery_terms_accepted ? 'Oui' : 'Non'}
                  </strong>
                </span>
                <span>
                  Centre co. :{' '}
                  <strong>{details.is_mall_delivery ? 'Oui' : 'Non'}</strong>
                </span>
                <span>
                  Semi-remorque :{' '}
                  <strong>
                    {details.semi_trailer_accessible ? 'Oui' : 'Non'}
                  </strong>
                </span>
                {details.desired_delivery_date ? (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Souhaitee :{' '}
                    {new Date(details.desired_delivery_date).toLocaleDateString(
                      'fr-FR'
                    )}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-600 font-medium">
                    <Calendar className="h-3 w-3" />
                    Date non renseignee
                  </span>
                )}
              </div>
              {details.is_mall_delivery && details.mall_email && (
                <p className="text-xs text-gray-500">
                  Email direction : {details.mall_email}
                </p>
              )}
              {details.delivery_notes && (
                <p className="text-xs text-gray-500">
                  Notes : {details.delivery_notes}
                </p>
              )}
              {details.access_form_required && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-amber-600 font-medium">
                    Formulaire accès requis
                  </span>
                  {details.access_form_url && (
                    <a
                      href={details.access_form_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Voir
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Post-approbation */}
            {order.status === 'validated' && (
              <>
                <Separator />
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-700">
                    Post-approbation
                  </p>
                  {details.step4_token && (
                    <div className="p-3 bg-blue-50 rounded-lg text-sm space-y-1">
                      <p className="font-medium text-blue-700">
                        Token de validation actif
                      </p>
                      {details.step4_token_expires_at && (
                        <p className="text-blue-600">
                          Expire le :{' '}
                          {new Date(
                            details.step4_token_expires_at
                          ).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                      {details.step4_completed_at && (
                        <p className="text-green-700">
                          <Check className="h-4 w-4 inline mr-1" />
                          Complété le :{' '}
                          {new Date(
                            details.step4_completed_at
                          ).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                      )}
                    </div>
                  )}
                  {details.reception_contact_name && (
                    <div>
                      <span className="text-xs text-gray-500">
                        Contact réception
                      </span>
                      <p className="font-medium">
                        {details.reception_contact_name}
                      </p>
                    </div>
                  )}
                  {details.confirmed_delivery_date && (
                    <div className="flex items-center gap-2 text-sm p-3 bg-green-50 rounded-lg text-green-700">
                      <Calendar className="h-4 w-4" />
                      <span>
                        <strong>Date confirmée :</strong>{' '}
                        {new Date(
                          details.confirmed_delivery_date
                        ).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  )}
                  {!details.reception_contact_name &&
                    !details.confirmed_delivery_date && (
                      <div className="p-3 bg-amber-50 rounded-lg text-sm text-amber-700">
                        <Clock className="h-4 w-4 inline mr-1" />
                        En attente de confirmation via le lien email.
                      </div>
                    )}
                </div>
              </>
            )}
          </div>
        ) : (
          <p className="text-gray-500">Données non disponibles</p>
        )}
      </CardContent>
    </Card>
  );
}
