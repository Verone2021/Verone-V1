'use client';

import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  Loader2,
  ShoppingCart,
  Store,
  User,
  X,
} from 'lucide-react';

import type { CartItem, NewRestaurantFormState } from './types';
import { ConfirmOrderModal } from './ConfirmOrderModal';
import { StepFacturation } from './steps/StepFacturation';
import { StepProduits } from './steps/StepProduits';
import { StepProprietaire } from './steps/StepProprietaire';
import { StepRecapitulatif } from './steps/StepRecapitulatif';
import { StepRestaurant } from './steps/StepRestaurant';
import type { SelectionProduct } from '../../../../../lib/hooks/use-affiliate-orders';

interface Selection {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  count: number;
}

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
  newRestaurantStep: number;
  setNewRestaurantStep: React.Dispatch<React.SetStateAction<number>>;
  newRestaurantForm: NewRestaurantFormState;
  setNewRestaurantForm: React.Dispatch<
    React.SetStateAction<NewRestaurantFormState>
  >;
  showConfirmModal: boolean;
  setShowConfirmModal: React.Dispatch<React.SetStateAction<boolean>>;
  canSubmitNew: boolean | string | null;
  cart: CartItem[];
  cartTotals: CartTotals;
  notes: string;
  setNotes: (v: string) => void;
  requester: Requester;
  selections: Selection[] | undefined;
  selectedSelectionId: string | null;
  handleSelectionChange: (id: string) => void;
  products: SelectionProduct[] | undefined;
  productsLoading: boolean;
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
  handleAddToCart: (product: SelectionProduct) => void;
  handleUpdateQuantity: (id: string, delta: number) => void;
  createOrderIsPending: boolean;
  selectedCustomerContacts?: {
    primaryContact?: {
      firstName?: string | null;
      lastName?: string | null;
      email?: string | null;
      phone?: string | null;
    } | null;
  } | null;
  onBack: () => void;
  onClose: () => void;
  onSubmit: () => void;
}

export function NewRestaurantStepper({
  newRestaurantStep,
  setNewRestaurantStep,
  newRestaurantForm,
  setNewRestaurantForm,
  showConfirmModal,
  setShowConfirmModal,
  canSubmitNew,
  cart,
  cartTotals,
  notes,
  setNotes,
  requester,
  selections,
  selectedSelectionId,
  handleSelectionChange,
  products,
  productsLoading,
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
  handleAddToCart,
  handleUpdateQuantity,
  createOrderIsPending,
  selectedCustomerContacts,
  onBack,
  onClose,
  onSubmit,
}: Props) {
  const steps = [
    { step: 1, label: 'Restaurant', icon: Store },
    { step: 2, label: 'Propriétaire', icon: User },
    { step: 3, label: 'Facturation', icon: FileText },
    { step: 4, label: 'Produits', icon: ShoppingCart },
    { step: 5, label: 'Validation', icon: Check },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute inset-4 md:inset-8 lg:inset-12 bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-green-600 to-green-700">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h2 className="text-xl font-semibold text-white">
                Nouveau restaurant - Ouverture
              </h2>
              <p className="text-green-100 text-sm">
                Étape {newRestaurantStep}/5
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

        {/* Stepper Progress */}
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {steps.map((s, idx) => (
              <div key={s.step} className="flex items-center">
                <div
                  className={`flex items-center gap-2 ${newRestaurantStep >= s.step ? 'text-green-600' : 'text-gray-400'}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      newRestaurantStep > s.step
                        ? 'bg-green-600 text-white'
                        : newRestaurantStep === s.step
                          ? 'bg-green-100 text-green-600 ring-2 ring-green-600'
                          : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {newRestaurantStep > s.step ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <s.icon className="h-4 w-4" />
                    )}
                  </div>
                  <span className="text-sm font-medium hidden sm:inline">
                    {s.label}
                  </span>
                </div>
                {idx < 4 && (
                  <div
                    className={`w-12 h-0.5 mx-2 ${newRestaurantStep > s.step ? 'bg-green-600' : 'bg-gray-200'}`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {newRestaurantStep === 1 && (
            <StepRestaurant
              form={newRestaurantForm}
              setForm={setNewRestaurantForm}
            />
          )}
          {newRestaurantStep === 2 && (
            <StepProprietaire
              form={newRestaurantForm}
              setForm={setNewRestaurantForm}
              selectedCustomerContacts={selectedCustomerContacts}
            />
          )}
          {newRestaurantStep === 3 && (
            <StepFacturation
              form={newRestaurantForm}
              setForm={setNewRestaurantForm}
            />
          )}
          {newRestaurantStep === 4 && (
            <StepProduits
              selections={selections}
              selectedSelectionId={selectedSelectionId}
              handleSelectionChange={handleSelectionChange}
              products={products}
              productsLoading={productsLoading}
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
              handleAddToCart={handleAddToCart}
              handleUpdateQuantity={handleUpdateQuantity}
            />
          )}
          {newRestaurantStep === 5 && (
            <StepRecapitulatif
              form={newRestaurantForm}
              requester={requester}
              cart={cart}
              cartTotals={cartTotals}
              notes={notes}
              setNotes={setNotes}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
          <button
            onClick={() =>
              newRestaurantStep > 1
                ? setNewRestaurantStep(prev => prev - 1)
                : onBack()
            }
            className="flex items-center gap-2 px-5 py-2.5 text-gray-700 hover:text-gray-900 font-medium transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </button>

          {newRestaurantStep < 5 ? (
            <button
              onClick={() => setNewRestaurantStep(prev => prev + 1)}
              disabled={
                (newRestaurantStep === 1 &&
                  (!newRestaurantForm.tradeName.trim() ||
                    !newRestaurantForm.city.trim() ||
                    !newRestaurantForm.ownerType)) ||
                (newRestaurantStep === 2 &&
                  (!newRestaurantForm.ownerFirstName.trim() ||
                    !newRestaurantForm.ownerLastName.trim() ||
                    !newRestaurantForm.ownerEmail.trim())) ||
                (newRestaurantStep === 3 &&
                  !newRestaurantForm.billingSiret.trim()) ||
                (newRestaurantStep === 4 &&
                  (!selectedSelectionId || cart.length === 0))
              }
              className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              Suivant
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={!canSubmitNew || createOrderIsPending}
              className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {createOrderIsPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Check className="h-5 w-5" />
              )}
              Valider la commande
            </button>
          )}
        </div>
      </div>

      {showConfirmModal && (
        <ConfirmOrderModal
          title="Confirmer la commande ?"
          restaurantName={newRestaurantForm.tradeName}
          restaurantAddress={`${newRestaurantForm.address}, ${newRestaurantForm.postalCode} ${newRestaurantForm.city}`}
          cart={cart}
          cartTotals={cartTotals}
          isPending={createOrderIsPending}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={() => {
            setShowConfirmModal(false);
            void onSubmit();
          }}
        />
      )}
    </div>
  );
}
