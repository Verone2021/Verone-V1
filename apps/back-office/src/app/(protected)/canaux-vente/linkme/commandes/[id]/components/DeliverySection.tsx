'use client';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Label,
  Separator,
} from '@verone/ui';
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Truck,
} from 'lucide-react';

import type { LinkMeOrderDetails } from '../../../hooks/use-linkme-order-actions';
import type { OrderWithDetails } from './types';

interface DeliverySectionProps {
  order: OrderWithDetails;
  details: LinkMeOrderDetails | null;
  deliveryAddressMatchesOrg: boolean;
  updateDetailsIsPending: boolean;
  onEditDeliveryAddress: () => void;
  onEditDeliveryOptions: () => void;
  onChangeDeliveryContact: () => void;
  onUseOrgAddress: () => void;
}

export function DeliverySection({
  order,
  details,
  deliveryAddressMatchesOrg,
  updateDetailsIsPending,
  onEditDeliveryAddress,
  onEditDeliveryOptions,
  onChangeDeliveryContact,
  onUseOrgAddress,
}: DeliverySectionProps) {
  const org = order.organisation;

  const isStep4Complete = () => {
    if (!details) return false;
    return !!details.step4_completed_at;
  };

  const renderStepBadge = (complete: boolean) => {
    if (complete) {
      return (
        <Badge className="bg-green-100 text-green-800 gap-1">
          <Check className="h-3 w-3" />
          Complet
        </Badge>
      );
    }
    return (
      <Badge variant="destructive" className="gap-1">
        <AlertCircle className="h-3 w-3" />
        Incomplet
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-cyan-600" />
          <CardTitle className="text-base">Livraison</CardTitle>
          {order.status === 'validated' && renderStepBadge(isStep4Complete())}
        </div>
      </CardHeader>
      <CardContent>
        {details ? (
          <div className="space-y-6">
            {/* ---- Sub-section 1: Delivery contact ---- */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">
                  Contact livraison
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onChangeDeliveryContact}
                >
                  <Pencil className="h-3 w-3 mr-1" />
                  Changer contact
                </Button>
              </div>
              {order.delivery_contact ? (
                <div className="space-y-1">
                  <p className="font-medium">
                    {order.delivery_contact.first_name}{' '}
                    {order.delivery_contact.last_name}
                  </p>
                  {order.delivery_contact.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <a
                        href={`mailto:${order.delivery_contact.email}`}
                        className="text-blue-600 hover:underline"
                      >
                        {order.delivery_contact.email}
                      </a>
                    </div>
                  )}
                  {order.delivery_contact.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{order.delivery_contact.phone}</span>
                    </div>
                  )}
                </div>
              ) : details.delivery_contact_name ? (
                <div className="space-y-1">
                  <p className="font-medium">{details.delivery_contact_name}</p>
                  {details.delivery_contact_email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <a
                        href={`mailto:${details.delivery_contact_email}`}
                        className="text-blue-600 hover:underline"
                      >
                        {details.delivery_contact_email}
                      </a>
                    </div>
                  )}
                  {details.delivery_contact_phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{details.delivery_contact_phone}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">
                  Aucun contact renseigne
                </p>
              )}
            </div>

            <Separator />

            {/* ---- Sub-section 2: Delivery address ---- */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">
                  Adresse de livraison
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onEditDeliveryAddress}
                >
                  <Pencil className="h-3 w-3 mr-1" />
                  Modifier
                </Button>
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
                          Adresse restaurant confirmee
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-3 w-3" />
                          Adresse differente du restaurant
                        </>
                      )}
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">
                  Aucune adresse renseignee
                </p>
              )}
              {/* Restaurant address clickable to fill */}
              {org && (org.address_line1 ?? org.shipping_address_line1) && (
                <button
                  type="button"
                  disabled={deliveryAddressMatchesOrg || updateDetailsIsPending}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    deliveryAddressMatchesOrg
                      ? 'bg-blue-50 border-blue-100 cursor-default'
                      : 'bg-blue-50 border-blue-200 cursor-pointer hover:bg-blue-100 hover:border-blue-300'
                  }`}
                  onClick={() => {
                    if (deliveryAddressMatchesOrg) return;
                    void Promise.resolve(onUseOrgAddress()).catch(
                      (err: unknown) => {
                        console.error(
                          '[DeliverySection] Use org address failed:',
                          err
                        );
                      }
                    );
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-blue-600" />
                      <p className="text-xs font-medium text-blue-700">
                        Adresse restaurant (organisation)
                      </p>
                    </div>
                    {!deliveryAddressMatchesOrg && !updateDetailsIsPending && (
                      <span className="text-[10px] font-medium text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                        Utiliser cette adresse
                      </span>
                    )}
                    {updateDetailsIsPending && (
                      <span className="text-[10px] font-medium text-blue-600">
                        Mise a jour...
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {org.has_different_shipping_address
                      ? [org.shipping_address_line1, org.shipping_address_line2]
                          .filter(Boolean)
                          .join(', ')
                      : [org.address_line1, org.address_line2]
                          .filter(Boolean)
                          .join(', ')}
                  </p>
                  <p className="text-sm text-gray-600">
                    {org.has_different_shipping_address
                      ? [org.shipping_postal_code, org.shipping_city]
                          .filter(Boolean)
                          .join(' ')
                      : [org.postal_code, org.city].filter(Boolean).join(' ')}
                  </p>
                </button>
              )}
            </div>

            <Separator />

            {/* ---- Sub-section 3: Delivery options ---- */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">Options</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onEditDeliveryOptions}
                >
                  <Pencil className="h-3 w-3 mr-1" />
                  Modifier
                </Button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Modalites acceptees</span>
                    <Badge
                      variant={
                        details.delivery_terms_accepted ? 'default' : 'outline'
                      }
                    >
                      {details.delivery_terms_accepted ? 'Oui' : 'Non'}
                    </Badge>
                  </div>
                  {details.desired_delivery_date && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>
                        Livraison souhaitee :{' '}
                        {new Date(
                          details.desired_delivery_date
                        ).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  )}
                  {details.delivery_date &&
                    details.delivery_date !== details.desired_delivery_date && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>
                          Date de livraison :{' '}
                          {new Date(details.delivery_date).toLocaleDateString(
                            'fr-FR'
                          )}
                        </span>
                      </div>
                    )}
                  {details.delivery_notes && (
                    <div>
                      <Label className="text-xs text-gray-500">Notes</Label>
                      <p className="text-sm text-gray-600">
                        {details.delivery_notes}
                      </p>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Centre commercial</span>
                    <Badge
                      variant={details.is_mall_delivery ? 'default' : 'outline'}
                    >
                      {details.is_mall_delivery ? 'Oui' : 'Non'}
                    </Badge>
                  </div>
                  {details.is_mall_delivery && details.mall_email && (
                    <div className="text-sm text-gray-600">
                      Email direction : {details.mall_email}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Acces semi-remorque</span>
                    <Badge
                      variant={
                        details.semi_trailer_accessible ? 'default' : 'outline'
                      }
                    >
                      {details.semi_trailer_accessible ? 'Oui' : 'Non'}
                    </Badge>
                  </div>
                  {details.access_form_required && (
                    <div className="p-3 bg-gray-50 rounded-lg text-sm">
                      <p className="font-medium">Formulaire acces requis</p>
                      {details.access_form_url && (
                        <a
                          href={details.access_form_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1 mt-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Voir le formulaire
                        </a>
                      )}
                    </div>
                  )}
                  {details.mall_form_required && (
                    <div className="p-3 bg-gray-50 rounded-lg text-sm">
                      <p className="font-medium">
                        Formulaire centre commercial requis
                      </p>
                      {details.mall_form_email && (
                        <p className="text-gray-600 mt-1">
                          Email : {details.mall_form_email}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Post-approval (if validated) */}
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
                          Complete le :{' '}
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
                      <Label className="text-xs text-gray-500">
                        Contact reception
                      </Label>
                      <p className="font-medium">
                        {details.reception_contact_name}
                      </p>
                    </div>
                  )}
                  {details.confirmed_delivery_date && (
                    <div className="flex items-center gap-2 text-sm p-3 bg-green-50 rounded-lg text-green-700">
                      <Calendar className="h-4 w-4" />
                      <span>
                        <strong>Date confirmee :</strong>{' '}
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
          <p className="text-gray-500">Donnees non disponibles</p>
        )}
      </CardContent>
    </Card>
  );
}
