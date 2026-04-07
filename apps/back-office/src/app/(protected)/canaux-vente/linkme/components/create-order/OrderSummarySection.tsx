'use client';

import { Building2, User, Store, Package } from 'lucide-react';
import type {
  EnseigneOrganisationCustomer,
  EnseigneIndividualCustomer,
} from '../../hooks/use-linkme-enseigne-customers';
import type {
  CartItem,
  CustomerType,
} from '../../hooks/use-create-linkme-order-form';

interface CartTotals {
  totalHt: number;
  totalTva: number;
  totalTtc: number;
  totalRetrocession: number;
}

interface OrderSummarySectionProps {
  customerType: CustomerType;
  selectedCustomer:
    | EnseigneOrganisationCustomer
    | EnseigneIndividualCustomer
    | null
    | undefined;
  affiliateDisplayName: string | undefined;
  affiliateType: 'enseigne' | 'org_independante' | null;
  cart: CartItem[];
  cartTotals: CartTotals;
}

export function OrderSummarySection({
  customerType,
  selectedCustomer,
  affiliateDisplayName,
  affiliateType,
  cart,
  cartTotals,
}: OrderSummarySectionProps) {
  return (
    <div className="space-y-4 border-t pt-6">
      <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
        Récapitulatif de la commande
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            {customerType === 'organization' ? (
              <Building2 className="h-4 w-4 text-slate-400" />
            ) : (
              <User className="h-4 w-4 text-slate-400" />
            )}
            <span className="text-xs font-medium text-slate-500 uppercase">
              Client
            </span>
          </div>
          <p className="font-medium text-slate-900">
            {customerType === 'organization'
              ? ((selectedCustomer as EnseigneOrganisationCustomer)?.name ??
                (selectedCustomer as EnseigneOrganisationCustomer)?.legal_name)
              : (selectedCustomer as EnseigneIndividualCustomer)?.full_name}
          </p>
          {selectedCustomer &&
            'email' in selectedCustomer &&
            selectedCustomer.email && (
              <p className="text-sm text-slate-600 mt-1">
                {selectedCustomer.email}
              </p>
            )}
          {selectedCustomer &&
            'address_line1' in selectedCustomer &&
            (selectedCustomer.address_line1 ?? selectedCustomer.city) && (
              <p className="text-sm text-slate-500 mt-1">
                {[
                  selectedCustomer.address_line1,
                  selectedCustomer.postal_code,
                  selectedCustomer.city,
                ]
                  .filter(Boolean)
                  .join(', ')}
              </p>
            )}
        </div>

        <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
          <div className="flex items-center gap-2 mb-3">
            <Store className="h-4 w-4 text-purple-400" />
            <span className="text-xs font-medium text-purple-500 uppercase">
              Affilié
            </span>
          </div>
          <p className="font-medium text-purple-900">{affiliateDisplayName}</p>
          <p className="text-sm text-purple-600">
            {affiliateType === 'enseigne'
              ? 'Enseigne'
              : 'Organisation indépendante'}
          </p>
        </div>
      </div>

      <div className="p-4 bg-white rounded-xl border border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-500 uppercase">
              {cart.length} Produit{cart.length > 1 ? 's' : ''}
            </span>
          </div>
          <span className="text-xs text-slate-500">TVA par ligne</span>
        </div>

        <div className="space-y-2 max-h-24 overflow-y-auto">
          {cart.map(item => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-slate-700 truncate flex-1">
                {item.product_name} × {item.quantity}
              </span>
              <span className="text-slate-900 font-medium ml-2">
                {(item.unit_price_ht * item.quantity).toFixed(2)}€
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <div className="w-64 space-y-2">
          <div className="flex justify-between text-sm text-slate-600">
            <span>Total HT</span>
            <span>{cartTotals.totalHt.toFixed(2)}€</span>
          </div>
          <div className="flex justify-between text-sm text-slate-600">
            <span>TVA</span>
            <span>{cartTotals.totalTva.toFixed(2)}€</span>
          </div>
          <div className="flex justify-between text-base font-semibold text-slate-900 pt-2 border-t">
            <span>Total TTC</span>
            <span>{cartTotals.totalTtc.toFixed(2)}€</span>
          </div>
          <div className="flex justify-between text-sm text-orange-600 pt-1">
            <span>Marge affilié HT</span>
            <span>-{cartTotals.totalRetrocession.toFixed(2)}€</span>
          </div>
        </div>
      </div>
    </div>
  );
}
