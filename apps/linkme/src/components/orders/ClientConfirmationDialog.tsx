'use client';

/**
 * ClientConfirmationDialog — Modal de confirmation formulaire client
 *
 * Design pro identique au formulaire utilisateur (OrderConfirmationDialog).
 * Utilise AlertDialog Radix, max-w-2xl, encart transport amber, email bleu.
 *
 * @module ClientConfirmationDialog
 * @since 2026-03-14
 */

import { useState } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  Checkbox,
  cn,
} from '@verone/ui';
import {
  CheckCircle,
  Store,
  Package,
  User,
  Truck,
  Mail,
  Loader2,
  Calendar,
} from 'lucide-react';

interface ClientConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isSubmitting: boolean;
  // Demandeur
  requesterName: string;
  requesterEmail: string;
  // Restaurant
  restaurantName: string;
  isNewRestaurant: boolean;
  // Responsable
  responsableName: string;
  // Panier
  itemsCount: number;
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  // Livraison
  hasDeliveryDate: boolean;
  deliveryAsap: boolean;
  deliveryAddress: string;
}

function formatCurrency(value: number): string {
  return value.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function ClientConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  isSubmitting,
  requesterName,
  requesterEmail,
  restaurantName,
  isNewRestaurant,
  responsableName,
  itemsCount,
  totalHT,
  totalTVA,
  totalTTC,
  hasDeliveryDate,
  deliveryAsap,
  deliveryAddress,
}: ClientConfirmationDialogProps) {
  const [termsAccepted, setTermsAccepted] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        className={cn(
          'max-w-2xl p-0 gap-0 overflow-hidden max-h-[90vh] overflow-y-auto',
          'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95'
        )}
      >
        {/* Header */}
        <AlertDialogHeader className="px-8 pt-8 pb-6 border-b bg-gradient-to-b from-green-50 to-white">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="h-7 w-7 text-green-600" />
            </div>
            <div>
              <AlertDialogTitle className="text-xl font-bold text-gray-900">
                Confirmer votre commande
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-gray-600 mt-1">
                Verifiez le recapitulatif ci-dessous avant de valider.
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        {/* Body */}
        <div className="px-8 py-6 space-y-6">
          {/* Demandeur */}
          <div className="flex items-center gap-3 pb-3 border-b">
            <User className="h-5 w-5 text-gray-400" />
            <div className="flex-1">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                Demandeur
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {requesterName}
              </p>
              <p className="text-xs text-gray-500">{requesterEmail}</p>
            </div>
          </div>

          {/* Restaurant */}
          <div className="flex items-center gap-3 pb-3 border-b">
            <Store className="h-5 w-5 text-gray-400" />
            <div className="flex-1">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                Restaurant
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {restaurantName}
              </p>
            </div>
            {isNewRestaurant && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                Nouveau
              </span>
            )}
          </div>

          {/* Responsable */}
          {responsableName && (
            <div className="flex items-center gap-3 pb-3 border-b">
              <User className="h-5 w-5 text-gray-400" />
              <div className="flex-1">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                  Responsable
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  {responsableName}
                </p>
              </div>
            </div>
          )}

          {/* Articles + Totaux */}
          <div className="flex items-center gap-3 pb-3 border-b">
            <Package className="h-5 w-5 text-gray-400" />
            <div className="flex-1">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                Articles
              </p>
            </div>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
              {itemsCount} article{itemsCount > 1 ? 's' : ''}
            </span>
          </div>

          {/* Livraison */}
          {deliveryAddress && (
            <div className="flex items-center gap-3 pb-3 border-b">
              <Truck className="h-5 w-5 text-gray-400" />
              <div className="flex-1">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                  Livraison
                </p>
                <p className="text-sm text-gray-900">{deliveryAddress}</p>
                {deliveryAsap && (
                  <p className="text-xs text-green-600 font-medium mt-0.5">
                    Des que possible
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Totals */}
          <div className="bg-gray-50 rounded-xl p-5 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total HT</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(totalHT)} €
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">TVA (20%)</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(totalTVA)} €
              </span>
            </div>
            <div className="flex justify-between pt-3 border-t border-gray-200">
              <span className="text-base font-bold text-gray-900">
                Total TTC
              </span>
              <span className="text-2xl font-bold text-gray-900">
                {formatCurrency(totalTTC)} €
              </span>
            </div>
          </div>

          {/* Transport Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Truck className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-semibold mb-1">
                  Frais de transport non inclus
                </p>
                <p className="leading-relaxed">
                  Le montant ci-dessus correspond uniquement aux produits. Les
                  frais de transport seront calcules en fonction de vos
                  informations de livraison et vous seront communiques dans le
                  devis detaille.
                </p>
                {!hasDeliveryDate && !deliveryAsap && (
                  <div className="flex items-center gap-2 mt-2 text-amber-900 font-medium">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Pensez a indiquer votre date de livraison souhaitee pour
                      permettre l&apos;estimation du transport.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Email Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <p className="text-sm text-blue-800">
                Un email de confirmation sera envoye a{' '}
                <span className="font-semibold">{requesterEmail}</span>
              </p>
            </div>
          </div>

          {/* Conditions */}
          <div className="flex items-start gap-3">
            <Checkbox
              id="clientTermsAccepted"
              checked={termsAccepted}
              onCheckedChange={(checked: boolean) => setTermsAccepted(checked)}
              disabled={isSubmitting}
            />
            <label
              htmlFor="clientTermsAccepted"
              className="text-xs text-gray-600 cursor-pointer leading-relaxed"
            >
              Je confirme que les informations ci-dessus sont exactes et
              j&apos;accepte les conditions generales de vente ainsi que les
              modalites de livraison. Je comprends que cette commande necessite
              une validation par l&apos;equipe Verone.
            </label>
          </div>
        </div>

        {/* Footer */}
        <AlertDialogFooter className="px-8 py-5 border-t bg-gray-50 gap-3 sm:gap-3">
          <AlertDialogCancel
            disabled={isSubmitting}
            className="px-6 py-2.5 text-sm"
          >
            Annuler
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={e => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isSubmitting || !termsAccepted}
            className={cn(
              'px-8 py-2.5 text-sm font-semibold',
              'bg-green-600 hover:bg-green-700 focus:ring-green-600',
              'text-white rounded-lg transition-colors',
              (!termsAccepted || isSubmitting) &&
                'opacity-50 cursor-not-allowed'
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Envoi en cours...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirmer la commande
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
