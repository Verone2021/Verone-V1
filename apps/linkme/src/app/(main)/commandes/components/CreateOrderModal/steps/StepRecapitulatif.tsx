'use client';

import { calculateMargin } from '@verone/utils';
import { AlertCircle, FileText, ShoppingCart, Store, User } from 'lucide-react';

import type { CartItem, NewRestaurantFormState } from '../types';

interface CartTotals {
  totalHt: number;
  totalTtc: number;
  totalMargin: number;
  totalTva: number;
  tvaDetails: { rate: number; amount: number }[];
}

interface Requester {
  type: string;
  name: string;
  email: string;
  phone: string;
  position: string | null;
}

interface Props {
  form: NewRestaurantFormState;
  requester: Requester;
  cart: CartItem[];
  cartTotals: CartTotals;
  notes: string;
  setNotes: (v: string) => void;
}

export function StepRecapitulatif({
  form,
  requester,
  cart,
  cartTotals,
  notes,
  setNotes,
}: Props) {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Récapitulatif de la commande
      </h3>

      {/* Récap Restaurant */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-2">
        <h4 className="font-medium text-gray-900 flex items-center gap-2">
          <Store className="h-4 w-4 text-green-600" />
          Restaurant
        </h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Nom commercial</p>
            <p className="font-medium">{form.tradeName}</p>
          </div>
          <div>
            <p className="text-gray-500">Type</p>
            <p className="font-medium capitalize">
              {form.ownerType === 'franchise' ? 'Franchisé' : 'Propre'}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-gray-500">Adresse de livraison</p>
            <p className="font-medium">
              {form.address}, {form.postalCode} {form.city}
            </p>
          </div>
        </div>
      </div>

      {/* Récap Demandeur */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
        <h4 className="font-medium text-gray-900 flex items-center gap-2">
          <User className="h-4 w-4 text-blue-600" />
          Demandeur de la commande
        </h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Nom complet</p>
            <p className="font-medium">{requester.name}</p>
          </div>
          <div>
            <p className="text-gray-500">Email</p>
            <p className="font-medium">{requester.email}</p>
          </div>
          {requester.phone && (
            <div>
              <p className="text-gray-500">Téléphone</p>
              <p className="font-medium">{requester.phone}</p>
            </div>
          )}
        </div>
        <div className="mt-2 p-2 bg-blue-100 rounded text-xs text-blue-700">
          ℹ️ Cette personne sera enregistrée comme le demandeur de la commande
        </div>
      </div>

      {/* Récap Propriétaire */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-2">
        <h4 className="font-medium text-gray-900 flex items-center gap-2">
          <User className="h-4 w-4 text-green-600" />
          Propriétaire
        </h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Nom complet</p>
            <p className="font-medium">
              {form.ownerFirstName} {form.ownerLastName}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Email</p>
            <p className="font-medium">{form.ownerEmail}</p>
          </div>
          {form.ownerPhone && (
            <div>
              <p className="text-gray-500">Téléphone</p>
              <p className="font-medium">{form.ownerPhone}</p>
            </div>
          )}
          {form.ownerType === 'franchise' && form.ownerCompanyName && (
            <div>
              <p className="text-gray-500">Raison sociale</p>
              <p className="font-medium">{form.ownerCompanyName}</p>
            </div>
          )}
        </div>
      </div>

      {/* Récap Facturation */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-2">
        <h4 className="font-medium text-gray-900 flex items-center gap-2">
          <FileText className="h-4 w-4 text-green-600" />
          Facturation
        </h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          {form.ownerType === 'franchise' && (
            <div>
              <p className="text-gray-500">Dénomination sociale</p>
              <p className="font-medium">{form.billingCompanyName || '-'}</p>
            </div>
          )}
          <div>
            <p className="text-gray-500">SIRET</p>
            <p className="font-medium font-mono">{form.billingSiret || '-'}</p>
          </div>
          <div className="col-span-2">
            <p className="text-gray-500">Adresse de facturation</p>
            <p className="font-medium">
              {form.billingUseSameAddress
                ? `${form.address}, ${form.postalCode} ${form.city}`
                : `${form.billingAddress}, ${form.billingPostalCode} ${form.billingCity}`}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-gray-500">Contact facturation</p>
            <p className="font-medium">
              {form.billingSameAsOwner
                ? `${form.ownerFirstName} ${form.ownerLastName} - ${form.ownerEmail}`
                : `${form.billingFirstName} ${form.billingLastName} - ${form.billingEmail}`}
            </p>
          </div>
        </div>
      </div>

      {/* Récap Panier */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-green-600" />
            Panier ({cart.reduce((sum, item) => sum + item.quantity, 0)} article
            {cart.reduce((sum, item) => sum + item.quantity, 0) > 1 ? 's' : ''})
          </h4>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-2 text-left">Produit</th>
              <th className="px-4 py-2 text-center">Qté</th>
              <th className="px-4 py-2 text-right">Prix unit.</th>
              <th className="px-4 py-2 text-right">Total HT</th>
              <th className="px-4 py-2 text-right">Marge</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {cart.map(item => {
              const lineHt = item.quantity * item.unitPriceHt;
              const { gainEuros } = calculateMargin({
                basePriceHt: item.basePriceHt,
                marginRate: item.marginRate,
              });
              const lineMargin = gainEuros * item.quantity;
              return (
                <tr key={item.selectionItemId}>
                  <td className="px-4 py-2">
                    <p className="font-medium text-gray-900">
                      {item.productName}
                    </p>
                    <p className="text-xs text-gray-500">{item.productSku}</p>
                  </td>
                  <td className="px-4 py-2 text-center">{item.quantity}</td>
                  <td className="px-4 py-2 text-right">
                    {item.unitPriceHt.toFixed(2)} €
                  </td>
                  <td className="px-4 py-2 text-right font-medium">
                    {lineHt.toFixed(2)} €
                  </td>
                  <td className="px-4 py-2 text-right text-green-600">
                    +{lineMargin.toFixed(2)} €
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="px-4 py-3 bg-gray-50 border-t">
          <div className="flex justify-end">
            <div className="w-64 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total HT</span>
                <span className="font-medium">
                  {cartTotals.totalHt.toFixed(2)} €
                </span>
              </div>
              {cartTotals.tvaDetails.map(tva => (
                <div
                  key={tva.rate}
                  className="flex justify-between text-gray-500"
                >
                  <span>TVA ({(tva.rate * 100).toFixed(0)}%)</span>
                  <span>{tva.amount.toFixed(2)} €</span>
                </div>
              ))}
              <div className="flex justify-between font-bold text-base pt-1 border-t">
                <span>Total TTC</span>
                <span>{cartTotals.totalTtc.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-green-600 pt-1 border-t">
                <span className="font-medium">Votre commission</span>
                <span className="font-bold">
                  +{cartTotals.totalMargin.toFixed(2)} €
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes (optionnel)
        </label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Instructions spéciales..."
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
        />
      </div>

      {notes && notes.trim() !== '' && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
          <h4 className="text-xs font-medium text-blue-700 uppercase tracking-wide flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Aperçu de vos notes
          </h4>
          <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
            {notes}
          </p>
        </div>
      )}

      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-amber-800">Validation requise</p>
          <p className="text-sm text-amber-700 mt-0.5">
            Votre commande sera envoyée à l'équipe pour validation avant
            traitement.
          </p>
        </div>
      </div>
    </div>
  );
}
