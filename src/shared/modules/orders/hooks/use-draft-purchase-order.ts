import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/shared/modules/common/hooks';

interface DraftPurchaseOrderParams {
  productId: string;
  quantity?: number; // Défaut: 1
  unitPrice?: number; // Défaut: cost_price du produit
  notes?: string;
  itemType?: 'regular' | 'internal' | 'customer'; // Défaut: regular
}

interface DraftPurchaseOrderResult {
  success: boolean;
  purchaseOrderId?: string;
  purchaseOrderNumber?: string;
  isNewOrder: boolean;
  error?: string;
}

export function useDraftPurchaseOrder() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  /**
   * Ajouter un produit à une commande fournisseur en brouillon
   * Logique intelligente :
   * 1. Chercher une commande draft existante pour ce fournisseur
   * 2. Si trouvée, ajouter le produit à cette commande
   * 3. Sinon, créer une nouvelle commande draft
   *
   * @param params - Paramètres de la commande
   * @returns Résultat de l'opération avec ID commande
   */
  async function addToDraftOrder(
    params: DraftPurchaseOrderParams
  ): Promise<DraftPurchaseOrderResult> {
    setIsLoading(true);

    try {
      const {
        productId,
        quantity = 1,
        unitPrice,
        notes,
        itemType = 'regular',
      } = params;

      // Validation quantité
      if (quantity <= 0) {
        throw new Error('La quantité doit être supérieure à 0');
      }

      // 1. Récupérer les infos du produit
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, name, sku, supplier_id, cost_price')
        .eq('id', productId)
        .single();

      if (productError || !product) {
        throw new Error('Produit non trouvé');
      }

      if (!product.supplier_id) {
        throw new Error("Ce produit n'a pas de fournisseur associé");
      }

      // Prix : utiliser celui fourni, sinon cost_price, sinon erreur
      const finalUnitPrice =
        unitPrice !== undefined ? unitPrice : product.cost_price || 0;

      if (finalUnitPrice <= 0) {
        throw new Error(
          'Le prix unitaire HT doit être défini et supérieur à 0'
        );
      }

      // 2. Chercher une commande draft existante pour ce fournisseur
      const { data: draftOrders, error: draftError } = await supabase
        .from('purchase_orders')
        .select('*')
        .eq('supplier_id', product.supplier_id)
        .eq('status', 'draft')
        .order('created_at', { ascending: false })
        .limit(1);

      if (draftError) {
        throw new Error('Erreur lors de la recherche de commandes draft');
      }

      let purchaseOrderId: string;
      let purchaseOrderNumber: string;
      let isNewOrder = false;

      const lineTotal = finalUnitPrice * quantity;

      // 3. Si commande draft existe, l'utiliser
      if (draftOrders && draftOrders.length > 0) {
        purchaseOrderId = draftOrders[0].id;
        purchaseOrderNumber = draftOrders[0].po_number;

        // Ajouter l'item à la commande existante
        const { error: insertItemError } = await supabase
          .from('purchase_order_items')
          .insert([
            {
              purchase_order_id: purchaseOrderId,
              product_id: productId,
              quantity,
              unit_price_ht: finalUnitPrice,
              discount_percentage: 0,
              sample_type: itemType === 'regular' ? null : itemType,
              notes: notes || `Commande ${product.name} (${product.sku})`,
            },
          ]);

        if (insertItemError) {
          throw new Error("Erreur lors de l'ajout du produit à la commande");
        }

        // Mettre à jour le total de la commande
        const newTotal = (draftOrders[0].total_ht || 0) + lineTotal;
        const newTotalTTC = newTotal * (1 + (draftOrders[0].tax_rate || 0.2));

        await supabase
          .from('purchase_orders')
          .update({
            total_ht: newTotal,
            total_ttc: newTotalTTC,
          })
          .eq('id', purchaseOrderId);

        toast({
          title: 'Produit ajouté',
          description: `Le produit a été ajouté à la commande draft ${purchaseOrderNumber}.`,
        });
      } else {
        // 4. Créer une nouvelle commande draft
        // Récupérer l'utilisateur actuel
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
          throw new Error('Utilisateur non authentifié');
        }

        // Générer un ID et numéro de commande
        const newOrderId = crypto.randomUUID();
        const poNumber = `PO-${Date.now()}`;

        const totalTTC = lineTotal * 1.2; // TVA 20% par défaut

        const { error: orderError } = await supabase
          .from('purchase_orders')
          .insert([
            {
              id: newOrderId,
              po_number: poNumber,
              supplier_id: product.supplier_id,
              status: 'draft',
              currency: 'EUR',
              tax_rate: 0.2,
              total_ht: lineTotal,
              total_ttc: totalTTC,
              created_by: userData.user.id,
              notes: 'Commande en brouillon',
            },
          ]);

        if (orderError) {
          throw new Error('Erreur lors de la création de la commande');
        }

        purchaseOrderId = newOrderId;
        purchaseOrderNumber = poNumber;
        isNewOrder = true;

        // Ajouter l'item
        const { error: insertItemError } = await supabase
          .from('purchase_order_items')
          .insert([
            {
              purchase_order_id: purchaseOrderId,
              product_id: productId,
              quantity,
              unit_price_ht: finalUnitPrice,
              discount_percentage: 0,
              sample_type: itemType === 'regular' ? null : itemType,
              notes: notes || `Commande ${product.name} (${product.sku})`,
            },
          ]);

        if (insertItemError) {
          // Rollback : supprimer la commande créée
          await supabase
            .from('purchase_orders')
            .delete()
            .eq('id', purchaseOrderId);

          throw new Error(
            "Erreur lors de l'ajout du produit à la nouvelle commande"
          );
        }

        toast({
          title: 'Commande créée',
          description: `Une nouvelle commande draft ${poNumber} a été créée avec ce produit.`,
        });
      }

      return {
        success: true,
        purchaseOrderId,
        purchaseOrderNumber,
        isNewOrder,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erreur inconnue';
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
      return {
        success: false,
        isNewOrder: false,
        error: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  }

  return {
    addToDraftOrder,
    isLoading,
  };
}
