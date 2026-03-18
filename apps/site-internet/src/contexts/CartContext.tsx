'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

import { useAuthUser } from '@/hooks/use-auth-user';

// ============================================
// Types
// ============================================

export interface CartItem {
  id: string;
  product_id: string;
  variant_group_id: string | null;
  quantity: number;
  include_assembly: boolean;
  // Enriched data (from products/pricing)
  name: string;
  slug: string;
  price_ttc: number;
  assembly_price: number;
  eco_participation: number;
  primary_image_url: string | null;
  sku: string | null;
}

interface CartContextValue {
  items: CartItem[];
  isLoading: boolean;
  itemCount: number;
  subtotal: number;
  addItem: (product: AddToCartInput) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
}

export interface AddToCartInput {
  product_id: string;
  variant_group_id?: string | null;
  quantity: number;
  include_assembly: boolean;
  // Product info for display
  name: string;
  slug: string;
  price_ttc: number;
  assembly_price: number;
  eco_participation: number;
  primary_image_url: string | null;
  sku: string | null;
}

// ============================================
// Constants
// ============================================

const CART_SESSION_KEY = 'verone_cart_session_id';
const CART_ITEMS_KEY = 'verone_cart_items';

// ============================================
// Context
// ============================================

const CartContext = createContext<CartContextValue | null>(null);

// ============================================
// Helper: Get or create session ID
// ============================================

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let sessionId = localStorage.getItem(CART_SESSION_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(CART_SESSION_KEY, sessionId);
  }
  return sessionId;
}

// ============================================
// Provider
// ============================================

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuthUser();

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_ITEMS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CartItem[];
        setItems(parsed);
      }
    } catch {
      // Ignore parse errors
    }
    setIsLoading(false);
  }, []);

  // Persist cart to localStorage on change
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(CART_ITEMS_KEY, JSON.stringify(items));
    }
  }, [items, isLoading]);

  // Sync to Supabase (anonymous via session_id)
  // Untyped Supabase client for shopping_carts (table not yet in generated types)
  const getSupabase = useCallback(() => {
    return createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }, []);

  const syncToSupabase = useCallback(
    async (updatedItems: CartItem[]) => {
      try {
        const supabase = getSupabase();
        const sessionId = getSessionId();

        // Clear existing cart for this session
        await supabase
          .from('shopping_carts')
          .delete()
          .eq('session_id', sessionId);

        // Insert current items with user_id + email if authenticated
        if (updatedItems.length > 0) {
          await supabase.from('shopping_carts').insert(
            updatedItems.map(item => ({
              session_id: sessionId,
              user_id: user?.id ?? null,
              customer_email: user?.email ?? null,
              product_id: item.product_id,
              variant_group_id: item.variant_group_id,
              quantity: item.quantity,
              include_assembly: item.include_assembly,
            }))
          );
        }
      } catch (error) {
        console.error('[CartContext] Sync to Supabase failed:', error);
      }
    },
    [getSupabase, user]
  );

  const addItem = useCallback(
    async (input: AddToCartInput) => {
      setItems(prev => {
        const existingIndex = prev.findIndex(
          i => i.product_id === input.product_id
        );

        let updated: CartItem[];
        if (existingIndex >= 0) {
          // Update quantity
          updated = prev.map((item, idx) =>
            idx === existingIndex
              ? {
                  ...item,
                  quantity: item.quantity + input.quantity,
                  include_assembly: input.include_assembly,
                }
              : item
          );
        } else {
          // Add new item
          const newItem: CartItem = {
            id: crypto.randomUUID(),
            product_id: input.product_id,
            variant_group_id: input.variant_group_id ?? null,
            quantity: input.quantity,
            include_assembly: input.include_assembly,
            name: input.name,
            slug: input.slug,
            price_ttc: input.price_ttc,
            assembly_price: input.assembly_price,
            eco_participation: input.eco_participation,
            primary_image_url: input.primary_image_url,
            sku: input.sku,
          };
          updated = [...prev, newItem];
        }

        void syncToSupabase(updated).catch(error => {
          console.error('[CartContext] addItem sync failed:', error);
        });

        return updated;
      });
    },
    [syncToSupabase]
  );

  const removeItem = useCallback(
    async (productId: string) => {
      setItems(prev => {
        const updated = prev.filter(i => i.product_id !== productId);
        void syncToSupabase(updated).catch(error => {
          console.error('[CartContext] removeItem sync failed:', error);
        });
        return updated;
      });
    },
    [syncToSupabase]
  );

  const updateQuantity = useCallback(
    async (productId: string, quantity: number) => {
      if (quantity <= 0) {
        await removeItem(productId);
        return;
      }
      setItems(prev => {
        const updated = prev.map(item =>
          item.product_id === productId
            ? { ...item, quantity: Math.min(quantity, 99) }
            : item
        );
        void syncToSupabase(updated).catch(error => {
          console.error('[CartContext] updateQuantity sync failed:', error);
        });
        return updated;
      });
    },
    [syncToSupabase, removeItem]
  );

  const clearCart = useCallback(async () => {
    setItems([]);
    void syncToSupabase([]).catch(error => {
      console.error('[CartContext] clearCart sync failed:', error);
    });
  }, [syncToSupabase]);

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const subtotal = useMemo(
    () =>
      items.reduce((sum, item) => {
        const itemPrice =
          item.price_ttc +
          item.eco_participation +
          (item.include_assembly ? item.assembly_price : 0);
        return sum + itemPrice * item.quantity;
      }, 0),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      isLoading,
      itemCount,
      subtotal,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
    }),
    [
      items,
      isLoading,
      itemCount,
      subtotal,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// ============================================
// Hook
// ============================================

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
