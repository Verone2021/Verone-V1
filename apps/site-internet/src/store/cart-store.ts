import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Store Zustand - Panier E-commerce
 *
 * Gestion globale du panier avec persistence localStorage
 * - Ajout/Suppression/Mise à jour quantité
 * - Calcul totaux automatique
 * - Persistence entre sessions
 */

export interface CartItem {
  productId: string;
  productName: string;
  productSlug: string;
  variantId?: string;
  variantName?: string;
  price: number; // Prix unitaire TTC en centimes
  quantity: number;
  imageUrl?: string | null;
  maxStock: number; // Stock disponible
}

interface CartState {
  // État
  items: CartItem[];
  isOpen: boolean; // Pour mini-cart dropdown

  // Getters
  itemsCount: number;
  subtotal: number; // En centimes
  total: number; // En centimes (peut inclure frais livraison plus tard)

  // Actions
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (
    productId: string,
    quantity: number,
    variantId?: string
  ) => void;
  clearCart: () => void;
  toggleCart: () => void;
  setCartOpen: (open: boolean) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      // État initial
      items: [],
      isOpen: false,

      // Getters calculés
      get itemsCount() {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      get subtotal() {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
      },

      get total() {
        // Pour l'instant = subtotal, plus tard on ajoutera frais livraison
        return get().subtotal;
      },

      // Actions
      addItem: item => {
        const { items } = get();
        const quantity = item.quantity ?? 1;

        // Vérifier si l'item existe déjà (même product + variant)
        const existingItemIndex = items.findIndex(
          i =>
            i.productId === item.productId &&
            i.variantId === item.variantId
        );

        if (existingItemIndex > -1) {
          // Item existe → augmenter quantité (max stock)
          const newItems = [...items];
          const existingItem = newItems[existingItemIndex];
          newItems[existingItemIndex] = {
            ...existingItem,
            quantity: Math.min(
              existingItem.quantity + quantity,
              item.maxStock
            ),
          };
          set({ items: newItems });
        } else {
          // Nouvel item → ajouter au panier
          const newItem: CartItem = {
            productId: item.productId,
            productName: item.productName,
            productSlug: item.productSlug,
            variantId: item.variantId,
            variantName: item.variantName,
            price: item.price,
            quantity: Math.min(quantity, item.maxStock),
            imageUrl: item.imageUrl,
            maxStock: item.maxStock,
          };
          set({ items: [...items, newItem] });
        }
      },

      removeItem: (productId, variantId) => {
        set({
          items: get().items.filter(
            item =>
              !(
                item.productId === productId &&
                item.variantId === variantId
              )
          ),
        });
      },

      updateQuantity: (productId, quantity, variantId) => {
        const { items } = get();
        const itemIndex = items.findIndex(
          i => i.productId === productId && i.variantId === variantId
        );

        if (itemIndex === -1) return;

        const newItems = [...items];
        const item = newItems[itemIndex];

        // Quantité min = 1, max = stock
        const newQuantity = Math.max(1, Math.min(quantity, item.maxStock));

        newItems[itemIndex] = {
          ...item,
          quantity: newQuantity,
        };

        set({ items: newItems });
      },

      clearCart: () => {
        set({ items: [] });
      },

      toggleCart: () => {
        set({ isOpen: !get().isOpen });
      },

      setCartOpen: open => {
        set({ isOpen: open });
      },
    }),
    {
      name: 'verone-cart-storage', // Clé localStorage
      partialize: state => ({ items: state.items }), // Persister uniquement items
    }
  )
);
