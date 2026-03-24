import Image from 'next/image';
import {
  Loader2,
  Package,
  User,
  UserCircle,
  Store,
  Truck,
  Check,
  ChevronLeft,
  CheckCircle,
  Mail,
  Calendar,
  Clock,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { Checkbox, cn } from '@verone/ui';

import type { InlineConfirmationProps } from './types';

function formatCurrency(value: number): string {
  return value.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function InlineConfirmation({
  onBack,
  onConfirm,
  isSubmitting,
  termsAccepted,
  onTermsChange,
  requesterName,
  requesterEmail,
  restaurantName,
  isNewRestaurant,
  responsableName,
  cart,
  itemsCount,
  totalHT,
  totalTVA,
  totalTTC,
  hasDeliveryDate,
  deliveryAsap,
  deliveryAddress,
  selectionName,
  faqUrl,
}: InlineConfirmationProps) {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-6 border-b bg-gradient-to-b from-green-50 to-transparent rounded-t-xl -mx-6 -mt-6 px-8 pt-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="h-7 w-7 text-green-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Confirmer votre commande
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Verifiez attentivement le recapitulatif ci-dessous avant de
              valider votre commande.
            </p>
          </div>
        </div>
      </div>

      {/* Demandeur */}
      <div className="flex items-center gap-3 pb-3 border-b">
        <User className="h-5 w-5 text-gray-400" />
        <div className="flex-1">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
            Demandeur
          </p>
          <p className="text-sm font-semibold text-gray-900">{requesterName}</p>
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
          {selectionName && (
            <p className="text-xs text-gray-500">Selection : {selectionName}</p>
          )}
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
          <UserCircle className="h-5 w-5 text-gray-400" />
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

      {/* Articles — Detail */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Package className="h-5 w-5 text-gray-400" />
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium flex-1">
            Articles commandes
          </p>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            {itemsCount} article{itemsCount > 1 ? 's' : ''}
          </span>
        </div>
        <div className="bg-gray-50 rounded-lg divide-y divide-gray-100">
          {cart.map(item => (
            <div key={item.id} className="flex items-center gap-3 px-4 py-3">
              {item.product_image ? (
                <Image
                  src={item.product_image}
                  alt={item.product_name}
                  width={40}
                  height={40}
                  className="rounded-md object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 bg-gray-200 rounded-md flex items-center justify-center flex-shrink-0">
                  <Package className="h-4 w-4 text-gray-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {item.product_name}
                </p>
                <p className="text-xs text-gray-500">{item.product_sku}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-medium text-gray-900">
                  {formatCurrency(item.selling_price_ttc * item.quantity)}{' '}
                  &euro;
                </p>
                <p className="text-xs text-gray-500">
                  {item.quantity} x {formatCurrency(item.selling_price_ttc)}{' '}
                  &euro;
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Livraison */}
      {deliveryAddress && (
        <div className="flex items-start gap-3 pb-3 border-b">
          <Truck className="h-5 w-5 text-gray-400 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
              Livraison
            </p>
            <p className="text-sm text-gray-900 mt-1">{deliveryAddress}</p>
            {deliveryAsap && (
              <span className="inline-flex items-center gap-1.5 mt-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                <Clock className="h-3 w-3" />
                Des que possible
              </span>
            )}
          </div>
        </div>
      )}

      {/* Totals */}
      <div className="bg-gray-50 rounded-xl p-5 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Total HT</span>
          <span className="font-medium text-gray-900">
            {formatCurrency(totalHT)} &euro;
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">TVA (20%)</span>
          <span className="font-medium text-gray-900">
            {formatCurrency(totalTVA)} &euro;
          </span>
        </div>
        <div className="flex justify-between pt-3 border-t border-gray-200">
          <span className="text-base font-bold text-gray-900">Total TTC</span>
          <span className="text-2xl font-bold text-gray-900">
            {formatCurrency(totalTTC)} &euro;
          </span>
        </div>
      </div>

      {/* Transport Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Truck className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-semibold mb-1">Frais de transport non inclus</p>
            <p className="leading-relaxed">
              Le montant ci-dessus correspond uniquement aux produits. Les frais
              de transport seront calcules en fonction de vos informations de
              livraison et vous seront communiques dans le devis detaille.
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

      {/* Prochaines etapes */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-5">
        <p className="text-sm font-semibold text-green-900 mb-4">
          Prochaines etapes
        </p>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check className="h-3.5 w-3.5 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-green-900">
                Commande recue
              </p>
              <p className="text-xs text-green-700">
                Votre commande sera enregistree des validation
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-green-200 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Clock className="h-3.5 w-3.5 text-green-700" />
            </div>
            <div>
              <p className="text-sm font-medium text-green-900">
                Validation sous 24h
              </p>
              <p className="text-xs text-green-700">
                Notre equipe verifie et valide votre commande sous 24h ouvrees
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-green-200 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Mail className="h-3.5 w-3.5 text-green-700" />
            </div>
            <div>
              <p className="text-sm font-medium text-green-900">
                Devis detaille par email
              </p>
              <p className="text-xs text-green-700">
                Vous recevrez un devis incluant les frais de transport a{' '}
                <span className="font-medium">{requesterEmail}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Email Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <Mail className="h-5 w-5 text-blue-600 flex-shrink-0" />
          <p className="text-sm text-blue-800">
            Un email de confirmation avec le recapitulatif de votre commande
            sera envoye a{' '}
            <span className="font-semibold">{requesterEmail}</span>
          </p>
        </div>
      </div>

      {/* FAQ Link */}
      <a
        href={faqUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors group"
      >
        <HelpCircle className="h-5 w-5 text-gray-400 group-hover:text-gray-600 flex-shrink-0" />
        <span className="text-sm text-gray-600 group-hover:text-gray-800 flex-1">
          Des questions ? Consultez notre FAQ
        </span>
        <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
      </a>

      {/* Conditions */}
      <div className="flex items-start gap-3">
        <Checkbox
          id="inlineTermsAccepted"
          checked={termsAccepted}
          onCheckedChange={(checked: boolean) => onTermsChange(checked)}
          disabled={isSubmitting}
        />
        <label
          htmlFor="inlineTermsAccepted"
          className="text-xs text-gray-600 cursor-pointer leading-relaxed"
        >
          Je confirme que les informations ci-dessus sont exactes et
          j&apos;accepte les conditions generales de vente ainsi que les
          modalites de livraison. Je comprends que cette commande necessite une
          validation par l&apos;equipe Verone sous 24h ouvrees.
        </label>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="flex-1 py-2.5 px-6 border border-gray-300 rounded-lg font-medium text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors flex items-center justify-center gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Retour
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isSubmitting || !termsAccepted}
          className={cn(
            'flex-1 py-2.5 px-8 text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2',
            'bg-green-600 hover:bg-green-700 text-white',
            (!termsAccepted || isSubmitting) && 'opacity-50 cursor-not-allowed'
          )}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Envoi en cours...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4" />
              Confirmer la commande
            </>
          )}
        </button>
      </div>
    </div>
  );
}
