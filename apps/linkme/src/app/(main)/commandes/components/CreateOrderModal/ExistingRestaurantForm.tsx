'use client';

/**
 * ExistingRestaurantForm - Formulaire commande restaurant existant
 *
 * Orchestrateur: sélection + restaurant + contacts + catalogue + récapitulatif
 *
 * @module ExistingRestaurantForm
 * @since 2025-xx-xx
 * @updated 2026-04-14 - Refactoring: extraction sous-composants
 */

import { AlertCircle, ArrowLeft, Check, Loader2, X } from 'lucide-react';

import { ContactsSection } from '../../../../../components/ContactsSection';
import type { SelectionProduct } from '../../../../../lib/hooks/use-affiliate-orders';
import type { ContactFormData } from '../../../../../lib/hooks/use-organisation-contacts';
import { ConfirmOrderModal } from './ConfirmOrderModal';
import { SelectionAndRestaurantGrid } from './existing-restaurant/SelectionAndRestaurantGrid';
import { ProductCatalogWithCart } from './existing-restaurant/ProductCatalogWithCart';
import { OrderSummaryTable } from './existing-restaurant/OrderSummaryTable';
import type { CartItem, CartTotals } from './types';

interface Selection {
  id: string;
  name: string;
  products_count: number;
}

interface Customer {
  id: string;
  name: string;
  city?: string | null;
  email?: string | null;
  customer_type: 'organization' | 'individual';
}

interface Category {
  id: string;
  name: string;
  count: number;
}

interface SelectedCustomer {
  name?: string;
}

interface Props {
  isLoading: boolean;
  selections: Selection[] | undefined;
  selectedSelectionId: string | null;
  handleSelectionChange: (id: string) => void;
  selectedSelection: Selection | undefined;
  customers: Customer[] | undefined;
  customersLoading: boolean;
  selectedCustomerId: string | null;
  handleCustomerSelect: (
    id: string,
    type: 'organization' | 'individual'
  ) => void;
  setContactsComplete: React.Dispatch<React.SetStateAction<boolean>>;
  setPendingContacts: React.Dispatch<
    React.SetStateAction<{
      primaryContact: ContactFormData;
      billingContact: ContactFormData | null;
    } | null>
  >;
  products: SelectionProduct[] | undefined;
  productsLoading: boolean;
  productsError: Error | null;
  paginatedProducts: SelectionProduct[];
  filteredProducts: SelectionProduct[];
  categories: Category[];
  totalPages: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string | null;
  setSelectedCategory: (cat: string | null) => void;
  cart: CartItem[];
  cartTotals: CartTotals;
  notes: string;
  setNotes: (v: string) => void;
  canSubmitExisting: boolean;
  _selectedCustomer: SelectedCustomer | undefined;
  createOrderIsPending: boolean;
  updateContactsIsPending: boolean;
  showConfirmExistingModal: boolean;
  setShowConfirmExistingModal: React.Dispatch<React.SetStateAction<boolean>>;
  handleAddToCart: (product: SelectionProduct) => void;
  handleUpdateQuantity: (id: string, delta: number) => void;
  handleRemoveFromCart: (id: string) => void;
  handleSubmitExisting: () => Promise<void>;
  onBack: () => void;
  onClose: () => void;
}

export function ExistingRestaurantForm({
  isLoading,
  selections,
  selectedSelectionId,
  handleSelectionChange,
  selectedSelection,
  customers,
  customersLoading,
  selectedCustomerId,
  handleCustomerSelect,
  setContactsComplete,
  setPendingContacts,
  products,
  productsLoading,
  productsError,
  paginatedProducts,
  filteredProducts,
  categories,
  totalPages,
  currentPage,
  setCurrentPage,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  cart,
  cartTotals,
  notes,
  setNotes,
  canSubmitExisting,
  _selectedCustomer,
  createOrderIsPending,
  updateContactsIsPending,
  showConfirmExistingModal,
  setShowConfirmExistingModal,
  handleAddToCart,
  handleUpdateQuantity,
  handleRemoveFromCart,
  handleSubmitExisting,
  onBack,
  onClose,
}: Props) {
  return (
    <>
      <div className="fixed inset-0 z-50 overflow-hidden">
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <div className="absolute inset-4 md:inset-8 lg:inset-12 bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-600 to-blue-700">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Commande - Restaurant existant
                </h2>
                <p className="text-blue-100 text-sm">
                  Sélectionnez le restaurant et les produits
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
              </div>
            ) : (
              <div className="p-6 space-y-6">
                {/* Section 1: Sélection + Restaurant */}
                <SelectionAndRestaurantGrid
                  selections={selections}
                  selectedSelectionId={selectedSelectionId}
                  onSelectionChange={handleSelectionChange}
                  customers={customers}
                  customersLoading={customersLoading}
                  selectedCustomerId={selectedCustomerId}
                  onCustomerSelect={handleCustomerSelect}
                />

                {/* Section 2: Contacts */}
                {selectedCustomerId && (
                  <ContactsSection
                    organisationId={selectedCustomerId}
                    onContactsComplete={() => setContactsComplete(true)}
                    onContactsIncomplete={() => setContactsComplete(false)}
                    onContactsChange={setPendingContacts}
                  />
                )}

                {/* Section 3: Produits + Panier */}
                <ProductCatalogWithCart
                  selectedSelectionId={selectedSelectionId}
                  selectedSelection={selectedSelection}
                  products={products}
                  productsLoading={productsLoading}
                  productsError={productsError}
                  paginatedProducts={paginatedProducts}
                  filteredProducts={filteredProducts}
                  categories={categories}
                  totalPages={totalPages}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  cart={cart}
                  cartTotals={cartTotals}
                  notes={notes}
                  setNotes={setNotes}
                  onAddToCart={handleAddToCart}
                  onUpdateQuantity={handleUpdateQuantity}
                />

                {/* Section 4: Récapitulatif */}
                {cart.length > 0 && canSubmitExisting && (
                  <OrderSummaryTable
                    cart={cart}
                    cartTotals={cartTotals}
                    notes={notes}
                    onNotesChange={setNotes}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemoveFromCart={handleRemoveFromCart}
                  />
                )}

                {canSubmitExisting && (
                  <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-800">
                        Validation requise
                      </p>
                      <p className="text-sm text-amber-700 mt-0.5">
                        Votre commande sera envoyée à l&apos;équipe pour
                        validation.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-gray-700 hover:text-gray-900 font-medium transition-colors"
            >
              Annuler
            </button>
            <div className="flex items-center gap-4">
              {cart.length > 0 && (
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}{' '}
                    article(s)
                  </p>
                  <p className="font-semibold text-gray-900">
                    {cartTotals.totalTtc.toFixed(2)} € TTC
                  </p>
                </div>
              )}
              <button
                onClick={() => setShowConfirmExistingModal(true)}
                disabled={
                  !canSubmitExisting ||
                  createOrderIsPending ||
                  updateContactsIsPending
                }
                className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
              >
                {createOrderIsPending || updateContactsIsPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Check className="h-5 w-5" />
                )}
                Créer la commande
              </button>
            </div>
          </div>
        </div>
      </div>

      {showConfirmExistingModal && (
        <ConfirmOrderModal
          title="Confirmer la commande ?"
          restaurantName={_selectedCustomer?.name ?? 'Restaurant selectionné'}
          cart={cart}
          cartTotals={cartTotals}
          isPending={createOrderIsPending}
          onClose={() => setShowConfirmExistingModal(false)}
          onConfirm={() => {
            setShowConfirmExistingModal(false);
            void handleSubmitExisting().catch(error => {
              console.error(
                '[CreateOrderModal] Submit existing failed:',
                error
              );
            });
          }}
        />
      )}
    </>
  );
}
