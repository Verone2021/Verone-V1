'use client';

import { useToast } from '@verone/common/hooks';
import { createClient } from '@verone/utils/supabase/client';

interface UseSourcingSampleOrderParams {
  refetch: () => Promise<void>;
}

export function useSourcingSampleOrder({
  refetch,
}: UseSourcingSampleOrderParams) {
  const { toast } = useToast();
  const supabase = createClient();

  /**
   * Vérifie si un produit a déjà été commandé (hors échantillons)
   *
   * Business Rule : Un produit peut demander un échantillon UNIQUEMENT s'il n'a jamais été commandé.
   * - Produits en sourcing : Toujours autorisés (nouveaux produits)
   * - Produits au catalogue : Autorisés seulement si jamais commandés avant
   *
   * @param productId - UUID du produit à vérifier
   * @returns true si déjà commandé (échantillon interdit), false sinon (échantillon autorisé)
   */
  const _hasProductBeenOrdered = async (
    productId: string
  ): Promise<boolean> => {
    try {
      // Chercher dans purchase_order_items si le produit a déjà été commandé
      // On exclut les items avec notes = 'Échantillon pour validation'
      const { data, error } = await supabase
        .from('purchase_order_items')
        .select('id')
        .eq('product_id', productId)
        .or('notes.not.eq.Échantillon pour validation,notes.is.null')
        .limit(1);

      if (error) {
        console.error('Erreur vérification commandes produit:', error);
        return false; // En cas d'erreur, autoriser échantillon par sécurité
      }

      // Si au moins 1 item trouvé → produit déjà commandé
      return data && data.length > 0;
    } catch (err) {
      console.error('Erreur hasProductBeenOrdered:', err);
      return false; // En cas d'erreur, autoriser échantillon par sécurité
    }
  };

  // Commander un échantillon - Logique métier complète
  const orderSample = async (productId: string) => {
    try {
      // 1. Récupérer les infos du produit (notamment le fournisseur, le prix et le client assigné)
      const { data: product, error: productError } = await supabase
        .from('products')
        .select(
          `
          name,
          supplier_id,
          cost_price,
          assigned_client_id,
          assigned_client:organisations!products_assigned_client_id_fkey(
            id,
            legal_name,
            trade_name,
            type
          )
        `
        )
        .eq('id', productId)
        .single();

      if (productError) throw productError;

      // Vérification fournisseur OBLIGATOIRE pour échantillon
      if (!product.supplier_id) {
        toast({
          title: 'Erreur',
          description:
            'Un fournisseur doit être lié au produit avant de commander un échantillon',
          variant: 'destructive',
        });
        return false;
      }

      // Vérification prix OBLIGATOIRE
      if (!product.cost_price || product.cost_price <= 0) {
        toast({
          title: 'Erreur',
          description:
            "Le prix d'achat doit être défini avant de commander un échantillon",
          variant: 'destructive',
        });
        return false;
      }

      // NOTE: Restriction "jamais commandé" SUPPRIMÉE (2025-11-25)
      // Les échantillons peuvent être commandés plusieurs fois tout au long de la vie du produit
      // (pour différents clients, showroom, tests qualité, etc.)

      // 2. Vérifier s'il existe une commande fournisseur en "draft" pour ce fournisseur
      const { data: existingDraftOrders, error: ordersError } = await supabase
        .from('purchase_orders')
        .select(
          'id, po_number, supplier_id, status, total_ht, total_ttc, created_at'
        )
        .eq('supplier_id', product.supplier_id)
        .eq('status', 'draft')
        .order('created_at', { ascending: false })
        .limit(1);

      if (ordersError) throw ordersError;

      let purchaseOrderId: string;

      if (existingDraftOrders && existingDraftOrders.length > 0) {
        // 3a. Ajouter l'échantillon à la commande draft existante
        purchaseOrderId = existingDraftOrders[0].id;

        // Déterminer le type d'échantillon et le client
        const assignedClient = product.assigned_client as {
          id: string;
          legal_name: string;
          trade_name: string | null;
          type: string;
        } | null;
        const clientName = assignedClient
          ? (assignedClient.trade_name ?? assignedClient.legal_name)
          : null;
        const sampleType = product.assigned_client_id ? 'customer' : 'internal';

        // Ajouter un item à la commande existante
        const { error: itemError } = await supabase
          .from('purchase_order_items')
          .insert([
            {
              purchase_order_id: purchaseOrderId,
              product_id: productId,
              quantity: 1, // Échantillon = quantité 1
              unit_price_ht: product.cost_price,
              discount_percentage: 0,
              sample_type: sampleType,
              customer_organisation_id: product.assigned_client_id ?? null,
              notes: clientName
                ? `Échantillon sourcing - Client: ${clientName}`
                : 'Échantillon pour validation',
            },
          ]);

        if (itemError) throw itemError;

        // Mettre à jour le total de la commande
        const { data: orderItems, error: itemsError } = await supabase
          .from('purchase_order_items')
          .select('quantity, unit_price_ht, discount_percentage')
          .eq('purchase_order_id', purchaseOrderId);

        if (itemsError) throw itemsError;

        const newTotalHT = orderItems.reduce((sum, item) => {
          return (
            sum +
            item.quantity *
              item.unit_price_ht *
              (1 - item.discount_percentage / 100)
          );
        }, 0);

        const newTotalTTC = newTotalHT * 1.2; // TVA 20%

        await supabase
          .from('purchase_orders')
          .update({
            total_ht: newTotalHT,
            total_ttc: newTotalTTC,
          })
          .eq('id', purchaseOrderId);

        toast({
          title: 'Succès',
          description: `Échantillon ajouté à la commande existante ${existingDraftOrders[0].po_number}`,
        });
      } else {
        // 3b. Créer une nouvelle commande fournisseur en "draft"
        // Générer le numéro de commande
        const { data: poNumber, error: numberError } =
          await supabase.rpc('generate_po_number');

        if (numberError) throw numberError;

        const totalHT = product.cost_price * 1; // 1 échantillon
        const totalTTC = totalHT * 1.2; // TVA 20%

        // Récupérer l'utilisateur actuel
        const {
          data: { user },
        } = await supabase.auth.getUser();

        // Créer la commande
        const { data: newOrder, error: orderError } = await supabase
          .from('purchase_orders')
          .insert([
            {
              po_number: poNumber,
              supplier_id: product.supplier_id,
              status: 'draft' as const,
              currency: 'EUR',
              total_ht: totalHT,
              total_ttc: totalTTC,
              notes: 'Commande échantillon automatique',
              created_by: user?.id ?? '',
            },
          ])
          .select('id')
          .single();

        if (orderError) throw orderError;

        purchaseOrderId = newOrder.id;

        // Déterminer le type d'échantillon et le client
        const assignedClientNew = product.assigned_client as {
          id: string;
          legal_name: string;
          trade_name: string | null;
          type: string;
        } | null;
        const clientNameNew = assignedClientNew
          ? (assignedClientNew.trade_name ?? assignedClientNew.legal_name)
          : null;
        const sampleTypeNew = product.assigned_client_id
          ? 'customer'
          : 'internal';

        // Créer l'item échantillon
        const { error: itemError } = await supabase
          .from('purchase_order_items')
          .insert([
            {
              purchase_order_id: purchaseOrderId,
              product_id: productId,
              quantity: 1,
              unit_price_ht: product.cost_price,
              discount_percentage: 0,
              sample_type: sampleTypeNew,
              customer_organisation_id: product.assigned_client_id ?? null,
              notes: clientNameNew
                ? `Échantillon sourcing - Client: ${clientNameNew}`
                : 'Échantillon pour validation',
            },
          ]);

        if (itemError) throw itemError;

        toast({
          title: 'Succès',
          description: `Nouvelle commande fournisseur ${poNumber} créée avec l'échantillon`,
        });
      }

      // 4. Mettre à jour le statut du produit
      const { error: updateError } = await supabase
        .from('products')
        .update({
          product_status: 'preorder', // ✅ FIXED: Use 'preorder' for sample order
          stock_status: 'coming_soon', // En attente d'échantillon
          requires_sample: true,
        })
        .eq('id', productId);

      if (updateError) throw updateError;

      await refetch();
      return true;
    } catch (err: unknown) {
      console.error('Erreur commande échantillon:', err);
      const errMsg =
        err instanceof Error
          ? err.message
          : "Impossible de commander l'échantillon";
      toast({
        title: 'Erreur',
        description: errMsg,
        variant: 'destructive',
      });
      return false;
    }
  };

  return { orderSample, _hasProductBeenOrdered };
}
