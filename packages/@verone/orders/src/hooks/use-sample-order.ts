import { useState } from 'react';

import { createClient } from '@/lib/supabase/client';
import { useToast } from '@verone/common/hooks';

import { useUnifiedSampleEligibility } from './use-unified-sample-eligibility';

interface SampleOrderResult {
  success: boolean;
  purchaseOrderId?: string;
  isNewOrder: boolean;
  error?: string;
}

export function useSampleOrder() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();
  const { checkEligibility } = useUnifiedSampleEligibility();

  /**
   * Créer une commande d'échantillon pour un produit
   * Logique :
   * 1. Vérifier si le produit a déjà été commandé
   * 2. Si oui, retourner erreur "déjà commandé"
   * 3. Chercher une commande draft existante pour ce fournisseur
   * 4. Si trouvée, ajouter le produit à cette commande
   * 5. Sinon, créer une nouvelle commande draft
   */
  async function requestSample(
    productId: string,
    sampleType?: 'internal' | 'customer'
  ): Promise<SampleOrderResult> {
    setIsLoading(true);

    try {
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

      if (!product.cost_price || product.cost_price <= 0) {
        throw new Error('Le prix HT du produit doit être défini');
      }

      // 2. Vérifier éligibilité échantillon avec règle UNIFIÉE
      // ✅ Vérifie BOTH purchase_order_items ET stock_movements
      // @see src/hooks/use-unified-sample-eligibility.ts
      const eligibility = await checkEligibility(productId);

      if (!eligibility.isEligible) {
        toast({
          title: 'Échantillon non autorisé',
          description: eligibility.message,
          variant: 'destructive',
        });
        return {
          success: false,
          isNewOrder: false,
          error: 'not_eligible',
        };
      }

      // 3. Chercher une commande draft existante pour ce fournisseur
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
      let isNewOrder = false;

      // 4. Si commande draft existe, l'utiliser
      if (draftOrders && draftOrders.length > 0) {
        purchaseOrderId = draftOrders[0].id;

        // Ajouter l'item à la commande existante
        const { error: insertItemError } = await supabase
          .from('purchase_order_items')
          .insert([
            {
              purchase_order_id: purchaseOrderId,
              product_id: productId,
              quantity: 1,
              unit_price_ht: product.cost_price,
              discount_percentage: 0,
              sample_type: sampleType || 'internal',
              notes: `Échantillon pour validation qualité - ${product.name}`,
            },
          ]);

        if (insertItemError) {
          throw new Error("Erreur lors de l'ajout du produit à la commande");
        }

        // Mettre à jour le total de la commande
        const newTotal = (draftOrders[0].total_ht || 0) + product.cost_price;
        await supabase
          .from('purchase_orders')
          .update({ total_ht: newTotal, total_ttc: newTotal * 1.2 })
          .eq('id', purchaseOrderId);

        toast({
          title: 'Échantillon ajouté',
          description: `Le produit a été ajouté à la commande draft existante (${draftOrders[0].po_number}).`,
        });
      } else {
        // 5. Créer une nouvelle commande draft
        // Récupérer l'utilisateur actuel
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
          throw new Error('Utilisateur non authentifié');
        }

        // Générer un ID et numéro de commande
        const newOrderId = crypto.randomUUID();
        const poNumber = `PO-ECH-${Date.now()}`;

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
              total_ht: product.cost_price,
              total_ttc: product.cost_price * 1.2,
              created_by: userData.user.id,
              notes: "Commande d'échantillons pour validation qualité",
            },
          ]);

        if (orderError) {
          throw new Error('Erreur lors de la création de la commande');
        }

        purchaseOrderId = newOrderId;
        isNewOrder = true;

        // Ajouter l'item
        const { error: insertItemError } = await supabase
          .from('purchase_order_items')
          .insert([
            {
              purchase_order_id: purchaseOrderId,
              product_id: productId,
              quantity: 1,
              unit_price_ht: product.cost_price,
              discount_percentage: 0,
              sample_type: sampleType || 'internal',
              notes: `Échantillon pour validation qualité - ${product.name}`,
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
          title: "Commande d'échantillon créée",
          description: `Une nouvelle commande (${poNumber}) a été créée avec ce produit.`,
        });
      }

      return {
        success: true,
        purchaseOrderId,
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
    requestSample,
    isLoading,
  };
}
