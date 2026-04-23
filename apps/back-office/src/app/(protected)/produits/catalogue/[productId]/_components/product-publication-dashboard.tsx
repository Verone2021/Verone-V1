'use client';

/**
 * ProductPublicationDashboard — orchestrateur onglet Publication.
 *
 * Design cible : Audit & Distribution v2b (validé Romeo).
 * Sprint : BO-UI-PROD-PUB-001
 *
 * Layout : rail gauche 220px (GeneralRail réutilisé) + body 3 sections empilées.
 * Pas de secondary sidebar — contenu full-width comme Tarification / Stock.
 */

import { useEffect, useState, useMemo } from 'react';

import { createClient } from '@verone/utils/supabase/client';

import { GeneralRail } from './_dashboard-blocks/GeneralRail';
import { PublicationScoreCard } from './_publication-blocks/PublicationScoreCard';
import { PublicationChecklist } from './_publication-blocks/PublicationChecklist';
import {
  PublicationChannels,
  type ChannelStatus,
} from './_publication-blocks/PublicationChannels';
import type { ChecklistItem } from './_publication-blocks/PublicationChecklist';
import type { Product } from './types';

interface ProductPublicationDashboardProps {
  product: Product;
  completionPercentage: number;
  onTabChange: (tabId: string) => void;
}

/**
 * Fetch channel_pricing pour ce produit.
 * Colonnes explicites — pas de select('*').
 */
async function fetchChannelPricing(
  supabase: ReturnType<typeof createClient>,
  productId: string
): Promise<ChannelStatus[]> {
  const { data, error } = await supabase
    .from('channel_pricing')
    .select('is_active, custom_price_ht, channel:sales_channels(code, name)')
    .eq('product_id', productId)
    .limit(20);

  if (error || !data) return [];

  return data.map(d => {
    const ch = d.channel as { code: string; name: string } | null;
    return {
      channel_code: ch?.code ?? '',
      channel_name: ch?.name ?? '',
      is_active: d.is_active ?? false,
      custom_price_ht: d.custom_price_ht ?? null,
    };
  });
}

export function ProductPublicationDashboard({
  product,
  completionPercentage,
  onTabChange,
}: ProductPublicationDashboardProps) {
  const [channels, setChannels] = useState<ChannelStatus[]>([]);
  const [loadingChannels, setLoadingChannels] = useState(true);

  // ── Fetch canaux ───────────────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient();
    void fetchChannelPricing(supabase, product.id)
      .then(result => {
        setChannels(result);
        setLoadingChannels(false);
      })
      .catch(err => {
        console.error(
          '[ProductPublicationDashboard] channel fetch failed:',
          err
        );
        setLoadingChannels(false);
      });
    // product.id est stable sur la durée de vie du composant.
  }, [product.id]);

  // ── Critère "prix de vente" (au moins 1 canal actif avec prix > 0) ─
  const hasPricingChannel = useMemo(
    () =>
      !loadingChannels &&
      channels.some(
        c => c.is_active && c.custom_price_ht != null && c.custom_price_ht > 0
      ),
    [channels, loadingChannels]
  );

  // ── Checklist items ────────────────────────────────────────────────
  const checklistItems = useMemo<ChecklistItem[]>(() => {
    const subcategoryLabel = product.subcategory?.name ?? undefined;
    const slugLabel = product.slug ?? undefined;

    return [
      // ─ Requis (6) ─
      {
        key: 'name',
        label: 'Nom du produit',
        ok: Boolean(product.name?.trim()),
        required: true,
        valueLabel: product.name?.trim() ? product.name : undefined,
      },
      {
        key: 'description',
        label: 'Description marketing',
        ok: Boolean(product.description?.trim()),
        required: true,
        linkLabel: !product.description?.trim()
          ? '→ Onglet Descriptions'
          : undefined,
        linkTabId: !product.description?.trim() ? 'descriptions' : undefined,
      },
      {
        key: 'images',
        label: 'Image principale',
        ok: product.has_images === true,
        required: true,
        linkLabel: product.has_images !== true ? '→ Onglet Images' : undefined,
        linkTabId: product.has_images !== true ? 'images' : undefined,
      },
      {
        key: 'category',
        label: 'Catégorie',
        ok: Boolean(product.subcategory_id),
        required: true,
        valueLabel: subcategoryLabel,
      },
      {
        key: 'slug',
        label: 'Slug URL',
        ok: Boolean(product.slug),
        required: true,
        valueLabel: slugLabel,
      },
      {
        key: 'pricing',
        label: 'Prix de vente (canal actif)',
        ok: hasPricingChannel,
        required: true,
        linkLabel: !hasPricingChannel ? '→ Onglet Tarification' : undefined,
        linkTabId: !hasPricingChannel ? 'pricing' : undefined,
      },
      // ─ Optionnels (3) ─
      {
        key: 'meta_description',
        label: 'Meta description SEO',
        ok: Boolean(product.meta_description?.trim()),
        required: false,
      },
      {
        key: 'status',
        label: 'Statut actif',
        ok: product.product_status === 'active',
        required: false,
        valueLabel: product.product_status === 'active' ? 'Actif' : undefined,
      },
      {
        key: 'published',
        label: 'Publié en ligne',
        ok: product.is_published_online === true,
        required: false,
      },
    ];
  }, [product, hasPricingChannel]);

  const requiredItems = useMemo(
    () => checklistItems.filter(i => i.required),
    [checklistItems]
  );
  const passedRequired = useMemo(
    () => requiredItems.filter(i => i.ok).length,
    [requiredItems]
  );

  // ── Tab entries pour le rail (miroir des autres onglets) ──────────
  const tabEntries = useMemo(
    () => [
      { id: 'general', label: 'Général', percent: completionPercentage },
      {
        id: 'descriptions',
        label: 'Descriptions',
        percent: product.description ? 100 : 0,
      },
      {
        id: 'pricing',
        label: 'Tarification',
        percent: product.cost_price != null ? 100 : 50,
      },
      {
        id: 'stock',
        label: 'Stock',
        percent: product.min_stock != null ? 100 : 50,
      },
      {
        id: 'characteristics',
        label: 'Caractéristiques',
        percent: product.dimensions ? 80 : 30,
      },
      {
        id: 'images',
        label: 'Images',
        percent: product.has_images ? 100 : 0,
      },
      {
        id: 'publication',
        label: 'Publication',
        percent: product.is_published_online ? 100 : 60,
      },
    ],
    [product, completionPercentage]
  );

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      {/* Rail gauche sticky — partagé avec les autres onglets */}
      <GeneralRail
        productId={product.id}
        productName={product.name}
        sku={product.sku ?? ''}
        completionPercentage={completionPercentage}
        tabEntries={tabEntries}
        variantGroupId={product.variant_group_id ?? null}
        variants={[]}
        onTabClick={onTabChange}
        onExportPdf={undefined}
      />

      {/* Body principal — 3 sections empilées */}
      <div className="flex-1 space-y-4 min-w-0">
        {/* Section 1 — Score card full-width */}
        <PublicationScoreCard
          passedRequired={passedRequired}
          totalRequired={requiredItems.length}
        />

        {/* Section 2 — Deux colonnes : checklist + canaux */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Colonne gauche : checklist */}
          <div className="w-full md:w-5/12">
            <PublicationChecklist
              items={checklistItems}
              onTabChange={onTabChange}
            />
          </div>

          {/* Colonne droite : canaux */}
          <div className="flex-1 min-w-0">
            <PublicationChannels
              channels={channels}
              loading={loadingChannels}
              productSlug={product.slug ?? null}
            />
          </div>
        </div>

        {/* Section 3 — Footer info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-xs text-blue-800">
            <strong>Publication automatique :</strong> Un produit est publié sur
            le site quand il est actif, possède un slug, au moins un prix de
            vente et une image. Les modifications sont reflétées sur le site
            dans les 5 minutes.
          </p>
        </div>
      </div>
    </div>
  );
}
