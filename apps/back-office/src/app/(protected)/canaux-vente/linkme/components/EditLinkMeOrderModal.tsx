'use client';

import { cn } from '@verone/utils';
import { X, Edit, AlertCircle, Loader2, Save, Lock } from 'lucide-react';

import { EditOrderItemsList } from './edit-order-items-list';
import { useEditLinkMeOrder } from './use-edit-linkme-order';

interface EditLinkMeOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string | null;
}

/**
 * Modal d'edition de commande LinkMe
 * Permet de modifier: TVA, frais, notes, quantites, prix et marges (si draft)
 */
export function EditLinkMeOrderModal({
  isOpen,
  onClose,
  orderId,
}: EditLinkMeOrderModalProps) {
  const {
    order,
    isLoading,
    isEditable,
    items,
    totals,
    hasChanges,
    taxRate,
    setTaxRate,
    shippingCostHt,
    setShippingCostHt,
    insuranceCostHt,
    setInsuranceCostHt,
    handlingCostHt,
    setHandlingCostHt,
    internalNotes,
    setInternalNotes,
    updateOrder,
    updateQuantity,
    updateItemPrice,
    updateItemMarginRate,
    handleSave,
  } = useEditLinkMeOrder(orderId, onClose);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Edit className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Modifier la commande</h2>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-500">
                    {order?.order_number ?? 'Chargement...'}
                  </p>
                  {order?.status && (
                    <span
                      className={cn(
                        'text-xs px-2 py-0.5 rounded-full font-medium',
                        order.status === 'draft'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-gray-100 text-gray-600'
                      )}
                    >
                      {order.status === 'draft' ? 'Brouillon' : order.status}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : !order ? (
              <div className="text-center py-8 text-gray-500">
                Commande non trouvee
              </div>
            ) : (
              <>
                {/* Info lecture seule si pas draft */}
                {!isEditable && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                    <Lock className="h-4 w-4 text-amber-600 mt-0.5" />
                    <p className="text-sm text-amber-700">
                      Les prix sont verrouilles (commande{' '}
                      {order.status === 'validated' ? 'validee' : order.status}
                      ). Seuls les frais et notes sont modifiables.
                    </p>
                  </div>
                )}

                {/* Taux de TVA */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Taux de TVA
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { value: 0.2, label: '20%', desc: 'Standard' },
                      { value: 0.1, label: '10%', desc: 'Intermediaire' },
                      { value: 0.055, label: '5,5%', desc: 'Reduit' },
                      { value: 0, label: '0%', desc: 'Exonere' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setTaxRate(opt.value)}
                        className={cn(
                          'p-3 rounded-lg border-2 transition-all text-center',
                          taxRate === opt.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        )}
                      >
                        <span className="block text-lg font-semibold">
                          {opt.label}
                        </span>
                        <span className="text-xs text-gray-500">
                          {opt.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Frais additionnels */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Frais additionnels
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {/* Livraison */}
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Livraison HT
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={shippingCostHt ?? ''}
                          onChange={e =>
                            setShippingCostHt(
                              e.target.value ? parseFloat(e.target.value) : 0
                            )
                          }
                          placeholder="0.00"
                          className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                          EUR
                        </span>
                      </div>
                    </div>

                    {/* Manutention */}
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Manutention HT
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={handlingCostHt ?? ''}
                          onChange={e =>
                            setHandlingCostHt(
                              e.target.value ? parseFloat(e.target.value) : 0
                            )
                          }
                          placeholder="0.00"
                          className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                          EUR
                        </span>
                      </div>
                    </div>

                    {/* Assurance */}
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Assurance HT
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={insuranceCostHt ?? ''}
                          onChange={e =>
                            setInsuranceCostHt(
                              e.target.value ? parseFloat(e.target.value) : 0
                            )
                          }
                          placeholder="0.00"
                          className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                          EUR
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lignes de commande */}
                <EditOrderItemsList
                  items={items}
                  isEditable={isEditable}
                  onUpdateQuantity={updateQuantity}
                  onUpdateItemPrice={updateItemPrice}
                  onUpdateItemMarginRate={updateItemMarginRate}
                />

                {/* Notes */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Notes internes
                  </label>
                  <textarea
                    value={internalNotes}
                    onChange={e => setInternalNotes(e.target.value)}
                    placeholder="Notes visibles uniquement par l'equipe..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Totaux */}
                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Sous-total produits HT</span>
                    <span>{totals.productsHt.toFixed(2)} EUR</span>
                  </div>
                  {totals.feesHt > 0 && (
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Frais</span>
                      <span>{totals.feesHt.toFixed(2)} EUR</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Total HT</span>
                    <span className="font-medium">
                      {totals.totalHt.toFixed(2)} EUR
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>
                      TVA ({(taxRate * 100).toFixed(taxRate === 0.055 ? 1 : 0)}
                      %)
                    </span>
                    <span>
                      {(totals.totalTtc - totals.totalHt).toFixed(2)} EUR
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-semibold pt-2 border-t">
                    <span>Total TTC</span>
                    <span>{totals.totalTtc.toFixed(2)} EUR</span>
                  </div>
                  {/* Commission affilie */}
                  {totals.totalCommission > 0 && (
                    <div className="flex justify-between text-sm text-green-700 bg-green-50 px-2 py-1 rounded">
                      <span>Commission affilie totale</span>
                      <span className="font-medium">
                        {totals.totalCommission.toFixed(2)} EUR
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Erreur */}
            {updateOrder.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                <p className="text-sm text-red-700">
                  {updateOrder.error instanceof Error
                    ? updateOrder.error.message
                    : 'Erreur lors de la mise a jour'}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex-1">
              {hasChanges && (
                <span className="text-xs text-amber-600">
                  Modifications non enregistrees
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={() => {
                void handleSave().catch(error => {
                  console.error(
                    '[EditLinkMeOrderModal] handleSave failed:',
                    error
                  );
                });
              }}
              disabled={!hasChanges || updateOrder.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateOrder.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Enregistrer
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
