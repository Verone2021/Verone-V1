'use client';

import { useQueryClient } from '@tanstack/react-query';

import { useToast } from '@verone/common/hooks';
import { invalidateMenuCounts } from '@verone/utils/query';
import { createClient } from '@verone/utils/supabase/client';
import { smartUploadImage } from '@verone/utils/upload';

interface UseSourcingCreateUpdateParams {
  refetch: () => Promise<void>;
}

/**
 * Traduit un refus de la base en phrase comprehensible.
 *
 * Le message brut de PostgreSQL (« violates check constraint "name_length" »)
 * ne dit rien a qui remplit un formulaire. Chaque contrainte que ce formulaire
 * peut reellement heurter a sa traduction ; le reste est renvoye tel quel,
 * plutot que masque derriere un « une erreur est survenue » inutile.
 */
function describeProductInsertError(message: string): string {
  if (message.includes('name_length')) {
    return 'Le nom du produit doit faire au moins 5 caractères.';
  }
  if (message.includes('chk_supplier_moq_positive')) {
    return 'La quantité minimum de commande doit être au moins 1, ou laissée vide.';
  }
  if (message.includes('check_products_cost_price_positive')) {
    return "Le prix d'achat doit être supérieur à 0.";
  }
  if (message.includes('products_cost_price_currency_check')) {
    return "La monnaie du prix d'achat doit être l'euro ou le dollar.";
  }
  if (message.includes('sku_format')) {
    return 'La référence interne générée est invalide. Signalez-le : le produit ne peut pas être créé en l’état.';
  }
  if (message.includes('duplicate key') || message.includes('unique')) {
    return 'Un produit portant la même référence existe déjà.';
  }
  if (
    message.includes('row-level security') ||
    message.includes('permission')
  ) {
    return "Vous n'avez pas les droits pour créer un produit. Reconnectez-vous, puis réessayez.";
  }
  return message;
}

export function useSourcingCreateUpdate({
  refetch,
}: UseSourcingCreateUpdateParams) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const supabase = createClient();

  // Créer un produit en sourcing rapide
  const createSourcingProduct = async (data: {
    name: string;
    supplier_page_url?: string;
    cost_price?: number;
    /** Monnaie du prix d'achat. 'EUR' par défaut. [BO-CONSULT-CURRENCY-001] */
    cost_price_currency?: string;
    /** Taux de change → EUR figé. 1 par défaut. [BO-CONSULT-CURRENCY-001] */
    cost_price_exchange_rate?: number;
    supplier_reference?: string;
    manufacturer?: string;
    description?: string;
    supplier_moq?: number;
    sourcing_channel?: string;
    supplier_id?: string;
    assigned_client_id?: string;
    enseigne_id?: string;
    imageFiles?: File[];
  }) => {
    try {
      // Validation nom
      if (!data.name?.trim()) {
        toast({
          title: 'Erreur',
          description: 'Le nom du produit est obligatoire',
          variant: 'destructive',
        });
        return null;
      }

      // Déterminer sourcing_type : 'client' si enseigne OU organisation, sinon 'interne'
      // Colonnes uuid : une chaîne vide venant d'un <select> non choisi fait
      // échouer l'INSERT en 400 (invalid input syntax for type uuid).
      // Roméo 17/09 : créer un sourcing sans fournisseur doit marcher.
      const toUuidOrNull = (value?: string | null): string | null =>
        value && value.trim() !== '' ? value : null;

      const supplierId = toUuidOrNull(data.supplier_id);
      const assignedClientId = toUuidOrNull(data.assigned_client_id);
      const enseigneId = toUuidOrNull(data.enseigne_id);

      const isClientSourcing = !!(enseigneId ?? assignedClientId);

      // Créer le produit (champs facultatifs envoyés uniquement si renseignés)
      const { data: newProduct, error } = await supabase
        .from('products')
        .insert([
          {
            name: data.name,
            supplier_page_url: data.supplier_page_url ?? null,
            cost_price: data.cost_price ?? null,
            cost_price_currency: data.cost_price_currency ?? 'EUR',
            cost_price_exchange_rate: data.cost_price_exchange_rate ?? 1,
            supplier_reference: data.supplier_reference ?? null,
            manufacturer: data.manufacturer ?? null,
            description: data.description ?? null,
            // La base exige supplier_moq >= 1 (chk_supplier_moq_positive) :
            // champ laissé vide = 0 côté formulaire → null, sinon l'INSERT
            // échoue en 400 (constaté le 17/09 sur le raccourci sourcing).
            supplier_moq:
              data.supplier_moq && data.supplier_moq >= 1
                ? data.supplier_moq
                : null,
            sourcing_channel: data.sourcing_channel ?? null,
            supplier_id: supplierId,
            assigned_client_id: assignedClientId,
            enseigne_id: enseigneId,
            creation_mode: 'sourcing',
            sourcing_type: isClientSourcing ? 'client' : 'interne',
            product_status: 'draft' as const,
            completion_status: 'draft',
            stock_status: 'out_of_stock' as const,
            // Le déclencheur products_auto_sku_trigger ne sait générer un SKU
            // qu'à partir d'une sous-catégorie ; le formulaire de sourcing n'en
            // demande pas, et la chaîne vide violait la contrainte sku_format
            // (400 au moment de créer — constaté le 17/09). Même format que
            // l'import du plugin navigateur.
            sku: `SRC-${Date.now().toString(36).toUpperCase()}`,
          },
        ])
        .select('id, name, sku, product_status, creation_mode, sourcing_type')
        .single();

      if (error) {
        console.error('[useSourcingCreateUpdate] INSERT products:', error);
        toast({
          title: 'Enregistrement refusé',
          description: describeProductInsertError(error.message),
          variant: 'destructive',
        });
        return null;
      }

      // Upload images si fournies (multi)
      if (data.imageFiles && data.imageFiles.length > 0 && newProduct) {
        for (let i = 0; i < data.imageFiles.length; i++) {
          const file = data.imageFiles[i];
          try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${newProduct.id}-${Date.now()}-${i}.${fileExt}`;
            const filePath = `products/${fileName}`;

            const uploadResult = await smartUploadImage(file, {
              bucket: 'product-images',
              path: filePath,
              ownerId: newProduct.id,
              ownerType: 'product',
            });
            const { error: insertError } = await supabase
              .from('product_images')
              .insert([
                {
                  product_id: newProduct.id,
                  cloudflare_image_id: uploadResult.cloudflareImageId ?? null,
                  public_url: uploadResult.supabasePublicUrl ?? null,
                  storage_path: filePath,
                  is_primary: i === 0,
                  image_type: i === 0 ? 'primary' : 'gallery',
                },
              ]);
            if (insertError) {
              if (uploadResult.storagePath) {
                try {
                  await supabase.storage
                    .from('product-images')
                    .remove([uploadResult.storagePath]);
                } catch (cleanupErr) {
                  console.warn(
                    `[sourcing] Cleanup Supabase échoué image ${i} (non bloquant):`,
                    cleanupErr
                  );
                }
              }
              // Note: si uploadResult.cloudflareImageId, l'image Cloudflare reste
              // orpheline (cleanup côté server requis, traité dans TÂCHE INFRA-IMG-012)
              console.error(
                `[sourcing] Insert product_images échoué image ${i}:`,
                insertError
              );
              continue;
            }
          } catch (imgError) {
            console.error(`Erreur upload image ${i}:`, imgError);
          }
        }
      }

      toast({
        title: 'Succès',
        description: 'Produit en sourcing créé',
      });

      await refetch();
      await invalidateMenuCounts(queryClient, 'sourcing');
      return newProduct;
    } catch (_err) {
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
      supplier_page_url?: string | null;
      cost_price?: number | null;
      eco_tax_default?: number | null;
      supplier_id?: string | null;
      supplier_reference?: string | null;
      margin_percentage?: number | null;
      manufacturer?: string | null;
      description?: string | null;
      supplier_moq?: number | null;
      dimensions?: Record<string, number> | null;
      weight?: number | null;
      internal_notes?: string | null;
    }
  ) => {
    try {
      // Validation basique
      if (
        data.cost_price !== undefined &&
        data.cost_price !== null &&
        data.cost_price <= 0
      ) {
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
      const updateData: Record<string, unknown> = {};

      if (data.name !== undefined) updateData.name = data.name;
      if (data.supplier_page_url !== undefined)
        updateData.supplier_page_url = data.supplier_page_url;
      if (data.cost_price !== undefined)
        updateData.cost_price = data.cost_price;
      if (data.eco_tax_default !== undefined)
        updateData.eco_tax_default = data.eco_tax_default;
      if (data.margin_percentage !== undefined)
        updateData.margin_percentage = data.margin_percentage;
      if (data.supplier_reference !== undefined)
        updateData.supplier_reference = data.supplier_reference;
      if (data.manufacturer !== undefined)
        updateData.manufacturer = data.manufacturer;
      if (data.description !== undefined)
        updateData.description = data.description;
      if (data.supplier_moq !== undefined) {
        // Même règle qu'à la création : 0 ou vide = aucune quantité minimale
        updateData.supplier_moq =
          data.supplier_moq && data.supplier_moq >= 1
            ? data.supplier_moq
            : null;
      }
      if (data.dimensions !== undefined)
        updateData.dimensions = data.dimensions;
      if (data.weight !== undefined) updateData.weight = data.weight;
      if (data.internal_notes !== undefined)
        updateData.internal_notes = data.internal_notes;

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

      await refetch();
      await invalidateMenuCounts(queryClient, 'sourcing');
      return true;
    } catch (_err) {
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le produit',
        variant: 'destructive',
      });
      return false;
    }
  };

  return { createSourcingProduct, updateSourcingProduct };
}
