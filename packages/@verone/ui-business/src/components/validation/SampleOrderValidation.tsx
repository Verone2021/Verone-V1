'use client';

import { useState, useEffect } from 'react';

import { useRouter } from 'next/navigation';

import {
  CheckCircle,
  Clock,
  Package,
  Building,
  Euro,
  Calendar,
  Truck,
  Eye,
  X,
  ArrowRight,
  Loader2,
} from 'lucide-react';

import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@verone/ui';
import { Textarea } from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import { useToast } from '@verone/common/hooks';

interface SampleOrder {
  id: string;
  supplier_id: string;
  supplier: {
    id: string;
    name: string;
    contact_email?: string;
    contact_phone?: string;
  };
  status:
    | 'draft'
    | 'pending_approval'
    | 'approved'
    | 'ordered'
    | 'delivered'
    | 'completed';
  estimated_total_cost: number;
  actual_total_cost?: number;
  expected_delivery_days: number;
  created_at: string;
  approved_at?: string;
  ordered_at?: string;
  delivered_at?: string;
  approval_notes?: string;
  sample_order_items: SampleOrderItem[];
}

interface SampleOrderItem {
  id: string;
  product_draft_id: string;
  description: string;
  estimated_cost: number;
  delivery_time_days: number;
  status: 'pending' | 'approved' | 'rejected';
  product_drafts: {
    id: string;
    name: string;
    supplier_page_url: string;
    primary_image_url?: string;
  };
}

interface SampleOrderValidationProps {
  className?: string;
}

export function SampleOrderValidation({
  className: _className,
}: SampleOrderValidationProps) {
  const router = useRouter();
  const { toast } = useToast();
  // TODO: Hook useDrafts n'existe pas - Code legacy à refactorer
  // const {
  //   approveSampleOrder,
  //   markSampleOrderDelivered,
  //   validateSamples,
  //   transferToProductCatalog,
  //   getSampleOrdersForSupplier,
  //   getSourcingWorkflowMetrics
  // } = useDrafts()

  const [sampleOrders, setSampleOrders] = useState<SampleOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<SampleOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [validationNotes, setValidationNotes] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [workflowMetrics, setWorkflowMetrics] = useState<Record<
    string,
    number
  > | null>(null);

  const supabase = createClient();

  // TODO: Implement these functions properly
  const getSourcingWorkflowMetrics = async () => {
    return { total: 0, pending: 0, approved: 0, rejected: 0 };
  };

  const approveSampleOrder = async (orderId: string, notes?: string) => {
    const { error } = await supabase
      .from('sample_orders')
      .update({ status: 'approved', notes })
      .eq('id', orderId);
    if (error) throw error;
  };

  const markSampleOrderDelivered = async (orderId: string) => {
    const { error } = await supabase
      .from('sample_orders')
      .update({ status: 'delivered', delivered_at: new Date().toISOString() })
      .eq('id', orderId);
    if (error) throw error;
  };

  const validateSamples = async (
    draftIds: string[],
    result: 'approved' | 'rejected',
    notes?: string
  ) => {
    const { error } = await supabase
      .from('product_drafts' as 'sample_orders')
      .update({ status: result, validation_notes: notes } as Record<
        string,
        unknown
      >)
      .in('id', draftIds);
    if (error) throw error;
  };

  const transferToProductCatalog = async (_draftId: string) => {
    // Implement transfer logic here
    throw new Error('transferToProductCatalog not yet implemented');
  };

  // Charger toutes les commandes d'échantillons
  const loadSampleOrders = async () => {
    try {
      setLoading(true);

      const { data: orders, error } = await supabase
        .from('sample_orders')
        .select(
          `
          *,
          suppliers!inner (
            id,
            name,
            contact_email,
            contact_phone
          ),
          sample_order_items (
            *,
            product_drafts!inner (
              id,
              name,
              supplier_page_url
            )
          )
        `
        )
        .order('created_at', { ascending: false });

      if (error) throw error;

      setSampleOrders((orders as unknown as SampleOrder[]) ?? []);

      // Charger les métriques du workflow
      try {
        const metrics = await getSourcingWorkflowMetrics();
        setWorkflowMetrics(metrics);
      } catch (metricsError) {
        console.warn('Métriques workflow non disponibles:', metricsError);
      }
    } catch (error) {
      console.error('Erreur chargement commandes échantillons:', error);
      toast({
        title: 'Erreur',
        description: "Impossible de charger les commandes d'échantillons",
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Approuver une commande d'échantillons
  const handleApproveOrder = async (orderId: string, notes?: string) => {
    try {
      await approveSampleOrder(orderId, notes);

      toast({
        title: 'Commande approuvée',
        description: "La commande d'échantillons a été approuvée",
      });

      await loadSampleOrders();
      setSelectedOrder(null);
      setValidationNotes('');
    } catch (error) {
      console.error('Erreur approbation commande:', error);
      toast({
        title: 'Erreur',
        description:
          error instanceof Error
            ? error.message
            : "Impossible d'approuver la commande",
        variant: 'destructive',
      });
    }
  };

  // Marquer comme livré
  const handleMarkDelivered = async (orderId: string) => {
    try {
      await markSampleOrderDelivered(orderId);

      toast({
        title: 'Livraison confirmée',
        description: 'La commande a été marquée comme livrée',
      });

      await loadSampleOrders();
    } catch (error) {
      console.error('Erreur marquage livraison:', error);
      toast({
        title: 'Erreur',
        description:
          error instanceof Error
            ? error.message
            : 'Impossible de marquer comme livré',
        variant: 'destructive',
      });
    }
  };

  // Valider des échantillons
  const handleValidateSamples = async (
    draftIds: string[],
    result: 'approved' | 'rejected',
    notes?: string
  ) => {
    try {
      await validateSamples(draftIds, result, notes);

      toast({
        title: `Échantillons ${result === 'approved' ? 'validés' : 'rejetés'}`,
        description: `${draftIds.length} échantillon(s) ${result === 'approved' ? 'approuvé(s)' : 'rejeté(s)'}`,
      });

      await loadSampleOrders();
      setSelectedItems([]);
      setValidationNotes('');
    } catch (error) {
      console.error('Erreur validation échantillons:', error);
      toast({
        title: 'Erreur',
        description:
          error instanceof Error
            ? error.message
            : 'Impossible de valider les échantillons',
        variant: 'destructive',
      });
    }
  };

  // Transférer vers catalogue
  const handleTransferToCatalog = async (draftIds: string[]) => {
    try {
      const transfers = await Promise.allSettled(
        draftIds.map(draftId => transferToProductCatalog(draftId))
      );

      const successful = transfers.filter(t => t.status === 'fulfilled').length;
      const failed = transfers.filter(t => t.status === 'rejected').length;

      if (successful > 0) {
        toast({
          title: 'Transfert réussi',
          description: `${successful} produit(s) ajouté(s) au catalogue${failed > 0 ? ` (${failed} échec(s))` : ''}`,
        });
      }

      if (failed > 0 && successful === 0) {
        toast({
          title: 'Erreur transfert',
          description:
            'Impossible de transférer les produits vers le catalogue',
          variant: 'destructive',
        });
      }

      await loadSampleOrders();
      setSelectedItems([]);
    } catch (error) {
      console.error('Erreur transfert catalogue:', error);
      toast({
        title: 'Erreur',
        description:
          error instanceof Error ? error.message : 'Erreur lors du transfert',
        variant: 'destructive',
      });
    }
  };

  // Obtenir le badge de statut
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return (
          <Badge variant="outline" className="border-gray-300 text-gray-600">
            Brouillon
          </Badge>
        );
      case 'pending_approval':
        return (
          <Badge variant="outline" className="border-gray-300 text-black">
            En attente d'approbation
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="outline" className="border-green-300 text-green-600">
            Approuvée
          </Badge>
        );
      case 'ordered':
        return (
          <Badge variant="outline" className="border-blue-300 text-blue-600">
            Commandée
          </Badge>
        );
      case 'delivered':
        return (
          <Badge
            variant="outline"
            className="border-purple-300 text-purple-600"
          >
            Livrée
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="outline" className="border-gray-800 text-gray-800">
            Terminée
          </Badge>
        );
      default:
        return <Badge variant="outline">Inconnu</Badge>;
    }
  };

  // Formater la date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Chargement initial
  useEffect(() => {
    void loadSampleOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec métriques */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-black">
              Validation Échantillons Groupés
            </h2>
            <p className="text-gray-600">
              Gestion des commandes d'échantillons par fournisseur
            </p>
          </div>
          <ButtonV2
            onClick={() => router.push('/produits/sourcing/validation')}
            className="bg-black hover:bg-gray-800 text-white"
          >
            <ArrowRight className="h-4 w-4 mr-2" />
            Validation Produits
          </ButtonV2>
        </div>

        {/* Métriques rapides */}
        {workflowMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-black">
                {workflowMetrics.total_sourcing ?? 0}
              </div>
              <div className="text-sm text-gray-600">Total sourcing</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-black">
                {workflowMetrics.requiring_samples ?? 0}
              </div>
              <div className="text-sm text-gray-600">
                Nécessitent échantillons
              </div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {workflowMetrics.samples_validated ?? 0}
              </div>
              <div className="text-sm text-gray-600">Échantillons validés</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {workflowMetrics.approved_products ?? 0}
              </div>
              <div className="text-sm text-gray-600">Produits approuvés</div>
            </div>
          </div>
        )}
      </div>

      {/* Liste des commandes d'échantillons */}
      <Card className="border-black">
        <CardHeader>
          <CardTitle className="text-black">
            Commandes d'Échantillons ({sampleOrders.length})
          </CardTitle>
          <CardDescription>
            Commandes groupées par fournisseur avec statuts de validation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {sampleOrders.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  Aucune commande d'échantillons en cours
                </p>
                <p className="text-sm text-gray-500">
                  Les nouvelles commandes apparaîtront ici
                </p>
              </div>
            ) : (
              sampleOrders.map(order => (
                <div
                  key={order.id}
                  className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors"
                >
                  {/* En-tête commande */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Building className="h-5 w-5 text-gray-400" />
                        <h3 className="font-semibold text-black text-lg">
                          {order.supplier.name}
                        </h3>
                        {getStatusBadge(order.status)}
                        <Badge variant="outline" className="text-xs">
                          {order.sample_order_items.length} item(s)
                        </Badge>
                      </div>

                      {order.supplier.contact_email && (
                        <div className="text-sm text-gray-600">
                          📧 {order.supplier.contact_email}
                          {order.supplier.contact_phone &&
                            ` • 📞 ${order.supplier.contact_phone}`}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <ButtonV2
                        variant="outline"
                        size="sm"
                        className="border-gray-300"
                      >
                        <Eye className="h-4 w-4" />
                      </ButtonV2>
                      {order.status === 'pending_approval' && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <ButtonV2
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => setSelectedOrder(order)}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approuver
                            </ButtonV2>
                          </DialogTrigger>
                        </Dialog>
                      )}
                      {order.status === 'approved' && (
                        <ButtonV2
                          size="sm"
                          onClick={() => {
                            void handleMarkDelivered(order.id);
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Truck className="h-4 w-4 mr-2" />
                          Marquer livré
                        </ButtonV2>
                      )}
                    </div>
                  </div>

                  {/* Informations commande */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center space-x-2 text-sm">
                      <Euro className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Coût estimé:</span>
                      <span className="font-medium text-black">
                        {order.estimated_total_cost}€
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Délai:</span>
                      <span className="text-black">
                        {order.expected_delivery_days} jours
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Créée le:</span>
                      <span className="text-black">
                        {formatDate(order.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Liste des items */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">
                      Produits ({order.sample_order_items.length})
                    </h4>
                    {order.sample_order_items.map(item => (
                      <div
                        key={item.id}
                        className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(
                              item.product_draft_id
                            )}
                            onChange={e => {
                              if (e.target.checked) {
                                setSelectedItems(prev => [
                                  ...prev,
                                  item.product_draft_id,
                                ]);
                              } else {
                                setSelectedItems(prev =>
                                  prev.filter(
                                    id => id !== item.product_draft_id
                                  )
                                );
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-black">
                            {item.product_drafts.name}
                          </div>
                          <div className="text-sm text-gray-600">
                            {item.description}
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">
                          {item.estimated_cost}€ • {item.delivery_time_days}j
                        </div>
                        {getStatusBadge(item.status)}
                      </div>
                    ))}
                  </div>

                  {/* Actions validation échantillons */}
                  {order.status === 'delivered' && selectedItems.length > 0 && (
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 mt-4">
                      <div className="text-sm text-gray-600">
                        {selectedItems.length} échantillon(s) sélectionné(s)
                      </div>
                      <div className="flex space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <ButtonV2
                              variant="outline"
                              size="sm"
                              className="border-red-300 text-red-600 hover:bg-red-50"
                            >
                              <X className="h-4 w-4 mr-2" />
                              Rejeter
                            </ButtonV2>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>
                                Rejeter les échantillons
                              </DialogTitle>
                              <DialogDescription>
                                Les échantillons sélectionnés seront marqués
                                comme rejetés
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <Textarea
                                placeholder="Raison du rejet..."
                                value={validationNotes}
                                onChange={e =>
                                  setValidationNotes(e.target.value)
                                }
                                className="border-black focus:ring-black"
                              />
                            </div>
                            <DialogFooter>
                              <ButtonV2
                                variant="outline"
                                onClick={() => setValidationNotes('')}
                              >
                                Annuler
                              </ButtonV2>
                              <ButtonV2
                                onClick={() => {
                                  void handleValidateSamples(
                                    selectedItems,
                                    'rejected',
                                    validationNotes
                                  );
                                }}
                                className="bg-red-600 hover:bg-red-700 text-white"
                              >
                                Confirmer Rejet
                              </ButtonV2>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

                        <Dialog>
                          <DialogTrigger asChild>
                            <ButtonV2
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Valider & Transférer
                            </ButtonV2>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>
                                Valider et transférer au catalogue
                              </DialogTitle>
                              <DialogDescription>
                                Les échantillons seront validés et les produits
                                ajoutés au catalogue
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <Textarea
                                placeholder="Notes de validation (optionnel)..."
                                value={validationNotes}
                                onChange={e =>
                                  setValidationNotes(e.target.value)
                                }
                                className="border-black focus:ring-black"
                              />
                            </div>
                            <DialogFooter>
                              <ButtonV2
                                variant="outline"
                                onClick={() => setValidationNotes('')}
                              >
                                Annuler
                              </ButtonV2>
                              <ButtonV2
                                onClick={() => {
                                  void (async () => {
                                    await handleValidateSamples(
                                      selectedItems,
                                      'approved',
                                      validationNotes
                                    );
                                    await handleTransferToCatalog(
                                      selectedItems
                                    );
                                  })();
                                }}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                Valider & Transférer
                              </ButtonV2>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog d'approbation commande */}
      {selectedOrder && (
        <Dialog
          open={!!selectedOrder}
          onOpenChange={() => setSelectedOrder(null)}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Approuver la commande</DialogTitle>
              <DialogDescription>
                Commande d'échantillons pour {selectedOrder.supplier.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-2">
                  Résumé de la commande:
                </div>
                <div className="space-y-1">
                  <div>
                    • {selectedOrder.sample_order_items.length} produit(s)
                  </div>
                  <div>
                    • Coût estimé: {selectedOrder.estimated_total_cost}€
                  </div>
                  <div>
                    • Délai: {selectedOrder.expected_delivery_days} jours
                  </div>
                </div>
              </div>
              <Textarea
                placeholder="Notes d'approbation (optionnel)..."
                value={validationNotes}
                onChange={e => setValidationNotes(e.target.value)}
                className="border-black focus:ring-black"
              />
            </div>
            <DialogFooter>
              <ButtonV2
                variant="outline"
                onClick={() => {
                  setSelectedOrder(null);
                  setValidationNotes('');
                }}
              >
                Annuler
              </ButtonV2>
              <ButtonV2
                onClick={() => {
                  void handleApproveOrder(selectedOrder.id, validationNotes);
                }}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Confirmer Approbation
              </ButtonV2>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
