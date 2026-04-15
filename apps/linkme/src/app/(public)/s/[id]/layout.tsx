'use client';

import { useRouter } from 'next/navigation';

import { ShoppingCart } from 'lucide-react';

import { OrderFormUnified } from '@/components/OrderFormUnified';
import type { CartItem as UnifiedCartItem } from '@/components/OrderFormUnified';
import { SelectionHero } from '@/components/public-selection';

import {
  SelectionContext,
  type SelectionContextValue,
} from './selection-context';
import { useSelectionLayout } from './use-selection-layout';
import { OrderConfirmationModal } from './OrderConfirmationModal';

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(price);
}

interface SelectionLayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export default function SelectionLayout({
  children,
  params,
}: SelectionLayoutProps) {
  const router = useRouter();

  const {
    id,
    pathname,
    selection,
    items,
    branding,
    cart,
    setCart,
    isLoading,
    error,
    isOrderFormOpen,
    setIsOrderFormOpen,
    orderNumber,
    setOrderNumber,
    submittedOrderData,
    setSubmittedOrderData,
    affiliateInfo,
    organisations,
    isSubmitting,
    cartCount,
    priceDisplayMode,
    cartTotal,
    categories,
    tabs,
    addToCart,
    updateQuantity,
    removeFromCart,
    handleOrderSubmit,
  } = useSelectionLayout(params);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (error || !selection) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {error ?? 'Selection non trouvee'}
          </h1>
          <p className="text-gray-600">Verifiez l&apos;URL et reessayez.</p>
        </div>
      </div>
    );
  }

  const contextValue: SelectionContextValue = {
    selection,
    items,
    branding,
    cart,
    affiliateInfo,
    organisations,
    categories,
    isLoading,
    error,
    addToCart,
    updateQuantity,
    removeFromCart,
    setCart,
  };

  return (
    <SelectionContext.Provider value={contextValue}>
      <div
        className="min-h-screen"
        style={{ backgroundColor: branding.background_color }}
      >
        {/* Simple Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 py-4">
            <h1
              className="text-2xl font-bold"
              style={{ color: branding.text_color }}
            >
              {selection.name}
            </h1>
          </div>
        </header>

        <SelectionHero
          name={selection.name}
          description={selection.description}
          imageUrl={selection.image_url}
          branding={branding}
          productCount={items.length}
        />

        {/* Navigation Tabs */}
        <div className="sticky top-0 z-30 bg-white border-b shadow-sm">
          <div className="container mx-auto px-4">
            <nav className="flex space-x-8">
              {tabs.map(tab => {
                const isActive = pathname === tab.href;
                return (
                  <button
                    key={tab.href}
                    onClick={() => router.push(tab.href)}
                    className={`py-4 px-2 font-medium text-sm transition-colors relative ${
                      isActive
                        ? 'text-gray-900'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.label}
                    {isActive && (
                      <div
                        className="absolute bottom-0 left-0 right-0 h-0.5"
                        style={{ backgroundColor: branding.primary_color }}
                      />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Page Content */}
        <main>{children}</main>

        {/* Floating Cart Button */}
        {cartCount > 0 && (
          <button
            onClick={() => setIsOrderFormOpen(true)}
            className="fixed bottom-6 right-6 z-40 text-white px-6 py-4 rounded-full shadow-lg transition-all flex items-center gap-3 hover:opacity-90"
            style={{ backgroundColor: branding.primary_color }}
          >
            <ShoppingCart className="h-5 w-5" />
            <span className="font-medium">
              {cartCount} article{cartCount > 1 ? 's' : ''}
            </span>
            <span className="font-bold">
              {formatPrice(cartTotal)} {priceDisplayMode}
            </span>
          </button>
        )}

        {/* Order Form Modal */}
        {isOrderFormOpen && (
          <div className="fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setIsOrderFormOpen(false)}
            />
            <div className="absolute inset-4 md:inset-8 lg:inset-12 bg-white rounded-2xl shadow-2xl overflow-hidden">
              {orderNumber ? (
                <OrderConfirmationModal
                  orderNumber={orderNumber}
                  submittedOrderData={submittedOrderData}
                  branding={branding}
                  onClose={() => {
                    setOrderNumber(null);
                    setSubmittedOrderData(null);
                    setIsOrderFormOpen(false);
                    setCart([]);
                  }}
                />
              ) : (
                <OrderFormUnified
                  affiliateId={selection.affiliate_id}
                  selectionId={selection.id}
                  selectionName={selection.name}
                  selectionSlug={id}
                  cart={cart.map(
                    (item): UnifiedCartItem => ({
                      id: item.id,
                      product_id: item.product_id,
                      product_name: item.product_name,
                      product_sku: item.product_sku,
                      product_image: item.product_image,
                      selling_price_ht: item.selling_price_ht,
                      selling_price_ttc: item.selling_price_ttc,
                      margin_rate: item.margin_rate,
                      quantity: item.quantity,
                    })
                  )}
                  organisations={organisations}
                  onSubmit={handleOrderSubmit}
                  onClose={() => setIsOrderFormOpen(false)}
                  isSubmitting={isSubmitting}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </SelectionContext.Provider>
  );
}
