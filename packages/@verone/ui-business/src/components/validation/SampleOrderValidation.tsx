'use client';

import { useState, useEffect } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import { useToast } from '@verone/common/hooks';
import { Loader2 } from 'lucide-react';

import {
  approveSampleOrder,
  getSourcingWorkflowMetrics,
  markSampleOrderDelivered,
  transferToProductCatalog,
  validateSamples,
} from './sample-order-validation.api';
import type {
  SampleOrder,
  SampleOrderValidationProps,
} from './sample-order-validation.types';
import { SampleOrderApprovalDialog } from './SampleOrderApprovalDialog';
import { SampleOrderCard, SampleOrderEmptyState } from './SampleOrderCard';
import { SampleOrderValidationHeader } from './SampleOrderValidationHeader';

export function SampleOrderValidation({
  className: _className,
}: SampleOrderValidationProps) {
  const { toast } = useToast();
  const supabase = createClient();

  const [sampleOrders, setSampleOrders] = useState<SampleOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<SampleOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [validationNotes, setValidationNotes] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [workflowMetrics, setWorkflowMetrics] = useState<Record<
    string,
    number
  > | null>(null);

  const loadSampleOrders = async () => {
    try {
      setLoading(true);
      const { data: orders, error } = await supabase
        .from('sample_orders')
        .select(
          `*, suppliers!inner (id, name, contact_email, contact_phone),
          sample_order_items (*, product_drafts!inner (id, name, supplier_page_url))`
        )
        .order('created_at', { ascending: false });
      if (error) throw error;
      setSampleOrders((orders as unknown as SampleOrder[]) ?? []);
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

  const handleApproveOrder = async (orderId: string, notes?: string) => {
    try {
      await approveSampleOrder(supabase, orderId, notes);
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

  const handleMarkDelivered = async (orderId: string) => {
    try {
      await markSampleOrderDelivered(supabase, orderId);
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

  const handleValidateSamples = async (
    draftIds: string[],
    result: 'approved' | 'rejected',
    notes?: string
  ) => {
    try {
      await validateSamples(supabase, draftIds, result, notes);
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

  const handleTransferToCatalog = async (draftIds: string[]) => {
    try {
      const transfers = await Promise.allSettled(
        draftIds.map(id => transferToProductCatalog(id))
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

  const handleToggleItem = (id: string, checked: boolean) => {
    setSelectedItems(prev =>
      checked ? [...prev, id] : prev.filter(i => i !== id)
    );
  };

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
      <SampleOrderValidationHeader workflowMetrics={workflowMetrics} />

      <Card className="border-black">
        <CardHeader>
          <CardTitle className="text-black">
            Commandes d&apos;Échantillons ({sampleOrders.length})
          </CardTitle>
          <CardDescription>
            Commandes groupées par fournisseur avec statuts de validation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {sampleOrders.length === 0 ? (
              <SampleOrderEmptyState />
            ) : (
              sampleOrders.map(order => (
                <SampleOrderCard
                  key={order.id}
                  order={order}
                  selectedItems={selectedItems}
                  validationNotes={validationNotes}
                  onValidationNotesChange={setValidationNotes}
                  onToggleItem={handleToggleItem}
                  onApproveClick={setSelectedOrder}
                  onMarkDelivered={id => {
                    void handleMarkDelivered(id);
                  }}
                  onValidateSamples={handleValidateSamples}
                  onTransferToCatalog={handleTransferToCatalog}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <SampleOrderApprovalDialog
        selectedOrder={selectedOrder}
        validationNotes={validationNotes}
        onValidationNotesChange={setValidationNotes}
        onClose={() => setSelectedOrder(null)}
        onConfirm={(orderId, notes) => {
          void handleApproveOrder(orderId, notes);
        }}
      />
    </div>
  );
}
