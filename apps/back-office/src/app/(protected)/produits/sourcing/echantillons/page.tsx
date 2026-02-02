'use client';

/**
 * Page: Échantillons (Sourcing)
 * Description: Gestion complète échantillons internes et clients
 *
 * Features:
 * - Tabs: Actifs | Archivés
 * - Archive/Réactive/Réinsertion échantillons
 * - Badges client (B2B/B2C) + sample_type
 * - Actions conditionnelles selon statut PO
 * - Modal création échantillon client
 */

import { useState } from 'react';
import Image from 'next/image';

import { useRouter } from 'next/navigation';

import { useToast } from '@verone/common';
import { CustomerBadge } from '@verone/customers';
import { useCustomerSamples } from '@verone/customers';
import type { UnifiedCustomer } from '@verone/orders';
import { CustomerSelector } from '@verone/orders';
import type { SelectedProduct } from '@verone/products';
import { UniversalProductSelectorV2 } from '@verone/products';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@verone/ui';
import { Badge } from '@verone/ui';
import { Button } from '@verone/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@verone/ui';
import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@verone/ui';
import { Textarea } from '@verone/ui';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import {
  Archive,
  ArchiveRestore,
  Trash2,
  Package,
  Truck,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Search,
  Plus,
  Building,
  User,
  RefreshCw,
  Eye,
} from 'lucide-react';

export default function SourcingEchantillonsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  // ===================================================================
  // ÉTATS
  // ===================================================================

  // Onglets Actifs/Archivés
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');

  // Filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Modal création échantillon
  const [showSampleForm, setShowSampleForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] =
    useState<UnifiedCustomer | null>(null);
  const [selectedProduct, setSelectedProduct] =
    useState<SelectedProduct | null>(null);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [showProductModal, setShowProductModal] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Modal confirmation suppression
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [sampleToDelete, setSampleToDelete] = useState<string | null>(null);

  // ===================================================================
  // HOOK: Fetch échantillons avec filtres
  // ===================================================================

  const {
    samples,
    loading,
    error,
    stats,
    archiveSample,
    reactivateSample,
    insertSampleInPO,
    deleteSample,
    refresh,
  } = useCustomerSamples({
    archived: activeTab === 'archived',
  });

  // ===================================================================
  // COMPUTED: Échantillons filtrés
  // ===================================================================

  const filteredSamples = samples.filter(sample => {
    const matchesSearch =
      sample.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sample.product_sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sample.customer_display_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      sample.po_number.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || sample.sample_status === statusFilter;
    const matchesType =
      typeFilter === 'all' || sample.sample_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  // ===================================================================
  // HANDLERS: Actions échantillons
  // ===================================================================

  const handleArchive = async (sampleId: string) => {
    try {
      await archiveSample(sampleId);
    } catch (err) {
      // Error toast déjà affiché par le hook
      console.error('Archive failed:', err);
    }
  };

  const handleReactivate = async (sampleId: string) => {
    try {
      await reactivateSample(sampleId);
    } catch (err) {
      console.error('Reactivate failed:', err);
    }
  };

  const handleReinsert = async (sampleId: string) => {
    try {
      await insertSampleInPO(sampleId);
    } catch (err) {
      console.error('Reinsert failed:', err);
    }
  };

  const handleDeleteClick = (sampleId: string) => {
    setSampleToDelete(sampleId);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!sampleToDelete) return;

    try {
      await deleteSample(sampleToDelete);
      setDeleteConfirmOpen(false);
      setSampleToDelete(null);
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  // ===================================================================
  // HANDLERS: Formulaire création échantillon client
  // ===================================================================

  const handleCustomerChange = (customer: UnifiedCustomer | null) => {
    setSelectedCustomer(customer);

    if (customer) {
      if (customer.type === 'professional') {
        const address = [
          customer.name,
          customer.shipping_address_line1 ?? customer.billing_address_line1,
          customer.shipping_city ?? customer.billing_city,
          customer.shipping_postal_code ?? customer.billing_postal_code,
        ]
          .filter(Boolean)
          .join(', ');
        setDeliveryAddress(address);
      } else {
        const address = [
          customer.name,
          customer.address_line1,
          customer.city,
          customer.postal_code,
        ]
          .filter(Boolean)
          .join(', ');
        setDeliveryAddress(address);
      }
    } else {
      setDeliveryAddress('');
    }
  };

  const handleProductSelect = (products: SelectedProduct[]) => {
    // V2 retourne un array, on prend le premier produit
    if (products.length > 0) {
      const product = products[0];
      setSelectedProduct(product);
      setSelectedProductId(product.id);
    }
    setShowProductModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !selectedProductId) {
      toast({
        title: 'Erreur',
        description: 'Client et produit requis',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Erreur',
          description: 'Utilisateur non connecté',
          variant: 'destructive',
        });
        setSubmitting(false);
        return;
      }

      const { data: product, error: productError } = await supabase
        .from('products')
        .select('cost_price, supplier_id')
        .eq('id', selectedProductId)
        .single();

      if (productError || !product?.supplier_id) {
        toast({
          title: 'Erreur',
          description: 'Produit invalide ou fournisseur manquant',
          variant: 'destructive',
        });
        setSubmitting(false);
        return;
      }

      const { data: newPO, error: poError } = await supabase
        .from('purchase_orders')
        .insert({
          po_number: `SAMPLE-${Date.now()}`,
          status: 'draft',
          notes: `Échantillon client: ${selectedCustomer.name}`,
          created_by: user.id,
          supplier_id: product.supplier_id,
        })
        .select('id')
        .single();

      if (poError) throw poError;

      const { error: itemError } = await supabase
        .from('purchase_order_items')
        .insert({
          purchase_order_id: newPO.id,
          product_id: selectedProductId,
          quantity,
          unit_price_ht: product?.cost_price ?? 0.01,
          sample_type: 'customer',
          customer_organisation_id:
            selectedCustomer.type === 'professional'
              ? selectedCustomer.id
              : null,
          customer_individual_id:
            selectedCustomer.type === 'individual' ? selectedCustomer.id : null,
          notes: `Livraison: ${deliveryAddress}\n\nNotes: ${notes}`,
        });

      if (itemError) throw itemError;

      toast({
        title: 'Demande créée',
        description: "Demande d'échantillon enregistrée avec succès",
      });
      setShowSampleForm(false);
      setSelectedCustomer(null);
      setSelectedProductId('');
      setSelectedProduct(null);
      setQuantity(1);
      setDeliveryAddress('');
      setNotes('');
      void refresh().catch(error => {
        console.error(
          '[EchantillonsPage] Refresh after creation failed:',
          error
        );
      });
    } catch (error) {
      console.error('Erreur création échantillon:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer la demande',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ===================================================================
  // UI HELPERS
  // ===================================================================

  const getSampleTypeBadge = (sampleType: 'internal' | 'customer') => {
    if (sampleType === 'internal') {
      return (
        <Badge
          variant="outline"
          className="border-amber-500 text-amber-700 bg-amber-50"
        >
          Interne
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className="border-purple-500 text-purple-700 bg-purple-50"
      >
        Client
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return (
          <Badge variant="outline" className="border-gray-300 text-gray-600">
            Brouillon
          </Badge>
        );
      case 'ordered':
        return (
          <Badge variant="outline" className="border-blue-300 text-blue-600">
            Commandé
          </Badge>
        );
      case 'received':
        return (
          <Badge variant="outline" className="border-green-300 text-green-600">
            Reçu
          </Badge>
        );
      case 'archived':
        return (
          <Badge variant="outline" className="border-red-300 text-red-600">
            Archivé
          </Badge>
        );
      default:
        return <Badge variant="outline">Inconnu</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <Clock className="h-4 w-4 text-gray-600" />;
      case 'ordered':
        return <Package className="h-4 w-4 text-blue-600" />;
      case 'received':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'archived':
        return <Archive className="h-4 w-4 text-red-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  // ===================================================================
  // LOADING STATE
  // ===================================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4" />
          <p className="text-gray-600">Chargement des échantillons...</p>
        </div>
      </div>
    );
  }

  // ===================================================================
  // ERROR STATE
  // ===================================================================

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md border-red-300">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Erreur de chargement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button
              onClick={() => {
                void refresh().catch(error => {
                  console.error(
                    '[EchantillonsPage] Refresh retry failed:',
                    error
                  );
                });
              }}
              className="bg-black hover:bg-gray-800 text-white"
            >
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ===================================================================
  // MAIN RENDER
  // ===================================================================

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black">Échantillons</h1>
              <p className="text-gray-600 mt-1">
                Gestion échantillons internes et clients
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => router.push('/produits/sourcing')}
                className="border-black text-black hover:bg-black hover:text-white"
              >
                Retour Dashboard
              </Button>
              <Button
                onClick={() => setShowSampleForm(true)}
                className="bg-black hover:bg-gray-800 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Échantillon
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="border-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Actifs
              </CardTitle>
              <Package className="h-4 w-4 text-black" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">
                {stats.active}
              </div>
              <p className="text-xs text-gray-600">échantillons actifs</p>
            </CardContent>
          </Card>

          <Card className="border-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Archivés
              </CardTitle>
              <Archive className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">
                {stats.archived}
              </div>
              <p className="text-xs text-gray-600">échantillons archivés</p>
            </CardContent>
          </Card>

          <Card className="border-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Internes
              </CardTitle>
              <Building className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">
                {stats.internal}
              </div>
              <p className="text-xs text-gray-600">catalogue sourcing</p>
            </CardContent>
          </Card>

          <Card className="border-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Clients
              </CardTitle>
              <User className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black">
                {stats.customer}
              </div>
              <p className="text-xs text-gray-600">B2B + B2C</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtres */}
        <Card className="border-black mb-6">
          <CardHeader>
            <CardTitle className="text-black">Filtres et Recherche</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10 border-black focus:ring-black"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="border-black">
                  <SelectValue placeholder="Statut PO" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="ordered">Commandé</SelectItem>
                  <SelectItem value="received">Reçu</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="border-black">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="internal">Internes</SelectItem>
                  <SelectItem value="customer">Clients</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => {
                  void refresh().catch(error => {
                    console.error('[EchantillonsPage] Refresh failed:', error);
                  });
                }}
                className="border-black text-black hover:bg-black hover:text-white"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualiser
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs Actifs/Archivés */}
        <Tabs
          value={activeTab}
          onValueChange={v => setActiveTab(v as 'active' | 'archived')}
        >
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="active">Actifs ({stats.active})</TabsTrigger>
            <TabsTrigger value="archived">
              Archivés ({stats.archived})
            </TabsTrigger>
          </TabsList>

          {/* Tab Content: Actifs */}
          <TabsContent value="active" className="mt-6">
            <Card className="border-black">
              <CardHeader>
                <CardTitle className="text-black">
                  Échantillons Actifs ({filteredSamples.length})
                </CardTitle>
                <CardDescription>
                  Échantillons en cours ou commandés
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredSamples.map(sample => (
                    <div
                      key={sample.sample_id}
                      className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors"
                    >
                      {/* En-tête */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(sample.sample_status)}
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-black">
                                {sample.product_name}
                              </h3>
                              {getSampleTypeBadge(sample.sample_type)}
                            </div>
                            <p className="text-sm text-gray-600">
                              SKU: {sample.product_sku}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          {getStatusBadge(sample.sample_status)}
                        </div>
                      </div>

                      {/* Informations */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <Building className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">Fournisseur:</span>
                          <span className="font-medium text-black">
                            {sample.supplier_name}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">Client:</span>
                          {sample.sample_type === 'internal' ? (
                            <Badge variant="outline" className="text-xs">
                              Interne - Catalogue
                            </Badge>
                          ) : (
                            <CustomerBadge
                              organisationId={sample.customer_org_id}
                              organisationLegalName={
                                sample.customer_org_legal_name
                              }
                              organisationTradeName={
                                sample.customer_org_trade_name
                              }
                              individualId={sample.customer_ind_id}
                              individualFirstName={
                                sample.customer_ind_first_name
                              }
                              individualLastName={sample.customer_ind_last_name}
                              individualEmail={sample.customer_ind_email}
                              compact
                            />
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          <Package className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">Quantité:</span>
                          <span className="font-medium text-black">
                            {sample.quantity}
                          </span>
                        </div>
                      </div>

                      {/* Dates */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">Créé le:</span>
                          <span className="text-black">
                            {new Date(
                              sample.sample_created_at
                            ).toLocaleDateString('fr-FR')}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Truck className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">PO:</span>
                          <span className="text-black">{sample.po_number}</span>
                          <Badge variant="outline" className="text-xs">
                            {sample.po_status}
                          </Badge>
                        </div>
                      </div>

                      {/* Notes */}
                      {sample.sample_notes && (
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 mb-4">
                          <p className="text-sm text-blue-800">
                            <strong>Notes:</strong> {sample.sample_notes}
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-end pt-4 border-t border-gray-200 space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-gray-300"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Voir détails
                        </Button>

                        {/* Archiver (uniquement si PO draft) */}
                        {sample.po_status === 'draft' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              void handleArchive(sample.sample_id).catch(
                                error => {
                                  console.error(
                                    '[EchantillonsPage] Archive failed:',
                                    error
                                  );
                                }
                              );
                            }}
                            className="border-red-300 text-red-600 hover:bg-red-50"
                          >
                            <Archive className="h-4 w-4 mr-2" />
                            Archiver
                          </Button>
                        ) : (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled
                                  className="border-gray-300 text-gray-400 cursor-not-allowed"
                                >
                                  <Archive className="h-4 w-4 mr-2" />
                                  Archiver
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  Impossible d'archiver : commande déjà envoyée
                                  au fournisseur
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </div>
                  ))}

                  {filteredSamples.length === 0 && (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">
                        Aucun échantillon actif trouvé
                      </p>
                      <p className="text-sm text-gray-500">
                        Essayez de modifier vos filtres
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Content: Archivés */}
          <TabsContent value="archived" className="mt-6">
            <Card className="border-black">
              <CardHeader>
                <CardTitle className="text-black">
                  Échantillons Archivés ({filteredSamples.length})
                </CardTitle>
                <CardDescription>
                  Échantillons annulés ou retirés
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredSamples.map(sample => (
                    <div
                      key={sample.sample_id}
                      className="border border-gray-200 rounded-lg p-6 bg-gray-50"
                    >
                      {/* En-tête */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <Archive className="h-4 w-4 text-red-600" />
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-black">
                                {sample.product_name}
                              </h3>
                              {getSampleTypeBadge(sample.sample_type)}
                              <Badge
                                variant="outline"
                                className="border-red-300 text-red-600"
                              >
                                Archivé
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">
                              SKU: {sample.product_sku}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Informations */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <Building className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">Fournisseur:</span>
                          <span className="font-medium text-black">
                            {sample.supplier_name}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">Client:</span>
                          {sample.sample_type === 'internal' ? (
                            <Badge variant="outline" className="text-xs">
                              Interne - Catalogue
                            </Badge>
                          ) : (
                            <CustomerBadge
                              organisationId={sample.customer_org_id}
                              organisationLegalName={
                                sample.customer_org_legal_name
                              }
                              organisationTradeName={
                                sample.customer_org_trade_name
                              }
                              individualId={sample.customer_ind_id}
                              individualFirstName={
                                sample.customer_ind_first_name
                              }
                              individualLastName={sample.customer_ind_last_name}
                              individualEmail={sample.customer_ind_email}
                              compact
                            />
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">Archivé le:</span>
                          <span className="text-black">
                            {sample.archived_at
                              ? new Date(sample.archived_at).toLocaleDateString(
                                  'fr-FR'
                                )
                              : 'N/A'}
                          </span>
                        </div>
                      </div>

                      {/* Actions Archivés */}
                      <div className="flex items-center justify-end pt-4 border-t border-gray-200 space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            void handleReactivate(sample.sample_id).catch(
                              error => {
                                console.error(
                                  '[EchantillonsPage] Reactivate failed:',
                                  error
                                );
                              }
                            );
                          }}
                          className="border-green-300 text-green-600 hover:bg-green-50"
                        >
                          <ArchiveRestore className="h-4 w-4 mr-2" />
                          Réactiver
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            void handleReinsert(sample.sample_id).catch(
                              error => {
                                console.error(
                                  '[EchantillonsPage] Reinsert failed:',
                                  error
                                );
                              }
                            );
                          }}
                          className="border-blue-300 text-blue-600 hover:bg-blue-50"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Réinsérer dans PO
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteClick(sample.sample_id)}
                          className="border-red-500 text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  ))}

                  {filteredSamples.length === 0 && (
                    <div className="text-center py-8">
                      <Archive className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">
                        Aucun échantillon archivé trouvé
                      </p>
                      <p className="text-sm text-gray-500">
                        Tous vos échantillons sont actifs
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog Formulaire Échantillon Client */}
      <Dialog open={showSampleForm} onOpenChange={setShowSampleForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouvelle Demande d'Échantillon Client</DialogTitle>
            <DialogDescription>
              Créer une demande d'échantillon pour un client professionnel (B2B)
              ou particulier (B2C)
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={e => {
              void handleSubmit(e).catch(error => {
                console.error('[EchantillonsPage] Form submit failed:', error);
              });
            }}
            className="space-y-6"
          >
            <div>
              <Label className="text-base font-semibold mb-4 block">
                Sélectionner le client *
              </Label>
              <CustomerSelector
                selectedCustomer={selectedCustomer}
                onCustomerChange={handleCustomerChange}
                disabled={submitting}
              />
            </div>

            {selectedCustomer && (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-900">
                        Client sélectionné : {selectedCustomer.name}
                      </p>
                      <p className="text-sm text-green-700">
                        Type :{' '}
                        {selectedCustomer.type === 'professional'
                          ? 'Professionnel (B2B)'
                          : 'Particulier (B2C)'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div>
              <Label>Produit *</Label>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowProductModal(true)}
                disabled={submitting}
                className="w-full justify-start text-left font-normal"
              >
                <Package className="h-4 w-4 mr-2" />
                {selectedProduct
                  ? selectedProduct.name
                  : 'Sélectionner un produit...'}
              </Button>

              {selectedProduct && (
                <Card className="mt-3 bg-green-50 border-green-200">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      {selectedProduct.product_images &&
                      selectedProduct.product_images.length > 0 ? (
                        <Image
                          src={
                            selectedProduct.product_images.find(
                              (img: any) => img.is_primary
                            )?.public_url ??
                            selectedProduct.product_images[0].public_url
                          }
                          alt={selectedProduct.name}
                          width={48}
                          height={48}
                          className="object-cover rounded"
                        />
                      ) : (
                        <div className="h-12 w-12 bg-gray-200 rounded flex items-center justify-center">
                          <Package className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-green-900">
                          {selectedProduct.name}
                        </p>
                        {selectedProduct.sku && (
                          <p className="text-sm text-green-700">
                            SKU: {selectedProduct.sku}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div>
              <Label htmlFor="quantity">Quantité</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max="10"
                value={quantity}
                onChange={e => setQuantity(parseInt(e.target.value) ?? 1)}
                disabled={submitting}
              />
              <p className="text-sm text-gray-500 mt-1">
                Maximum 10 échantillons par demande
              </p>
            </div>

            <div>
              <Label htmlFor="delivery">Adresse de livraison</Label>
              <Textarea
                id="delivery"
                value={deliveryAddress}
                onChange={e => setDeliveryAddress(e.target.value)}
                placeholder="Auto-remplie depuis la fiche client..."
                rows={3}
                disabled={submitting}
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Contexte, usage prévu, remarques particulières..."
                rows={3}
                disabled={submitting}
              />
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowSampleForm(false)}
                disabled={submitting}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={!selectedCustomer || !selectedProductId || submitting}
                className="bg-black hover:bg-gray-800"
              >
                {submitting ? 'Création...' : 'Créer la demande'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Sélection Produit - V2 */}
      <UniversalProductSelectorV2
        open={showProductModal}
        onClose={() => setShowProductModal(false)}
        onSelect={handleProductSelect}
        mode="single"
        context="consultations"
        selectedProducts={selectedProduct ? [selectedProduct] : []}
        showQuantity={false}
        showImages
      />

      {/* AlertDialog Confirmation Suppression */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer définitivement cet échantillon
              ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                void handleDeleteConfirm().catch(error => {
                  console.error(
                    '[EchantillonsPage] Delete confirm failed:',
                    error
                  );
                });
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer définitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
