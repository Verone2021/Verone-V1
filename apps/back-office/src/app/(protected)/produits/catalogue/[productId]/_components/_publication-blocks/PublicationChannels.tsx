'use client';

/**
 * PublicationChannels — statut par canal de vente.
 * Sprint : BO-UI-PROD-PUB-001
 */

import {
  Globe,
  ShoppingBag,
  ExternalLink,
  BarChart3,
  Link,
} from 'lucide-react';

export interface ChannelStatus {
  channel_code: string;
  channel_name: string;
  is_active: boolean;
  custom_price_ht: number | null;
  /** Commission LinkMe en % si disponible. */
  commission?: number | null;
}

interface PublicationChannelsProps {
  channels: ChannelStatus[];
  loading: boolean;
  productSlug: string | null;
}

const CHANNEL_CONFIG: Record<
  string,
  { label: string; Icon: typeof Globe; urlBase?: string }
> = {
  site_internet: {
    label: 'Site Internet',
    Icon: Globe,
    urlBase: 'https://veronecollections.fr/produits',
  },
  meta_commerce: {
    label: 'Meta Commerce (Facebook / Instagram)',
    Icon: ShoppingBag,
  },
  google_merchant: {
    label: 'Google Merchant',
    Icon: BarChart3,
  },
  linkme: {
    label: 'LinkMe',
    Icon: Link,
  },
};

function formatPriceHt(price: number | null): string {
  if (price == null || price <= 0) return '';
  return `${price.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € HT`;
}

export function PublicationChannels({
  channels,
  loading,
  productSlug,
}: PublicationChannelsProps) {
  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-5 flex-1">
      <h3 className="text-sm font-semibold text-neutral-900 mb-4">
        Canaux de distribution
      </h3>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(n => (
            <div
              key={n}
              className="h-14 rounded-lg bg-gray-100 animate-pulse"
            />
          ))}
        </div>
      ) : channels.length === 0 ? (
        <p className="text-sm text-neutral-500">
          Aucun canal configuré. Ajoutez un prix dans l&apos;onglet Tarification
          pour activer un canal.
        </p>
      ) : (
        <div className="space-y-2">
          {channels.map(ch => {
            const config = CHANNEL_CONFIG[ch.channel_code] ?? {
              label: ch.channel_name,
              Icon: Globe,
            };
            const { label, Icon, urlBase } = config;

            const siteUrl =
              ch.channel_code === 'site_internet' && productSlug && urlBase
                ? `${urlBase}/${productSlug}`
                : null;

            const priceLabel = formatPriceHt(ch.custom_price_ht);

            return (
              <div
                key={ch.channel_code}
                className={`
                  flex items-center justify-between px-3 py-2.5 rounded-lg border
                  ${ch.is_active ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'}
                `}
              >
                {/* Icône + nom + URL */}
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`h-4 w-4 flex-shrink-0 ${ch.is_active ? 'text-emerald-600' : 'text-gray-400'}`}
                  />
                  <div className="min-w-0">
                    <p
                      className={`text-sm font-medium truncate ${ch.is_active ? 'text-emerald-800' : 'text-gray-600'}`}
                    >
                      {label}
                    </p>
                    {ch.channel_code === 'site_internet' && siteUrl && (
                      <p className="text-xs text-gray-400 truncate">
                        {siteUrl}
                      </p>
                    )}
                  </div>
                </div>

                {/* Droite : prix + badge + lien */}
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  {priceLabel && (
                    <span className="text-xs text-neutral-600 hidden sm:inline">
                      {priceLabel}
                    </span>
                  )}

                  {/* Toggle visuel readonly */}
                  <div
                    className={`
                      w-8 h-4 rounded-full flex items-center
                      transition-colors
                      ${ch.is_active ? 'bg-emerald-500' : 'bg-gray-300'}
                    `}
                    title={ch.is_active ? 'Canal actif' : 'Canal inactif'}
                  >
                    <div
                      className={`
                        w-3 h-3 rounded-full bg-white shadow mx-0.5 transition-transform
                        ${ch.is_active ? 'translate-x-4' : 'translate-x-0'}
                      `}
                    />
                  </div>

                  {/* Badge statut */}
                  {ch.is_active ? (
                    <span className="bg-emerald-100 text-emerald-800 text-xs rounded-full px-2 py-0.5 whitespace-nowrap">
                      {ch.channel_code === 'linkme' && ch.commission != null
                        ? `Commission ${ch.commission}%`
                        : 'Actif'}
                    </span>
                  ) : (
                    <span className="bg-gray-200 text-gray-600 text-xs rounded-full px-2 py-0.5 whitespace-nowrap">
                      Inactif
                    </span>
                  )}

                  {/* Lien "Voir" pour site_internet */}
                  {siteUrl && ch.is_active && (
                    <a
                      href={siteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 flex items-center gap-0.5 text-xs"
                      title="Voir la page produit"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span className="hidden md:inline">Voir</span>
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
