'use client';

import type { SupabaseClient } from '@supabase/supabase-js';

import type { CreateVariantGroupData, VariantGroup } from '@verone/types';
import logger from '@verone/utils/logger';

import type {
  ToastFn,
  VariantGroupUpdateData,
} from './types/variant-group.types';
import {
  propagateColorToProducts,
  propagateCommonAttributesToProducts,
  propagateCostPriceToProducts,
  propagateMaterialToProducts,
  propagateSupplierToProducts,
  propagateWeightToProducts,
} from './utils/variant-group-propagation';

export interface VariantGroupCrudDeps {
  supabase: SupabaseClient;
  toast: ToastFn;
  fetchVariantGroups: () => Promise<void>;
}

export function useVariantGroupCrud(deps: VariantGroupCrudDeps) {
  const { supabase, toast, fetchVariantGroups } = deps;

  // Créer un nouveau groupe de variantes
  const createVariantGroup = async (
    data: CreateVariantGroupData
  ): Promise<VariantGroup | null> => {
    try {
      const { data: newGroup, error: createError } = await supabase
        .from('variant_groups')
        .insert([
          {
            name: data.name,
            base_sku: data.base_sku,
            subcategory_id: data.subcategory_id,
            variant_type: data.variant_type ?? 'color',
            dimensions_length: data.dimensions_length ?? null,
            dimensions_width: data.dimensions_width ?? null,
            dimensions_height: data.dimensions_height ?? null,
            dimensions_unit: data.dimensions_unit ?? 'cm',
            common_weight: data.common_weight ?? null,
            has_common_weight: data.has_common_weight ?? false,
            style: data.style ?? null,
            suitable_rooms: data.suitable_rooms ?? null,
            supplier_id: data.supplier_id ?? null,
            has_common_supplier: data.has_common_supplier ?? false,
            common_cost_price: data.common_cost_price ?? null,
            has_common_cost_price: data.has_common_cost_price ?? false,
            common_eco_tax: data.common_eco_tax ?? null,
            common_material: data.common_material ?? null,
            has_common_material: data.has_common_material ?? false,
            common_color: data.common_color ?? null,
            has_common_color: data.has_common_color ?? false,
            material_name_position: data.material_name_position ?? 'none',
            color_name_position: data.color_name_position ?? 'none',
            product_count: 0,
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase strict enum types pour suitable_rooms nécessitent cast
        ] as any)
        .select(
          'id, name, base_sku, subcategory_id, variant_type, product_count, has_common_supplier, supplier_id, dimensions_length, dimensions_width, dimensions_height, dimensions_unit, style, suitable_rooms, common_weight, has_common_weight, common_cost_price, has_common_cost_price, common_eco_tax, common_material, has_common_material, common_color, has_common_color, material_name_position, color_name_position, archived_at, created_at, updated_at'
        )
        .single();

      if (createError || !newGroup) {
        toast({
          title: 'Erreur',
          description: createError?.message || 'Erreur lors de la création',
          variant: 'destructive',
        });
        return null;
      }

      // Attacher le produit témoin au groupe avec variant_position=1
      if (data.matrix_product_id) {
        const groupId = String(newGroup.id);
        const { error: attachError } = await supabase
          .from('products')
          .update({ variant_group_id: groupId, variant_position: 1 })
          .eq('id', data.matrix_product_id);

        if (attachError) {
          logger.error(
            'Échec rattachement produit témoin au groupe',
            new Error(attachError.message),
            {
              operation: 'attach_matrix_product_failed',
              groupId,
              matrixProductId: data.matrix_product_id,
            }
          );
          toast({
            title: 'Attention',
            description:
              "Groupe créé mais le produit témoin n'a pas pu être ajouté automatiquement. Ajoutez-le manuellement.",
            variant: 'destructive',
          });
        }
      }

      // Propager les attributs communs (matiere/couleur) au produit temoin nouvellement attache
      const groupId = String(newGroup.id);
      if (data.has_common_material && data.common_material) {
        await propagateMaterialToProducts(
          supabase,
          groupId,
          data.common_material
        );
      }
      if (data.has_common_color && data.common_color) {
        await propagateColorToProducts(supabase, groupId, data.common_color);
      }
      if (data.has_common_supplier && data.supplier_id) {
        await propagateSupplierToProducts(supabase, groupId, data.supplier_id);
      }
      if (data.has_common_weight && data.common_weight != null) {
        await propagateWeightToProducts(
          supabase,
          groupId,
          Number(data.common_weight)
        );
      }
      if (data.has_common_cost_price && data.common_cost_price != null) {
        await propagateCostPriceToProducts(
          supabase,
          groupId,
          Number(data.common_cost_price),
          data.common_eco_tax ?? null
        );
      }

      toast({
        title: 'Succès',
        description: `Groupe de variantes "${data.name}" créé`,
      });

      await fetchVariantGroups();
      return newGroup as VariantGroup;
    } catch (err) {
      logger.error('Erreur création groupe', err as Error, {
        operation: 'create_variant_group_failed',
      });
      toast({
        title: 'Erreur',
        description: 'Impossible de créer le groupe',
        variant: 'destructive',
      });
      return null;
    }
  };

  // Supprimer un groupe de variantes
  const deleteVariantGroup = async (groupId: string): Promise<boolean> => {
    try {
      // D'abord retirer tous les produits du groupe
      const { error: updateError } = await supabase
        .from('products')
        .update({ variant_group_id: null, variant_position: null })
        .eq('variant_group_id', groupId);

      if (updateError) {
        toast({
          title: 'Erreur',
          description: updateError.message,
          variant: 'destructive',
        });
        return false;
      }

      const { error: deleteError } = await supabase
        .from('variant_groups')
        .delete()
        .eq('id', groupId);

      if (deleteError) {
        toast({
          title: 'Erreur',
          description: deleteError.message,
          variant: 'destructive',
        });
        return false;
      }

      toast({ title: 'Succès', description: 'Groupe de variantes supprimé' });
      await fetchVariantGroups();
      return true;
    } catch (err) {
      logger.error('Erreur suppression groupe', err as Error, {
        operation: 'delete_variant_group_failed',
      });
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le groupe',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Mettre à jour un groupe de variantes
  const updateVariantGroup = async (
    groupId: string,
    data: VariantGroupUpdateData
  ): Promise<boolean> => {
    try {
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (data.name !== undefined) updateData.name = data.name;
      if (data.variant_type !== undefined)
        updateData.variant_type = data.variant_type;
      if (data.subcategory_id !== undefined)
        updateData.subcategory_id = data.subcategory_id;
      if (data.style !== undefined) updateData.style = data.style;
      if (data.suitable_rooms !== undefined)
        updateData.suitable_rooms = data.suitable_rooms;
      if (data.has_common_supplier !== undefined)
        updateData.has_common_supplier = data.has_common_supplier;
      if (data.supplier_id !== undefined)
        updateData.supplier_id = data.supplier_id;
      if (data.common_dimensions !== undefined)
        updateData.common_dimensions = data.common_dimensions;
      if (data.common_weight !== undefined)
        updateData.common_weight = data.common_weight;
      if (data.has_common_weight !== undefined)
        updateData.has_common_weight = data.has_common_weight;
      if (data.common_cost_price !== undefined)
        updateData.common_cost_price = data.common_cost_price;
      if (data.has_common_cost_price !== undefined)
        updateData.has_common_cost_price = data.has_common_cost_price;
      if (data.common_eco_tax !== undefined)
        updateData.common_eco_tax = data.common_eco_tax;
      if (data.common_material !== undefined)
        updateData.common_material = data.common_material;
      if (data.has_common_material !== undefined)
        updateData.has_common_material = data.has_common_material;
      if (data.common_color !== undefined)
        updateData.common_color = data.common_color;
      if (data.has_common_color !== undefined)
        updateData.has_common_color = data.has_common_color;
      if (data.material_name_position !== undefined)
        updateData.material_name_position = data.material_name_position;
      if (data.color_name_position !== undefined)
        updateData.color_name_position = data.color_name_position;

      logger.info('Mise à jour variant group', {
        operation: 'update_variant_group',
        groupId,
        updateData,
      });

      const { error: updateError, data: updatedGroup } = await supabase
        .from('variant_groups')
        .update(updateData)
        .eq('id', groupId)
        .select(
          'id, name, base_sku, subcategory_id, variant_type, product_count, has_common_supplier, supplier_id, dimensions_length, dimensions_width, dimensions_height, dimensions_unit, style, suitable_rooms, common_weight, has_common_weight, common_cost_price, has_common_cost_price, common_eco_tax, common_material, has_common_material, common_color, has_common_color, material_name_position, color_name_position, archived_at, created_at, updated_at'
        )
        .single();

      if (updateError) {
        logger.error('Supabase update error', new Error(updateError.message), {
          operation: 'update_variant_group_supabase_error',
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
          code: updateError.code,
          updateData,
        });
        toast({
          title: 'Erreur',
          description: updateError.message,
          variant: 'destructive',
        });
        return false;
      }

      logger.info('Variant group mis à jour avec succès', {
        operation: 'update_variant_group_success',
        groupId: updatedGroup.id,
        name: updatedGroup.name,
      });

      // Propagation fournisseur
      if (
        (data.has_common_supplier !== undefined ||
          data.supplier_id !== undefined) &&
        data.has_common_supplier &&
        data.supplier_id
      ) {
        await propagateSupplierToProducts(supabase, groupId, data.supplier_id);
      }

      // Propagation poids
      if (
        data.has_common_weight !== undefined ||
        data.common_weight !== undefined
      ) {
        if (data.has_common_weight && data.common_weight) {
          await propagateWeightToProducts(
            supabase,
            groupId,
            data.common_weight
          );
        } else if (data.has_common_weight === false) {
          logger.info('Désactivation poids commun', {
            operation: 'disable_common_weight',
            groupId,
          });
        }
      }

      // Propagation prix d'achat + éco-taxe
      if (
        data.has_common_cost_price !== undefined ||
        data.common_cost_price !== undefined
      ) {
        if (data.has_common_cost_price && data.common_cost_price) {
          await propagateCostPriceToProducts(
            supabase,
            groupId,
            data.common_cost_price,
            data.common_eco_tax
          );
        } else if (data.has_common_cost_price === false) {
          logger.info("Désactivation prix d'achat commun", {
            operation: 'disable_common_cost_price',
            groupId,
          });
        }
      } else if (data.has_common_cost_price === false) {
        logger.info("Désactivation éco-taxe commune (prix d'achat désactivé)", {
          operation: 'disable_common_eco_tax',
          groupId,
        });
      }

      // Propagation matiere commune
      if (
        data.has_common_material !== undefined ||
        data.common_material !== undefined
      ) {
        if (data.has_common_material && data.common_material) {
          await propagateMaterialToProducts(
            supabase,
            groupId,
            data.common_material
          );
        }
      }

      // Propagation couleur commune
      if (
        data.has_common_color !== undefined ||
        data.common_color !== undefined
      ) {
        if (data.has_common_color && data.common_color) {
          await propagateColorToProducts(supabase, groupId, data.common_color);
        }
      }

      // Propagation attributs communs (dimensions, noms, etc.)
      await propagateCommonAttributesToProducts(supabase, groupId, data);

      toast({ title: 'Succès', description: 'Groupe de variantes mis à jour' });
      await fetchVariantGroups();
      return true;
    } catch (err) {
      logger.error('Exception durant mise à jour variant group', err as Error, {
        operation: 'update_variant_group_exception',
      });
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le groupe',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    createVariantGroup,
    deleteVariantGroup,
    updateVariantGroup,
  };
}
