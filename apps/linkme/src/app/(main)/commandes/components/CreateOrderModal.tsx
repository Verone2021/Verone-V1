'use client';

/**
 * Modal: Création de commande par un affilié
 * ==========================================
 *
 * Workflow amélioré:
 * - Question initiale: "Restaurant existant ou nouveau ?"
 * - Restaurant existant: Sélection + Contacts + Produits
 * - Nouveau restaurant: Stepper (Infos + Propriétaire + Facturation + Produits)
 *
 * @module CreateOrderModal
 * @since 2025-12-19
 * @updated 2026-01-11 - Refonte workflow avec question initiale
 */

import { useState, useMemo, useCallback, useEffect } from 'react';

import {
  X,
  Loader2,
  Package,
  Users,
  ShoppingCart,
  Plus,
  Minus,
  Star,
  Building2,
  User,
  AlertCircle,
  Check,
  Trash2,
  Search,
  ArrowLeft,
  ArrowRight,
  Store,
  FileText,
} from 'lucide-react';

import { ContactsSection } from '../../../../components/ContactsSection';
import {
  useCreateAffiliateOrder,
  useAffiliateCustomers,
  useSelectionProducts,
} from '../../../../lib/hooks/use-affiliate-orders';
import {
  useUpdateOrganisationContacts,
  type ContactFormData,
} from '../../../../lib/hooks/use-organisation-contacts';
import {
  useUserSelections,
  useUserAffiliate,
} from '../../../../lib/hooks/use-user-selection';

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CartItem {
  selectionItemId: string;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPriceHt: number;
  marginRate: number;
  basePriceHt: number;
  taxRate: number;
}

// État pour un nouveau restaurant
interface NewRestaurantFormState {
  tradeName: string;
  city: string;
  address: string;
  postalCode: string;
  ownerType: 'propre' | 'franchise' | null;
  // Propriétaire
  ownerFirstName: string;
  ownerLastName: string;
  ownerEmail: string;
  ownerPhone: string;
  ownerCompanyName: string;
  ownerKbisUrl: string;
  // Facturation
  billingSameAsOwner: boolean;
  billingFirstName: string;
  billingLastName: string;
  billingEmail: string;
  billingPhone: string;
}

const initialNewRestaurantForm: NewRestaurantFormState = {
  tradeName: '',
  city: '',
  address: '',
  postalCode: '',
  ownerType: null,
  ownerFirstName: '',
  ownerLastName: '',
  ownerEmail: '',
  ownerPhone: '',
  ownerCompanyName: '',
  ownerKbisUrl: '',
  billingSameAsOwner: true,
  billingFirstName: '',
  billingLastName: '',
  billingEmail: '',
  billingPhone: '',
};

export function CreateOrderModal({ isOpen, onClose }: CreateOrderModalProps) {
  // ============================================
  // STATE - Question initiale
  // ============================================
  const [isNewRestaurant, setIsNewRestaurant] = useState<boolean | null>(null);
  const [contactsComplete, setContactsComplete] = useState(false);
  const [pendingContacts, setPendingContacts] = useState<{
    primaryContact: ContactFormData;
    billingContact: ContactFormData | null;
  } | null>(null);

  // Stepper pour nouveau restaurant
  const [newRestaurantStep, setNewRestaurantStep] = useState(1);
  const [newRestaurantForm, setNewRestaurantForm] =
    useState<NewRestaurantFormState>(initialNewRestaurantForm);

  // ============================================
  // STATE - Formulaire commande
  // ============================================
  const [selectedSelectionId, setSelectedSelectionId] = useState<string | null>(
    null
  );
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null
  );
  const [selectedCustomerType, setSelectedCustomerType] = useState<
    'organization' | 'individual'
  >('organization');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notes, setNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // ============================================
  // HOOKS
  // ============================================
  const { data: affiliate, isLoading: affiliateLoading } = useUserAffiliate();
  const { data: selections, isLoading: selectionsLoading } =
    useUserSelections();
  const { data: customers, isLoading: customersLoading } =
    useAffiliateCustomers(affiliate?.id ?? null);
  const {
    data: products,
    isLoading: productsLoading,
    error: productsError,
  } = useSelectionProducts(selectedSelectionId);

  const createOrder = useCreateAffiliateOrder();
  const updateContacts = useUpdateOrganisationContacts();

  // ============================================
  // COMPUTED
  // ============================================
  const selectedSelection = useMemo(
    () => selections?.find(s => s.id === selectedSelectionId),
    [selections, selectedSelectionId]
  );

  const selectedCustomer = useMemo(
    () => customers?.find(c => c.id === selectedCustomerId),
    [customers, selectedCustomerId]
  );

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (!searchQuery) return products;
    const query = searchQuery.toLowerCase();
    return products.filter(
      (p: any) =>
        p.productName.toLowerCase().includes(query) ||
        p.productSku.toLowerCase().includes(query)
    );
  }, [products, searchQuery]);

  const cartTotals = useMemo(() => {
    let totalHt = 0;
    let totalMargin = 0;
    const tvaByRate = new Map<number, number>();

    cart.forEach(item => {
      const lineHt = item.unitPriceHt * item.quantity;
      totalHt += lineHt;
      totalMargin += item.basePriceHt * (item.marginRate / 100) * item.quantity;
      const tvaAmount = lineHt * item.taxRate;
      tvaByRate.set(
        item.taxRate,
        (tvaByRate.get(item.taxRate) || 0) + tvaAmount
      );
    });

    const tvaDetails = Array.from(tvaByRate.entries())
      .map(([rate, amount]) => ({ rate, amount }))
      .sort((a, b) => a.rate - b.rate);

    const totalTva = tvaDetails.reduce((sum, t) => sum + t.amount, 0);
    const totalTtc = totalHt + totalTva;

    return { totalHt, totalTtc, totalMargin, totalTva, tvaDetails };
  }, [cart]);

  // Validation pour restaurant existant
  const canSubmitExisting = useMemo(() => {
    return (
      !!selectedSelectionId &&
      !!selectedCustomerId &&
      cart.length > 0 &&
      contactsComplete
    );
  }, [selectedSelectionId, selectedCustomerId, cart, contactsComplete]);

  // Validation pour nouveau restaurant
  const canSubmitNew = useMemo(() => {
    const form = newRestaurantForm;
    const restaurantValid = form.tradeName.trim() && form.city.trim();
    const ownerValid =
      form.ownerType &&
      form.ownerFirstName.trim() &&
      form.ownerLastName.trim() &&
      form.ownerEmail.trim();
    const billingValid =
      form.billingSameAsOwner ||
      (form.billingFirstName.trim() &&
        form.billingLastName.trim() &&
        form.billingEmail.trim());
    return (
      !!selectedSelectionId &&
      cart.length > 0 &&
      restaurantValid &&
      ownerValid &&
      billingValid
    );
  }, [selectedSelectionId, cart, newRestaurantForm]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleClose = useCallback(() => {
    setIsNewRestaurant(null);
    setContactsComplete(false);
    setPendingContacts(null);
    setNewRestaurantStep(1);
    setNewRestaurantForm(initialNewRestaurantForm);
    setSelectedSelectionId(null);
    setSelectedCustomerId(null);
    setCart([]);
    setNotes('');
    setSearchQuery('');
    onClose();
  }, [onClose]);

  const handleSelectionChange = useCallback((selectionId: string) => {
    setSelectedSelectionId(selectionId);
    setCart([]);
    setSearchQuery('');
  }, []);

  const handleCustomerSelect = useCallback(
    (customerId: string, customerType: 'organization' | 'individual') => {
      setSelectedCustomerId(customerId);
      setSelectedCustomerType(customerType);
      setContactsComplete(false); // Reset until contacts are verified
    },
    []
  );

  const handleAddToCart = useCallback((product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.selectionItemId === product.id);
      if (existing) {
        return prev.map(item =>
          item.selectionItemId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          selectionItemId: product.id,
          productId: product.productId,
          productName: product.productName,
          productSku: product.productSku,
          quantity: 1,
          unitPriceHt: product.sellingPriceHt,
          marginRate: product.marginRate,
          basePriceHt: product.basePriceHt,
          taxRate: product.taxRate ?? 0.2,
        },
      ];
    });
  }, []);

  const handleUpdateQuantity = useCallback(
    (selectionItemId: string, delta: number) => {
      setCart(prev =>
        prev
          .map(item =>
            item.selectionItemId === selectionItemId
              ? { ...item, quantity: Math.max(0, item.quantity + delta) }
              : item
          )
          .filter(item => item.quantity > 0)
      );
    },
    []
  );

  const handleRemoveFromCart = useCallback((selectionItemId: string) => {
    setCart(prev =>
      prev.filter(item => item.selectionItemId !== selectionItemId)
    );
  }, []);

  const handleSubmitExisting = async () => {
    if (
      !affiliate?.id ||
      !selectedCustomerId ||
      !selectedSelectionId ||
      cart.length === 0
    ) {
      return;
    }

    try {
      // Si des contacts ont été modifiés, les sauvegarder d'abord
      if (pendingContacts) {
        await updateContacts.mutateAsync({
          organisationId: selectedCustomerId,
          primaryContact: pendingContacts.primaryContact,
          billingContact: pendingContacts.billingContact,
        });
      }

      await createOrder.mutateAsync({
        affiliateId: affiliate.id,
        customerId: selectedCustomerId,
        customerType: selectedCustomerType,
        selectionId: selectedSelectionId,
        items: cart.map(item => ({
          selection_item_id: item.selectionItemId,
          quantity: item.quantity,
        })),
        notes: notes || undefined,
      });

      handleClose();
    } catch (error) {
      console.error('Erreur création commande:', error);
    }
  };

  const handleSubmitNew = async () => {
    if (!affiliate?.id || !selectedSelectionId || cart.length === 0) {
      return;
    }

    // TODO: Implémenter la création d'une commande pour nouveau restaurant
    // Cette fonctionnalité nécessite une RPC spécifique pour créer:
    // 1. Une entrée dans sales_order_linkme_details avec is_new_restaurant = true
    // 2. Les infos owner_* et billing_*
    // 3. pending_admin_validation = true

    console.log('Submit new restaurant order:', {
      form: newRestaurantForm,
      items: cart.map(item => ({
        selection_item_id: item.selectionItemId,
        quantity: item.quantity,
      })),
      notes,
    });

    handleClose();
  };

  // ============================================
  // RENDER
  // ============================================
  if (!isOpen) return null;

  const isLoading = affiliateLoading || selectionsLoading;

  // === QUESTION INITIALE ===
  if (isNewRestaurant === null) {
    return (
      <div className="fixed inset-0 z-50 overflow-hidden">
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        />
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-600 to-blue-700">
              <h2 className="text-xl font-semibold text-white">
                Nouvelle commande
              </h2>
              <p className="text-blue-100 text-sm">
                Pour qui est cette commande ?
              </p>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-gray-600 text-center mb-6">
                Cette commande est pour...
              </p>

              <button
                onClick={() => setIsNewRestaurant(false)}
                className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
              >
                <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
                  <Store className="h-6 w-6 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">
                    Restaurant existant
                  </p>
                  <p className="text-sm text-gray-500">
                    Un de mes restaurants déjà enregistrés
                  </p>
                </div>
              </button>

              <button
                onClick={() => setIsNewRestaurant(true)}
                className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all group"
              >
                <div className="p-3 bg-green-100 rounded-xl group-hover:bg-green-200 transition-colors">
                  <Plus className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">
                    Nouveau restaurant
                  </p>
                  <p className="text-sm text-gray-500">
                    Ouverture ou première commande
                  </p>
                </div>
              </button>
            </div>

            <div className="px-6 py-4 border-t bg-gray-50">
              <button
                onClick={handleClose}
                className="w-full py-2.5 text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // === RESTAURANT EXISTANT ===
  if (!isNewRestaurant) {
    return (
      <div className="fixed inset-0 z-50 overflow-hidden">
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        />
        <div className="absolute inset-4 md:inset-8 lg:inset-12 bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-600 to-blue-700">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsNewRestaurant(null)}
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
              onClick={handleClose}
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
                                  {customer.city ||
                                    customer.email ||
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

                {/* Section 2: Contacts (si restaurant sélectionné) */}
                {selectedCustomerId && (
                  <ContactsSection
                    organisationId={selectedCustomerId}
                    onContactsComplete={() => setContactsComplete(true)}
                    onContactsIncomplete={() => setContactsComplete(false)}
                    onContactsChange={setPendingContacts}
                  />
                )}

                {/* Section 3: Produits */}
                <div className="bg-white border rounded-xl shadow-sm">
                  <div className="px-5 py-4 border-b bg-gray-50 rounded-t-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5 text-green-500" />
                        <h3 className="font-semibold text-gray-900">
                          Produits
                        </h3>
                        {selectedSelection && (
                          <span className="text-sm text-gray-500">
                            — {selectedSelection.name}
                          </span>
                        )}
                      </div>
                      {selectedSelectionId &&
                        products &&
                        products.length > 0 && (
                          <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                              type="text"
                              placeholder="Rechercher..."
                              value={searchQuery}
                              onChange={e => setSearchQuery(e.target.value)}
                              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                          </div>
                        )}
                    </div>
                  </div>
                  <div className="p-4">
                    {!selectedSelectionId ? (
                      <div className="text-center py-8">
                        <Star className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">
                          Sélectionnez d'abord une sélection de produits
                        </p>
                      </div>
                    ) : productsLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                      </div>
                    ) : productsError ? (
                      <div className="text-center py-8">
                        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
                        <p className="text-red-600">Erreur de chargement</p>
                      </div>
                    ) : filteredProducts && filteredProducts.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {filteredProducts.map((product: any) => {
                          const inCart = cart.find(
                            item => item.selectionItemId === product.id
                          );
                          return (
                            <div
                              key={product.id}
                              className={`p-4 border rounded-xl transition-all ${
                                inCart
                                  ? 'border-green-300 bg-green-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                  {product.productImage ? (
                                    <img
                                      src={product.productImage}
                                      alt={product.productName}
                                      className="w-full h-full object-cover rounded-lg"
                                    />
                                  ) : (
                                    <Package className="h-6 w-6 text-gray-400" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 truncate">
                                    {product.productName}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {product.productSku}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-sm font-semibold text-gray-900">
                                      {product.sellingPriceHt.toFixed(2)} €
                                    </span>
                                    <span className="text-xs px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded">
                                      {product.marginRate.toFixed(0)}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="mt-3 flex items-center justify-end">
                                {inCart ? (
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() =>
                                        handleUpdateQuantity(product.id, -1)
                                      }
                                      className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                                    >
                                      <Minus className="h-4 w-4" />
                                    </button>
                                    <span className="w-10 text-center font-semibold">
                                      {inCart.quantity}
                                    </span>
                                    <button
                                      onClick={() =>
                                        handleUpdateQuantity(product.id, 1)
                                      }
                                      className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                                    >
                                      <Plus className="h-4 w-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleAddToCart(product)}
                                    className="flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                                  >
                                    <Plus className="h-4 w-4" />
                                    Ajouter
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-gray-500">Aucun produit</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 4: Récapitulatif */}
                {cart.length > 0 && (
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
                              const lineMargin =
                                item.quantity *
                                item.basePriceHt *
                                (item.marginRate / 100);
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

                {/* Message validation */}
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
              onClick={handleClose}
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
                onClick={handleSubmitExisting}
                disabled={
                  !canSubmitExisting ||
                  createOrder.isPending ||
                  updateContacts.isPending
                }
                className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
              >
                {createOrder.isPending || updateContacts.isPending ? (
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
    );
  }

  // === NOUVEAU RESTAURANT ===
  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="absolute inset-4 md:inset-8 lg:inset-12 bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-green-600 to-green-700">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsNewRestaurant(null)}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h2 className="text-xl font-semibold text-white">
                Nouveau restaurant - Ouverture
              </h2>
              <p className="text-green-100 text-sm">
                Étape {newRestaurantStep}/4
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Stepper Progress */}
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {[
              { step: 1, label: 'Restaurant', icon: Store },
              { step: 2, label: 'Propriétaire', icon: User },
              { step: 3, label: 'Facturation', icon: FileText },
              { step: 4, label: 'Produits', icon: ShoppingCart },
            ].map((s, idx) => (
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
                {idx < 3 && (
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
          {/* Step 1: Restaurant */}
          {newRestaurantStep === 1 && (
            <div className="max-w-xl mx-auto space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Informations du restaurant
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom commercial *
                    </label>
                    <input
                      type="text"
                      value={newRestaurantForm.tradeName}
                      onChange={e =>
                        setNewRestaurantForm(prev => ({
                          ...prev,
                          tradeName: e.target.value,
                        }))
                      }
                      placeholder="Ex: Restaurant Le Gourmet"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ville *
                      </label>
                      <input
                        type="text"
                        value={newRestaurantForm.city}
                        onChange={e =>
                          setNewRestaurantForm(prev => ({
                            ...prev,
                            city: e.target.value,
                          }))
                        }
                        placeholder="Paris"
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Code postal
                      </label>
                      <input
                        type="text"
                        value={newRestaurantForm.postalCode}
                        onChange={e =>
                          setNewRestaurantForm(prev => ({
                            ...prev,
                            postalCode: e.target.value,
                          }))
                        }
                        placeholder="75001"
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Adresse
                    </label>
                    <input
                      type="text"
                      value={newRestaurantForm.address}
                      onChange={e =>
                        setNewRestaurantForm(prev => ({
                          ...prev,
                          address: e.target.value,
                        }))
                      }
                      placeholder="123 rue de la Gastronomie"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Type de restaurant
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() =>
                      setNewRestaurantForm(prev => ({
                        ...prev,
                        ownerType: 'propre',
                      }))
                    }
                    className={`p-4 border-2 rounded-xl transition-all ${
                      newRestaurantForm.ownerType === 'propre'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Building2
                      className={`h-8 w-8 mx-auto mb-2 ${newRestaurantForm.ownerType === 'propre' ? 'text-green-600' : 'text-gray-400'}`}
                    />
                    <p className="font-medium text-gray-900">Propre</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Restaurant détenu par l'enseigne
                    </p>
                  </button>
                  <button
                    onClick={() =>
                      setNewRestaurantForm(prev => ({
                        ...prev,
                        ownerType: 'franchise',
                      }))
                    }
                    className={`p-4 border-2 rounded-xl transition-all ${
                      newRestaurantForm.ownerType === 'franchise'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Users
                      className={`h-8 w-8 mx-auto mb-2 ${newRestaurantForm.ownerType === 'franchise' ? 'text-green-600' : 'text-gray-400'}`}
                    />
                    <p className="font-medium text-gray-900">Franchisé</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Exploité par un franchisé
                    </p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Propriétaire */}
          {newRestaurantStep === 2 && (
            <div className="max-w-xl mx-auto space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Propriétaire / Responsable
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prénom *
                    </label>
                    <input
                      type="text"
                      value={newRestaurantForm.ownerFirstName}
                      onChange={e =>
                        setNewRestaurantForm(prev => ({
                          ...prev,
                          ownerFirstName: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom *
                    </label>
                    <input
                      type="text"
                      value={newRestaurantForm.ownerLastName}
                      onChange={e =>
                        setNewRestaurantForm(prev => ({
                          ...prev,
                          ownerLastName: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={newRestaurantForm.ownerEmail}
                    onChange={e =>
                      setNewRestaurantForm(prev => ({
                        ...prev,
                        ownerEmail: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={newRestaurantForm.ownerPhone}
                    onChange={e =>
                      setNewRestaurantForm(prev => ({
                        ...prev,
                        ownerPhone: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  />
                </div>

                {newRestaurantForm.ownerType === 'franchise' && (
                  <>
                    <div className="pt-4 border-t">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">
                        Informations société (franchisé)
                      </h4>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Raison sociale *
                        </label>
                        <input
                          type="text"
                          value={newRestaurantForm.ownerCompanyName}
                          onChange={e =>
                            setNewRestaurantForm(prev => ({
                              ...prev,
                              ownerCompanyName: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Facturation */}
          {newRestaurantStep === 3 && (
            <div className="max-w-xl mx-auto space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Responsable Facturation
              </h3>

              <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={newRestaurantForm.billingSameAsOwner}
                  onChange={e =>
                    setNewRestaurantForm(prev => ({
                      ...prev,
                      billingSameAsOwner: e.target.checked,
                    }))
                  }
                  className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                />
                <div>
                  <p className="font-medium text-gray-900">
                    Même contact que le propriétaire
                  </p>
                  <p className="text-sm text-gray-500">
                    {newRestaurantForm.ownerFirstName}{' '}
                    {newRestaurantForm.ownerLastName} -{' '}
                    {newRestaurantForm.ownerEmail}
                  </p>
                </div>
              </label>

              {!newRestaurantForm.billingSameAsOwner && (
                <div className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prénom *
                      </label>
                      <input
                        type="text"
                        value={newRestaurantForm.billingFirstName}
                        onChange={e =>
                          setNewRestaurantForm(prev => ({
                            ...prev,
                            billingFirstName: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom *
                      </label>
                      <input
                        type="text"
                        value={newRestaurantForm.billingLastName}
                        onChange={e =>
                          setNewRestaurantForm(prev => ({
                            ...prev,
                            billingLastName: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={newRestaurantForm.billingEmail}
                      onChange={e =>
                        setNewRestaurantForm(prev => ({
                          ...prev,
                          billingEmail: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      value={newRestaurantForm.billingPhone}
                      onChange={e =>
                        setNewRestaurantForm(prev => ({
                          ...prev,
                          billingPhone: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Produits */}
          {newRestaurantStep === 4 && (
            <div className="space-y-6">
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
                <div className="p-4 flex flex-wrap gap-2">
                  {selections?.map(selection => (
                    <button
                      key={selection.id}
                      onClick={() => handleSelectionChange(selection.id)}
                      className={`px-4 py-2 rounded-lg border transition-all ${
                        selectedSelectionId === selection.id
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {selection.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Produits */}
              {selectedSelectionId && (
                <div className="bg-white border rounded-xl shadow-sm">
                  <div className="px-5 py-4 border-b bg-gray-50 rounded-t-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5 text-green-500" />
                        <h3 className="font-semibold text-gray-900">
                          Produits
                        </h3>
                      </div>
                      {products && products.length > 0 && (
                        <div className="relative w-64">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Rechercher..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="p-4">
                    {productsLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                      </div>
                    ) : filteredProducts && filteredProducts.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {filteredProducts.map((product: any) => {
                          const inCart = cart.find(
                            item => item.selectionItemId === product.id
                          );
                          return (
                            <div
                              key={product.id}
                              className={`p-4 border rounded-xl transition-all ${
                                inCart
                                  ? 'border-green-300 bg-green-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                  {product.productImage ? (
                                    <img
                                      src={product.productImage}
                                      alt={product.productName}
                                      className="w-full h-full object-cover rounded-lg"
                                    />
                                  ) : (
                                    <Package className="h-6 w-6 text-gray-400" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 truncate">
                                    {product.productName}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {product.productSku}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-sm font-semibold text-gray-900">
                                      {product.sellingPriceHt.toFixed(2)} €
                                    </span>
                                    <span className="text-xs px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded">
                                      {product.marginRate.toFixed(0)}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="mt-3 flex items-center justify-end">
                                {inCart ? (
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() =>
                                        handleUpdateQuantity(product.id, -1)
                                      }
                                      className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                                    >
                                      <Minus className="h-4 w-4" />
                                    </button>
                                    <span className="w-10 text-center font-semibold">
                                      {inCart.quantity}
                                    </span>
                                    <button
                                      onClick={() =>
                                        handleUpdateQuantity(product.id, 1)
                                      }
                                      className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                                    >
                                      <Plus className="h-4 w-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleAddToCart(product)}
                                    className="flex items-center gap-1.5 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
                                  >
                                    <Plus className="h-4 w-4" />
                                    Ajouter
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-gray-500">Aucun produit</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Récapitulatif panier */}
              {cart.length > 0 && (
                <div className="bg-white border rounded-xl shadow-sm p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-500">
                        {cart.reduce((sum, item) => sum + item.quantity, 0)}{' '}
                        article(s)
                      </p>
                      <p className="text-lg font-bold text-gray-900">
                        {cartTotals.totalTtc.toFixed(2)} € TTC
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Votre commission</p>
                      <p className="text-lg font-bold text-green-600">
                        +{cartTotals.totalMargin.toFixed(2)} €
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optionnel)
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Instructions spéciales..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
          <button
            onClick={() =>
              newRestaurantStep > 1
                ? setNewRestaurantStep(prev => prev - 1)
                : setIsNewRestaurant(null)
            }
            className="flex items-center gap-2 px-5 py-2.5 text-gray-700 hover:text-gray-900 font-medium transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </button>

          {newRestaurantStep < 4 ? (
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
                    !newRestaurantForm.ownerEmail.trim()))
              }
              className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              Suivant
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmitNew}
              disabled={!canSubmitNew || createOrder.isPending}
              className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {createOrder.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Check className="h-5 w-5" />
              )}
              Créer la commande
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
