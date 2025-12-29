'use client';

import { use, useEffect, useRef, useState } from 'react';

import Image from 'next/image';

import { createClient } from '@verone/utils/supabase/client';
import {
  Package,
  ShoppingCart,
  Plus,
  Minus,
  Check,
  User,
  Building2,
  Loader2,
  X,
} from 'lucide-react';

const supabase = createClient();

interface SelectionPageProps {
  params: Promise<{ id: string }>;
}

interface SelectionItem {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  product_image: string | null;
  base_price_ht: number;
  selling_price_ht: number;
  selling_price_ttc: number;
  margin_rate: number;
  stock_quantity: number;
  category: string | null;
}

interface Selection {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  affiliate_id: string;
  is_public: boolean;
  created_at: string;
}

interface CartItem extends SelectionItem {
  quantity: number;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(price);
}

export default function PublicSelectionPage({ params }: SelectionPageProps) {
  const { id } = use(params);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [items, setItems] = useState<SelectionItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOrderPanelOpen, setIsOrderPanelOpen] = useState(false);
  const [customerType, setCustomerType] = useState<'existing' | 'new'>(
    'existing'
  );
  const [customerCode, setCustomerCode] = useState('');
  const [customerData, setCustomerData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
  });
  const [codeLookup, setCodeLookup] = useState<{
    loading: boolean;
    found: boolean;
    name: string | null;
  }>({ loading: false, found: false, name: null });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState<{
    success: boolean;
    order_number?: string;
    error?: string;
  } | null>(null);

  // Track view
  const hasTrackedView = useRef(false);

  // Fetch selection data
  useEffect(() => {
    const fetchSelection = async () => {
      try {
        // Detect if id is UUID or slug
        const isUuid =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            id
          );

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error: rpcError } = await (supabase.rpc as any)(
          isUuid ? 'get_public_selection' : 'get_public_selection_by_slug',
          isUuid ? { p_selection_id: id } : { p_slug: id }
        );

        if (rpcError) throw rpcError;
        if (!data?.success)
          throw new Error(data?.error || 'Selection non trouvee');

        setSelection(data.selection);
        setItems(data.items || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSelection();
  }, [id]);

  // Track view
  useEffect(() => {
    if (selection?.id && !hasTrackedView.current) {
      hasTrackedView.current = true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.rpc as any)('track_selection_view', {
        p_selection_id: selection.id,
      })
        .then(() => {})
        .catch(() => {});
    }
  }, [selection?.id]);

  // Lookup customer code
  useEffect(() => {
    if (customerType !== 'existing' || customerCode.length < 9) {
      setCodeLookup({ loading: false, found: false, name: null });
      return;
    }

    const lookup = async () => {
      setCodeLookup({ loading: true, found: false, name: null });
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (supabase.rpc as any)(
          'lookup_customer_by_code',
          {
            p_code: customerCode,
          }
        );
        if (data && Array.isArray(data) && data.length > 0) {
          setCodeLookup({
            loading: false,
            found: true,
            name: data[0].trade_name || data[0].legal_name,
          });
        } else {
          setCodeLookup({ loading: false, found: false, name: null });
        }
      } catch {
        setCodeLookup({ loading: false, found: false, name: null });
      }
    };

    const timer = setTimeout(lookup, 300);
    return () => clearTimeout(timer);
  }, [customerCode, customerType]);

  const addToCart = (item: SelectionItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) {
        return prev.map(c =>
          c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(c => c.id !== itemId));
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(prev =>
      prev
        .map(c =>
          c.id === itemId
            ? { ...c, quantity: Math.max(0, c.quantity + delta) }
            : c
        )
        .filter(c => c.quantity > 0)
    );
  };

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.selling_price_ttc * item.quantity,
    0
  );
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleSubmitOrder = async () => {
    if (cart.length === 0) return;

    // Validation
    if (customerType === 'existing' && !codeLookup.found) {
      setOrderResult({ success: false, error: 'Code client invalide' });
      return;
    }
    if (customerType === 'new') {
      if (
        !customerData.first_name ||
        !customerData.last_name ||
        !customerData.email
      ) {
        setOrderResult({
          success: false,
          error: 'Veuillez remplir tous les champs obligatoires',
        });
        return;
      }
    }

    setIsSubmitting(true);
    setOrderResult(null);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: rpcError } = await (supabase.rpc as any)(
        'create_public_order',
        {
          p_selection_id: id,
          p_customer_type: customerType,
          p_items: cart.map(c => ({
            selection_item_id: c.id,
            quantity: c.quantity,
          })),
          p_customer_code: customerType === 'existing' ? customerCode : null,
          p_customer_data: customerType === 'new' ? customerData : null,
        }
      );

      if (rpcError) throw rpcError;

      if (data?.success) {
        setOrderResult({
          success: true,
          order_number: data.order_number,
        });
        setCart([]);
      } else {
        throw new Error(
          data?.error || 'Erreur lors de la creation de la commande'
        );
      }
    } catch (err) {
      setOrderResult({
        success: false,
        error: err instanceof Error ? err.message : 'Erreur inconnue',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-gray-200 rounded-full" />
          <div className="w-48 h-4 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (error || !selection) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Selection introuvable
          </h1>
          <p className="text-gray-600">
            {error || "Cette selection n'existe pas ou n'est plus disponible."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <div className="relative h-64 md:h-80 bg-gray-900">
        {selection.image_url ? (
          <Image
            src={selection.image_url}
            alt={selection.name}
            fill
            className="object-cover opacity-60"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="relative h-full max-w-7xl mx-auto px-4 flex flex-col justify-end pb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            {selection.name}
          </h1>
          {selection.description && (
            <p className="text-white/80 max-w-2xl">{selection.description}</p>
          )}
          <p className="text-white/60 mt-2">{items.length} produits</p>
        </div>
      </div>

      {/* Floating Cart Button */}
      {cartCount > 0 && (
        <button
          onClick={() => setIsOrderPanelOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-blue-600 text-white px-6 py-4 rounded-full shadow-lg hover:bg-blue-700 transition-all flex items-center gap-3"
        >
          <ShoppingCart className="h-5 w-5" />
          <span className="font-medium">
            {cartCount} article{cartCount > 1 ? 's' : ''}
          </span>
          <span className="font-bold">{formatPrice(cartTotal)}</span>
        </button>
      )}

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map(item => {
              const inCart = cart.find(c => c.id === item.id);
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300"
                >
                  {/* Product Image */}
                  <div className="relative h-56 bg-gray-100 overflow-hidden group">
                    {item.product_image ? (
                      <Image
                        src={item.product_image}
                        alt={item.product_name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <Package className="h-16 w-16" />
                      </div>
                    )}
                    {/* Stock Badge */}
                    <div className="absolute top-3 right-3">
                      {item.stock_quantity > 0 ? (
                        <span className="bg-green-500 text-white text-xs font-medium px-2 py-1 rounded-full">
                          Stock: {item.stock_quantity}
                        </span>
                      ) : (
                        <span className="bg-orange-500 text-white text-xs font-medium px-2 py-1 rounded-full">
                          Sur commande
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <p className="text-xs text-gray-500 mb-1">
                      {item.product_sku}
                    </p>
                    <h3 className="font-medium text-gray-900 line-clamp-2 mb-3 min-h-[2.5rem]">
                      {item.product_name}
                    </h3>

                    {/* Price */}
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-xl font-bold text-gray-900">
                        {formatPrice(item.selling_price_ttc)}
                      </span>
                      <span className="text-sm text-gray-500">TTC</span>
                    </div>

                    {/* Add to Cart */}
                    {inCart ? (
                      <div className="flex items-center justify-between bg-gray-100 rounded-lg p-2">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="font-medium">{inCart.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(item)}
                        className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
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
          <div className="text-center py-16">
            <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">Aucun produit dans cette selection</p>
          </div>
        )}
      </div>

      {/* Order Panel (Slide-over) */}
      {isOrderPanelOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !isSubmitting && setIsOrderPanelOpen(false)}
          />

          {/* Panel */}
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-bold">Votre commande</h2>
              <button
                onClick={() => !isSubmitting && setIsOrderPanelOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {orderResult?.success ? (
              /* Success State */
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Commande envoyee !
                </h3>
                <p className="text-gray-600 mb-4">
                  Votre commande <strong>{orderResult.order_number}</strong> a
                  ete recue.
                </p>
                <p className="text-sm text-gray-500">
                  Elle sera validee par notre equipe sous 24h.
                </p>
                <button
                  onClick={() => {
                    setOrderResult(null);
                    setIsOrderPanelOpen(false);
                  }}
                  className="mt-8 px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                >
                  Fermer
                </button>
              </div>
            ) : (
              <>
                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-4">
                  {cart.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      Votre panier est vide
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {cart.map(item => (
                        <div
                          key={item.id}
                          className="flex gap-3 bg-gray-50 rounded-lg p-3"
                        >
                          <div className="relative w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                            {item.product_image ? (
                              <Image
                                src={item.product_image}
                                alt={item.product_name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm line-clamp-1">
                              {item.product_name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatPrice(item.selling_price_ttc)}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <button
                                onClick={() => updateQuantity(item.id, -1)}
                                className="p-1 hover:bg-gray-200 rounded"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="text-sm font-medium w-6 text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, 1)}
                                className="p-1 hover:bg-gray-200 rounded"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="ml-auto text-red-500 text-xs hover:underline"
                              >
                                Supprimer
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Customer Identification */}
                  {cart.length > 0 && (
                    <div className="mt-6 pt-6 border-t">
                      <h3 className="font-medium text-gray-900 mb-4">
                        Identification
                      </h3>

                      {/* Tabs */}
                      <div className="flex rounded-lg bg-gray-100 p-1 mb-4">
                        <button
                          onClick={() => setCustomerType('existing')}
                          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                            customerType === 'existing'
                              ? 'bg-white text-gray-900 shadow-sm'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          <Building2 className="h-4 w-4" />
                          J'ai un code
                        </button>
                        <button
                          onClick={() => setCustomerType('new')}
                          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                            customerType === 'new'
                              ? 'bg-white text-gray-900 shadow-sm'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          <User className="h-4 w-4" />
                          Nouveau client
                        </button>
                      </div>

                      {customerType === 'existing' ? (
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">
                            Code client (VERO-XXXX)
                          </label>
                          <input
                            type="text"
                            value={customerCode}
                            onChange={e =>
                              setCustomerCode(e.target.value.toUpperCase())
                            }
                            placeholder="VERO-XXXX"
                            maxLength={9}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          {codeLookup.loading && (
                            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Verification...
                            </p>
                          )}
                          {codeLookup.found && (
                            <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                              <Check className="h-3 w-3" />
                              {codeLookup.name}
                            </p>
                          )}
                          {customerCode.length === 9 &&
                            !codeLookup.loading &&
                            !codeLookup.found && (
                              <p className="text-sm text-red-600 mt-1">
                                Code non trouve
                              </p>
                            )}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm text-gray-600 mb-1">
                                Prenom *
                              </label>
                              <input
                                type="text"
                                value={customerData.first_name}
                                onChange={e =>
                                  setCustomerData(d => ({
                                    ...d,
                                    first_name: e.target.value,
                                  }))
                                }
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-600 mb-1">
                                Nom *
                              </label>
                              <input
                                type="text"
                                value={customerData.last_name}
                                onChange={e =>
                                  setCustomerData(d => ({
                                    ...d,
                                    last_name: e.target.value,
                                  }))
                                }
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">
                              Email *
                            </label>
                            <input
                              type="email"
                              value={customerData.email}
                              onChange={e =>
                                setCustomerData(d => ({
                                  ...d,
                                  email: e.target.value,
                                }))
                              }
                              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">
                              Telephone
                            </label>
                            <input
                              type="tel"
                              value={customerData.phone}
                              onChange={e =>
                                setCustomerData(d => ({
                                  ...d,
                                  phone: e.target.value,
                                }))
                              }
                              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <p className="text-xs text-gray-500">
                            * Nouveau client = approbation requise avant
                            traitement
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer */}
                {cart.length > 0 && (
                  <div className="p-4 border-t bg-gray-50">
                    {orderResult?.error && (
                      <p className="text-sm text-red-600 mb-3">
                        {orderResult.error}
                      </p>
                    )}
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-medium">Total TTC</span>
                      <span className="text-xl font-bold">
                        {formatPrice(cartTotal)}
                      </span>
                    </div>
                    <button
                      onClick={handleSubmitOrder}
                      disabled={
                        isSubmitting ||
                        (customerType === 'existing' && !codeLookup.found) ||
                        (customerType === 'new' &&
                          (!customerData.first_name ||
                            !customerData.last_name ||
                            !customerData.email))
                      }
                      className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Envoi en cours...
                        </>
                      ) : (
                        'Confirmer la commande'
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
