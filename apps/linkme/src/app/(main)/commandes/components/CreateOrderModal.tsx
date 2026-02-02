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
 *
 * TODO [LM-ORD-009 Phase 8]: Migrer vers OrderFormUnified
 * ========================================================
 * Ce composant doit être aligné avec OrderFormUnified pour utiliser le workflow 6 étapes:
 * 1. Demandeur (auto-rempli depuis profil utilisateur: name, email, phone, position)
 * 2. Restaurant (recherche + cartes OU nouveau avec ownership_type)
 * 3. Responsable (contacts existants + nouveau)
 * 4. Facturation (option org mère + custom)
 * 5. Livraison (contact, adresse, date, centre commercial, formulaire accès, semi-remorque)
 * 6. Validation (récap 6 sections + panier)
 *
 * Référence: apps/linkme/src/app/(public)/s/[id]/page.tsx (utilise OrderFormUnified)
 * RPC: create_public_linkme_order (8 paramètres) - voir use-submit-unified-order.ts
 *
 * Migration steps:
 * 1. Remplacer le contenu du modal par <OrderFormUnified />
 * 2. Auto-remplir étape 1 (Demandeur) depuis useAuth()
 * 3. Passer cart, organisations, handlers
 * 4. Tester workflow complet (restaurant existant + nouveau)
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import Image from 'next/image';

import { useQueryClient } from '@tanstack/react-query';
import { AddressAutocomplete, type AddressResult } from '@verone/ui';
import { calculateMargin } from '@verone/utils';
import { createClient } from '@verone/utils/supabase/client';
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
  ArrowLeft,
  ArrowRight,
  Store,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  CategoryTabs,
  Pagination,
  ProductFilters,
} from '@/components/public-selection';
import { useAuth } from '@/contexts/AuthContext';

import { ContactsSection } from '../../../../components/ContactsSection';
import {
  useCreateAffiliateOrder,
  useAffiliateCustomers,
  useSelectionProducts,
  type SelectionProduct,
} from '../../../../lib/hooks/use-affiliate-orders';
import {
  useOrganisationContacts,
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
  // Étape 1 - Livraison
  tradeName: string;
  city: string;
  address: string;
  postalCode: string;
  latitude: number | null;
  longitude: number | null;
  ownerType: 'succursale' | 'franchise' | null;
  // Étape 2 - Propriétaire
  ownerFirstName: string;
  ownerLastName: string;
  ownerEmail: string;
  ownerPhone: string;
  ownerCompanyName: string; // Raison sociale si franchise
  ownerKbisUrl: string;
  // Étape 3 - Facturation
  billingSameAsOwner: boolean;
  billingUseSameAddress: boolean; // Reprendre adresse livraison
  billingCompanyName: string; // Dénomination sociale
  billingFirstName: string;
  billingLastName: string;
  billingEmail: string;
  billingPhone: string;
  billingAddress: string;
  billingPostalCode: string;
  billingCity: string;
  billingLatitude: number | null;
  billingLongitude: number | null;
  billingSiret: string;
  billingKbisUrl: string; // Facultatif
}

const initialNewRestaurantForm: NewRestaurantFormState = {
  tradeName: '',
  city: '',
  address: '',
  postalCode: '',
  latitude: null,
  longitude: null,
  ownerType: null,
  ownerFirstName: '',
  ownerLastName: '',
  ownerEmail: '',
  ownerPhone: '',
  ownerCompanyName: '',
  ownerKbisUrl: '',
  billingSameAsOwner: true,
  billingUseSameAddress: true,
  billingCompanyName: '',
  billingFirstName: '',
  billingLastName: '',
  billingEmail: '',
  billingPhone: '',
  billingAddress: '',
  billingPostalCode: '',
  billingCity: '',
  billingLatitude: null,
  billingLongitude: null,
  billingSiret: '',
  billingKbisUrl: '',
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

  // Stepper pour nouveau restaurant (5 étapes)
  const [newRestaurantStep, setNewRestaurantStep] = useState(1);
  const [newRestaurantForm, setNewRestaurantForm] =
    useState<NewRestaurantFormState>(initialNewRestaurantForm);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PRODUCTS_PER_PAGE = 12; // 3 rows × 4 columns

  // Demandeur = utilisateur authentifié qui passe la commande
  const [requester, setRequester] = useState({
    type: 'responsable_enseigne',
    name: '',
    email: '',
    phone: '',
    position: null,
  });

  // ============================================
  // HOOKS
  // ============================================
  const queryClient = useQueryClient();
  const { user } = useAuth();
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

  // Hook pour charger les contacts du client sélectionné
  const { data: selectedCustomerContacts } = useOrganisationContacts(
    selectedCustomerId && selectedCustomerType === 'organization'
      ? selectedCustomerId
      : null
  );

  // ============================================
  // EFFECTS - Pré-remplissage automatique
  // ============================================

  // Initialiser le demandeur depuis l'utilisateur authentifié
  useEffect(() => {
    if (user) {
      setRequester({
        type: 'responsable_enseigne',
        name: user.user_metadata?.full_name ?? user.email ?? '',
        email: user.email ?? '',
        phone: user.user_metadata?.phone ?? '',
        position: user.user_metadata?.position ?? null,
      });
    }
  }, [user]);

  // Pré-remplir les données du propriétaire quand un client est sélectionné
  useEffect(() => {
    if (
      selectedCustomerContacts?.contacts &&
      selectedCustomerContacts.contacts.length > 0 &&
      isNewRestaurant === true // Seulement pour nouveau restaurant
    ) {
      const primaryContact = selectedCustomerContacts.primaryContact;

      if (primaryContact) {
        setNewRestaurantForm(prev => ({
          ...prev,
          ownerFirstName: primaryContact.firstName ?? '',
          ownerLastName: primaryContact.lastName ?? '',
          ownerEmail: primaryContact.email ?? '',
          ownerPhone: primaryContact.phone ?? '',
        }));
      }
    }
  }, [selectedCustomerContacts, isNewRestaurant]);

  // ============================================
  // COMPUTED
  // ============================================
  const selectedSelection = useMemo(
    () => selections?.find(s => s.id === selectedSelectionId),
    [selections, selectedSelectionId]
  );

  const _selectedCustomer = useMemo(
    () => customers?.find(c => c.id === selectedCustomerId),
    [customers, selectedCustomerId]
  );

  // Extract categories from products
  const categories = useMemo(() => {
    if (!products) return [];

    const categoryMap = new Map<string, { count: number }>();

    for (const product of products) {
      const cat = product.category ?? 'Autres';
      const existing = categoryMap.get(cat);
      if (existing) {
        existing.count++;
      } else {
        categoryMap.set(cat, { count: 1 });
      }
    }

    return Array.from(categoryMap.entries())
      .map(([name, data]) => ({
        id: name.toLowerCase().replace(/\s+/g, '-'),
        name,
        count: data.count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    let filtered = products;

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p: SelectionProduct) =>
          p.productName.toLowerCase().includes(query) ||
          p.productSku.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (selectedCategory) {
      const categoryName = categories.find(
        c => c.id === selectedCategory
      )?.name;
      if (categoryName) {
        filtered = filtered.filter(
          (p: SelectionProduct) => (p.category ?? 'Autres') === categoryName
        );
      }
    }

    return filtered;
  }, [products, searchQuery, selectedCategory, categories]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    const endIndex = startIndex + PRODUCTS_PER_PAGE;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  const cartTotals = useMemo(() => {
    let totalHt = 0;
    let totalMargin = 0;
    const tvaByRate = new Map<number, number>();

    cart.forEach(item => {
      const lineHt = item.unitPriceHt * item.quantity;
      totalHt += lineHt;
      // Calcul du gain avec la SSOT (taux de marque)
      // Le gain = selling_price - base_price (calculé par la formule taux de marque)
      const { gainEuros } = calculateMargin({
        basePriceHt: item.basePriceHt,
        marginRate: item.marginRate,
      });
      totalMargin += gainEuros * item.quantity;
      const tvaAmount = lineHt * item.taxRate;
      tvaByRate.set(
        item.taxRate,
        (tvaByRate.get(item.taxRate) ?? 0) + tvaAmount
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
  // EFFECTS
  // ============================================

  // Pré-remplir les données du propriétaire quand un client est sélectionné
  useEffect(() => {
    if (selectedCustomerContacts?.primaryContact && isNewRestaurant === false) {
      const primary = selectedCustomerContacts.primaryContact;

      setNewRestaurantForm(prev => ({
        ...prev,
        ownerFirstName: primary.firstName ?? '',
        ownerLastName: primary.lastName ?? '',
        ownerEmail: primary.email ?? '',
        ownerPhone: primary.phone ?? primary.mobile ?? '',
      }));
    }
  }, [selectedCustomerContacts, isNewRestaurant]);

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

  const handleAddToCart = useCallback((product: SelectionProduct) => {
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
          taxRate: product.taxRate,
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

    const supabase = createClient();

    try {
      // Préparer le panier
      const p_cart = cart.map(item => ({
        product_id: item.productId,
        quantity: item.quantity,
        selling_price_ttc: item.unitPriceHt * (1 + item.taxRate),
        id: item.selectionItemId,
      }));

      // Demandeur = Utilisateur authentifié qui passe la commande
      const p_requester = requester;

      // Organisation nouvelle
      const p_organisation = {
        is_new: true,
        trade_name: newRestaurantForm.tradeName,
        legal_name:
          newRestaurantForm.ownerType === 'franchise'
            ? newRestaurantForm.billingCompanyName ||
              newRestaurantForm.ownerCompanyName
            : newRestaurantForm.tradeName,
        city: newRestaurantForm.city,
        postal_code: newRestaurantForm.postalCode || null,
        address: newRestaurantForm.address || null,
        siret: newRestaurantForm.billingSiret || null,
      };

      // Propriétaire
      const p_owner = {
        type: newRestaurantForm.ownerType,
        same_as_requester: false,
        name: `${newRestaurantForm.ownerFirstName} ${newRestaurantForm.ownerLastName}`,
        email: newRestaurantForm.ownerEmail,
        phone: newRestaurantForm.ownerPhone || null,
      };

      // Facturation - Contact
      const billingName = newRestaurantForm.billingSameAsOwner
        ? `${newRestaurantForm.ownerFirstName} ${newRestaurantForm.ownerLastName}`
        : `${newRestaurantForm.billingFirstName} ${newRestaurantForm.billingLastName}`;
      const billingEmail = newRestaurantForm.billingSameAsOwner
        ? newRestaurantForm.ownerEmail
        : newRestaurantForm.billingEmail;
      const billingPhone = newRestaurantForm.billingSameAsOwner
        ? newRestaurantForm.ownerPhone
        : newRestaurantForm.billingPhone;

      // Adresse de facturation
      const billingAddress = newRestaurantForm.billingUseSameAddress
        ? newRestaurantForm.address
        : newRestaurantForm.billingAddress;
      const billingPostalCode = newRestaurantForm.billingUseSameAddress
        ? newRestaurantForm.postalCode
        : newRestaurantForm.billingPostalCode;
      const billingCity = newRestaurantForm.billingUseSameAddress
        ? newRestaurantForm.city
        : newRestaurantForm.billingCity;

      const p_billing = {
        contact_source: newRestaurantForm.billingSameAsOwner
          ? 'step2'
          : 'custom',
        name: billingName,
        email: billingEmail,
        phone: billingPhone || null,
        address: billingAddress || null,
        postal_code: billingPostalCode || null,
        city: billingCity || null,
        delivery_date: null,
        mall_form_required: false,
      };

      // Appel RPC
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: result, error: rpcError } = await (supabase.rpc as any)(
        'create_public_linkme_order',
        {
          p_affiliate_id: affiliate.id,
          p_selection_id: selectedSelectionId,
          p_cart: p_cart,
          p_requester: p_requester,
          p_organisation: p_organisation,
          p_owner: p_owner,
          p_billing: p_billing,
        }
      );

      if (rpcError) {
        throw new Error(`Erreur création commande: ${rpcError.message}`);
      }

      const rpcResult = result;

      if (!rpcResult?.success) {
        throw new Error(
          rpcResult?.error ?? 'Erreur inconnue lors de la création'
        );
      }

      const orderId = rpcResult.order_id;
      const orderNumber = rpcResult.order_number;
      const totalTtc = rpcResult.total_ttc;

      // Envoyer notification email
      try {
        const { data: selectionData } = await supabase
          .from('linkme_selections')
          .select('name, linkme_affiliates(name)')
          .eq('id', selectedSelectionId)
          .single();

        await fetch('/api/emails/notify-enseigne-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderNumber,
            orderId,
            requesterName: p_requester.name,
            requesterEmail: p_requester.email,
            requesterType: 'responsable_enseigne',
            organisationName: newRestaurantForm.tradeName,
            isNewRestaurant: true,
            totalTtc: totalTtc,
            source: 'create_order_modal',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            affiliateName: (selectionData?.linkme_affiliates as any)?.name,
            selectionName: selectionData?.name,
            notes: notes || null,
          }),
        });
      } catch (emailError) {
        console.error('Erreur envoi notification email:', emailError);
      }

      // Invalider les caches
      await queryClient.invalidateQueries({ queryKey: ['linkme-orders'] });
      await queryClient.invalidateQueries({
        queryKey: ['affiliate-orders', affiliate.id],
      });

      toast.success('Demande envoyée !', {
        description: `Commande ${orderNumber} en attente de validation.`,
      });

      handleClose();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erreur inconnue';
      toast.error('Erreur', {
        description: errorMessage,
      });
    }
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

                {/* Section 2: Contacts (si restaurant sélectionné) */}
                {selectedCustomerId && (
                  <ContactsSection
                    organisationId={selectedCustomerId}
                    onContactsComplete={() => setContactsComplete(true)}
                    onContactsIncomplete={() => setContactsComplete(false)}
                    onContactsChange={setPendingContacts}
                  />
                )}

                {/* Section 3: Produits (Layout 2 colonnes: Catalogue + Panier) */}
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
                        {/* Barre de recherche */}
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

                        {/* Onglets catégories */}
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

                        {/* Résultats de recherche */}
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

                        {/* Grille de produits */}
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

                        {/* Pagination */}
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
                            {/* Résumé panier */}
                            <div className="sticky top-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
                              <div className="flex items-center gap-2 mb-4">
                                <ShoppingCart className="h-5 w-5 text-blue-600" />
                                <h4 className="font-semibold text-gray-900">
                                  Panier
                                </h4>
                              </div>

                              <div className="space-y-2 mb-4 max-h-96 overflow-y-auto">
                                {cart.map(item => {
                                  // Calcul du gain avec la SSOT (taux de marque)
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

                              {/* Totaux */}
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

                              {/* Notes */}
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

                {/* Message validation */}
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
                              // Calcul du gain avec la SSOT (taux de marque)
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
                onClick={() => {
                  void handleSubmitExisting().catch(error => {
                    console.error('[CreateOrderModal] Submit failed:', error);
                  });
                }}
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
                Étape {newRestaurantStep}/5
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
              { step: 5, label: 'Validation', icon: Check },
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
          {/* Step 1: Restaurant - Adresse de livraison */}
          {newRestaurantStep === 1 && (
            <div className="max-w-xl mx-auto space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Adresse de livraison du restaurant
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom commercial *
                    </label>
                    <input
                      type="text"
                      autoComplete="organization"
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
                  <div>
                    <AddressAutocomplete
                      label="Adresse du restaurant *"
                      placeholder="Rechercher une adresse..."
                      value={
                        newRestaurantForm.address
                          ? `${newRestaurantForm.address}, ${newRestaurantForm.postalCode} ${newRestaurantForm.city}`
                          : ''
                      }
                      onChange={value => {
                        // L'utilisateur tape manuellement
                        if (!value) {
                          setNewRestaurantForm(prev => ({
                            ...prev,
                            address: '',
                            city: '',
                            postalCode: '',
                            latitude: null,
                            longitude: null,
                          }));
                        }
                      }}
                      onSelect={(address: AddressResult) => {
                        // L'utilisateur sélectionne une adresse depuis l'autocomplete
                        setNewRestaurantForm(prev => ({
                          ...prev,
                          address: address.streetAddress,
                          city: address.city,
                          postalCode: address.postalCode,
                          latitude: address.latitude,
                          longitude: address.longitude,
                        }));
                      }}
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
                        ownerType: 'succursale',
                      }))
                    }
                    className={`p-4 border-2 rounded-xl transition-all ${
                      newRestaurantForm.ownerType === 'succursale'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Building2
                      className={`h-8 w-8 mx-auto mb-2 ${newRestaurantForm.ownerType === 'succursale' ? 'text-green-600' : 'text-gray-400'}`}
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
                {newRestaurantForm.ownerType === 'franchise'
                  ? 'Propriétaire du restaurant (Franchisé)'
                  : 'Responsable du restaurant'}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {newRestaurantForm.ownerType === 'franchise'
                  ? 'Informations du propriétaire franchisé'
                  : 'Informations du responsable de ce restaurant'}
              </p>

              {/* Badge données pré-remplies */}
              {selectedCustomerContacts?.primaryContact && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <p className="text-sm text-blue-700">
                    Données pré-remplies depuis le profil client (modifiables)
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prénom *
                    </label>
                    <input
                      type="text"
                      autoComplete="given-name"
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
                      autoComplete="family-name"
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
                    autoComplete="email"
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
                    autoComplete="tel"
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
                          autoComplete="organization"
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
                Informations de facturation
              </h3>

              {/* Dénomination sociale (franchise uniquement) */}
              {newRestaurantForm.ownerType === 'franchise' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dénomination sociale *
                  </label>
                  <input
                    type="text"
                    autoComplete="organization"
                    value={newRestaurantForm.billingCompanyName}
                    onChange={e =>
                      setNewRestaurantForm(prev => ({
                        ...prev,
                        billingCompanyName: e.target.value,
                      }))
                    }
                    placeholder="Ex: SARL Le Gourmet"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  />
                </div>
              )}

              {/* Adresse de facturation */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-900">
                  Adresse de facturation
                </h4>
                <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={newRestaurantForm.billingUseSameAddress}
                    onChange={e =>
                      setNewRestaurantForm(prev => ({
                        ...prev,
                        billingUseSameAddress: e.target.checked,
                      }))
                    }
                    className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                  />
                  <div>
                    <p className="font-medium text-gray-900">
                      Reprendre l'adresse de livraison
                    </p>
                    <p className="text-sm text-gray-500">
                      {newRestaurantForm.address},{' '}
                      {newRestaurantForm.postalCode} {newRestaurantForm.city}
                    </p>
                  </div>
                </label>

                {!newRestaurantForm.billingUseSameAddress && (
                  <div className="space-y-4 pt-2">
                    <AddressAutocomplete
                      label="Adresse de facturation *"
                      placeholder="Rechercher une adresse..."
                      value={
                        newRestaurantForm.billingAddress
                          ? `${newRestaurantForm.billingAddress}, ${newRestaurantForm.billingPostalCode} ${newRestaurantForm.billingCity}`
                          : ''
                      }
                      onChange={value => {
                        if (!value) {
                          setNewRestaurantForm(prev => ({
                            ...prev,
                            billingAddress: '',
                            billingCity: '',
                            billingPostalCode: '',
                            billingLatitude: null,
                            billingLongitude: null,
                          }));
                        }
                      }}
                      onSelect={(address: AddressResult) => {
                        setNewRestaurantForm(prev => ({
                          ...prev,
                          billingAddress: address.streetAddress,
                          billingCity: address.city,
                          billingPostalCode: address.postalCode,
                          billingLatitude: address.latitude,
                          billingLongitude: address.longitude,
                        }));
                      }}
                    />
                  </div>
                )}
              </div>

              {/* SIRET */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SIRET *
                </label>
                <input
                  type="text"
                  value={newRestaurantForm.billingSiret}
                  onChange={e =>
                    setNewRestaurantForm(prev => ({
                      ...prev,
                      billingSiret: e.target.value.replace(/\s/g, ''),
                    }))
                  }
                  placeholder="123 456 789 00012"
                  maxLength={14}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none font-mono"
                />
                <p className="text-xs text-gray-500 mt-1">
                  14 chiffres sans espaces
                </p>
              </div>

              {/* K-bis (facultatif) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  K-bis (facultatif)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={newRestaurantForm.billingKbisUrl}
                    onChange={e =>
                      setNewRestaurantForm(prev => ({
                        ...prev,
                        billingKbisUrl: e.target.value,
                      }))
                    }
                    placeholder="URL du document K-bis"
                    className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Lien vers le document (Google Drive, Dropbox, etc.)
                </p>
              </div>

              {/* Contact facturation */}
              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium text-gray-900 mb-4">
                  Contact facturation
                </h4>
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
                          autoComplete="given-name"
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
                          autoComplete="family-name"
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
                        autoComplete="email"
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
                        autoComplete="tel"
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
            </div>
          )}

          {/* Step 4: Produits (Layout 2 colonnes: Catalogue + Panier) */}
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

              {/* Produits (même layout que restaurant existant) */}
              {selectedSelectionId && (
                <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b bg-gray-50 rounded-t-xl">
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-green-500" />
                      <h3 className="font-semibold text-gray-900">Produits</h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-[60%_40%] gap-4 p-4">
                    {/* COLONNE GAUCHE: CATALOGUE */}
                    <div className="space-y-4">
                      {/* Barre de recherche */}
                      <ProductFilters
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        branding={{
                          primary_color: '#16a34a',
                          secondary_color: '#15803d',
                          accent_color: '#22c55e',
                          text_color: '#1f2937',
                          background_color: '#ffffff',
                          logo_url: null,
                        }}
                        isSearchOpen={false}
                        onSearchOpenChange={() => {}}
                      />

                      {/* Onglets catégories */}
                      {categories.length > 1 && (
                        <CategoryTabs
                          categories={categories}
                          selectedCategory={selectedCategory}
                          selectedSubcategory={null}
                          onCategoryChange={setSelectedCategory}
                          onSubcategoryChange={() => {}}
                          branding={{
                            primary_color: '#16a34a',
                            secondary_color: '#15803d',
                            accent_color: '#22c55e',
                            text_color: '#1f2937',
                            background_color: '#ffffff',
                            logo_url: null,
                          }}
                          totalCount={products?.length ?? 0}
                        />
                      )}

                      {/* Résultats de recherche */}
                      {(searchQuery || selectedCategory) && (
                        <div className="flex items-center justify-between text-sm">
                          <p className="text-gray-600">
                            {filteredProducts.length} résultat
                            {filteredProducts.length > 1 ? 's' : ''}
                            {searchQuery && ` pour "${searchQuery}"`}
                          </p>
                          <button
                            onClick={() => {
                              setSearchQuery('');
                              setSelectedCategory(null);
                            }}
                            className="text-green-600 hover:underline font-medium"
                          >
                            Effacer les filtres
                          </button>
                        </div>
                      )}

                      {/* Grille de produits */}
                      {productsLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin text-green-500" />
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
                                      ? 'border-green-500 bg-green-50'
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
                                        <span className="w-8 text-center font-semibold text-sm">
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
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
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
                              className="mt-4 text-green-600 hover:underline font-medium"
                            >
                              Voir tous les produits
                            </button>
                          )}
                        </div>
                      )}

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <Pagination
                          currentPage={currentPage}
                          totalPages={totalPages}
                          onPageChange={setCurrentPage}
                          branding={{
                            primary_color: '#16a34a',
                            secondary_color: '#15803d',
                            accent_color: '#22c55e',
                            text_color: '#1f2937',
                          }}
                        />
                      )}
                    </div>

                    {/* COLONNE DROITE: PANIER */}
                    <div className="space-y-4">
                      {cart.length > 0 ? (
                        <div className="sticky top-4 bg-green-50 border border-green-200 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-4">
                            <ShoppingCart className="h-5 w-5 text-green-600" />
                            <h4 className="font-semibold text-gray-900">
                              Panier
                            </h4>
                          </div>

                          <div className="space-y-2 mb-4 max-h-96 overflow-y-auto">
                            {cart.map(item => {
                              // Calcul du gain avec la SSOT (taux de marque)
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
                                      +{(gainEuros * item.quantity).toFixed(2)}{' '}
                                      €
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Totaux */}
                          <div className="border-t border-green-200 pt-4 space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Articles</span>
                              <span className="font-medium">
                                {cart.reduce(
                                  (sum, item) => sum + item.quantity,
                                  0
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Total HT</span>
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
                            <div className="flex justify-between text-base font-bold border-t border-green-200 pt-2">
                              <span className="text-gray-900">Total TTC</span>
                              <span className="text-green-600">
                                {cartTotals.totalTtc.toFixed(2)} €
                              </span>
                            </div>
                            <div className="flex justify-between text-sm bg-amber-50 rounded-lg p-2 border border-amber-200">
                              <span className="text-amber-700 font-medium">
                                Votre commission
                              </span>
                              <span className="text-amber-700 font-bold">
                                +{cartTotals.totalMargin.toFixed(2)} €
                              </span>
                            </div>
                          </div>
                        </div>
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
                </div>
              )}
            </div>
          )}

          {/* Step 5: Validation / Récapitulatif */}
          {newRestaurantStep === 5 && (
            <div className="max-w-3xl mx-auto space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Récapitulatif de la commande
              </h3>

              {/* Récap Restaurant */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <Store className="h-4 w-4 text-green-600" />
                  Restaurant
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Nom commercial</p>
                    <p className="font-medium">{newRestaurantForm.tradeName}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Type</p>
                    <p className="font-medium capitalize">
                      {newRestaurantForm.ownerType === 'franchise'
                        ? 'Franchisé'
                        : 'Propre'}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-500">Adresse de livraison</p>
                    <p className="font-medium">
                      {newRestaurantForm.address},{' '}
                      {newRestaurantForm.postalCode} {newRestaurantForm.city}
                    </p>
                  </div>
                </div>
              </div>

              {/* Récap Demandeur */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-600" />
                  Demandeur de la commande
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Nom complet</p>
                    <p className="font-medium">{requester.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Email</p>
                    <p className="font-medium">{requester.email}</p>
                  </div>
                  {requester.phone && (
                    <div>
                      <p className="text-gray-500">Téléphone</p>
                      <p className="font-medium">{requester.phone}</p>
                    </div>
                  )}
                </div>
                <div className="mt-2 p-2 bg-blue-100 rounded text-xs text-blue-700">
                  ℹ️ Cette personne sera enregistrée comme le demandeur de la
                  commande
                </div>
              </div>

              {/* Récap Propriétaire */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <User className="h-4 w-4 text-green-600" />
                  Propriétaire
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Nom complet</p>
                    <p className="font-medium">
                      {newRestaurantForm.ownerFirstName}{' '}
                      {newRestaurantForm.ownerLastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Email</p>
                    <p className="font-medium">
                      {newRestaurantForm.ownerEmail}
                    </p>
                  </div>
                  {newRestaurantForm.ownerPhone && (
                    <div>
                      <p className="text-gray-500">Téléphone</p>
                      <p className="font-medium">
                        {newRestaurantForm.ownerPhone}
                      </p>
                    </div>
                  )}
                  {newRestaurantForm.ownerType === 'franchise' &&
                    newRestaurantForm.ownerCompanyName && (
                      <div>
                        <p className="text-gray-500">Raison sociale</p>
                        <p className="font-medium">
                          {newRestaurantForm.ownerCompanyName}
                        </p>
                      </div>
                    )}
                </div>
              </div>

              {/* Récap Facturation */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-green-600" />
                  Facturation
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {newRestaurantForm.ownerType === 'franchise' && (
                    <div>
                      <p className="text-gray-500">Dénomination sociale</p>
                      <p className="font-medium">
                        {newRestaurantForm.billingCompanyName || '-'}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-500">SIRET</p>
                    <p className="font-medium font-mono">
                      {newRestaurantForm.billingSiret || '-'}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-500">Adresse de facturation</p>
                    <p className="font-medium">
                      {newRestaurantForm.billingUseSameAddress
                        ? `${newRestaurantForm.address}, ${newRestaurantForm.postalCode} ${newRestaurantForm.city}`
                        : `${newRestaurantForm.billingAddress}, ${newRestaurantForm.billingPostalCode} ${newRestaurantForm.billingCity}`}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-500">Contact facturation</p>
                    <p className="font-medium">
                      {newRestaurantForm.billingSameAsOwner
                        ? `${newRestaurantForm.ownerFirstName} ${newRestaurantForm.ownerLastName} - ${newRestaurantForm.ownerEmail}`
                        : `${newRestaurantForm.billingFirstName} ${newRestaurantForm.billingLastName} - ${newRestaurantForm.billingEmail}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Récap Panier */}
              <div className="bg-white border rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b">
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-green-600" />
                    Panier ({cart.reduce(
                      (sum, item) => sum + item.quantity,
                      0
                    )}{' '}
                    article
                    {cart.reduce((sum, item) => sum + item.quantity, 0) > 1
                      ? 's'
                      : ''}
                    )
                  </h4>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                    <tr>
                      <th className="px-4 py-2 text-left">Produit</th>
                      <th className="px-4 py-2 text-center">Qté</th>
                      <th className="px-4 py-2 text-right">Prix unit.</th>
                      <th className="px-4 py-2 text-right">Total HT</th>
                      <th className="px-4 py-2 text-right">Marge</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {cart.map(item => {
                      const lineHt = item.quantity * item.unitPriceHt;
                      // Calcul du gain avec la SSOT (taux de marque)
                      const { gainEuros } = calculateMargin({
                        basePriceHt: item.basePriceHt,
                        marginRate: item.marginRate,
                      });
                      const lineMargin = gainEuros * item.quantity;
                      return (
                        <tr key={item.selectionItemId}>
                          <td className="px-4 py-2">
                            <p className="font-medium text-gray-900">
                              {item.productName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {item.productSku}
                            </p>
                          </td>
                          <td className="px-4 py-2 text-center">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-2 text-right">
                            {item.unitPriceHt.toFixed(2)} €
                          </td>
                          <td className="px-4 py-2 text-right font-medium">
                            {lineHt.toFixed(2)} €
                          </td>
                          <td className="px-4 py-2 text-right text-green-600">
                            +{lineMargin.toFixed(2)} €
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="px-4 py-3 bg-gray-50 border-t">
                  <div className="flex justify-end">
                    <div className="w-64 space-y-1 text-sm">
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
                      <div className="flex justify-between font-bold text-base pt-1 border-t">
                        <span>Total TTC</span>
                        <span>{cartTotals.totalTtc.toFixed(2)} €</span>
                      </div>
                      <div className="flex justify-between text-green-600 pt-1 border-t">
                        <span className="font-medium">Votre commission</span>
                        <span className="font-bold">
                          +{cartTotals.totalMargin.toFixed(2)} €
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

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

              {/* Preview Notes en temps réel */}
              {notes && notes.trim() !== '' && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
                  <h4 className="text-xs font-medium text-blue-700 uppercase tracking-wide flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" />
                    Aperçu de vos notes
                  </h4>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
                    {notes}
                  </p>
                </div>
              )}

              {/* Avertissement validation */}
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800">
                    Validation requise
                  </p>
                  <p className="text-sm text-amber-700 mt-0.5">
                    Votre commande sera envoyée à l'équipe pour validation avant
                    traitement.
                  </p>
                </div>
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
              disabled={!canSubmitNew || createOrder.isPending}
              className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {createOrder.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Check className="h-5 w-5" />
              )}
              Valider la commande
            </button>
          )}
        </div>
      </div>

      {/* Modal de confirmation (double-check) */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowConfirmModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b bg-gradient-to-r from-green-600 to-green-700">
              <h3 className="text-lg font-semibold text-white">
                Confirmer la commande ?
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-600">
                Vous êtes sur le point de soumettre une commande pour :
              </p>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p className="font-semibold text-gray-900">
                  {newRestaurantForm.tradeName}
                </p>
                <p className="text-sm text-gray-600">
                  {newRestaurantForm.address}, {newRestaurantForm.postalCode}{' '}
                  {newRestaurantForm.city}
                </p>
                <div className="pt-2 border-t">
                  <p className="text-sm text-gray-500">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}{' '}
                    article(s)
                  </p>
                  <p className="font-bold text-gray-900">
                    {cartTotals.totalTtc.toFixed(2)} € TTC
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <p>La commande sera envoyée à l'équipe pour validation.</p>
              </div>
            </div>
            <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  void handleSubmitNew().catch(error => {
                    console.error(
                      '[CreateOrderModal] Submit new failed:',
                      error
                    );
                  });
                }}
                disabled={createOrder.isPending}
                className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium transition-colors"
              >
                {createOrder.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Check className="h-5 w-5" />
                )}
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
