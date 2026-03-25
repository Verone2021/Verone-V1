import Image from 'next/image';
import {
  Package,
  ShoppingCart,
  Plus,
  Minus,
  AlertCircle,
  Check,
  Trash2,
} from 'lucide-react';

import type { Step6Props } from './types';

export function OpeningStep6Validation({
  data,
  errors,
  updateData,
  cart,
  cartTotals,
  formatPrice,
  onUpdateQuantity,
  onRemoveItem,
  onOpenConfirmation,
}: Step6Props) {
  return (
    <div className="space-y-6">
      {/* Récapitulatif panier */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Récapitulatif de votre commande
        </h3>

        {cart.length === 0 ? (
          <div className="p-8 text-center bg-gray-50 rounded-lg border border-gray-200">
            <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Votre panier est vide</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="text-xs text-gray-500 uppercase">
                  <th className="px-4 py-3 text-left font-medium">Produit</th>
                  <th className="px-4 py-3 text-center font-medium w-32">
                    Quantité
                  </th>
                  <th className="px-4 py-3 text-right font-medium w-28">
                    Prix unit. HT
                  </th>
                  <th className="px-4 py-3 text-right font-medium w-28">
                    Total TTC
                  </th>
                  {onRemoveItem && <th className="px-4 py-3 w-12" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cart.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                          {item.product_image ? (
                            <Image
                              src={item.product_image}
                              alt={item.product_name}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {item.product_name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {item.product_sku}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {onUpdateQuantity ? (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateQuantity(item.id, item.quantity - 1)
                            }
                            disabled={item.quantity <= 1}
                            className="p-1.5 rounded-lg border hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            <Minus className="h-4 w-4 text-gray-600" />
                          </button>
                          <span className="w-8 text-center font-medium text-gray-900">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateQuantity(item.id, item.quantity + 1)
                            }
                            className="p-1.5 rounded-lg border hover:bg-gray-100 transition-colors"
                          >
                            <Plus className="h-4 w-4 text-gray-600" />
                          </button>
                        </div>
                      ) : (
                        <div className="text-center font-medium text-gray-900">
                          {item.quantity}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {formatPrice(item.selling_price_ht)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {formatPrice(item.selling_price_ttc * item.quantity)}
                    </td>
                    {onRemoveItem && (
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.id)}
                          className="p-1.5 rounded-lg hover:bg-red-100 transition-colors text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t">
                <tr>
                  <td
                    colSpan={2}
                    className="px-4 py-3 text-right text-sm text-gray-500"
                  >
                    Sous-total HT
                  </td>
                  <td
                    colSpan={onRemoveItem ? 3 : 2}
                    className="px-4 py-3 text-right font-medium"
                  >
                    {formatPrice(cartTotals.totalHt)}
                  </td>
                </tr>
                <tr>
                  <td
                    colSpan={2}
                    className="px-4 py-2 text-right text-sm text-gray-500"
                  >
                    TVA
                  </td>
                  <td
                    colSpan={onRemoveItem ? 3 : 2}
                    className="px-4 py-2 text-right font-medium"
                  >
                    {formatPrice(cartTotals.totalTva)}
                  </td>
                </tr>
                <tr className="text-lg">
                  <td
                    colSpan={2}
                    className="px-4 py-3 text-right font-semibold text-gray-900"
                  >
                    Total TTC
                  </td>
                  <td
                    colSpan={onRemoveItem ? 3 : 2}
                    className="px-4 py-3 text-right font-bold text-blue-600"
                  >
                    {formatPrice(cartTotals.totalTtc)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Conditions */}
      <div className="p-4 bg-gray-50 rounded-lg border">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="deliveryTerms"
            checked={data.deliveryTermsAccepted}
            onChange={e =>
              updateData({ deliveryTermsAccepted: e.target.checked })
            }
            className={`h-4 w-4 text-blue-600 rounded mt-0.5 ${
              errors.deliveryTermsAccepted
                ? 'border-red-500'
                : 'border-gray-300'
            }`}
          />
          <label htmlFor="deliveryTerms" className="text-sm text-gray-700">
            J'accepte les{' '}
            <a href="#" className="text-blue-600 hover:underline">
              modalités de livraison
            </a>{' '}
            et confirme que les informations fournies sont exactes. La commande
            sera traitée après validation par l'équipe Verone.
          </label>
        </div>
        {errors.deliveryTermsAccepted && (
          <p className="mt-2 text-xs text-red-600">
            {errors.deliveryTermsAccepted}
          </p>
        )}
      </div>

      {errors.cart && <p className="text-sm text-red-600">{errors.cart}</p>}
      {errors.submit && <p className="text-sm text-red-600">{errors.submit}</p>}

      {/* Info validation */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-amber-800">Validation requise</p>
          <p className="text-sm text-amber-700 mt-0.5">
            Cette commande sera envoyée à l'équipe pour validation avant
            traitement. Vous recevrez un email pour compléter les informations
            de livraison.
          </p>
        </div>
      </div>

      {/* Bouton valider */}
      <div className="flex justify-center pt-4">
        <button
          type="button"
          onClick={onOpenConfirmation}
          disabled={cart.length === 0}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          <Check className="h-5 w-5" />
          Valider le panier
        </button>
      </div>
    </div>
  );
}
