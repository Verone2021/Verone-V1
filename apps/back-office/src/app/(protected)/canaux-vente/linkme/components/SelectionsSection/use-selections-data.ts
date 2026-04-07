'use client';

import { useEffect, useState } from 'react';

import { useToast } from '@verone/common';
import { createClient } from '@verone/utils/supabase/client';

import type {
  CatalogDataItem,
  CatalogProduct,
  ProductImageItem,
  Selection,
} from './types';

const LINKME_CHANNEL_ID = '93c68db1-5a30-4168-89ec-6383152be405';

export function useSelectionsData() {
  const { toast } = useToast();
  const [selections, setSelections] = useState<Selection[]>([]);
  const [affiliates, setAffiliates] = useState<
    { id: string; display_name: string; slug: string }[]
  >([]);
  const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchData().catch(error => {
      console.error('[SelectionsSection] Initial fetch failed:', error);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchData is not memoized, including it would cause infinite loop
  }, []);

  async function fetchData() {
    const supabase = createClient();
    setLoading(true);

    try {
      const { data: selectionsData, error: selectionsError } = await supabase
        .from('linkme_selections')
        .select(
          `
          *,
          affiliate:linkme_affiliates(display_name, slug)
        `
        )
        .order('created_at', { ascending: false });

      if (selectionsError) throw selectionsError;

      const { data: affiliatesData, error: affiliatesError } = await supabase
        .from('linkme_affiliates')
        .select('id, display_name, slug')
        .eq('status', 'active');

      if (affiliatesError) throw affiliatesError;

      const { data: catalogData, error: catalogError } = await supabase
        .from('channel_pricing')
        .select(
          `
          id,
          product_id,
          min_margin_rate,
          max_margin_rate,
          suggested_margin_rate,
          channel_commission_rate,
          public_price_ht,
          products:product_id (
            name,
            sku
          )
        `
        )
        .eq('channel_id', LINKME_CHANNEL_ID)
        .eq('is_active', true);

      if (catalogError) {
        console.error('Error fetching catalog:', catalogError);
      }

      const typedCatalogData = (catalogData ?? []) as CatalogDataItem[];
      const productIds = typedCatalogData.map(item => item.product_id);
      const { data: imagesData } = await supabase
        .from('product_images')
        .select('product_id, public_url')
        .in('product_id', productIds)
        .eq('is_primary', true);

      const typedImagesData = (imagesData ?? []) as ProductImageItem[];
      const imageMap = new Map(
        typedImagesData.map(img => [img.product_id, img.public_url])
      );

      const transformedCatalog: CatalogProduct[] = typedCatalogData.map(
        item => ({
          id: item.id,
          product_id: item.product_id,
          product_name: item.products?.name ?? 'Produit inconnu',
          product_reference: item.products?.sku ?? '',
          product_price_ht: Number(item.public_price_ht ?? 0),
          product_image_url: imageMap.get(item.product_id) ?? null,
          max_margin_rate: Number(item.max_margin_rate ?? 30),
          min_margin_rate: Number(item.min_margin_rate ?? 5),
          suggested_margin_rate: Number(item.suggested_margin_rate ?? 15),
          linkme_commission_rate: Number(item.channel_commission_rate ?? 5),
        })
      );

      setSelections(selectionsData ?? []);
      setAffiliates(affiliatesData ?? []);
      setCatalogProducts(transformedCatalog);
    } catch (error) {
      console.error('Error fetching selections:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les sélections',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteSelection(
    selectionId: string,
    selectionName: string
  ) {
    if (
      !confirm(
        `Êtes-vous sûr de vouloir supprimer la sélection "${selectionName}" ?\n\nCette action est irréversible.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch('/api/linkme/selections/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selection_id: selectionId }),
      });

      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(data.message ?? 'Erreur lors de la suppression');
      }

      setSelections(prev => prev.filter(s => s.id !== selectionId));

      toast({
        title: 'Sélection supprimée',
        description: `La sélection "${selectionName}" a été supprimée définitivement.`,
      });
    } catch (error) {
      console.error('Error deleting selection:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer la sélection',
        variant: 'destructive',
      });
    }
  }

  async function handleArchive(selection: Selection) {
    const supabase = createClient();
    const isCurrentlyArchived = selection.archived_at !== null;
    const newArchivedAt = isCurrentlyArchived ? null : new Date().toISOString();

    try {
      const { error } = await supabase
        .from('linkme_selections')
        .update({
          archived_at: newArchivedAt,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selection.id);

      if (error) throw error;

      setSelections(prev =>
        prev.map(s =>
          s.id === selection.id ? { ...s, archived_at: newArchivedAt } : s
        )
      );

      toast({
        title: isCurrentlyArchived
          ? 'Sélection désarchivée'
          : 'Sélection archivée',
        description: isCurrentlyArchived
          ? `"${selection.name}" est maintenant active.`
          : `"${selection.name}" a été archivée.`,
      });
    } catch (error) {
      console.error('Error archiving selection:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier le statut de la sélection',
        variant: 'destructive',
      });
    }
  }

  return {
    selections,
    affiliates,
    catalogProducts,
    loading,
    fetchData,
    setSelections,
    handleDeleteSelection,
    handleArchive,
  };
}
