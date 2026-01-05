'use client';

import { use, useEffect, useRef, useState } from 'react';

import Image from 'next/image';

import { createClient } from '@verone/utils/supabase/client';
import { Package, ShoppingCart, Plus, Minus, Check, Store } from 'lucide-react';

import { EnseigneStepper } from '@/components/checkout';

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
  /** Timestamp de publication. null = non publié */
  published_at: string | null;
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
  const [isEnseigneStepperOpen, setIsEnseigneStepperOpen] = useState(false);
  const [enseigneOrderNumber, setEnseigneOrderNumber] = useState<string | null>(
    null
  );

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
          <div className="flex items-center gap-4 mt-3">
            <p className="text-white/60">{items.length} produits</p>
            {/* Bouton Commander Enseigne dans le header */}
            {cartCount > 0 && (
              <button
                onClick={() => setIsEnseigneStepperOpen(true)}
                className="flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-colors border border-white/30"
              >
                <Store className="h-4 w-4" />
                Commander ({cartCount})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Floating Cart Button - Ouvre maintenant EnseigneStepper */}
      {cartCount > 0 && (
        <button
          onClick={() => setIsEnseigneStepperOpen(true)}
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

      {/* Enseigne Stepper (Slide-over) */}
      {isEnseigneStepperOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsEnseigneStepperOpen(false)}
          />

          {/* Panel */}
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-lg bg-white shadow-xl">
            {enseigneOrderNumber ? (
              /* Success State */
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Commande envoyee !
                </h3>
                <p className="text-gray-600 mb-4">
                  Votre commande <strong>{enseigneOrderNumber}</strong> a ete
                  recue.
                </p>
                <p className="text-sm text-gray-500 mb-8">
                  Elle sera validee par notre equipe sous 24h.
                </p>
                <button
                  onClick={() => {
                    setEnseigneOrderNumber(null);
                    setIsEnseigneStepperOpen(false);
                    setCart([]);
                  }}
                  className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                >
                  Fermer
                </button>
              </div>
            ) : (
              <EnseigneStepper
                affiliateId={selection.affiliate_id}
                selectionId={selection.id}
                cart={cart.map(item => ({
                  id: item.id,
                  product_id: item.product_id,
                  product_name: item.product_name,
                  selling_price_ttc: item.selling_price_ttc,
                  quantity: item.quantity,
                }))}
                onClose={() => setIsEnseigneStepperOpen(false)}
                onSuccess={orderNumber => {
                  setEnseigneOrderNumber(orderNumber);
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
