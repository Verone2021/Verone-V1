'use client';

import Image from 'next/image';

import { calculateMargin } from '@verone/utils';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  FileText,
  Loader2,
  Minus,
  Package,
  Plus,
  ShoppingCart,
  Star,
  Store,
  Trash2,
  X,
} from 'lucide-react';

import {
  CategoryTabs,
  Pagination,
  ProductFilters,
} from '@/components/public-selection';

import { ContactsSection } from '../../../../../components/ContactsSection';
import type { SelectionProduct } from '../../../../../lib/hooks/use-affiliate-orders';
import type { ContactFormData } from '../../../../../lib/hooks/use-organisation-contacts';
import { ConfirmOrderModal } from './ConfirmOrderModal';
import type { CartItem } from './types';

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

interface CartTotals {
  totalHt: number;
  totalTtc: number;
  totalMargin: number;
  totalTva: number;
  tvaDetails: { rate: number; amount: number }[];
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Sélection */}
                  <div className="bg-white border rounded-xl shadow-sm">
                    <div className="px-5 py-4 border-b bg-gray-50 rounded-t-xl">
                      <div className="flex items-center gap-2">
                        <Star className="h-5 w-5 text-amber-500" />
                        <h3 className="font-semibold text-gray-900">
                          Sélection de produits
                        </h3>
                      </div>
                    </div>
                    <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
                      {!selections || selections.length === 0 ? (
                        <div className="text-center py-6">
                          <Star className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                          <p className="text-gray-500">Aucune sélection</p>
                        </div>
                      ) : (
                        selections.map(selection => (
                          <button
                            key={selection.id}
                            onClick={() => handleSelectionChange(selection.id)}
                            className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                              selectedSelectionId === selection.id
                                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`p-2 rounded-lg ${selectedSelectionId === selection.id ? 'bg-blue-100' : 'bg-gray-100'}`}
                              >
                                <Star
                                  className={`h-4 w-4 ${selectedSelectionId === selection.id ? 'text-blue-600' : 'text-gray-400'}`}
                                />
                              </div>
                              <div className="text-left">
                                <p className="font-medium text-gray-900">
                                  {selection.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {selection.products_count} produit
                                  {selection.products_count > 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>
                            {selectedSelectionId === selection.id && (
                              <Check className="h-5 w-5 text-blue-600" />
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Restaurant */}
                  <div className="bg-white border rounded-xl shadow-sm">
                    <div className="px-5 py-4 border-b bg-gray-50 rounded-t-xl">
                      <div className="flex items-center gap-2">
                        <Store className="h-5 w-5 text-blue-500" />
                        <h3 className="font-semibold text-gray-900">
                          Restaurant
                        </h3>
                      </div>
                    </div>
                    <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
                      {customersLoading ? (
                        <div className="flex justify-center py-4">
                          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                        </div>
                      ) : customers && customers.length > 0 ? (
                        customers.map(customer => (
                          <button
                            key={customer.id}
                            onClick={() =>
                              handleCustomerSelect(
                                customer.id,
                                customer.customer_type
                              )
                            }
                            className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                              selectedCustomerId === customer.id
                                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`p-2 rounded-lg ${selectedCustomerId === customer.id ? 'bg-blue-100' : 'bg-gray-100'}`}
                              >
                                <Store
                                  className={`h-4 w-4 ${selectedCustomerId === customer.id ? 'text-blue-600' : 'text-gray-400'}`}
                                />
                              </div>
                              <div className="text-left">
                                <p className="font-medium text-gray-900">
                                  {customer.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {customer.city ??
                                    customer.email ??
                                    'Pas de détails'}
                                </p>
                              </div>
                            </div>
                            {selectedCustomerId === customer.id && (
                              <Check className="h-5 w-5 text-blue-600" />
                            )}
                          </button>
                        ))
                      ) : (
                        <div className="text-center py-6">
                          <Store className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                          <p className="text-gray-500 text-sm">
                            Aucun restaurant
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 2: Contacts */}
                {selectedCustomerId && (
                  <ContactsSection
                    organisationId={selectedCustomerId}
                    onContactsComplete={() => setContactsComplete(true)}
                    onContactsIncomplete={() => setContactsComplete(false)}
                    onContactsChange={setPendingContacts}
                  />
                )}

                {/* Section 3: Produits */}
                <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b bg-gray-50 rounded-t-xl">
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-blue-500" />
                      <h3 className="font-semibold text-gray-900">
                        Sélection de produits
                      </h3>
                      {selectedSelection && (
                        <span className="text-sm text-gray-500">
                          — {selectedSelection.name}
                        </span>
                      )}
                    </div>
                  </div>

                  {!selectedSelectionId ? (
                    <div className="p-8 text-center">
                      <Star className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">
                        Sélectionnez d'abord une sélection de produits
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-[60%_40%] gap-4 p-4">
                      {/* COLONNE GAUCHE: CATALOGUE */}
                      <div className="space-y-4">
                        <ProductFilters
                          searchQuery={searchQuery}
                          onSearchChange={setSearchQuery}
                          branding={{
                            primary_color: '#3b82f6',
                            secondary_color: '#1e40af',
                            accent_color: '#60a5fa',
                            text_color: '#1f2937',
                            background_color: '#ffffff',
                            logo_url: null,
                          }}
                          isSearchOpen={false}
                          onSearchOpenChange={() => {}}
                        />

                        {categories.length > 1 && (
                          <CategoryTabs
                            categories={categories}
                            selectedCategory={selectedCategory}
                            selectedSubcategory={null}
                            onCategoryChange={setSelectedCategory}
                            onSubcategoryChange={() => {}}
                            branding={{
                              primary_color: '#3b82f6',
                              secondary_color: '#1e40af',
                              accent_color: '#60a5fa',
                              text_color: '#1f2937',
                              background_color: '#ffffff',
                              logo_url: null,
                            }}
                            totalCount={products?.length ?? 0}
                          />
                        )}

                        {(searchQuery || selectedCategory) && (
                          <div className="flex items-center justify-between text-sm">
                            <p className="text-gray-600">
                              {filteredProducts.length} résultat
                              {filteredProducts.length > 1 ? 's' : ''}
                              {searchQuery && ` pour "${searchQuery}"`}
                            </p>
                            {(searchQuery || selectedCategory) && (
                              <button
                                onClick={() => {
                                  setSearchQuery('');
                                  setSelectedCategory(null);
                                }}
                                className="text-blue-600 hover:underline font-medium"
                              >
                                Effacer les filtres
                              </button>
                            )}
                          </div>
                        )}

                        {productsLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                          </div>
                        ) : productsError ? (
                          <div className="text-center py-8">
                            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
                            <p className="text-red-600">Erreur de chargement</p>
                          </div>
                        ) : paginatedProducts.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {paginatedProducts.map(
                              (product: SelectionProduct) => {
                                const inCart = cart.find(
                                  item => item.selectionItemId === product.id
                                );
                                return (
                                  <div
                                    key={product.id}
                                    className={`p-4 border rounded-xl transition-all ${
                                      inCart
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                  >
                                    <div className="flex items-start gap-3">
                                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                                        {product.productImage ? (
                                          <Image
                                            src={product.productImage}
                                            alt={product.productName}
                                            width={64}
                                            height={64}
                                            className="w-full h-full object-cover"
                                          />
                                        ) : (
                                          <Package className="h-8 w-8 text-gray-400" />
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 line-clamp-2 text-sm">
                                          {product.productName}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                          {product.productSku}
                                        </p>
                                        <div className="flex items-center gap-2 mt-2">
                                          <span className="text-sm font-semibold text-gray-900">
                                            {product.sellingPriceHt.toFixed(2)}{' '}
                                            €
                                          </span>
                                          <span className="text-xs px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded">
                                            {product.marginRate.toFixed(2)}%
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="mt-3 flex items-center justify-end">
                                      {inCart ? (
                                        <div className="flex items-center gap-2">
                                          <button
                                            onClick={() =>
                                              handleUpdateQuantity(
                                                product.id,
                                                -1
                                              )
                                            }
                                            className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                                          >
                                            <Minus className="h-4 w-4" />
                                          </button>
                                          <span className="w-8 text-center font-semibold text-sm">
                                            {inCart.quantity}
                                          </span>
                                          <button
                                            onClick={() =>
                                              handleUpdateQuantity(
                                                product.id,
                                                1
                                              )
                                            }
                                            className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                                          >
                                            <Plus className="h-4 w-4" />
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() =>
                                            handleAddToCart(product)
                                          }
                                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                                        >
                                          <Plus className="h-4 w-4" />
                                          Ajouter
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              }
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                            <p className="text-gray-500">
                              {searchQuery || selectedCategory
                                ? 'Aucun produit ne correspond à votre recherche'
                                : 'Aucun produit disponible'}
                            </p>
                            {(searchQuery || selectedCategory) && (
                              <button
                                onClick={() => {
                                  setSearchQuery('');
                                  setSelectedCategory(null);
                                }}
                                className="mt-4 text-blue-600 hover:underline font-medium"
                              >
                                Voir tous les produits
                              </button>
                            )}
                          </div>
                        )}

                        {totalPages > 1 && (
                          <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                            branding={{
                              primary_color: '#3b82f6',
                              secondary_color: '#1e40af',
                              accent_color: '#60a5fa',
                              text_color: '#1f2937',
                            }}
                          />
                        )}
                      </div>

                      {/* COLONNE DROITE: PANIER */}
                      <div className="space-y-4">
                        {cart.length > 0 ? (
                          <>
                            <div className="sticky top-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
                              <div className="flex items-center gap-2 mb-4">
                                <ShoppingCart className="h-5 w-5 text-blue-600" />
                                <h4 className="font-semibold text-gray-900">
                                  Panier
                                </h4>
                              </div>

                              <div className="space-y-2 mb-4 max-h-96 overflow-y-auto">
                                {cart.map(item => {
                                  const { gainEuros } = calculateMargin({
                                    basePriceHt: item.basePriceHt,
                                    marginRate: item.marginRate,
                                  });
                                  return (
                                    <div
                                      key={item.selectionItemId}
                                      className="flex items-center justify-between bg-white rounded-lg p-3 text-sm"
                                    >
                                      <div className="flex-1 min-w-0 mr-2">
                                        <p className="font-medium text-gray-900 truncate">
                                          {item.productName}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          x{item.quantity} •{' '}
                                          {item.unitPriceHt.toFixed(2)} €
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        <p className="font-semibold text-gray-900">
                                          {(
                                            item.quantity * item.unitPriceHt
                                          ).toFixed(2)}{' '}
                                          €
                                        </p>
                                        <p className="text-xs text-green-600">
                                          +
                                          {(gainEuros * item.quantity).toFixed(
                                            2
                                          )}{' '}
                                          €
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              <div className="border-t border-blue-200 pt-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">
                                    Articles
                                  </span>
                                  <span className="font-medium">
                                    {cart.reduce(
                                      (sum, item) => sum + item.quantity,
                                      0
                                    )}
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">
                                    Total HT
                                  </span>
                                  <span className="font-medium">
                                    {cartTotals.totalHt.toFixed(2)} €
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">TVA</span>
                                  <span className="font-medium">
                                    {cartTotals.totalTva.toFixed(2)} €
                                  </span>
                                </div>
                                <div className="flex justify-between text-base font-bold border-t border-blue-200 pt-2">
                                  <span className="text-gray-900">
                                    Total TTC
                                  </span>
                                  <span className="text-blue-600">
                                    {cartTotals.totalTtc.toFixed(2)} €
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm bg-green-50 rounded-lg p-2 border border-green-200">
                                  <span className="text-green-700 font-medium">
                                    Votre commission
                                  </span>
                                  <span className="text-green-700 font-bold">
                                    +{cartTotals.totalMargin.toFixed(2)} €
                                  </span>
                                </div>
                              </div>

                              <div className="mt-4 pt-4 border-t border-blue-200">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Notes (optionnel)
                                </label>
                                <textarea
                                  value={notes}
                                  onChange={e => setNotes(e.target.value)}
                                  placeholder="Instructions spéciales..."
                                  rows={2}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                                />
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="sticky top-4 bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
                            <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                            <p className="text-gray-500 text-sm">
                              Votre panier est vide
                            </p>
                            <p className="text-gray-400 text-xs mt-1">
                              Ajoutez des produits pour commencer
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Récapitulatif */}
                {cart.length > 0 && canSubmitExisting && (
                  <div className="bg-white border rounded-xl shadow-sm">
                    <div className="px-5 py-4 border-b bg-gray-50 rounded-t-xl">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-500" />
                        <h3 className="font-semibold text-gray-900">
                          Récapitulatif
                        </h3>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="border rounded-lg overflow-hidden mb-4">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr className="text-xs text-gray-500 uppercase">
                              <th className="px-4 py-3 text-left">Produit</th>
                              <th className="px-4 py-3 text-center">Qté</th>
                              <th className="px-4 py-3 text-right">Prix HT</th>
                              <th className="px-4 py-3 text-right">Total HT</th>
                              <th className="px-4 py-3 text-right">Marge</th>
                              <th className="px-4 py-3 w-10" />
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
                                <tr
                                  key={item.selectionItemId}
                                  className="text-sm"
                                >
                                  <td className="px-4 py-3">
                                    <p className="font-medium text-gray-900">
                                      {item.productName}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {item.productSku}
                                    </p>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center justify-center gap-1">
                                      <button
                                        onClick={() =>
                                          handleUpdateQuantity(
                                            item.selectionItemId,
                                            -1
                                          )
                                        }
                                        className="p-1 rounded hover:bg-gray-100"
                                      >
                                        <Minus className="h-3 w-3" />
                                      </button>
                                      <span className="w-8 text-center font-medium">
                                        {item.quantity}
                                      </span>
                                      <button
                                        onClick={() =>
                                          handleUpdateQuantity(
                                            item.selectionItemId,
                                            1
                                          )
                                        }
                                        className="p-1 rounded hover:bg-gray-100"
                                      >
                                        <Plus className="h-3 w-3" />
                                      </button>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-right text-gray-700">
                                    {item.unitPriceHt.toFixed(2)} €
                                  </td>
                                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                                    {lineHt.toFixed(2)} €
                                  </td>
                                  <td className="px-4 py-3 text-right font-medium text-green-600">
                                    +{lineMargin.toFixed(2)} €
                                  </td>
                                  <td className="px-4 py-3">
                                    <button
                                      onClick={() =>
                                        handleRemoveFromCart(
                                          item.selectionItemId
                                        )
                                      }
                                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      <div className="flex justify-end">
                        <div className="w-80 space-y-2 text-sm">
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
                          <div className="flex justify-between text-lg font-bold pt-2 border-t">
                            <span>Total TTC</span>
                            <span>{cartTotals.totalTtc.toFixed(2)} €</span>
                          </div>
                          <div className="flex justify-between text-green-600 pt-2 border-t">
                            <span className="font-medium">
                              Votre commission
                            </span>
                            <span className="font-bold">
                              +{cartTotals.totalMargin.toFixed(2)} €
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Notes (optionnel)
                        </label>
                        <textarea
                          value={notes}
                          onChange={e => setNotes(e.target.value)}
                          placeholder="Instructions spéciales..."
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {canSubmitExisting && (
                  <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-800">
                        Validation requise
                      </p>
                      <p className="text-sm text-amber-700 mt-0.5">
                        Votre commande sera envoyée à l'équipe pour validation.
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
