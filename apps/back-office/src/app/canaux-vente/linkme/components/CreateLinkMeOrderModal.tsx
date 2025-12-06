'use client';

import { useState, useEffect, useMemo } from 'react';

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
  ChevronRight,
  Users,
  Layers,
} from 'lucide-react';

import {
  useLinkMeEnseigneCustomers,
  useCreateEnseigneOrganisation,
  useCreateEnseigneIndividualCustomer,
  type EnseigneOrganisationCustomer,
  type EnseigneIndividualCustomer,
} from '../hooks/use-linkme-enseigne-customers';
import { useLinkMeEnseignes } from '../hooks/use-linkme-enseignes';
import {
  useCreateLinkMeOrder,
  type CreateLinkMeOrderInput,
  type LinkMeOrderItemInput,
} from '../hooks/use-linkme-orders';
import {
  useLinkMeSelectionsByEnseigne,
  useLinkMeSelection,
  type SelectionSummary,
  type SelectionItem,
} from '../hooks/use-linkme-selections';

interface CreateLinkMeOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Pré-sélectionner une enseigne */
  preselectedEnseigneId?: string;
}

type CustomerType = 'organization' | 'individual';

interface CartItem extends LinkMeOrderItemInput {
  id: string; // Pour la clé unique dans la liste
}

/**
 * Modal de création de commande LinkMe
 * Workflow: Enseigne → Client → Produits → Validation
 */
export function CreateLinkMeOrderModal({
  isOpen,
  onClose,
  preselectedEnseigneId,
}: CreateLinkMeOrderModalProps) {
  const createOrder = useCreateLinkMeOrder();

  // Étape courante (1: Enseigne, 2: Client, 3: Produits)
  const [step, setStep] = useState(1);

  // Données sélectionnées
  const [selectedEnseigneId, setSelectedEnseigneId] = useState<string>(
    preselectedEnseigneId || ''
  );
  const [customerType, setCustomerType] =
    useState<CustomerType>('organization');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedSelectionId, setSelectedSelectionId] = useState<string>('');

  // Panier de produits
  const [cart, setCart] = useState<CartItem[]>([]);

  // Recherche
  const [searchQuery, setSearchQuery] = useState('');

  // Notes internes
  const [internalNotes, setInternalNotes] = useState('');

  // Formulaire création client
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerFirstName, setNewCustomerFirstName] = useState('');
  const [newCustomerLastName, setNewCustomerLastName] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');

  // Données
  const { data: enseignes } = useLinkMeEnseignes();
  const customers = useLinkMeEnseigneCustomers(selectedEnseigneId || null);

  // Sélections (mini-boutiques) de l'enseigne
  const { data: selections, isLoading: selectionsLoading } =
    useLinkMeSelectionsByEnseigne(selectedEnseigneId || null);
  // Détails de la sélection choisie (avec produits)
  const { data: selectionDetails, isLoading: selectionDetailsLoading } =
    useLinkMeSelection(selectedSelectionId || null);

  // Mutations pour création de clients
  const createOrganisation = useCreateEnseigneOrganisation();
  const createIndividualCustomer = useCreateEnseigneIndividualCustomer();

  // Reset à l'ouverture
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedEnseigneId(preselectedEnseigneId || '');
      setCustomerType('organization');
      setSelectedCustomerId('');
      setSelectedSelectionId('');
      setCart([]);
      setSearchQuery('');
      setInternalNotes('');
      // Reset formulaire création client
      setShowCreateForm(false);
      setNewCustomerName('');
      setNewCustomerFirstName('');
      setNewCustomerLastName('');
      setNewCustomerEmail('');
      setNewCustomerPhone('');
    }
  }, [isOpen, preselectedEnseigneId]);

  // Reset client et sélection quand enseigne change
  useEffect(() => {
    setSelectedCustomerId('');
    setCustomerType('organization');
    setSelectedSelectionId('');
    setCart([]);
  }, [selectedEnseigneId]);

  // Enseigne sélectionnée
  const selectedEnseigne = useMemo(() => {
    return enseignes?.find(e => e.id === selectedEnseigneId);
  }, [enseignes, selectedEnseigneId]);

  // Client sélectionné
  const selectedCustomer = useMemo(() => {
    if (!selectedCustomerId) return null;
    if (customerType === 'organization') {
      return customers.organisations.find(o => o.id === selectedCustomerId);
    }
    return customers.individuals.find(i => i.id === selectedCustomerId);
  }, [customerType, selectedCustomerId, customers]);

  // Filtrer les clients par recherche
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

  // Créer un nouveau client
  const handleCreateCustomer = async () => {
    if (!selectedEnseigneId) return;

    try {
      if (customerType === 'organization') {
        if (!newCustomerName.trim()) return;
        const result = await createOrganisation.mutateAsync({
          enseigne_id: selectedEnseigneId,
          legal_name: newCustomerName.trim(),
          email: newCustomerEmail.trim() || undefined,
          phone: newCustomerPhone.trim() || undefined,
          source_type: 'linkme',
        });
        // Sélectionner automatiquement le client créé
        setSelectedCustomerId(result.id);
        customers.refetch();
      } else {
        if (!newCustomerFirstName.trim() || !newCustomerLastName.trim()) return;
        const result = await createIndividualCustomer.mutateAsync({
          enseigne_id: selectedEnseigneId,
          first_name: newCustomerFirstName.trim(),
          last_name: newCustomerLastName.trim(),
          email: newCustomerEmail.trim() || undefined,
          phone: newCustomerPhone.trim() || undefined,
          source_type: 'linkme',
        });
        // Sélectionner automatiquement le client créé
        setSelectedCustomerId(result.id);
        customers.refetch();
      }
      // Fermer le formulaire et reset
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

  // Calculs panier
  const cartTotals = useMemo(() => {
    let totalHt = 0;
    let totalRetrocession = 0;

    for (const item of cart) {
      const lineTotal = item.quantity * item.unit_price_ht;
      totalHt += lineTotal;
      totalRetrocession += lineTotal * item.retrocession_rate;
    }

    return {
      totalHt,
      totalTtc: totalHt * 1.2,
      totalRetrocession,
      beneficeNet: totalHt - totalRetrocession,
    };
  }, [cart]);

  // Ajouter un produit au panier depuis la sélection LinkMe
  const addProductFromSelection = (item: SelectionItem) => {
    // Vérifier si déjà dans le panier
    const existing = cart.find(
      cartItem => cartItem.product_id === item.product_id
    );
    if (existing) {
      setCart(
        cart.map(cartItem =>
          cartItem.product_id === item.product_id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        )
      );
      return;
    }

    // Prix de vente = selling_price_ht de la sélection (base_price_ht + marge)
    // Si pas défini, calculer: base_price_ht * (1 + margin_rate)
    const sellingPrice =
      item.selling_price_ht || item.base_price_ht * (1 + item.margin_rate);

    // Commission = margin_rate de la sélection (ce que l'affilié touche)
    const retrocessionRate = item.margin_rate;

    const newItem: CartItem = {
      id: `${item.product_id}-${Date.now()}`,
      product_id: item.product_id,
      product_name: item.product?.name || 'Produit inconnu',
      sku: item.product?.sku || '',
      quantity: 1,
      unit_price_ht: sellingPrice,
      retrocession_rate: retrocessionRate,
      linkme_selection_item_id: item.id, // Lien vers la sélection pour traçabilité
    };
    setCart([...cart, newItem]);
  };

  // Ajouter un produit manuellement (fallback si pas de sélection)
  const addProductToCart = (product: {
    id: string;
    name: string;
    sku: string;
    price: number;
    retrocessionRate: number;
  }) => {
    // Vérifier si déjà dans le panier
    const existing = cart.find(item => item.product_id === product.id);
    if (existing) {
      setCart(
        cart.map(item =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
      return;
    }

    const newItem: CartItem = {
      id: `${product.id}-${Date.now()}`,
      product_id: product.id,
      product_name: product.name,
      sku: product.sku,
      quantity: 1,
      unit_price_ht: product.price,
      retrocession_rate: product.retrocessionRate,
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

  // Validation
  const canProceed = () => {
    switch (step) {
      case 1:
        return !!selectedEnseigneId;
      case 2:
        return !!selectedCustomerId;
      case 3:
        return cart.length > 0;
      default:
        return false;
    }
  };

  // Soumettre la commande
  const handleSubmit = async () => {
    if (!selectedCustomerId || cart.length === 0) return;

    // Récupérer l'affiliate_id depuis la sélection choisie
    const affiliateId = selectionDetails?.affiliate_id || '';

    const input: CreateLinkMeOrderInput = {
      customer_type: customerType,
      customer_organisation_id:
        customerType === 'organization' ? selectedCustomerId : null,
      individual_customer_id:
        customerType === 'individual' ? selectedCustomerId : null,
      affiliate_id: affiliateId,
      items: cart.map(item => ({
        product_id: item.product_id,
        product_name: item.product_name,
        sku: item.sku,
        quantity: item.quantity,
        unit_price_ht: item.unit_price_ht,
        retrocession_rate: item.retrocession_rate,
        linkme_selection_item_id: item.linkme_selection_item_id,
      })),
      internal_notes: internalNotes || undefined,
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
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">
                  Nouvelle commande LinkMe
                </h2>
                <p className="text-sm text-gray-500">
                  Étape {step}/3 :{' '}
                  {step === 1
                    ? 'Sélection enseigne'
                    : step === 2
                      ? 'Sélection client'
                      : 'Produits & validation'}
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

          {/* Steps indicator */}
          <div className="px-6 py-3 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2">
              {[1, 2, 3].map(s => (
                <div key={s} className="flex items-center">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                      s < step
                        ? 'bg-green-500 text-white'
                        : s === step
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-500'
                    )}
                  >
                    {s < step ? <Check className="h-4 w-4" /> : s}
                  </div>
                  {s < 3 && (
                    <ChevronRight
                      className={cn(
                        'h-4 w-4 mx-2',
                        s < step ? 'text-green-500' : 'text-gray-300'
                      )}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Étape 1: Sélection enseigne */}
            {step === 1 && (
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  Sélectionner une enseigne
                </label>
                <div className="space-y-2">
                  {enseignes?.map(enseigne => (
                    <button
                      key={enseigne.id}
                      onClick={() => setSelectedEnseigneId(enseigne.id)}
                      className={cn(
                        'w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left',
                        selectedEnseigneId === enseigne.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <Building2
                        className={cn(
                          'h-5 w-5',
                          selectedEnseigneId === enseigne.id
                            ? 'text-blue-600'
                            : 'text-gray-400'
                        )}
                      />
                      <div>
                        <p className="font-medium">{enseigne.name}</p>
                        <p className="text-sm text-gray-500">
                          {enseigne.city || 'France'}
                        </p>
                      </div>
                      {selectedEnseigneId === enseigne.id && (
                        <Check className="h-5 w-5 text-blue-600 ml-auto" />
                      )}
                    </button>
                  ))}
                </div>
                {enseignes?.length === 0 && (
                  <p className="text-center text-gray-500 py-8">
                    Aucune enseigne disponible
                  </p>
                )}
              </div>
            )}

            {/* Étape 2: Sélection client */}
            {step === 2 && (
              <div className="space-y-4">
                {/* Type de client */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type de client
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        setCustomerType('organization');
                        setSelectedCustomerId('');
                      }}
                      className={cn(
                        'flex items-center gap-2 p-3 rounded-lg border-2 transition-all',
                        customerType === 'organization'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <Building2
                        className={cn(
                          'h-5 w-5',
                          customerType === 'organization'
                            ? 'text-blue-600'
                            : 'text-gray-400'
                        )}
                      />
                      <span
                        className={cn(
                          'font-medium',
                          customerType === 'organization'
                            ? 'text-blue-700'
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
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <User
                        className={cn(
                          'h-5 w-5',
                          customerType === 'individual'
                            ? 'text-blue-600'
                            : 'text-gray-400'
                        )}
                      />
                      <span
                        className={cn(
                          'font-medium',
                          customerType === 'individual'
                            ? 'text-blue-700'
                            : 'text-gray-600'
                        )}
                      >
                        Particulier
                      </span>
                    </button>
                  </div>
                </div>

                {/* Recherche + Bouton créer */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Rechercher un client..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className={cn(
                      'flex items-center gap-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors',
                      showCreateForm
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    )}
                    title="Créer un nouveau client"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Nouveau</span>
                  </button>
                </div>

                {/* Formulaire création client */}
                {showCreateForm && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                    <p className="text-sm font-medium text-blue-800">
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          value={newCustomerLastName}
                          onChange={e => setNewCustomerLastName(e.target.value)}
                          placeholder="Nom *"
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="email"
                        value={newCustomerEmail}
                        onChange={e => setNewCustomerEmail(e.target.value)}
                        placeholder="Email"
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="tel"
                        value={newCustomerPhone}
                        onChange={e => setNewCustomerPhone(e.target.value)}
                        placeholder="Téléphone"
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
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
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {customers.isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
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
                              ? 'border-blue-500 bg-blue-50'
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
                            <Check className="h-4 w-4 text-blue-600" />
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
                            ? 'border-blue-500 bg-blue-50'
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
                          <Check className="h-4 w-4 text-blue-600" />
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

            {/* Étape 3: Produits */}
            {step === 3 && (
              <div className="space-y-4">
                {/* Résumé client */}
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Client</p>
                  <p className="font-medium">
                    {customerType === 'organization'
                      ? (selectedCustomer as EnseigneOrganisationCustomer)?.name
                      : (selectedCustomer as EnseigneIndividualCustomer)
                          ?.full_name}
                  </p>
                </div>

                {/* Sélection de la mini-boutique */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Layers className="h-4 w-4 inline mr-1" />
                    Sélection (mini-boutique)
                  </label>
                  {selectionsLoading ? (
                    <div className="flex items-center gap-2 py-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-gray-500">
                        Chargement des sélections...
                      </span>
                    </div>
                  ) : selections && selections.length > 0 ? (
                    <div className="space-y-2">
                      {selections.map(selection => (
                        <button
                          key={selection.id}
                          onClick={() => {
                            setSelectedSelectionId(selection.id);
                            // Reset panier quand on change de sélection
                            if (selectedSelectionId !== selection.id) {
                              setCart([]);
                            }
                          }}
                          className={cn(
                            'w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left',
                            selectedSelectionId === selection.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          )}
                        >
                          <Layers
                            className={cn(
                              'h-5 w-5',
                              selectedSelectionId === selection.id
                                ? 'text-blue-600'
                                : 'text-gray-400'
                            )}
                          />
                          <div className="flex-1">
                            <p className="font-medium">{selection.name}</p>
                            <p className="text-xs text-gray-500">
                              {selection.products_count || 0} produit
                              {(selection.products_count || 0) > 1 ? 's' : ''}
                              {selection.archived_at && ' • Archivée'}
                            </p>
                          </div>
                          {selectedSelectionId === selection.id && (
                            <Check className="h-5 w-5 text-blue-600" />
                          )}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-amber-600 py-2">
                      <AlertCircle className="h-4 w-4 inline mr-1" />
                      Aucune sélection disponible pour cette enseigne
                    </p>
                  )}
                </div>

                {/* Produits de la sélection choisie */}
                {selectedSelectionId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Package className="h-4 w-4 inline mr-1" />
                      Produits disponibles
                    </label>
                    {selectionDetailsLoading ? (
                      <div className="flex items-center gap-2 py-4">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-gray-500">
                          Chargement des produits...
                        </span>
                      </div>
                    ) : selectionDetails?.items &&
                      selectionDetails.items.length > 0 ? (
                      <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                        {selectionDetails.items.map(item => {
                          const isInCart = cart.some(
                            c => c.product_id === item.product_id
                          );
                          const sellingPrice =
                            item.selling_price_ht ||
                            item.base_price_ht * (1 + item.margin_rate);
                          return (
                            <button
                              key={item.id}
                              onClick={() => addProductFromSelection(item)}
                              className={cn(
                                'flex items-center gap-3 p-2 rounded-lg border transition-all text-left',
                                isInCart
                                  ? 'border-green-300 bg-green-50'
                                  : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
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
                                  {(item.margin_rate * 100).toFixed(0)}%
                                </p>
                              </div>
                              {isInCart ? (
                                <Check className="h-4 w-4 text-green-600" />
                              ) : (
                                <Plus className="h-4 w-4 text-blue-600" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 py-2">
                        Aucun produit dans cette sélection
                      </p>
                    )}
                  </div>
                )}

                {/* Mode manuel (si pas de sélection ou fallback) */}
                {(!selections || selections.length === 0) && (
                  <div className="border border-dashed border-gray-300 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-700 mb-3">
                      Ajouter un produit manuellement
                    </p>
                    <QuickAddProduct onAdd={addProductToCart} />
                  </div>
                )}

                {/* Panier */}
                {cart.length > 0 ? (
                  <div className="space-y-3">
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
                              {item.unit_price_ht.toFixed(2)}€ HT ×{' '}
                              {item.quantity} ={' '}
                              {(item.unit_price_ht * item.quantity).toFixed(2)}€
                              HT
                            </p>
                            <p className="text-xs text-orange-600">
                              Commission:{' '}
                              {(item.retrocession_rate * 100).toFixed(0)}% (
                              {(
                                item.unit_price_ht *
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
                        <span className="text-gray-600">TVA (20%)</span>
                        <span>
                          {(cartTotals.totalTtc - cartTotals.totalHt).toFixed(
                            2
                          )}
                          €
                        </span>
                      </div>
                      <div className="flex justify-between text-sm font-medium">
                        <span>Total TTC</span>
                        <span>{cartTotals.totalTtc.toFixed(2)}€</span>
                      </div>
                      <div className="flex justify-between text-sm text-orange-600">
                        <span>Commissions affilié</span>
                        <span>-{cartTotals.totalRetrocession.toFixed(2)}€</span>
                      </div>
                      <div className="flex justify-between text-sm font-medium text-green-600">
                        <span>Bénéfice net</span>
                        <span>{cartTotals.beneficeNet.toFixed(2)}€</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">
                    Aucun produit dans le panier
                  </p>
                )}

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes internes (optionnel)
                  </label>
                  <textarea
                    value={internalNotes}
                    onChange={e => setInternalNotes(e.target.value)}
                    placeholder="Notes visibles uniquement par l'équipe..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Erreur */}
            {createOrder.error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                <p className="text-sm text-red-700">
                  {createOrder.error instanceof Error
                    ? createOrder.error.message
                    : 'Erreur lors de la création'}
                </p>
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="flex gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors"
              >
                Retour
              </button>
            )}
            <div className="flex-1" />
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors"
            >
              Annuler
            </button>
            {step < 3 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continuer
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canProceed() || createOrder.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Composant temporaire pour ajouter un produit rapidement
 * TODO: Remplacer par un sélecteur depuis les sélections LinkMe
 */
function QuickAddProduct({
  onAdd,
}: {
  onAdd: (product: {
    id: string;
    name: string;
    sku: string;
    price: number;
    retrocessionRate: number;
  }) => void;
}) {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [commission, setCommission] = useState('10');

  const handleAdd = () => {
    if (!name || !price) return;

    onAdd({
      id: `temp-${Date.now()}`,
      name,
      sku: sku || 'SKU-TEMP',
      price: parseFloat(price),
      retrocessionRate: parseFloat(commission) / 100,
    });

    // Reset
    setName('');
    setSku('');
    setPrice('');
  };

  return (
    <div className="grid grid-cols-4 gap-2">
      <input
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Nom produit"
        className="col-span-2 px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <input
        type="number"
        value={price}
        onChange={e => setPrice(e.target.value)}
        placeholder="Prix HT"
        className="px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <div className="flex gap-1">
        <input
          type="number"
          value={commission}
          onChange={e => setCommission(e.target.value)}
          placeholder="%"
          className="w-14 px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          onClick={handleAdd}
          disabled={!name || !price}
          className="px-2 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
