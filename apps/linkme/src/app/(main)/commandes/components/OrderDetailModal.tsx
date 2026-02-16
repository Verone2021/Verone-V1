'use client';

/**
 * OrderDetailModal - Modal de detail d'une commande LinkMe
 * Design: Fond blanc, accents turquoise #5DBEBB, texte navy #183559
 *
 * @module OrderDetailModal
 * @since 2026-01-06
 */

import Image from 'next/image';

import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Separator,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import { LINKME_CONSTANTS } from '@verone/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  CalendarIcon,
  FileTextIcon,
  ImageIcon,
  MapPinIcon,
  PackageIcon,
  PhoneIcon,
  TruckIcon,
  UserIcon,
  XIcon,
} from 'lucide-react';

import type {
  LinkMeOrder,
  StructuredAddress,
} from '../../../../hooks/use-linkme-orders';

interface OrderDetailModalProps {
  order: LinkMeOrder | null;
  isOpen: boolean;
  onClose: () => void;
}

// Couleurs des badges par statut
const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-amber-100 text-amber-800 border-amber-200',
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  validated: 'bg-blue-100 text-blue-800 border-blue-200',
  processing: 'bg-blue-100 text-blue-800 border-blue-200',
  shipped: 'bg-purple-100 text-purple-800 border-purple-200',
  delivered: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  pending: 'En attente',
  validated: 'Validee',
  processing: 'En cours',
  shipped: 'Expediee',
  delivered: 'Livree',
  cancelled: 'Annulee',
};

/**
 * Formatte une adresse structuree en texte lisible
 */
function formatAddress(address: StructuredAddress | null): string[] {
  if (!address || Object.keys(address).length === 0) {
    return ['Non renseignee'];
  }

  const lines: string[] = [];

  if (address.contact_name) {
    lines.push(address.contact_name);
  }
  if (address.line1) {
    lines.push(address.line1);
  }
  if (address.line2) {
    lines.push(address.line2);
  }
  if (address.postal_code || address.city) {
    lines.push([address.postal_code, address.city].filter(Boolean).join(' '));
  }
  if (address.country) {
    lines.push(address.country);
  }

  return lines.length > 0 ? lines : ['Non renseignee'];
}

/**
 * Formatte un prix en euros
 */
function formatPrice(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

/**
 * Formatte une date
 */
function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  try {
    return format(new Date(dateStr), 'dd MMM yyyy', { locale: fr });
  } catch {
    return dateStr;
  }
}

/**
 * Contact info card (reusable)
 */
function ContactCard({
  label,
  name,
  email,
  phone,
  position,
}: {
  label: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  position?: string | null;
}) {
  if (!name && !email && !phone) return null;

  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      {name && <p className="font-medium text-[#183559] text-sm">{name}</p>}
      {position && <p className="text-xs text-gray-500">{position}</p>}
      {email && <p className="text-sm text-gray-600">{email}</p>}
      {phone && (
        <p className="text-sm text-gray-600 flex items-center gap-1">
          <PhoneIcon className="h-3 w-3" />
          {phone}
        </p>
      )}
    </div>
  );
}

export function OrderDetailModal({
  order,
  isOpen,
  onClose,
}: OrderDetailModalProps) {
  if (!order) return null;

  const statusColor = STATUS_COLORS[order.status] || STATUS_COLORS.pending;
  const statusLabel = STATUS_LABELS[order.status] || order.status;

  // Verifier si adresse livraison = facturation
  const isSameAddress =
    JSON.stringify(order.billing_address) ===
    JSON.stringify(order.shipping_address);

  // Check if delivery text address exists (from linkme_details)
  const hasDeliveryTextAddress =
    order.delivery_address_text ||
    order.delivery_postal_code ||
    order.delivery_city;

  // Check if any contact data exists
  const hasRequester =
    order.requester_name || order.requester_email || order.requester_phone;
  const hasDeliveryContact =
    order.delivery_contact_name ||
    order.delivery_contact_email ||
    order.delivery_contact_phone;
  const hasReceptionContact =
    order.reception_contact_name ||
    order.reception_contact_email ||
    order.reception_contact_phone;

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <DialogTitle className="text-xl font-semibold text-[#183559]">
              Commande {order.order_number}
            </DialogTitle>
            <Badge variant="outline" className={`${statusColor} font-medium`}>
              {statusLabel}
            </Badge>
            {order.pending_admin_validation && (
              <Badge
                variant="outline"
                className="bg-orange-100 text-orange-800 border-orange-200 font-medium"
              >
                Validation admin requise
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <XIcon className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Section: Informations client + Affiliate */}
          <section>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-[#183559] mb-3">
              <UserIcon className="h-4 w-4 text-[#5DBEBB]" />
              Client
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="font-medium text-[#183559]">
                {order.customer_name}
              </p>
              {order.customer_email && (
                <p className="text-sm text-gray-600">{order.customer_email}</p>
              )}
              {order.customer_phone && (
                <p className="text-sm text-gray-600">{order.customer_phone}</p>
              )}
              <div className="flex gap-2 mt-2">
                <Badge variant="secondary" className="text-xs">
                  {order.customer_type === 'organization'
                    ? 'Organisation'
                    : 'Particulier'}
                </Badge>
                {order.affiliate_name && (
                  <Badge
                    variant="outline"
                    className="text-xs bg-teal-50 text-teal-700 border-teal-200"
                  >
                    Affilie: {order.affiliate_name}
                  </Badge>
                )}
                {order.selection_name && (
                  <Badge
                    variant="outline"
                    className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                  >
                    {order.selection_name}
                  </Badge>
                )}
              </div>
            </div>
          </section>

          <Separator />

          {/* Section: Contacts (requester, billing, delivery, reception) */}
          {(hasRequester ||
            order.billing_name ||
            hasDeliveryContact ||
            hasReceptionContact) && (
            <>
              <section>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-[#183559] mb-3">
                  <PhoneIcon className="h-4 w-4 text-[#5DBEBB]" />
                  Contacts
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <ContactCard
                    label="Responsable commande"
                    name={order.requester_name}
                    email={order.requester_email}
                    phone={order.requester_phone}
                    position={order.requester_position}
                  />
                  <ContactCard
                    label="Contact facturation"
                    name={order.billing_name}
                    email={order.billing_email}
                    phone={order.billing_phone}
                  />
                  <ContactCard
                    label="Contact livraison"
                    name={order.delivery_contact_name}
                    email={order.delivery_contact_email}
                    phone={order.delivery_contact_phone}
                  />
                  <ContactCard
                    label="Contact reception"
                    name={order.reception_contact_name}
                    email={order.reception_contact_email}
                    phone={order.reception_contact_phone}
                  />
                </div>
              </section>

              <Separator />
            </>
          )}

          {/* Section: Adresses */}
          <section>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-[#183559] mb-3">
              <MapPinIcon className="h-4 w-4 text-[#5DBEBB]" />
              Adresses
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Adresse de facturation */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileTextIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">
                    Facturation
                  </span>
                </div>
                {formatAddress(order.billing_address).map((line, i) => (
                  <p key={i} className="text-sm text-gray-600">
                    {line}
                  </p>
                ))}
                {order.billing_name && (
                  <p className="text-sm text-gray-600 mt-1">
                    Contact: {order.billing_name}
                  </p>
                )}
                {order.billing_email && (
                  <p className="text-sm text-gray-500">{order.billing_email}</p>
                )}
              </div>

              {/* Adresse de livraison */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TruckIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">
                    Livraison
                  </span>
                </div>
                {isSameAddress && !hasDeliveryTextAddress ? (
                  <p className="text-sm text-gray-500 italic">
                    Identique a l&apos;adresse de facturation
                  </p>
                ) : hasDeliveryTextAddress ? (
                  <>
                    {order.delivery_contact_name && (
                      <p className="text-sm font-medium text-gray-700">
                        {order.delivery_contact_name}
                      </p>
                    )}
                    {order.delivery_address_text && (
                      <p className="text-sm text-gray-600">
                        {order.delivery_address_text}
                      </p>
                    )}
                    {(order.delivery_postal_code || order.delivery_city) && (
                      <p className="text-sm text-gray-600">
                        {[order.delivery_postal_code, order.delivery_city]
                          .filter(Boolean)
                          .join(' ')}
                      </p>
                    )}
                  </>
                ) : (
                  formatAddress(order.shipping_address).map((line, i) => (
                    <p key={i} className="text-sm text-gray-600">
                      {line}
                    </p>
                  ))
                )}
                {order.is_mall_delivery && (
                  <Badge variant="secondary" className="mt-2 text-xs">
                    Livraison en centre commercial
                  </Badge>
                )}
                {order.delivery_notes && (
                  <p className="text-xs text-gray-500 mt-2 italic">
                    {order.delivery_notes}
                  </p>
                )}
              </div>
            </div>
          </section>

          <Separator />

          {/* Section: Dates de livraison */}
          <section>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-[#183559] mb-3">
              <CalendarIcon className="h-4 w-4 text-[#5DBEBB]" />
              Livraison
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Date souhaitee</p>
                <p className="font-medium text-[#183559]">
                  {formatDate(order.desired_delivery_date)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Date confirmee</p>
                <p className="font-medium text-[#183559]">
                  {formatDate(order.confirmed_delivery_date)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Commande creee</p>
                <p className="font-medium text-[#183559]">
                  {formatDate(order.created_at)}
                </p>
              </div>
            </div>
          </section>

          <Separator />

          {/* Section: Articles */}
          <section>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-[#183559] mb-3">
              <PackageIcon className="h-4 w-4 text-[#5DBEBB]" />
              Articles ({order.items_count})
            </h3>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-16 text-[#183559]">Image</TableHead>
                    <TableHead className="text-[#183559]">Produit</TableHead>
                    <TableHead className="text-center text-[#183559]">
                      Qte
                    </TableHead>
                    <TableHead className="text-right text-[#183559]">
                      Prix unit. HT
                    </TableHead>
                    <TableHead className="text-right text-[#183559]">
                      Total HT
                    </TableHead>
                    <TableHead className="text-center text-[#183559]">
                      Marge %
                    </TableHead>
                    <TableHead className="text-right text-[#183559]">
                      Commission TTC
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="w-16">
                        {item.product_image_url ? (
                          <Image
                            src={item.product_image_url}
                            alt={item.product_name}
                            width={48}
                            height={48}
                            className="rounded-md object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center">
                            <ImageIcon className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-[#183559]">
                            {item.product_name}
                          </p>
                          {item.product_sku && (
                            <p className="text-xs text-gray-500">
                              SKU: {item.product_sku}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatPrice(item.unit_price_ht)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatPrice(item.total_ht)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="text-xs">
                          {item.margin_rate.toFixed(0)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-emerald-600">
                        +
                        {formatPrice(
                          item.affiliate_margin *
                            (1 + LINKME_CONSTANTS.DEFAULT_TAX_RATE)
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>

          <Separator />

          {/* Section: Totaux */}
          <section>
            <div className="bg-gradient-to-r from-gray-50 to-white rounded-lg p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Total HT</p>
                  <p className="text-lg font-semibold text-[#183559]">
                    {formatPrice(order.total_ht)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">
                    Frais livraison HT
                  </p>
                  <p className="text-lg font-semibold text-[#183559]">
                    {formatPrice(order.shipping_cost_ht)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Total TTC</p>
                  <p className="text-lg font-bold text-[#183559]">
                    {formatPrice(order.total_ttc)}
                  </p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3 -m-1">
                  <p className="text-xs text-emerald-600 mb-1">
                    Votre Commission TTC
                  </p>
                  <p className="text-lg font-bold text-emerald-600">
                    +
                    {formatPrice(
                      order.total_affiliate_margin *
                        (1 + LINKME_CONSTANTS.DEFAULT_TAX_RATE)
                    )}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section: Actions futures (placeholder pour Qonto) */}
          <section className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose}>
              Fermer
            </Button>
            {/* TODO: Telecharger facture via Qonto API */}
            <Button
              variant="default"
              className="bg-[#5DBEBB] hover:bg-[#4DAEAB] text-white"
              disabled
            >
              <FileTextIcon className="h-4 w-4 mr-2" />
              Telecharger facture
            </Button>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
