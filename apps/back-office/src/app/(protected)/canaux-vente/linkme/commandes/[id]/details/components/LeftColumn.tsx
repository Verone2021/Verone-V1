'use client';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Separator,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import { formatCurrency } from '@verone/utils';
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
  Package,
  Pencil,
  Phone,
  Save,
  Truck,
  XCircle,
  Building2,
} from 'lucide-react';

import type { LinkMeOrderDetails } from '../../../../hooks/use-linkme-order-actions';
import { FeesSection } from '@/components/orders/FeesSection';

import type {
  OrderWithDetails,
  EnrichedOrderItem,
  FusedContactGroup,
} from './types';

// ============================================
// PROPS
// ============================================

export interface LeftColumnProps {
  order: OrderWithDetails;
  enrichedItems: EnrichedOrderItem[];
  locked: boolean;
  details: LinkMeOrderDetails | null;
  fusedContacts: FusedContactGroup[];
  // Items editing
  editedQuantities: Record<string, number>;
  setEditedQuantities: React.Dispatch<
    React.SetStateAction<Record<string, number>>
  >;
  hasItemChanges: boolean;
  isSavingItems: boolean;
  onSaveItems: () => void;
  // Edit dialogs
  onOpenEditDialog: (
    step: 'responsable' | 'billing' | 'delivery_address' | 'delivery_options'
  ) => void;
  // Contact dialog
  onOpenContactDialog: (role: 'responsable' | 'billing' | 'delivery') => void;
  // Delivery address
  deliveryAddressMatchesOrg: boolean;
  onUseOrgAddress: () => void;
  updateDetailsPending: boolean;
  // Step badge
  isStep4Complete: boolean;
}

// ============================================
// HELPERS
// ============================================

function renderStepBadge(complete: boolean) {
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
}

// ============================================
// COMPONENT
// ============================================

export function LeftColumn({
  order,
  enrichedItems,
  locked,
  details,
  fusedContacts,
  editedQuantities,
  setEditedQuantities,
  hasItemChanges,
  isSavingItems,
  onSaveItems,
  onOpenEditDialog,
  onOpenContactDialog,
  deliveryAddressMatchesOrg,
  onUseOrgAddress,
  updateDetailsPending,
  isStep4Complete,
}: LeftColumnProps) {
  const org = order.organisation;

  return (
    <div className="lg:col-span-2 space-y-4">
      {/* RESTAURANT — compact inline */}
      <Card>
        <CardContent className="p-4">
          {order.organisation ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Building2 className="h-4 w-4 text-orange-600 flex-shrink-0" />
                <span className="font-semibold text-gray-900">
                  {order.organisation.trade_name ??
                    order.organisation.legal_name}
                </span>
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
                {order.organisation.approval_status ===
                  'pending_validation' && (
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
                  if (isFrench) {
                    return order.organisation.siret ? (
                      <span>SIRET : {order.organisation.siret}</span>
                    ) : (
                      <span className="text-amber-600 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        SIRET : Non renseigné
                      </span>
                    );
                  } else {
                    return order.organisation.vat_number ? (
                      <span>TVA Intra. : {order.organisation.vat_number}</span>
                    ) : (
                      <span className="text-amber-600 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        N° TVA Intracommunautaire : Non renseigné
                      </span>
                    );
                  }
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

      {/* ITEMS TABLE (editable) */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-orange-600" />
              <CardTitle className="text-base">Articles</CardTitle>
              <span className="text-xs text-gray-400">
                ({order.items.length})
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {hasItemChanges && (
            <div className="flex justify-end mb-4">
              <Button
                size="sm"
                className="gap-2"
                disabled={isSavingItems}
                onClick={onSaveItems}
              >
                <Save className="h-4 w-4" />
                {isSavingItems
                  ? 'Enregistrement...'
                  : 'Sauvegarder les modifications'}
              </Button>
            </div>
          )}
          {enrichedItems.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Produit</TableHead>
                    <TableHead className="text-right">Prix Verone HT</TableHead>
                    <TableHead className="text-center">Commission %</TableHead>
                    <TableHead className="text-right">
                      Commission &euro;
                    </TableHead>
                    <TableHead className="text-right">Prix client HT</TableHead>
                    <TableHead className="text-center">Qté</TableHead>
                    <TableHead className="text-right">Total HT</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrichedItems.map(item => {
                    const isRevendeur = !!item.created_by_affiliate;
                    const commissionPerUnit =
                      item.quantity > 0
                        ? (item.affiliate_margin ?? 0) / item.quantity
                        : 0;
                    // For affiliate products, show affiliate_commission_rate; for catalogue, retrocession_rate
                    const displayCommissionPct = isRevendeur
                      ? item.affiliate_margin > 0 && item.total_ht > 0
                        ? Math.round(
                            (item.affiliate_margin / item.total_ht) * 100
                          )
                        : 0
                      : Math.round(item.retrocession_rate * 100);

                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div>
                              <p className="font-medium text-sm">
                                {item.product_name}
                              </p>
                              <div className="flex items-center gap-2">
                                <p className="text-xs text-gray-500 font-mono">
                                  {item.product_sku}
                                </p>
                                <Badge
                                  variant="outline"
                                  className={
                                    isRevendeur
                                      ? 'text-[10px] border-violet-500 text-violet-700 bg-violet-50'
                                      : 'text-[10px] border-blue-500 text-blue-700 bg-blue-50'
                                  }
                                >
                                  {isRevendeur ? 'REVENDEUR' : 'CATALOGUE'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        {/* Prix Verone HT (base_price from selection) */}
                        <TableCell className="text-right">
                          {formatCurrency(
                            item.base_price_ht || item.unit_price_ht
                          )}
                        </TableCell>
                        {/* Commission % */}
                        <TableCell className="text-center">
                          <span
                            className={
                              isRevendeur ? 'text-orange-500' : 'text-teal-600'
                            }
                          >
                            {`${displayCommissionPct}%`}
                          </span>
                        </TableCell>
                        {/* Commission EUR (per unit) */}
                        <TableCell className="text-right">
                          <span
                            className={
                              isRevendeur ? 'text-orange-500' : 'text-teal-600'
                            }
                          >
                            {formatCurrency(commissionPerUnit)}
                          </span>
                        </TableCell>
                        {/* Prix client HT (includes commission) */}
                        <TableCell className="text-right font-medium">
                          {formatCurrency(item.unit_price_ht)}
                        </TableCell>
                        {/* Quantité */}
                        <TableCell className="text-center">
                          {order.status === 'draft' ||
                          order.status === 'validated' ? (
                            <Input
                              type="number"
                              min={1}
                              className="w-16 h-8 text-center mx-auto"
                              value={editedQuantities[item.id] ?? item.quantity}
                              onChange={e => {
                                const val = parseInt(e.target.value, 10);
                                if (!isNaN(val) && val > 0) {
                                  setEditedQuantities(prev => ({
                                    ...prev,
                                    [item.id]: val,
                                  }));
                                }
                              }}
                            />
                          ) : (
                            item.quantity
                          )}
                        </TableCell>
                        {/* Total HT */}
                        <TableCell className="text-right font-medium">
                          {formatCurrency(item.total_ht)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex-1 space-y-2">
              {order.items.map(item => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <p className="font-medium text-sm">
                      {item.product?.name ?? 'Produit inconnu'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.product?.sku ?? '-'} × {item.quantity}
                    </p>
                  </div>
                  <p className="font-medium">
                    {formatCurrency(item.total_ht)} HT
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* FRAIS DE SERVICE — after articles */}
      <FeesSection
        orderId={order.id}
        shippingCostHt={order.shipping_cost_ht ?? 0}
        handlingCostHt={order.handling_cost_ht ?? 0}
        insuranceCostHt={order.insurance_cost_ht ?? 0}
        feesVatRate={order.fees_vat_rate ?? 0.2}
        readOnly={locked}
      />

      {/* TOTAUX — after fees */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Total HT</span>
            <span className="text-sm font-medium">
              {formatCurrency(order.total_ht)}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-gray-200">
            <span className="font-bold">Total TTC</span>
            <span className="font-bold text-lg">
              {formatCurrency(order.total_ttc)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* COMMISSION & VERSEMENT — breakdown of what Verone owes the affiliate */}
      {enrichedItems.length > 0 &&
        (() => {
          const catalogueItems = enrichedItems.filter(
            i => !i.created_by_affiliate
          );
          const affiliateProductItems = enrichedItems.filter(
            i => !!i.created_by_affiliate
          );

          // Catalogue: retrocession (what we pay the affiliate as commission)
          const catalogueCommissionHT = catalogueItems.reduce(
            (sum, item) => sum + (item.affiliate_margin ?? 0),
            0
          );
          const catalogueCommissionTTC = catalogueCommissionHT * 1.2;

          // Affiliate products: Verone takes a commission, reverses the rest
          const affiliateProductsTotalHT = affiliateProductItems.reduce(
            (sum, item) => sum + item.total_ht,
            0
          );
          const affiliateProductsTotalTTC = affiliateProductsTotalHT * 1.2;
          const affiliateProductsCommissionHT = affiliateProductItems.reduce(
            (sum, item) => sum + (item.affiliate_margin ?? 0),
            0
          );
          const affiliateProductsCommissionTTC =
            affiliateProductsCommissionHT * 1.2;
          const affiliateVersementHT =
            affiliateProductsTotalHT - affiliateProductsCommissionHT;
          const affiliateVersementTTC =
            affiliateProductsTotalTTC - affiliateProductsCommissionTTC;

          // Grand total to pay the affiliate
          const totalPayoutHT = catalogueCommissionHT + affiliateVersementHT;
          const totalPayoutTTC = catalogueCommissionTTC + affiliateVersementTTC;

          return (
            <Card className="border-emerald-200">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full bg-emerald-100 flex items-center justify-center text-[10px] text-emerald-700 font-bold">
                    $
                  </span>
                  Commission & Versement
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0 space-y-3">
                {/* Catalogue products commission */}
                {catalogueItems.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">
                      Produits catalogue ({catalogueItems.length} ligne
                      {catalogueItems.length > 1 ? 's' : ''})
                    </p>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Commission affilié</span>
                      <span className="font-medium text-teal-600">
                        {formatCurrency(catalogueCommissionHT)} HT /{' '}
                        {formatCurrency(catalogueCommissionTTC)} TTC
                      </span>
                    </div>
                  </div>
                )}

                {/* Affiliate products: commission LinkMe + versement */}
                {affiliateProductItems.length > 0 && (
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-xs font-medium text-orange-500 mb-1">
                      Produits affilié ({affiliateProductItems.length} ligne
                      {affiliateProductItems.length > 1 ? 's' : ''})
                    </p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          CA produits affilié
                        </span>
                        <span className="text-gray-900">
                          {formatCurrency(affiliateProductsTotalHT)} HT /{' '}
                          {formatCurrency(affiliateProductsTotalTTC)} TTC
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          Commission LinkMe (Verone garde)
                        </span>
                        <span className="font-medium text-orange-500">
                          {formatCurrency(affiliateProductsCommissionHT)} HT /{' '}
                          {formatCurrency(affiliateProductsCommissionTTC)} TTC
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          Versement affilié (à reverser)
                        </span>
                        <span className="font-medium text-emerald-600">
                          {formatCurrency(affiliateVersementHT)} HT /{' '}
                          {formatCurrency(affiliateVersementTTC)} TTC
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Grand total */}
                <div className="pt-3 border-t-2 border-emerald-200">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-900">
                      Total à verser à l&apos;affilié
                    </span>
                    <div className="text-right">
                      <p className="text-lg font-bold text-emerald-700">
                        {formatCurrency(totalPayoutTTC)} TTC
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatCurrency(totalPayoutHT)} HT
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })()}

      {/* LIVRAISON — after totals */}
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
                      {new Date(
                        details.desired_delivery_date
                      ).toLocaleDateString('fr-FR')}
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

      {/* HISTORIQUE DEMANDES */}
      {order.infoRequests.length > 0 && (
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-indigo-600" />
              <CardTitle className="text-base">Demandes</CardTitle>
              <Badge variant="secondary" className="ml-auto text-xs">
                {order.infoRequests.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...order.infoRequests]
                .sort(
                  (a, b) =>
                    new Date(b.sent_at).getTime() -
                    new Date(a.sent_at).getTime()
                )
                .map(req => {
                  const isPending = !req.completed_at && !req.cancelled_at;
                  const isCompleted = !!req.completed_at;
                  const isCancelled = !!req.cancelled_at;
                  return (
                    <div
                      key={req.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border ${
                        isPending
                          ? 'border-yellow-200 bg-yellow-50'
                          : isCompleted
                            ? 'border-green-200 bg-green-50'
                            : 'border-red-200 bg-red-50'
                      }`}
                    >
                      {isPending && (
                        <Clock className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      )}
                      {isCompleted && (
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      )}
                      {isCancelled && (
                        <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-gray-900">
                            {req.recipient_email}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {req.recipient_type === 'requester'
                              ? 'Demandeur'
                              : 'Propriétaire'}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Envoyé le{' '}
                          {new Date(req.sent_at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                          {isCompleted && req.completed_at && (
                            <span className="text-green-700 ml-2">
                              — Complété le{' '}
                              {new Date(req.completed_at).toLocaleDateString(
                                'fr-FR',
                                {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric',
                                }
                              )}
                            </span>
                          )}
                          {isCancelled && req.cancelled_reason && (
                            <span className="text-red-700 ml-2">
                              — Raison : {req.cancelled_reason}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
