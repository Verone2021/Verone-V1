'use client';

import { useState, useEffect } from 'react';

import { createClient } from '@verone/utils/supabase/client';

import type {
  CustomerProduct,
  OrganisationChannel,
  ProductWithImages,
} from './customer-detail.types';

interface UseCustomerDetailReturn {
  kbisUrl: string | null;
  kbisUploading: boolean;
  handleKbisUpload: (file: File) => Promise<void>;
  customerProducts: CustomerProduct[];
  productsLoading: boolean;
  organisationChannels: OrganisationChannel[];
}

export function useCustomerDetail(
  customerId: string | string[] | undefined
): UseCustomerDetailReturn {
  const [kbisUrl, setKbisUrl] = useState<string | null>(null);
  const [kbisUploading, setKbisUploading] = useState(false);
  const [customerProducts, setCustomerProducts] = useState<CustomerProduct[]>(
    []
  );
  const [productsLoading, setProductsLoading] = useState(false);
  const [organisationChannels, setOrganisationChannels] = useState<
    OrganisationChannel[]
  >([]);

  // Fetch kbis_url separately (not in shared hook ORGANISATION_COLUMNS)
  useEffect(() => {
    if (!customerId || typeof customerId !== 'string') return;
    const supabase = createClient();
    void supabase
      .from('organisations')
      .select('id, kbis_url')
      .eq('id', customerId)
      .single()
      .then(({ data }) => {
        const row = data as { kbis_url?: string | null } | null;
        if (row?.kbis_url) setKbisUrl(row.kbis_url);
      });
  }, [customerId]);

  const handleKbisUpload = async (file: File) => {
    if (!customerId || typeof customerId !== 'string') return;
    setKbisUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop() ?? 'pdf';
      const path = `${customerId}/kbis-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('organisation-logos')
        .upload(path, file, { upsert: true });
      if (uploadError) {
        console.error('K-BIS upload error:', uploadError);
        return;
      }
      const { data: urlData } = supabase.storage
        .from('organisation-logos')
        .getPublicUrl(path);
      const publicUrl = urlData.publicUrl;
      // kbis_url exists in DB but not in generated types — use raw update
      const { error: updateError } = await supabase
        .from('organisations')
        .update({ kbis_url: publicUrl } as Record<string, unknown>)
        .eq('id', customerId);
      if (updateError) {
        console.error('K-BIS DB update error:', updateError);
        return;
      }
      setKbisUrl(publicUrl);
    } catch (err) {
      console.error('K-BIS upload failed:', err);
    } finally {
      setKbisUploading(false);
    }
  };

  // Charger les produits sourcés pour ce client
  useEffect(() => {
    async function fetchCustomerProducts() {
      if (!customerId || typeof customerId !== 'string') return;
      setProductsLoading(true);
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('products')
          .select(
            `id, name, sku, product_status, created_at,
            product_images!left(public_url, is_primary)`
          )
          .eq('assigned_client_id', customerId)
          .order('created_at', { ascending: false });

        const products = data as ProductWithImages[] | null;
        const mappedProducts: CustomerProduct[] = (products ?? []).map(p => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          product_status: p.product_status,
          created_at: p.created_at,
          primary_image_url:
            p.product_images?.find(img => img.is_primary)?.public_url ?? null,
        }));
        setCustomerProducts(mappedProducts);
      } catch (err) {
        console.error('Erreur chargement produits client:', err);
      } finally {
        setProductsLoading(false);
      }
    }
    void fetchCustomerProducts().catch(error => {
      console.error('[CustomerDetail] Fetch products failed:', error);
    });
  }, [customerId]);

  // Charger les canaux de vente de cette organisation
  useEffect(() => {
    async function fetchOrganisationChannels() {
      if (!customerId || typeof customerId !== 'string') return;

      const channels: OrganisationChannel[] = [];
      try {
        const supabase = createClient();
        const { data: linkmeAffiliate } = await supabase
          .from('linkme_affiliates')
          .select('id, status')
          .eq('organisation_id', customerId)
          .single();

        if (linkmeAffiliate) {
          channels.push({
            code: 'linkme',
            name: 'LinkMe',
            link: `/canaux-vente/linkme/organisations/${customerId}`,
            isActive: linkmeAffiliate.status === 'active',
          });
        }
        setOrganisationChannels(channels);
      } catch (err) {
        console.error('Erreur chargement canaux organisation:', err);
      }
    }
    void fetchOrganisationChannels().catch(error => {
      console.error('[CustomerDetail] Fetch channels failed:', error);
    });
  }, [customerId]);

  return {
    kbisUrl,
    kbisUploading,
    handleKbisUpload,
    customerProducts,
    productsLoading,
    organisationChannels,
  };
}
