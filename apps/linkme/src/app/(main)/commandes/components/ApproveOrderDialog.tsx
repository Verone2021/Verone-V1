/**
 * Dialog: ApproveOrderDialog
 * Confirmation avant approbation d'une commande en attente
 *
 * Design cohérent avec LinkMe (couleurs teal)
 * Affiche les informations clés de la commande
 *
 * @module ApproveOrderDialog
 * @since 2026-01-10
 */

'use client';

import { X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

import type { LinkMeOrder } from '../../../../hooks/use-linkme-orders';

interface ApproveOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  order: LinkMeOrder | null;
  isLoading: boolean;
  error?: string;
}

export function ApproveOrderDialog({
  isOpen,
  onClose,
  onConfirm,
  order,
  isLoading,
  error,
}: ApproveOrderDialogProps): JSX.Element | null {
  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-teal-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-100 rounded-full">
              <CheckCircle2 className="h-5 w-5 text-teal-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Approuver la commande
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isLoading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-gray-600">
            Voulez-vous approuver la commande suivante ?
          </p>

          {/* Informations commande */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Numéro</span>
              <span className="font-semibold text-gray-900">
                {order.order_number}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Client</span>
              <span className="font-medium text-gray-900">
                {order.customer_name}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Total TTC</span>
              <span className="font-semibold text-gray-900">
                {order.total_ttc.toFixed(2)} EUR
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Commission</span>
              <span className="font-semibold text-emerald-600">
                +{order.total_affiliate_margin.toFixed(2)} EUR
              </span>
            </div>
          </div>

          {/* Info synchronisation */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
            <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-700">
              Cette approbation sera synchronisée avec le back-office Verone.
            </p>
          </div>

          {/* Erreur */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isLoading}
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-teal-500 hover:bg-teal-600 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Approbation...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Approuver
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ApproveOrderDialog;
