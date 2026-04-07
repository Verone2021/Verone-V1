'use client';

import Link from 'next/link';
import { ArrowLeft, AlertCircle, Package } from 'lucide-react';

import { useCheckout } from './hooks';
import { BillingSection } from './components/BillingSection';
import { CheckoutHeader } from './components/CheckoutHeader';
import { ContactSection } from './components/ContactSection';
import { OrderSummary } from './components/OrderSummary';
import { PaymentSection } from './components/PaymentSection';
import { ShippingSection } from './components/ShippingSection';

export default function CheckoutPage() {
  const {
    items,
    itemCount,
    totalHT,
    totalTVA,
    finalTotal,
    formData,
    isSubmitting,
    paymentError,
    revolutLoaded,
    updateFormData,
    handleShippingAddressSelect,
    handleBillingAddressSelect,
    handleSubmit,
  } = useCheckout();

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">
          Votre panier est vide
        </h1>
        <p className="text-gray-600 mb-6 text-sm">
          Ajoutez des produits à votre panier pour passer commande.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Découvrir nos sélections
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CheckoutHeader />

      <div className="max-w-6xl mx-auto px-4 py-6">
        {paymentError && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-800 font-medium text-sm">
                Erreur de paiement
              </p>
              <p className="text-red-600 text-xs">{paymentError}</p>
            </div>
          </div>
        )}

        <div className="lg:grid lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-7">
            <form
              onSubmit={e => {
                void handleSubmit(e).catch(error => {
                  console.error('[Checkout] Submit failed:', error);
                });
              }}
              className="space-y-4"
            >
              <ContactSection
                formData={formData}
                updateFormData={updateFormData}
              />
              <ShippingSection
                formData={formData}
                updateFormData={updateFormData}
                onAddressSelect={handleShippingAddressSelect}
              />
              <BillingSection
                formData={formData}
                updateFormData={updateFormData}
                onAddressSelect={handleBillingAddressSelect}
              />
              <PaymentSection
                isSubmitting={isSubmitting}
                revolutLoaded={revolutLoaded}
                finalTotal={finalTotal}
              />
            </form>
          </div>

          <div className="lg:col-span-5 mt-6 lg:mt-0">
            <OrderSummary
              items={items}
              itemCount={itemCount}
              totalHT={totalHT}
              totalTVA={totalTVA}
              finalTotal={finalTotal}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
