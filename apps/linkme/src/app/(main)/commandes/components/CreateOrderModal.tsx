'use client';

/**
 * Modal: Création de commande par un affilié
 *
 * Formulaire professionnel sur une page complète:
 * - Section 1: Sélection + Client (côte à côte)
 * - Section 2: Produits avec quantités
 * - Section 3: Récapitulatif et validation
 *
 * @module CreateOrderModal
 * @since 2025-12-19
 * @updated 2025-12-19 - Formulaire single-page professionnel
 */

import { useState, useMemo, useCallback } from 'react';

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
} from 'lucide-react';

import {
  useCreateAffiliateOrder,
  useAffiliateCustomers,
  useSelectionProducts,
  useCreateCustomerOrganisation,
  useCreateCustomerIndividual,
} from '../../../../lib/hooks/use-affiliate-orders';
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

export function CreateOrderModal({ isOpen, onClose }: CreateOrderModalProps) {
  // ============================================
  // STATE
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
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [newCustomerType, setNewCustomerType] = useState<
    'organization' | 'individual'
  >('organization');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notes, setNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Nouveau client form state
  const [newCustomerForm, setNewCustomerForm] = useState({
    legalName: '',
    tradeName: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    postalCode: '',
    city: '',
  });

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
  const createOrg = useCreateCustomerOrganisation();
  const createIndividual = useCreateCustomerIndividual();

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

  // Produits filtrés par recherche
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

      // Calculer TVA par taux
      const tvaAmount = lineHt * item.taxRate;
      tvaByRate.set(
        item.taxRate,
        (tvaByRate.get(item.taxRate) || 0) + tvaAmount
      );
    });

    // Convertir en array pour affichage
    const tvaDetails = Array.from(tvaByRate.entries())
      .map(([rate, amount]) => ({ rate, amount }))
      .sort((a, b) => a.rate - b.rate);

    const totalTva = tvaDetails.reduce((sum, t) => sum + t.amount, 0);
    const totalTtc = totalHt + totalTva;

    return { totalHt, totalTtc, totalMargin, totalTva, tvaDetails };
  }, [cart]);

  const canSubmit = useMemo(() => {
    return !!selectedSelectionId && !!selectedCustomerId && cart.length > 0;
  }, [selectedSelectionId, selectedCustomerId, cart]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleClose = useCallback(() => {
    setSelectedSelectionId(null);
    setSelectedCustomerId(null);
    setCart([]);
    setNotes('');
    setIsCreatingCustomer(false);
    setNewCustomerForm({
      legalName: '',
      tradeName: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      postalCode: '',
      city: '',
    });
    onClose();
  }, [onClose]);

  const handleSelectionChange = useCallback((selectionId: string) => {
    setSelectedSelectionId(selectionId);
    setCart([]); // Reset cart when changing selection
    setSearchQuery('');
  }, []);

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

  const handleCreateCustomer = async () => {
    if (!affiliate?.id) return;

    try {
      let customerId: string;

      if (newCustomerType === 'organization') {
        customerId = await createOrg.mutateAsync({
          affiliateId: affiliate.id,
          legalName: newCustomerForm.legalName,
          tradeName: newCustomerForm.tradeName || undefined,
          email: newCustomerForm.email || undefined,
          phone: newCustomerForm.phone || undefined,
          address: newCustomerForm.address || undefined,
          postalCode: newCustomerForm.postalCode || undefined,
          city: newCustomerForm.city || undefined,
        });
      } else {
        customerId = await createIndividual.mutateAsync({
          affiliateId: affiliate.id,
          firstName: newCustomerForm.firstName,
          lastName: newCustomerForm.lastName,
          email: newCustomerForm.email || undefined,
          phone: newCustomerForm.phone || undefined,
          address: newCustomerForm.address || undefined,
          postalCode: newCustomerForm.postalCode || undefined,
          city: newCustomerForm.city || undefined,
        });
      }

      setSelectedCustomerId(customerId);
      setSelectedCustomerType(newCustomerType);
      setIsCreatingCustomer(false);
      setNewCustomerForm({
        legalName: '',
        tradeName: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        postalCode: '',
        city: '',
      });
    } catch (error) {
      console.error('Erreur création client:', error);
    }
  };

  const handleSubmit = async () => {
    if (
      !affiliate?.id ||
      !selectedCustomerId ||
      !selectedSelectionId ||
      cart.length === 0
    ) {
      return;
    }

    try {
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

  // ============================================
  // RENDER
  // ============================================
  if (!isOpen) return null;

  const isLoading = affiliateLoading || selectionsLoading;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal - Full width */}
      <div className="absolute inset-4 md:inset-8 lg:inset-12 bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-600 to-blue-700">
          <div>
            <h2 className="text-xl font-semibold text-white">
              Nouvelle commande
            </h2>
            <p className="text-blue-100 text-sm">
              Créez une commande pour votre client
            </p>
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
              {/* Section 1: Sélection + Client */}
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
                    <p className="text-sm text-gray-500 mt-1">
                      Choisissez la sélection contenant vos produits
                    </p>
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
                              className={`p-2 rounded-lg ${
                                selectedSelectionId === selection.id
                                  ? 'bg-blue-100'
                                  : 'bg-gray-100'
                              }`}
                            >
                              <Star
                                className={`h-4 w-4 ${
                                  selectedSelectionId === selection.id
                                    ? 'text-blue-600'
                                    : 'text-gray-400'
                                }`}
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

                {/* Client */}
                <div className="bg-white border rounded-xl shadow-sm">
                  <div className="px-5 py-4 border-b bg-gray-50 rounded-t-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-blue-500" />
                        <h3 className="font-semibold text-gray-900">Client</h3>
                      </div>
                      {!isCreatingCustomer && (
                        <button
                          onClick={() => setIsCreatingCustomer(true)}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          + Nouveau
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {isCreatingCustomer
                        ? 'Créez un nouveau client'
                        : 'Sélectionnez ou créez un client'}
                    </p>
                  </div>
                  <div className="p-4">
                    {isCreatingCustomer ? (
                      /* Formulaire nouveau client */
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setNewCustomerType('organization')}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                newCustomerType === 'organization'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              <Building2 className="h-4 w-4" />
                              Entreprise
                            </button>
                            <button
                              onClick={() => setNewCustomerType('individual')}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                newCustomerType === 'individual'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              <User className="h-4 w-4" />
                              Particulier
                            </button>
                          </div>
                          <button
                            onClick={() => setIsCreatingCustomer(false)}
                            className="text-sm text-gray-500 hover:text-gray-700"
                          >
                            Annuler
                          </button>
                        </div>

                        {newCustomerType === 'organization' ? (
                          <div className="space-y-3">
                            <input
                              type="text"
                              placeholder="Raison sociale *"
                              value={newCustomerForm.legalName}
                              onChange={e =>
                                setNewCustomerForm({
                                  ...newCustomerForm,
                                  legalName: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                            <input
                              type="text"
                              placeholder="Nom commercial"
                              value={newCustomerForm.tradeName}
                              onChange={e =>
                                setNewCustomerForm({
                                  ...newCustomerForm,
                                  tradeName: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            <input
                              type="text"
                              placeholder="Prénom *"
                              value={newCustomerForm.firstName}
                              onChange={e =>
                                setNewCustomerForm({
                                  ...newCustomerForm,
                                  firstName: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                            <input
                              type="text"
                              placeholder="Nom *"
                              value={newCustomerForm.lastName}
                              onChange={e =>
                                setNewCustomerForm({
                                  ...newCustomerForm,
                                  lastName: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="email"
                            placeholder="Email"
                            value={newCustomerForm.email}
                            onChange={e =>
                              setNewCustomerForm({
                                ...newCustomerForm,
                                email: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          />
                          <input
                            type="tel"
                            placeholder="Téléphone"
                            value={newCustomerForm.phone}
                            onChange={e =>
                              setNewCustomerForm({
                                ...newCustomerForm,
                                phone: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          />
                        </div>

                        <input
                          type="text"
                          placeholder="Adresse"
                          value={newCustomerForm.address}
                          onChange={e =>
                            setNewCustomerForm({
                              ...newCustomerForm,
                              address: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />

                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            placeholder="Code postal"
                            value={newCustomerForm.postalCode}
                            onChange={e =>
                              setNewCustomerForm({
                                ...newCustomerForm,
                                postalCode: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          />
                          <input
                            type="text"
                            placeholder="Ville"
                            value={newCustomerForm.city}
                            onChange={e =>
                              setNewCustomerForm({
                                ...newCustomerForm,
                                city: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          />
                        </div>

                        <button
                          onClick={handleCreateCustomer}
                          disabled={
                            createOrg.isPending ||
                            createIndividual.isPending ||
                            (newCustomerType === 'organization' &&
                              !newCustomerForm.legalName) ||
                            (newCustomerType === 'individual' &&
                              (!newCustomerForm.firstName ||
                                !newCustomerForm.lastName))
                          }
                          className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
                        >
                          {createOrg.isPending || createIndividual.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                          Créer le client
                        </button>
                      </div>
                    ) : (
                      /* Liste clients existants */
                      <div className="space-y-2 max-h-52 overflow-y-auto">
                        {customersLoading ? (
                          <div className="flex justify-center py-4">
                            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                          </div>
                        ) : customers && customers.length > 0 ? (
                          customers.map(customer => (
                            <button
                              key={customer.id}
                              onClick={() => {
                                setSelectedCustomerId(customer.id);
                                setSelectedCustomerType(customer.customer_type);
                              }}
                              className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                                selectedCustomerId === customer.id
                                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`p-2 rounded-lg ${
                                    selectedCustomerId === customer.id
                                      ? 'bg-blue-100'
                                      : 'bg-gray-100'
                                  }`}
                                >
                                  {customer.customer_type === 'organization' ? (
                                    <Building2
                                      className={`h-4 w-4 ${
                                        selectedCustomerId === customer.id
                                          ? 'text-blue-600'
                                          : 'text-gray-400'
                                      }`}
                                    />
                                  ) : (
                                    <User
                                      className={`h-4 w-4 ${
                                        selectedCustomerId === customer.id
                                          ? 'text-blue-600'
                                          : 'text-gray-400'
                                      }`}
                                    />
                                  )}
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
                            <Users className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                            <p className="text-gray-500 text-sm">
                              Aucun client
                            </p>
                            <button
                              onClick={() => setIsCreatingCustomer(true)}
                              className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                              Créer un client
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 2: Produits */}
              <div className="bg-white border rounded-xl shadow-sm">
                <div className="px-5 py-4 border-b bg-gray-50 rounded-t-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5 text-green-500" />
                      <h3 className="font-semibold text-gray-900">Produits</h3>
                      {selectedSelection && (
                        <span className="text-sm text-gray-500">
                          — {selectedSelection.name}
                        </span>
                      )}
                    </div>
                    {/* Barre de recherche */}
                    {selectedSelectionId && products && products.length > 0 && (
                      <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Rechercher un produit..."
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Ajoutez les produits et définissez les quantités
                    <span className="text-orange-600 ml-1">
                      (marges définies dans votre sélection)
                    </span>
                  </p>
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
                      <p className="text-sm text-gray-500 mt-1">
                        Impossible de charger les produits
                      </p>
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
                  ) : products && products.length > 0 ? (
                    <div className="text-center py-8">
                      <Search className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-gray-500">
                        Aucun produit ne correspond à votre recherche
                      </p>
                      <button
                        onClick={() => setSearchQuery('')}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                      >
                        Effacer la recherche
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-gray-500">
                        Aucun produit dans cette sélection
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 3: Récapitulatif */}
              {cart.length > 0 && (
                <div className="bg-white border rounded-xl shadow-sm">
                  <div className="px-5 py-4 border-b bg-gray-50 rounded-t-xl">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5 text-blue-500" />
                      <h3 className="font-semibold text-gray-900">
                        Récapitulatif de la commande
                      </h3>
                    </div>
                  </div>
                  <div className="p-4">
                    {/* Panier */}
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
                                      handleRemoveFromCart(item.selectionItemId)
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

                    {/* Totaux */}
                    <div className="flex justify-end">
                      <div className="w-80 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total HT</span>
                          <span className="font-medium">
                            {cartTotals.totalHt.toFixed(2)} €
                          </span>
                        </div>
                        {/* TVA par taux */}
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
                          <span className="font-medium">Votre commission</span>
                          <span className="font-bold">
                            +{cartTotals.totalMargin.toFixed(2)} €
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notes (optionnel)
                      </label>
                      <textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="Instructions spéciales, commentaires..."
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Message validation admin */}
              {canSubmit && (
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800">
                      Validation requise
                    </p>
                    <p className="text-sm text-amber-700 mt-0.5">
                      Votre commande sera envoyée à l'équipe pour validation
                      avant traitement.
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
              onClick={handleSubmit}
              disabled={!canSubmit || createOrder.isPending}
              className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {createOrder.isPending ? (
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
