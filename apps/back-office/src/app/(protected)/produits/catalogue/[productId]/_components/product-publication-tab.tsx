'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@verone/utils/supabase/client';
import { cn } from '@verone/ui';
import {
  Globe,
  ShoppingBag,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';

import { PublicationSchedulingCard } from './_publication-blocks/PublicationSchedulingCard';
import type { Product, ProductRow } from './types';

interface ChannelStatus {
  channel_code: string;
  channel_name: string;
  is_active: boolean;
  custom_price_ht: number | null;
}

interface ProductPublicationTabProps {
  product: Product;
  onProductUpdate?: (updates: Partial<ProductRow>) => Promise<void>;
}

export function ProductPublicationTab({
  product,
  onProductUpdate,
}: ProductPublicationTabProps) {
  const [channels, setChannels] = useState<ChannelStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChannels = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('channel_pricing')
        .select(
          'is_active, custom_price_ht, channel:sales_channels(code, name)'
        )
        .eq('product_id', product.id);

      if (data) {
        setChannels(
          data.map(d => ({
            channel_code:
              (d.channel as { code: string; name: string })?.code ?? '',
            channel_name:
              (d.channel as { code: string; name: string })?.name ?? '',
            is_active: d.is_active ?? false,
            custom_price_ht: d.custom_price_ht,
          }))
        );
      }
      setLoading(false);
    };
    void fetchChannels();
  }, [product.id]);

  // Publication readiness checks
  const checks = [
    {
      label: 'Nom du produit',
      ok: Boolean(product.name?.trim()),
      required: true,
    },
    {
      label: 'Description',
      ok: Boolean(product.description?.trim()),
      required: true,
    },
    {
      label: 'Meta description SEO',
      ok: Boolean(product.meta_description?.trim()),
      required: false,
    },
    { label: 'Image(s)', ok: product.has_images === true, required: true },
    { label: 'Categorie', ok: Boolean(product.subcategory_id), required: true },
    { label: 'Slug URL', ok: Boolean(product.slug), required: true },
    {
      label: 'Prix de vente (canal)',
      ok: channels.some(c => c.custom_price_ht && c.custom_price_ht > 0),
      required: true,
    },
    {
      label: 'Statut actif',
      ok: product.product_status === 'active',
      required: true,
    },
    {
      label: 'Publie en ligne',
      ok: product.is_published_online === true,
      required: false,
    },
  ];

  const requiredChecks = checks.filter(c => c.required);
  const passedRequired = requiredChecks.filter(c => c.ok).length;
  const isReadyToPublish = requiredChecks.every(c => c.ok);

  const CHANNEL_ICONS: Record<
    string,
    { icon: typeof Globe; label: string; url?: string }
  > = {
    site_internet: {
      icon: Globe,
      label: 'Site Internet',
      url: product.slug
        ? `https://veronecollections.fr/produits/${product.slug}`
        : undefined,
    },
    meta_commerce: {
      icon: ShoppingBag,
      label: 'Meta Commerce (Facebook/Instagram)',
    },
    google_merchant: { icon: Globe, label: 'Google Merchant' },
    linkme: { icon: ShoppingBag, label: 'LinkMe' },
  };

  return (
    <div className="space-y-6">
      {/* Readiness score */}
      <section className="bg-white rounded-lg border border-neutral-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          {isReadyToPublish ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <AlertCircle className="h-4 w-4 text-orange-500" />
          )}
          Pret a publier — {passedRequired}/{requiredChecks.length} criteres
          requis
        </h3>

        {/* Progress bar */}
        <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
          <div
            className={cn(
              'h-2 rounded-full transition-all',
              isReadyToPublish
                ? 'bg-green-500'
                : passedRequired >= requiredChecks.length * 0.7
                  ? 'bg-orange-400'
                  : 'bg-red-400'
            )}
            style={{
              width: `${(passedRequired / requiredChecks.length) * 100}%`,
            }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {checks.map(check => (
            <div
              key={check.label}
              className="flex items-center gap-2 text-sm py-1"
            >
              {check.ok ? (
                <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
              ) : check.required ? (
                <XCircle className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-3.5 w-3.5 text-gray-300 flex-shrink-0" />
              )}
              <span
                className={cn(
                  check.ok
                    ? 'text-green-700'
                    : check.required
                      ? 'text-red-600'
                      : 'text-gray-400'
                )}
              >
                {check.label}
                {!check.required && ' (optionnel)'}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Channels */}
      <section className="bg-white rounded-lg border border-neutral-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">
          Statut par canal de vente
        </h3>

        {loading ? (
          <p className="text-sm text-gray-400">Chargement...</p>
        ) : channels.length === 0 ? (
          <p className="text-sm text-gray-500">
            Aucun canal configure. Ajoutez un prix dans l&apos;onglet Prix pour
            activer un canal.
          </p>
        ) : (
          <div className="space-y-3">
            {channels.map(ch => {
              const config = CHANNEL_ICONS[ch.channel_code];
              const Icon = config?.icon ?? Globe;
              return (
                <div
                  key={ch.channel_code}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg border',
                    ch.is_active
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50 border-gray-200'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        'h-5 w-5',
                        ch.is_active ? 'text-green-600' : 'text-gray-400'
                      )}
                    />
                    <div>
                      <p
                        className={cn(
                          'text-sm font-medium',
                          ch.is_active ? 'text-green-800' : 'text-gray-600'
                        )}
                      >
                        {config?.label ?? ch.channel_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {ch.custom_price_ht
                          ? `${ch.custom_price_ht} EUR HT`
                          : 'Pas de prix'}
                        {ch.is_active ? ' — Actif' : ' — Inactif'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {ch.is_active ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-200 text-green-800">
                        Publie
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">
                        Non publie
                      </span>
                    )}
                    {config?.url && ch.is_active && (
                      <a
                        href={config.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Quick info */}
      <section className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-xs text-blue-800">
          <strong>Publication :</strong> Un produit est publie automatiquement
          sur le site quand il est actif, a un slug, un prix de vente, et au
          moins une image. Les descriptions du catalogue sont heritees par les
          canaux sauf si une description specifique est definie dans la
          configuration du canal.
        </p>
      </section>

      {/* Planification — dates de publication / dépublication */}
      {onProductUpdate && (
        <PublicationSchedulingCard
          publicationDate={product.publication_date ?? null}
          unpublicationDate={product.unpublication_date ?? null}
          onProductUpdate={onProductUpdate}
        />
      )}
    </div>
  );
}
