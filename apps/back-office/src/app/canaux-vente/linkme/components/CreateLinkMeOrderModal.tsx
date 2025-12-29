'use client';

import { useState, useEffect, useMemo } from 'react';

import { CategoryFilterCombobox } from '@verone/categories';
import { cn } from '@verone/utils';
import {
  X,
  ShoppingCart,
  Building2,
  User,
  Package,
  Plus,
  Minus,
  Trash2,
  AlertCircle,
  Check,
  Loader2,
  Search,
  Store,
  Layers,
  Eye,
} from 'lucide-react';

import {
  useLinkMeAffiliates,
  useLinkMeSelectionsByAffiliate,
  type AffiliateType,
  type LinkMeAffiliate,
} from '../hooks/use-linkme-affiliates';
import {
  useLinkMeAffiliateCustomers,
  useCreateEnseigneOrganisation,
  useCreateEnseigneIndividualCustomer,
  type EnseigneOrganisationCustomer,
  type EnseigneIndividualCustomer,
} from '../hooks/use-linkme-enseigne-customers';
import {
  useCreateLinkMeOrder,
  type CreateLinkMeOrderInput,
  type LinkMeOrderItemInput,
} from '../hooks/use-linkme-orders';
import {
  useLinkMeSelection,
  type SelectionItem,
} from '../hooks/use-linkme-selections';

interface CreateLinkMeOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Pré-sélectionner un affilié */
  preselectedAffiliateId?: string;
}

type CustomerType = 'organization' | 'individual';

interface CartItem extends LinkMeOrderItemInput {
  id: string;
  tax_rate: number; // TVA par ligne (0.20 = 20%)
}

/**
 * Modal de création de commande LinkMe
 * Formulaire tout-en-un (style SalesOrderFormModal)
 * Workflow: Type affilié → Affilié → Sélection → Client → Produits → Validation
 */
export function CreateLinkMeOrderModal({
  isOpen,
  onClose,
  preselectedAffiliateId,
}: CreateLinkMeOrderModalProps) {
  const createOrder = useCreateLinkMeOrder();

  // Type d'affilié sélectionné
  const [affiliateType, setAffiliateType] = useState<AffiliateType | null>(
    null
  );
  const [selectedAffiliateId, setSelectedAffiliateId] = useState<string>(
    preselectedAffiliateId || ''
  );
  const [selectedSelectionId, setSelectedSelectionId] = useState<string>('');

  // Client
  const [customerType, setCustomerType] =
    useState<CustomerType>('organization');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');

  // Panier
  const [cart, setCart] = useState<CartItem[]>([]);

  // Frais additionnels
  const [shippingCostHt, setShippingCostHt] = useState<number>(0);
  const [handlingCostHt, setHandlingCostHt] = useState<number>(0);
  const [insuranceCostHt, setInsuranceCostHt] = useState<number>(0);
  const [fraisTaxRate, setFraisTaxRate] = useState<number>(0.2); // TVA frais (defaut 20%)

  // Recherche produits (Section 5)
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<
    string | undefined
  >(undefined);

  // Recherche clients et formulaire création
  const [searchQuery, setSearchQuery] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Preview sélection
  const [previewSelectionId, setPreviewSelectionId] = useState<string | null>(
    null
  );
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerFirstName, setNewCustomerFirstName] = useState('');
  const [newCustomerLastName, setNewCustomerLastName] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');

  // Hooks data
  const { data: affiliates, isLoading: affiliatesLoading } =
    useLinkMeAffiliates(affiliateType || undefined);
  const { data: selections, isLoading: selectionsLoading } =
    useLinkMeSelectionsByAffiliate(selectedAffiliateId || null);
  const { data: selectionDetails, isLoading: selectionDetailsLoading } =
    useLinkMeSelection(selectedSelectionId || null);

  // Preview sélection
  const { data: previewSelection, isLoading: previewLoading } =
    useLinkMeSelection(previewSelectionId);

  // Récupérer l'enseigne_id de l'affilié sélectionné pour les clients
  const selectedAffiliate = useMemo(() => {
    return affiliates?.find(a => a.id === selectedAffiliateId);
  }, [affiliates, selectedAffiliateId]);

  // Clients selon le type d'affilié (enseigne ou org_independante)
  const customers = useLinkMeAffiliateCustomers(
    selectedAffiliate
      ? {
          id: selectedAffiliate.id,
          enseigne_id: selectedAffiliate.enseigne_id,
          organisation_id: selectedAffiliate.organisation_id,
          affiliate_type: selectedAffiliate.type, // 'type' dans LinkMeAffiliate
        }
      : null
  );

  // Mutations création client
  const createOrganisation = useCreateEnseigneOrganisation();
  const createIndividualCustomer = useCreateEnseigneIndividualCustomer();

  // Reset à l'ouverture
  useEffect(() => {
    if (isOpen) {
      setAffiliateType(null);
      setSelectedAffiliateId(preselectedAffiliateId || '');
      setSelectedSelectionId('');
      setCustomerType('organization');
      setSelectedCustomerId('');
      setCart([]);
      setSearchQuery('');
      setInternalNotes('');
      setShowCreateForm(false);
      setNewCustomerName('');
      setNewCustomerFirstName('');
      setNewCustomerLastName('');
      setNewCustomerEmail('');
      setNewCustomerPhone('');
    }
  }, [isOpen, preselectedAffiliateId]);

  // Reset affilié quand type change
  useEffect(() => {
    setSelectedAffiliateId('');
    setSelectedSelectionId('');
    setSelectedCustomerId('');
    setCart([]);
  }, [affiliateType]);

  // Reset sélection et panier quand affilié change
  useEffect(() => {
    setSelectedSelectionId('');
    setSelectedCustomerId('');
    setCart([]);
  }, [selectedAffiliateId]);

  // Reset panier quand sélection change
  useEffect(() => {
    setCart([]);
  }, [selectedSelectionId]);

  // Client sélectionné
  const selectedCustomer = useMemo(() => {
    if (!selectedCustomerId) return null;
    if (customerType === 'organization') {
      return customers.organisations.find(o => o.id === selectedCustomerId);
    }
    return customers.individuals.find(i => i.id === selectedCustomerId);
  }, [customerType, selectedCustomerId, customers]);

  // Filtrage clients
  const filteredOrganisations = useMemo(() => {
    if (!searchQuery.trim()) return customers.organisations;
    const q = searchQuery.toLowerCase();
    return customers.organisations.filter(
      o =>
        o.name.toLowerCase().includes(q) ||
        o.legal_name.toLowerCase().includes(q) ||
        o.email?.toLowerCase().includes(q)
    );
  }, [customers.organisations, searchQuery]);

  const filteredIndividuals = useMemo(() => {
    if (!searchQuery.trim()) return customers.individuals;
    const q = searchQuery.toLowerCase();
    return customers.individuals.filter(
      i =>
        i.full_name.toLowerCase().includes(q) ||
        i.email?.toLowerCase().includes(q)
    );
  }, [customers.individuals, searchQuery]);

  // Filtrage produits de la sélection (texte + catégorie)
  const filteredSelectionItems = useMemo(() => {
    if (!selectionDetails?.items) return [];

    return selectionDetails.items.filter(item => {
      // Filtre par recherche texte (nom ou SKU)
      const matchesSearch =
        !productSearchQuery.trim() ||
        item.product?.name
          ?.toLowerCase()
          .includes(productSearchQuery.toLowerCase()) ||
        item.product?.sku
          ?.toLowerCase()
          .includes(productSearchQuery.toLowerCase());

      // Filtre par sous-catégorie (si sélectionnée)
      const matchesCategory =
        !selectedSubcategoryId ||
        item.product?.subcategory_id === selectedSubcategoryId;

      return matchesSearch && matchesCategory;
    });
  }, [selectionDetails?.items, productSearchQuery, selectedSubcategoryId]);

  // Création client
  // Supporte les enseignes ET les organisations indépendantes
  const handleCreateCustomer = async () => {
    // Pour les org indépendantes, on n'a pas d'enseigne_id mais on a l'organisation_id
    const hasEnseigne = !!selectedAffiliate?.enseigne_id;
    const hasOrganisation = !!selectedAffiliate?.organisation_id;

    // Au moins l'un des deux doit être présent
    if (!hasEnseigne && !hasOrganisation) {
      console.error('Ni enseigne_id ni organisation_id disponible');
      return;
    }

    try {
      if (customerType === 'organization') {
        if (!newCustomerName.trim()) return;
        const result = await createOrganisation.mutateAsync({
          enseigne_id: selectedAffiliate.enseigne_id || '',
          legal_name: newCustomerName.trim(),
          email: newCustomerEmail.trim() || undefined,
          phone: newCustomerPhone.trim() || undefined,
          source_type: 'linkme',
          source_affiliate_id: selectedAffiliateId || undefined,
        });
        setSelectedCustomerId(result.id);
        customers.refetch();
      } else {
        if (!newCustomerFirstName.trim() || !newCustomerLastName.trim()) return;
        // Pour les org indépendantes, on passe organisation_id au lieu de enseigne_id
        const result = await createIndividualCustomer.mutateAsync({
          enseigne_id: selectedAffiliate.enseigne_id || null,
          organisation_id: hasEnseigne
            ? null
            : selectedAffiliate.organisation_id,
          first_name: newCustomerFirstName.trim(),
          last_name: newCustomerLastName.trim(),
          email: newCustomerEmail.trim() || undefined,
          phone: newCustomerPhone.trim() || undefined,
          source_type: 'linkme',
          source_affiliate_id: selectedAffiliateId || undefined,
        });
        setSelectedCustomerId(result.id);
        customers.refetch();
      }
      setShowCreateForm(false);
      setNewCustomerName('');
      setNewCustomerFirstName('');
      setNewCustomerLastName('');
      setNewCustomerEmail('');
      setNewCustomerPhone('');
    } catch (error) {
      console.error('Erreur création client:', error);
    }
  };

  // Totaux panier avec TVA par ligne
  const cartTotals = useMemo(() => {
    // Helper pour arrondir les montants monétaires
    const roundMoney = (value: number): number => Math.round(value * 100) / 100;

    let productsHt = 0;
    let totalTva = 0;
    let totalRetrocession = 0;

    for (const item of cart) {
      const lineHt = roundMoney(item.quantity * item.unit_price_ht);
      const lineTva = roundMoney(lineHt * (item.tax_rate || 0.2));
      productsHt = roundMoney(productsHt + lineHt);
      totalTva = roundMoney(totalTva + lineTva);
      // Commission calculee sur base_price_ht (135EUR), pas sur unit_price_ht (168.75EUR)
      totalRetrocession = roundMoney(
        totalRetrocession +
          item.quantity * item.base_price_ht * item.retrocession_rate
      );
    }

    // Frais additionnels avec TVA configurable
    const totalFrais = roundMoney(
      shippingCostHt + handlingCostHt + insuranceCostHt
    );
    const totalHt = roundMoney(productsHt + totalFrais);
    const totalTvaFrais = roundMoney(totalFrais * fraisTaxRate);
    const totalTtc = roundMoney(totalHt + totalTva + totalTvaFrais);

    return {
      productsHt,
      totalFrais,
      totalHt,
      totalTva: roundMoney(totalTva + totalTvaFrais),
      totalTtc,
      totalRetrocession,
    };
  }, [cart, shippingCostHt, handlingCostHt, insuranceCostHt, fraisTaxRate]);

  // Ajouter produit au panier
  const addProductFromSelection = (item: SelectionItem) => {
    // Helper pour arrondir les montants monétaires
    const roundMoney = (value: number): number => Math.round(value * 100) / 100;

    const existing = cart.find(c => c.product_id === item.product_id);
    if (existing) {
      setCart(
        cart.map(c =>
          c.product_id === item.product_id
            ? { ...c, quantity: c.quantity + 1 }
            : c
        )
      );
      return;
    }

    // IMPORTANT: Calculer le prix affilié HT avec TAUX DE MARQUE
    // Formule taux de marque: Prix = base / (1 - tauxMarque) × (1 + commission)
    // - commission_rate: ex 10% (channel_pricing.channel_commission_rate)
    // - margin_rate: ex 15% (taux de marque affilié)
    // Exemple: (55.50 / 0.85) × 1.10 = 65.29 × 1.10 = 71.82€
    const commissionRate = (item.commission_rate || 0) / 100;
    const marginRate = item.margin_rate / 100;
    const sellingPrice = roundMoney(
      (item.base_price_ht / (1 - marginRate)) * (1 + commissionRate)
    );
    const retrocessionRate = marginRate;

    const newItem: CartItem = {
      id: `${item.product_id}-${Date.now()}`,
      product_id: item.product_id,
      product_name: item.product?.name || 'Produit inconnu',
      sku: item.product?.sku || '',
      quantity: 1,
      unit_price_ht: sellingPrice,
      tax_rate: 0.2, // TVA 20% par defaut
      base_price_ht: item.base_price_ht, // Prix de base pour calcul commission
      retrocession_rate: retrocessionRate,
      linkme_selection_item_id: item.id,
    };
    setCart([...cart, newItem]);
  };

  // Modifier quantité
  const updateQuantity = (itemId: string, delta: number) => {
    setCart(
      cart
        .map(item => {
          if (item.id === itemId) {
            const newQty = Math.max(0, item.quantity + delta);
            return newQty === 0 ? null : { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  // Supprimer du panier
  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  // Validation formulaire
  const canSubmit =
    selectedAffiliateId &&
    selectedSelectionId &&
    selectedCustomerId &&
    cart.length > 0;

  // Soumettre commande
  const handleSubmit = async () => {
    if (!canSubmit) return;

    const input: CreateLinkMeOrderInput = {
      customer_type: customerType,
      customer_organisation_id:
        customerType === 'organization' ? selectedCustomerId : null,
      individual_customer_id:
        customerType === 'individual' ? selectedCustomerId : null,
      affiliate_id: selectedAffiliateId,
      items: cart.map(item => ({
        product_id: item.product_id,
        product_name: item.product_name,
        sku: item.sku,
        quantity: item.quantity,
        unit_price_ht: item.unit_price_ht,
        tax_rate: item.tax_rate || 0.2, // TVA par ligne
        base_price_ht: item.base_price_ht,
        retrocession_rate: item.retrocession_rate,
        linkme_selection_item_id: item.linkme_selection_item_id,
      })),
      internal_notes: internalNotes || undefined,
      // Frais additionnels
      shipping_cost_ht: shippingCostHt || 0,
      handling_cost_ht: handlingCostHt || 0,
      insurance_cost_ht: insuranceCostHt || 0,
      frais_tax_rate: fraisTaxRate,
    };

    try {
      await createOrder.mutateAsync(input);
      onClose();
    } catch (error) {
      console.error('Erreur création commande:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ShoppingCart className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">
                  Nouvelle commande LinkMe
                </h2>
                <p className="text-sm text-gray-500">
                  Créer une commande depuis une sélection affilié
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content - Formulaire tout-en-un */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Section 1: Type d'affilié */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Type d&apos;affilié *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setAffiliateType('enseigne')}
                  className={cn(
                    'flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left',
                    affiliateType === 'enseigne'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <Store
                    className={cn(
                      'h-5 w-5',
                      affiliateType === 'enseigne'
                        ? 'text-purple-600'
                        : 'text-gray-400'
                    )}
                  />
                  <div>
                    <p
                      className={cn(
                        'font-medium',
                        affiliateType === 'enseigne'
                          ? 'text-purple-700'
                          : 'text-gray-700'
                      )}
                    >
                      Enseigne
                    </p>
                    <p className="text-xs text-gray-500">
                      Chaîne de magasins affiliée
                    </p>
                  </div>
                  {affiliateType === 'enseigne' && (
                    <Check className="h-5 w-5 text-purple-600 ml-auto" />
                  )}
                </button>

                <button
                  onClick={() => setAffiliateType('org_independante')}
                  className={cn(
                    'flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left',
                    affiliateType === 'org_independante'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <Building2
                    className={cn(
                      'h-5 w-5',
                      affiliateType === 'org_independante'
                        ? 'text-purple-600'
                        : 'text-gray-400'
                    )}
                  />
                  <div>
                    <p
                      className={cn(
                        'font-medium',
                        affiliateType === 'org_independante'
                          ? 'text-purple-700'
                          : 'text-gray-700'
                      )}
                    >
                      Organisation indépendante
                    </p>
                    <p className="text-xs text-gray-500">
                      Entreprise affiliée autonome
                    </p>
                  </div>
                  {affiliateType === 'org_independante' && (
                    <Check className="h-5 w-5 text-purple-600 ml-auto" />
                  )}
                </button>
              </div>
            </div>

            {/* Section 2: Sélection affilié */}
            {affiliateType && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Affilié *
                </label>
                {affiliatesLoading ? (
                  <div className="flex items-center gap-2 py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                    <span className="text-sm text-gray-500">
                      Chargement des affiliés...
                    </span>
                  </div>
                ) : affiliates && affiliates.length > 0 ? (
                  <div className="grid gap-2 max-h-40 overflow-y-auto">
                    {affiliates.map(affiliate => (
                      <button
                        key={affiliate.id}
                        onClick={() => setSelectedAffiliateId(affiliate.id)}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left',
                          selectedAffiliateId === affiliate.id
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        )}
                      >
                        {affiliate.logo_url ? (
                          <img
                            src={affiliate.logo_url}
                            alt={affiliate.display_name}
                            className="w-10 h-10 object-cover rounded"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                            <Store className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="font-medium">
                            {affiliate.display_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {affiliate.enseigne_name ||
                              affiliate.organisation_name ||
                              'Affilié LinkMe'}{' '}
                            • {affiliate.selections_count} sélection
                            {affiliate.selections_count > 1 ? 's' : ''}
                          </p>
                        </div>
                        {selectedAffiliateId === affiliate.id && (
                          <Check className="h-5 w-5 text-purple-600" />
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-amber-600 py-2">
                    <AlertCircle className="h-4 w-4 inline mr-1" />
                    Aucun affilié de ce type disponible
                  </p>
                )}
              </div>
            )}

            {/* Section 3: Sélection (mini-boutique) */}
            {selectedAffiliateId && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  <Layers className="h-4 w-4 inline mr-1" />
                  Sélection (mini-boutique) *
                </label>
                {selectionsLoading ? (
                  <div className="flex items-center gap-2 py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-gray-500">
                      Chargement des sélections...
                    </span>
                  </div>
                ) : selections && selections.length > 0 ? (
                  <div className="grid gap-2 max-h-40 overflow-y-auto">
                    {selections.map((selection: any) => (
                      <div
                        key={selection.id}
                        className="flex items-center gap-2"
                      >
                        <button
                          onClick={() => setSelectedSelectionId(selection.id)}
                          className={cn(
                            'flex-1 flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left',
                            selectedSelectionId === selection.id
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200 hover:border-gray-300'
                          )}
                        >
                          <Layers
                            className={cn(
                              'h-5 w-5',
                              selectedSelectionId === selection.id
                                ? 'text-purple-600'
                                : 'text-gray-400'
                            )}
                          />
                          <div className="flex-1">
                            <p className="font-medium">{selection.name}</p>
                            <p className="text-xs text-gray-500">
                              {selection.products_count || 0} produit
                              {(selection.products_count || 0) > 1 ? 's' : ''}
                            </p>
                          </div>
                          {selectedSelectionId === selection.id && (
                            <Check className="h-5 w-5 text-purple-600" />
                          )}
                        </button>
                        {/* Bouton preview */}
                        <button
                          onClick={() => setPreviewSelectionId(selection.id)}
                          className="p-2 hover:bg-purple-100 rounded-lg transition-colors border border-gray-200"
                          title="Aperçu des produits"
                        >
                          <Eye className="h-4 w-4 text-gray-500 hover:text-purple-600" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-amber-600 py-2">
                    <AlertCircle className="h-4 w-4 inline mr-1" />
                    Aucune sélection disponible pour cet affilié
                  </p>
                )}
              </div>
            )}

            {/* Section 4: Client */}
            {selectedSelectionId && selectedAffiliateId && (
              <div className="space-y-3 border-t pt-6">
                <label className="block text-sm font-medium text-gray-700">
                  Client *
                </label>

                {/* Type de client */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      setCustomerType('organization');
                      setSelectedCustomerId('');
                    }}
                    className={cn(
                      'flex items-center gap-2 p-3 rounded-lg border-2 transition-all',
                      customerType === 'organization'
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <Building2
                      className={cn(
                        'h-5 w-5',
                        customerType === 'organization'
                          ? 'text-purple-600'
                          : 'text-gray-400'
                      )}
                    />
                    <span
                      className={cn(
                        'font-medium',
                        customerType === 'organization'
                          ? 'text-purple-700'
                          : 'text-gray-600'
                      )}
                    >
                      Organisation
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      setCustomerType('individual');
                      setSelectedCustomerId('');
                    }}
                    className={cn(
                      'flex items-center gap-2 p-3 rounded-lg border-2 transition-all',
                      customerType === 'individual'
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <User
                      className={cn(
                        'h-5 w-5',
                        customerType === 'individual'
                          ? 'text-purple-600'
                          : 'text-gray-400'
                      )}
                    />
                    <span
                      className={cn(
                        'font-medium',
                        customerType === 'individual'
                          ? 'text-purple-700'
                          : 'text-gray-600'
                      )}
                    >
                      Particulier
                    </span>
                  </button>
                </div>

                {/* Recherche + Nouveau */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Rechercher un client..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className={cn(
                      'flex items-center gap-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors',
                      showCreateForm
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    )}
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Nouveau</span>
                  </button>
                </div>

                {/* Formulaire création client */}
                {showCreateForm && (
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg space-y-3">
                    <p className="text-sm font-medium text-purple-800">
                      {customerType === 'organization'
                        ? 'Nouvelle organisation'
                        : 'Nouveau particulier'}
                    </p>

                    {customerType === 'organization' ? (
                      <input
                        type="text"
                        value={newCustomerName}
                        onChange={e => setNewCustomerName(e.target.value)}
                        placeholder="Nom de l'organisation *"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={newCustomerFirstName}
                          onChange={e =>
                            setNewCustomerFirstName(e.target.value)
                          }
                          placeholder="Prénom *"
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <input
                          type="text"
                          value={newCustomerLastName}
                          onChange={e => setNewCustomerLastName(e.target.value)}
                          placeholder="Nom *"
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="email"
                        value={newCustomerEmail}
                        onChange={e => setNewCustomerEmail(e.target.value)}
                        placeholder="Email"
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <input
                        type="tel"
                        value={newCustomerPhone}
                        onChange={e => setNewCustomerPhone(e.target.value)}
                        placeholder="Téléphone"
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={handleCreateCustomer}
                        disabled={
                          createOrganisation.isPending ||
                          createIndividualCustomer.isPending ||
                          (customerType === 'organization' &&
                            !newCustomerName.trim()) ||
                          (customerType === 'individual' &&
                            (!newCustomerFirstName.trim() ||
                              !newCustomerLastName.trim()))
                        }
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                      >
                        {createOrganisation.isPending ||
                        createIndividualCustomer.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Création...
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4" />
                            Créer et sélectionner
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setShowCreateForm(false)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white text-sm"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}

                {/* Liste clients */}
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {customers.isLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                    </div>
                  ) : customerType === 'organization' ? (
                    filteredOrganisations.length > 0 ? (
                      filteredOrganisations.map(org => (
                        <button
                          key={org.id}
                          onClick={() => setSelectedCustomerId(org.id)}
                          className={cn(
                            'w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left',
                            selectedCustomerId === org.id
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200 hover:border-gray-300'
                          )}
                        >
                          <Building2 className="h-4 w-4 text-gray-400" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{org.name}</p>
                            <p className="text-xs text-gray-500 truncate">
                              {org.email || org.city || "Pas d'email"}
                            </p>
                          </div>
                          {selectedCustomerId === org.id && (
                            <Check className="h-4 w-4 text-purple-600" />
                          )}
                        </button>
                      ))
                    ) : (
                      <p className="text-center text-gray-500 py-4">
                        Aucune organisation trouvée
                      </p>
                    )
                  ) : filteredIndividuals.length > 0 ? (
                    filteredIndividuals.map(individual => (
                      <button
                        key={individual.id}
                        onClick={() => setSelectedCustomerId(individual.id)}
                        className={cn(
                          'w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left',
                          selectedCustomerId === individual.id
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        )}
                      >
                        <User className="h-4 w-4 text-gray-400" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {individual.full_name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {individual.email ||
                              individual.city ||
                              "Pas d'email"}
                          </p>
                        </div>
                        {selectedCustomerId === individual.id && (
                          <Check className="h-4 w-4 text-purple-600" />
                        )}
                      </button>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-4">
                      Aucun particulier trouvé
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Section 4 bis: Résumé client sélectionné */}
            {selectedCustomer && (
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      {customerType === 'organization' ? (
                        <Building2 className="h-5 w-5 text-purple-600" />
                      ) : (
                        <User className="h-5 w-5 text-purple-600" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold text-purple-900">
                        {customerType === 'organization'
                          ? (selectedCustomer as any).name ||
                            (selectedCustomer as any).legal_name
                          : (selectedCustomer as any).full_name}
                      </p>
                      {(selectedCustomer as any).email && (
                        <p className="text-sm text-purple-700">
                          📧 {(selectedCustomer as any).email}
                        </p>
                      )}
                      {(selectedCustomer as any).phone && (
                        <p className="text-sm text-purple-700">
                          📞 {(selectedCustomer as any).phone}
                        </p>
                      )}
                      {((selectedCustomer as any).address_line1 ||
                        (selectedCustomer as any).city) && (
                        <p className="text-sm text-purple-700">
                          📍{' '}
                          {[
                            (selectedCustomer as any).address_line1,
                            (selectedCustomer as any).postal_code,
                            (selectedCustomer as any).city,
                          ]
                            .filter(Boolean)
                            .join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedCustomerId('')}
                    className="text-xs text-purple-600 hover:text-purple-800 underline"
                  >
                    Modifier
                  </button>
                </div>
              </div>
            )}

            {/* Section 4 ter: Frais additionnels */}
            {selectedSelectionId && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Frais additionnels (HT)
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {/* Livraison */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Livraison
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={shippingCostHt || ''}
                        onChange={e =>
                          setShippingCostHt(
                            e.target.value ? parseFloat(e.target.value) : 0
                          )
                        }
                        placeholder="0.00"
                        className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                        EUR
                      </span>
                    </div>
                  </div>

                  {/* Manutention */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Manutention
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={handlingCostHt || ''}
                        onChange={e =>
                          setHandlingCostHt(
                            e.target.value ? parseFloat(e.target.value) : 0
                          )
                        }
                        placeholder="0.00"
                        className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                        EUR
                      </span>
                    </div>
                  </div>

                  {/* Assurance */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Assurance
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={insuranceCostHt || ''}
                        onChange={e =>
                          setInsuranceCostHt(
                            e.target.value ? parseFloat(e.target.value) : 0
                          )
                        }
                        placeholder="0.00"
                        className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                        EUR
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-xs text-gray-500 mb-2">
                    Taux de TVA sur les frais
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { value: 0.2, label: '20%' },
                      { value: 0.1, label: '10%' },
                      { value: 0.055, label: '5,5%' },
                      { value: 0, label: '0%' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFraisTaxRate(opt.value)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg border text-sm transition-all',
                          fraisTaxRate === opt.value
                            ? 'border-purple-500 bg-purple-50 text-purple-700 font-medium'
                            : 'border-gray-200 hover:border-gray-300 text-gray-600'
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Section 5: Produits de la sélection */}
            {selectedSelectionId && selectedCustomerId && (
              <div className="space-y-3 border-t pt-6">
                <label className="block text-sm font-medium text-gray-700">
                  <Package className="h-4 w-4 inline mr-1" />
                  Produits disponibles ({selectionDetails?.items?.length || 0})
                </label>

                {/* Barre de recherche produits + Filtre catégorie */}
                <div className="flex gap-2">
                  {/* Recherche texte */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={productSearchQuery}
                      onChange={e => setProductSearchQuery(e.target.value)}
                      placeholder="Rechercher (nom ou SKU)..."
                      className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    {productSearchQuery && (
                      <button
                        onClick={() => setProductSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Filtre hiérarchique par catégorie */}
                  <CategoryFilterCombobox
                    value={selectedSubcategoryId}
                    onValueChange={setSelectedSubcategoryId}
                    placeholder="Filtrer par catégorie..."
                    entityType="products"
                    className="w-64"
                  />
                </div>

                {/* Indicateur de filtres actifs */}
                {(productSearchQuery || selectedSubcategoryId) && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>
                      {filteredSelectionItems.length} produit(s) trouvé(s)
                    </span>
                    {(productSearchQuery || selectedSubcategoryId) && (
                      <button
                        onClick={() => {
                          setProductSearchQuery('');
                          setSelectedSubcategoryId(undefined);
                        }}
                        className="text-purple-600 hover:underline"
                      >
                        Réinitialiser les filtres
                      </button>
                    )}
                  </div>
                )}

                {selectionDetailsLoading ? (
                  <div className="flex items-center gap-2 py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-gray-500">
                      Chargement des produits...
                    </span>
                  </div>
                ) : filteredSelectionItems.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                    {filteredSelectionItems.map(item => {
                      const isInCart = cart.some(
                        c => c.product_id === item.product_id
                      );
                      // margin_rate et commission_rate sont en POURCENTAGE
                      // Taux de marque: Prix = base / (1 - tauxMarque) × (1 + commission)
                      const commissionRate = (item.commission_rate || 0) / 100;
                      const marginRate = item.margin_rate / 100;
                      const sellingPrice =
                        (item.base_price_ht / (1 - marginRate)) *
                        (1 + commissionRate);
                      return (
                        <button
                          key={item.id}
                          onClick={() => addProductFromSelection(item)}
                          className={cn(
                            'flex items-center gap-3 p-2 rounded-lg border transition-all text-left',
                            isInCart
                              ? 'border-green-300 bg-green-50'
                              : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                          )}
                        >
                          {item.product_image_url ? (
                            <img
                              src={item.product_image_url}
                              alt={item.product?.name || ''}
                              className="w-10 h-10 object-cover rounded"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                              <Package className="h-4 w-4 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {item.product?.name || 'Produit'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {sellingPrice.toFixed(2)}€ HT • Marge{' '}
                              {item.margin_rate.toFixed(0)}%
                            </p>
                          </div>
                          {isInCart ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Plus className="h-4 w-4 text-purple-600" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 py-2">
                    {productSearchQuery.trim()
                      ? `Aucun produit ne correspond à "${productSearchQuery}"`
                      : 'Aucun produit dans cette sélection'}
                  </p>
                )}
              </div>
            )}

            {/* Section 6: Panier */}
            {cart.length > 0 && (
              <div className="space-y-3 border-t pt-6">
                <p className="text-sm font-medium text-gray-700">
                  Panier ({cart.length} produit{cart.length > 1 ? 's' : ''})
                </p>
                <div className="space-y-2">
                  {cart.map(item => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <Package className="h-4 w-4 text-gray-400" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {item.product_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.unit_price_ht.toFixed(2)}€ HT × {item.quantity}{' '}
                          = {(item.unit_price_ht * item.quantity).toFixed(2)}€
                          HT
                        </p>
                        <p className="text-xs text-orange-600">
                          Commission:{' '}
                          {(item.retrocession_rate * 100).toFixed(0)}% (
                          {(
                            item.base_price_ht *
                            item.quantity *
                            item.retrocession_rate
                          ).toFixed(2)}
                          €)
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-1 hover:bg-red-100 rounded text-red-600 ml-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totaux */}
                <div className="border-t border-gray-200 pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total HT</span>
                    <span className="font-medium">
                      {cartTotals.totalHt.toFixed(2)}€
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">TVA</span>
                    <span>{cartTotals.totalTva.toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium">
                    <span>Total TTC</span>
                    <span>{cartTotals.totalTtc.toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between text-sm text-orange-600">
                    <span>Commissions affilié</span>
                    <span>-{cartTotals.totalRetrocession.toFixed(2)}€</span>
                  </div>
                </div>
              </div>
            )}

            {/* Section 7: Notes */}
            {selectedSelectionId && (
              <div className="space-y-2 border-t pt-6">
                <label className="block text-sm font-medium text-gray-700">
                  Notes internes (optionnel)
                </label>
                <textarea
                  value={internalNotes}
                  onChange={e => setInternalNotes(e.target.value)}
                  placeholder="Notes visibles uniquement par l'équipe..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            )}

            {/* Section 7 bis: Récapitulatif - Design 2025 */}
            {canSubmit && (
              <div className="space-y-4 border-t pt-6">
                <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
                  Récapitulatif de la commande
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  {/* Card Client */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 mb-3">
                      {customerType === 'organization' ? (
                        <Building2 className="h-4 w-4 text-slate-400" />
                      ) : (
                        <User className="h-4 w-4 text-slate-400" />
                      )}
                      <span className="text-xs font-medium text-slate-500 uppercase">
                        Client
                      </span>
                    </div>
                    <p className="font-medium text-slate-900">
                      {customerType === 'organization'
                        ? (selectedCustomer as any)?.name ||
                          (selectedCustomer as any)?.legal_name
                        : (selectedCustomer as any)?.full_name}
                    </p>
                    {(selectedCustomer as any)?.email && (
                      <p className="text-sm text-slate-600 mt-1">
                        {(selectedCustomer as any).email}
                      </p>
                    )}
                    {((selectedCustomer as any)?.address_line1 ||
                      (selectedCustomer as any)?.city) && (
                      <p className="text-sm text-slate-500 mt-1">
                        {[
                          (selectedCustomer as any).address_line1,
                          (selectedCustomer as any).postal_code,
                          (selectedCustomer as any).city,
                        ]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    )}
                  </div>

                  {/* Card Affilié */}
                  <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                    <div className="flex items-center gap-2 mb-3">
                      <Store className="h-4 w-4 text-purple-400" />
                      <span className="text-xs font-medium text-purple-500 uppercase">
                        Affilié
                      </span>
                    </div>
                    <p className="font-medium text-purple-900">
                      {selectedAffiliate?.display_name}
                    </p>
                    <p className="text-sm text-purple-600">
                      {affiliateType === 'enseigne'
                        ? 'Enseigne'
                        : 'Organisation indépendante'}
                    </p>
                  </div>
                </div>

                {/* Ligne Produits */}
                <div className="p-4 bg-white rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-slate-400" />
                      <span className="text-xs font-medium text-slate-500 uppercase">
                        {cart.length} Produit{cart.length > 1 ? 's' : ''}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500">
                      TVA par ligne
                    </span>
                  </div>

                  {/* Mini liste produits */}
                  <div className="space-y-2 max-h-24 overflow-y-auto">
                    {cart.map(item => (
                      <div
                        key={item.id}
                        className="flex justify-between text-sm"
                      >
                        <span className="text-slate-700 truncate flex-1">
                          {item.product_name} × {item.quantity}
                        </span>
                        <span className="text-slate-900 font-medium ml-2">
                          {(item.unit_price_ht * item.quantity).toFixed(2)}€
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totaux - Design épuré */}
                <div className="flex justify-end">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>Total HT</span>
                      <span>{cartTotals.totalHt.toFixed(2)}€</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>TVA</span>
                      <span>{cartTotals.totalTva.toFixed(2)}€</span>
                    </div>
                    <div className="flex justify-between text-base font-semibold text-slate-900 pt-2 border-t">
                      <span>Total TTC</span>
                      <span>{cartTotals.totalTtc.toFixed(2)}€</span>
                    </div>
                    <div className="flex justify-between text-sm text-orange-600 pt-1">
                      <span>Commission affilié</span>
                      <span>-{cartTotals.totalRetrocession.toFixed(2)}€</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Erreur */}
            {createOrder.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                <p className="text-sm text-red-700">
                  {createOrder.error instanceof Error
                    ? createOrder.error.message
                    : 'Erreur lors de la création'}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex-1" />
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || createOrder.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createOrder.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Créer la commande
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Dialog Preview Sélection */}
      {previewSelectionId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden mx-4">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-lg">
                Aperçu : {previewSelection?.name || 'Chargement...'}
              </h3>
              <button
                onClick={() => setPreviewSelectionId(null)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Contenu */}
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {previewLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                </div>
              ) : !previewSelection?.items?.length ? (
                <div className="text-center py-8 text-gray-500">
                  Aucun produit dans cette sélection
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {previewSelection.items.map(item => {
                    // Taux de marque: Prix = base / (1 - tauxMarque) × (1 + commission)
                    const commissionRate = (item.commission_rate || 0) / 100;
                    const marginRate = (item.margin_rate || 0) / 100;
                    const sellingPrice =
                      (item.base_price_ht / (1 - marginRate)) *
                      (1 + commissionRate);
                    return (
                      <div
                        key={item.id}
                        className="border rounded-lg p-2 bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        {/* Image petite 64x64 */}
                        <div className="w-16 h-16 mx-auto mb-2 overflow-hidden rounded">
                          {item.product_image_url ? (
                            <img
                              src={item.product_image_url}
                              alt={item.product?.name || 'Produit'}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <Package className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        {/* Nom tronqué */}
                        <p className="text-xs font-medium text-center truncate">
                          {item.product?.name || 'Produit'}
                        </p>
                        {/* Prix */}
                        <p className="text-xs text-gray-500 text-center">
                          {sellingPrice.toFixed(2)}€
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t flex justify-end">
              <button
                onClick={() => setPreviewSelectionId(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
