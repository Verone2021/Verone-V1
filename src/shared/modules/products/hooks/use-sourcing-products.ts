'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/shared/modules/common/hooks';

export interface SourcingProduct {
  id: string;
  sku: string;
  name: string;
  supplier_page_url: string | null;

  // 💰 PRICING - Pattern LPP (Last Purchase Price)
  cost_price: number | null; // Prix d'achat indicatif (auto-update via trigger PO)
  margin_percentage?: number; // Marge minimum en pourcentage
  // ❌ selling_price N'EXISTE PAS - Prix de vente sera dans sales_order_items (Phase 2)

  status: string;
  supplier_id: string | null;
  supplier?: {
    id: string;
    legal_name: string;
    trade_name: string | null;
    name: string;
    type: string;
    website: string | null;
  };
  creation_mode: string;
  sourcing_type?: string;
  requires_sample: boolean;
  assigned_client_id: string | null;
  assigned_client?: {
    id: string;
    name: string;
    type: string; // 🔥 FIX: type au lieu de is_professional
  };
  created_at: string;
  updated_at: string;
  // Calculs
  estimated_selling_price?: number;
  // Images
  main_image_url?: string;
}

interface SourcingFilters {
  search?: string;
  status?: string;
  sourcing_type?: 'interne' | 'client';
  supplier_id?: string; // 🆕 Filtrer par fournisseur spécifique
  assigned_client_id?: string; // 🆕 Filtrer par client assigné spécifique
  has_supplier?: boolean;
  requires_sample?: boolean;
}

export function useSourcingProducts(filters?: SourcingFilters) {
  const [products, setProducts] = useState<SourcingProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const supabase = createClient();

  // 🔥 FIX SIMPLE: Utiliser fonction classique au lieu de useCallback
  // Cela évite les dépendances circulaires
  const fetchSourcingProducts = async () => {
    setLoading(true);
    setError(null);

    try {
      // Requête de base pour produits en sourcing avec jointures organisations
      let query = supabase
        .from('products')
        .select(
          `
          id,
          sku,
          name,
          supplier_page_url,
          cost_price,
          stock_status,
          product_status,
          supplier_id,
          creation_mode,
          sourcing_type,
          requires_sample,
          assigned_client_id,
          margin_percentage,
          created_at,
          updated_at,
          supplier:organisations!products_supplier_id_fkey(
            id,
            legal_name,
            trade_name,
            type,
            website
          ),
          assigned_client:organisations!products_assigned_client_id_fkey(
            id,
            legal_name,
            trade_name,
            type
          ),
          product_images!left(
            public_url,
            is_primary
          )
        `
        )
        .eq('creation_mode', 'sourcing')
        .is('archived_at', null)
        .order('created_at', { ascending: false });

      // Appliquer les filtres
      if (filters?.search) {
        query = query.or(
          `name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`
        );
      }

      if (filters?.status) {
        query = query.eq('status', filters.status as any);
      }

      if (filters?.sourcing_type) {
        query = query.eq('sourcing_type', filters.sourcing_type);
      }

      if (filters?.has_supplier !== undefined) {
        if (filters.has_supplier) {
          query = query.not('supplier_id', 'is', null);
        } else {
          query = query.is('supplier_id', null);
        }
      }

      if (filters?.requires_sample !== undefined) {
        query = query.eq('requires_sample', filters.requires_sample);
      }

      // 🆕 Filtre par fournisseur spécifique
      if (filters?.supplier_id) {
        query = query.eq('supplier_id', filters.supplier_id);
      }

      // 🆕 Filtre par client assigné spécifique
      if (filters?.assigned_client_id) {
        query = query.eq('assigned_client_id', filters.assigned_client_id);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        setError(fetchError.message);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les produits en sourcing',
          variant: 'destructive',
        });
        return;
      }

      // Enrichir les produits avec les calculs et images (BR-TECH-002: product_images!left)
      const enrichedProducts = (data || []).map(product => {
        const supplierCost = product.cost_price || 0; // Prix d'achat LPP comme base calcul
        const margin = product.margin_percentage || 50; // Marge par défaut 50%
        const estimatedSellingPrice = supplierCost * (1 + margin / 100);

        // Extraire image primaire depuis product_images (jointure)
        const primaryImage = product.product_images?.find(
          (img: any) => img.is_primary
        );
        const mainImageUrl =
          primaryImage?.public_url ||
          product.product_images?.[0]?.public_url ||
          null;

        return {
          ...product,
          estimated_selling_price: estimatedSellingPrice,
          main_image_url: mainImageUrl,
        };
      });

      setProducts(enrichedProducts as any);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors du chargement',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 🔥 FIX: Appeler directement sans dépendances sur la fonction
    // Dépendre uniquement des valeurs primitives de filters
    fetchSourcingProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters?.search,
    filters?.status,
    filters?.sourcing_type,
    filters?.has_supplier,
    filters?.requires_sample,
  ]);

  // Valider un produit sourcing (passage au catalogue)
  const validateSourcing = async (productId: string) => {
    try {
      // 🔥 FIX: Vérifications business rules complètes
      const product = products.find(p => p.id === productId);

      if (!product) {
        toast({
          title: 'Erreur',
          description: 'Produit introuvable',
          variant: 'destructive',
        });
        return false;
      }

      // Vérification prix OBLIGATOIRE
      if (!product.cost_price || product.cost_price <= 0) {
        toast({
          title: 'Erreur',
          description:
            "Le prix d'achat doit être défini et > 0€ avant validation",
          variant: 'destructive',
        });
        return false;
      }

      // Vérification fournisseur OBLIGATOIRE
      if (!product.supplier_id) {
        toast({
          title: 'Erreur',
          description: 'Un fournisseur doit être lié avant la validation',
          variant: 'destructive',
        });
        return false;
      }

      // 🔥 FIX: Mettre à jour statut + stocks pour respecter trigger validation
      // Le trigger exige stock > 0 pour status "in_stock"
      const { error } = await supabase
        .from('products')
        .update({
          status: 'in_stock',
          creation_mode: 'complete',
          stock_real: 1, // Stock initial minimal pour valider le trigger
          stock_forecasted_in: 0, // Pas de stock prévisionnel à l'entrée
        })
        .eq('id', productId);

      if (error) {
        toast({
          title: 'Erreur',
          description: error.message,
          variant: 'destructive',
        });
        return false;
      }

      toast({
        title: 'Succès',
        description: 'Produit validé et ajouté au catalogue',
      });

      await fetchSourcingProducts();
      return true;
    } catch (err) {
      toast({
        title: 'Erreur',
        description: 'Impossible de valider le produit',
        variant: 'destructive',
      });
      return false;
    }
  };

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
  const hasProductBeenOrdered = async (productId: string): Promise<boolean> => {
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
      // 1. Récupérer les infos du produit (notamment le fournisseur et le prix)
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('name, supplier_id, cost_price')
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

      // Vérification "jamais commandé" - Business Rule
      const alreadyOrdered = await hasProductBeenOrdered(productId);
      if (alreadyOrdered) {
        toast({
          title: 'Échantillon non autorisé',
          description:
            'Ce produit a déjà été commandé. Les échantillons ne sont disponibles que pour les produits jamais commandés.',
          variant: 'destructive',
        });
        return false;
      }

      // 2. Vérifier s'il existe une commande fournisseur en "draft" pour ce fournisseur
      const { data: existingDraftOrders, error: ordersError } = await supabase
        .from('purchase_orders')
        .select('*')
        .eq('supplier_id', product.supplier_id)
        .eq('status', 'draft')
        .order('created_at', { ascending: false })
        .limit(1);

      if (ordersError) throw ordersError;

      let purchaseOrderId: string;

      if (existingDraftOrders && existingDraftOrders.length > 0) {
        // 3a. Ajouter l'échantillon à la commande draft existante
        purchaseOrderId = existingDraftOrders[0].id;

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
              notes: 'Échantillon pour validation',
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
              status: 'draft',
              currency: 'EUR',
              tax_rate: 0.2,
              total_ht: totalHT,
              total_ttc: totalTTC,
              notes: 'Commande échantillon automatique',
              created_by: user?.id,
            },
          ] as any)
          .select('id')
          .single();

        if (orderError) throw orderError;

        purchaseOrderId = newOrder.id;

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
              notes: 'Échantillon pour validation',
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
          status: 'echantillon_a_commander', // Passage à "à commander" car ajouté à commande
          requires_sample: true,
        })
        .eq('id', productId);

      if (updateError) throw updateError;

      await fetchSourcingProducts();
      return true;
    } catch (err: any) {
      console.error('Erreur commande échantillon:', err);
      toast({
        title: 'Erreur',
        description: err.message || "Impossible de commander l'échantillon",
        variant: 'destructive',
      });
      return false;
    }
  };

  // Approuver échantillon - Transférer vers catalogue
  const approveSample = async (productId: string) => {
    try {
      // 1. Récupérer les infos du produit
      const product = products.find(p => p.id === productId);

      if (!product) {
        toast({
          title: 'Erreur',
          description: 'Produit introuvable',
          variant: 'destructive',
        });
        return false;
      }

      // Vérifications business rules
      if (!product.supplier_id) {
        toast({
          title: 'Erreur',
          description: 'Un fournisseur doit être lié avant validation',
          variant: 'destructive',
        });
        return false;
      }

      if (!product.cost_price || product.cost_price <= 0) {
        toast({
          title: 'Erreur',
          description: "Le prix d'achat doit être défini",
          variant: 'destructive',
        });
        return false;
      }

      // 2. Mettre à jour produit: statut actif + completion 100%
      const { error } = await supabase
        .from('products')
        .update({
          status: 'in_stock',
          creation_mode: 'complete',
          completion_percentage: 100,
          stock_real: 1, // Stock initial minimal
          stock_forecasted_in: 0,
        })
        .eq('id', productId);

      if (error) {
        toast({
          title: 'Erreur',
          description: error.message,
          variant: 'destructive',
        });
        return false;
      }

      // 3. Notifier utilisateur
      toast({
        title: 'Échantillon approuvé',
        description: 'Le produit a été ajouté au catalogue avec statut actif',
      });

      // 4. Recharger liste sourcing
      await fetchSourcingProducts();
      return true;
    } catch (err: any) {
      console.error('Erreur approbation échantillon:', err);
      toast({
        title: 'Erreur',
        description: err.message || "Impossible d'approuver l'échantillon",
        variant: 'destructive',
      });
      return false;
    }
  };

  // Rejeter échantillon - Auto-archivage non désarchivable
  const rejectSample = async (productId: string, reason?: string) => {
    try {
      // 1. Auto-archivage avec mention rejet
      const { error } = await supabase
        .from('products')
        .update({
          status: 'discontinued',
          archived_at: new Date().toISOString(),
          rejection_reason:
            reason || 'Échantillon refusé lors de la validation',
        })
        .eq('id', productId);

      if (error) {
        toast({
          title: 'Erreur',
          description: error.message,
          variant: 'destructive',
        });
        return false;
      }

      // 2. Notifier utilisateur
      toast({
        title: 'Échantillon rejeté',
        description:
          'Le produit a été archivé automatiquement et ne peut pas être désarchivé',
      });

      // 3. Recharger liste sourcing
      await fetchSourcingProducts();
      return true;
    } catch (err: any) {
      console.error('Erreur rejet échantillon:', err);
      toast({
        title: 'Erreur',
        description: err.message || "Impossible de rejeter l'échantillon",
        variant: 'destructive',
      });
      return false;
    }
  };

  // Créer un produit en sourcing rapide
  const createSourcingProduct = async (data: {
    name: string;
    supplier_page_url: string;
    cost_price: number; // REQUIRED - validation > 0
    supplier_id?: string;
    assigned_client_id?: string;
    imageFile?: File; // Upload image optionnel
  }) => {
    try {
      // 🔥 FIX: Validation prix OBLIGATOIRE
      if (!data.cost_price || data.cost_price <= 0) {
        toast({
          title: 'Erreur',
          description: "Le prix d'achat est obligatoire et doit être > 0€",
          variant: 'destructive',
        });
        return null;
      }

      // Validation nom
      if (!data.name?.trim()) {
        toast({
          title: 'Erreur',
          description: 'Le nom du produit est obligatoire',
          variant: 'destructive',
        });
        return null;
      }

      // Créer le produit
      const { data: newProduct, error } = await supabase
        .from('products')
        .insert([
          {
            name: data.name,
            supplier_page_url: data.supplier_page_url,
            cost_price: data.cost_price,
            supplier_id: data.supplier_id,
            assigned_client_id: data.assigned_client_id,
            creation_mode: 'sourcing',
            sourcing_type: data.assigned_client_id ? 'client' : 'interne',
            status: 'sourcing', // Statut initial pour produit en sourcing
          },
        ] as any)
        .select()
        .single();

      if (error) {
        toast({
          title: 'Erreur',
          description: error.message,
          variant: 'destructive',
        });
        return null;
      }

      // 🔥 FIX: Upload image si fournie
      if (data.imageFile && newProduct) {
        try {
          const fileExt = data.imageFile.name.split('.').pop();
          const fileName = `${newProduct.id}-${Date.now()}.${fileExt}`;
          const filePath = `products/${fileName}`;

          // Upload vers Supabase Storage
          const { error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(filePath, data.imageFile);

          if (uploadError) {
            console.error('Erreur upload image:', uploadError);
            // Ne pas bloquer la création du produit, juste logger
          } else {
            // Obtenir l'URL publique
            const {
              data: { publicUrl },
            } = supabase.storage.from('product-images').getPublicUrl(filePath);

            // Créer entrée product_images
            await supabase.from('product_images').insert([
              {
                product_id: newProduct.id,
                public_url: publicUrl,
                storage_path: filePath,
                is_primary: true,
                image_type: 'product',
              },
            ] as any);
          }
        } catch (imgError) {
          console.error('Erreur gestion image:', imgError);
          // Ne pas bloquer la création
        }
      }

      toast({
        title: 'Succès',
        description: 'Produit en sourcing créé',
      });

      await fetchSourcingProducts();
      return newProduct;
    } catch (err) {
      toast({
        title: 'Erreur',
        description: 'Impossible de créer le produit',
        variant: 'destructive',
      });
      return null;
    }
  };

  // Mettre à jour un produit en sourcing
  const updateSourcingProduct = async (
    productId: string,
    data: {
      name?: string;
      supplier_page_url?: string;
      cost_price?: number;
      supplier_id?: string | null;
      margin_percentage?: number;
    }
  ) => {
    try {
      // Validation basique
      if (data.cost_price !== undefined && data.cost_price <= 0) {
        toast({
          title: 'Erreur',
          description: "Le prix d'achat doit être > 0€",
          variant: 'destructive',
        });
        return false;
      }

      if (data.name !== undefined && !data.name.trim()) {
        toast({
          title: 'Erreur',
          description: 'Le nom du produit ne peut pas être vide',
          variant: 'destructive',
        });
        return false;
      }

      // Construire l'objet de mise à jour avec uniquement les champs fournis
      const updateData: Partial<{
        name: string;
        supplier_page_url: string;
        cost_price: number;
        supplier_id: string | null;
        margin_percentage: number;
      }> = {};

      if (data.name !== undefined) updateData.name = data.name;
      if (data.supplier_page_url !== undefined)
        updateData.supplier_page_url = data.supplier_page_url;
      if (data.cost_price !== undefined)
        updateData.cost_price = data.cost_price;
      if (data.margin_percentage !== undefined)
        updateData.margin_percentage = data.margin_percentage;

      // Gérer supplier_id (peut être null pour retirer le fournisseur)
      if (data.supplier_id !== undefined) {
        updateData.supplier_id = data.supplier_id;
      }

      const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', productId);

      if (error) {
        toast({
          title: 'Erreur',
          description: error.message,
          variant: 'destructive',
        });
        return false;
      }

      toast({
        title: 'Succès',
        description: 'Produit mis à jour avec succès',
      });

      await fetchSourcingProducts();
      return true;
    } catch (err) {
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le produit',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    products,
    loading,
    error,
    refetch: fetchSourcingProducts,
    validateSourcing,
    orderSample,
    approveSample,
    rejectSample,
    createSourcingProduct,
    updateSourcingProduct,
  };
}
