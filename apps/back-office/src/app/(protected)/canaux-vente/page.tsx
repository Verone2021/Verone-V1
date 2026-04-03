'use client';

import Link from 'next/link';

import {
  ArrowRight,
  Euro,
  Globe,
  Link2,
  MessageCircle,
  ShoppingBag,
} from 'lucide-react';
import {
  useGoogleMerchantStats,
  useMetaCommerceStats,
} from '@verone/channels/hooks';

import { useLinkMeDashboard } from './linkme/hooks/use-linkme-dashboard';

interface ChannelInfo {
  name: string;
  description: string;
  href: string;
  icon: typeof Link2;
  status: 'active' | 'beta' | 'coming_soon';
  color: string;
  stats?: { label: string; value: string }[];
}

export default function CanauxVentePage() {
  const { data: linkmeData, isLoading: linkmeLoading } = useLinkMeDashboard();
  const { data: googleData, isLoading: googleLoading } =
    useGoogleMerchantStats();
  const { data: metaData, isLoading: metaLoading } = useMetaCommerceStats();

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(amount);

  const channels: ChannelInfo[] = [
    {
      name: 'LinkMe',
      description:
        "Reseau affilies B2B2C — apporteurs d'affaires professionnels",
      href: '/canaux-vente/linkme',
      icon: Link2,
      status: 'active',
      color: 'blue',
      stats: linkmeLoading
        ? undefined
        : [
            {
              label: 'CA ce mois',
              value: formatCurrency(linkmeData?.revenue.current ?? 0),
            },
            {
              label: 'Commandes',
              value: String(linkmeData?.orders.current ?? 0),
            },
            {
              label: 'Affilies actifs',
              value: String(linkmeData?.affiliates.active ?? 0),
            },
            {
              label: 'Commissions',
              value: formatCurrency(linkmeData?.pendingCommissions.amount ?? 0),
            },
          ],
    },
    {
      name: 'Site Internet',
      description: 'Boutique en ligne veronecollections.fr — e-commerce B2C',
      href: '/canaux-vente/site-internet',
      icon: Globe,
      status: 'beta',
      color: 'green',
      stats: [
        { label: 'Produits publies', value: '18' },
        { label: 'Collections', value: '2' },
        { label: 'Commandes', value: '0' },
        { label: 'Statut', value: 'En ligne' },
      ],
    },
    {
      name: 'Google Merchant',
      description: 'Synchronisation Google Shopping et Search',
      href: '/canaux-vente/google-merchant',
      icon: ShoppingBag,
      status: 'active',
      color: 'orange',
      stats: googleLoading
        ? undefined
        : [
            {
              label: 'Produits syncs',
              value: String(googleData?.total_products ?? 0),
            },
            {
              label: 'Approuves',
              value: String(googleData?.approved_products ?? 0),
            },
            {
              label: 'En attente',
              value: String(googleData?.pending_products ?? 0),
            },
            {
              label: 'Conversion',
              value: (googleData?.conversion_rate ?? 0).toFixed(1) + '%',
            },
          ],
    },
    {
      name: 'Prix Clients',
      description: 'Tarifs personnalises et ristournes B2B par client',
      href: '/canaux-vente/prix-clients',
      icon: Euro,
      status: 'active',
      color: 'green',
      stats: [
        { label: 'Prix configures', value: '0' },
        { label: 'Regles actives', value: '0' },
        { label: 'Clients', value: '0' },
        { label: 'Remise moyenne', value: '0%' },
      ],
    },
    {
      name: 'Meta (Facebook / Instagram)',
      description:
        'Catalogue Facebook Shop, Instagram Shopping, WhatsApp Business',
      href: '/canaux-vente/meta',
      icon: MessageCircle,
      status: 'active',
      color: 'purple',
      stats: metaLoading
        ? undefined
        : [
            {
              label: 'Produits',
              value: String(metaData?.total_products ?? 0),
            },
            {
              label: 'Actifs',
              value: String(metaData?.active_products ?? 0),
            },
            {
              label: 'En attente',
              value: String(metaData?.pending_products ?? 0),
            },
            {
              label: 'Conversion',
              value: (metaData?.conversion_rate ?? 0).toFixed(1) + '%',
            },
          ],
    },
  ];

  const statusLabels: Record<string, { text: string; className: string }> = {
    active: { text: 'Actif', className: 'bg-green-100 text-green-700' },
    beta: { text: 'Beta', className: 'bg-blue-100 text-blue-700' },
    coming_soon: { text: 'Bientot', className: 'bg-gray-100 text-gray-500' },
  };

  const activeCount = channels.filter(
    c => c.status === 'active' || c.status === 'beta'
  ).length;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Canaux de Vente</h1>
            <div className="flex items-center gap-3 mt-1 text-xs">
              <Link
                href="/canaux-vente/linkme"
                className="text-gray-500 hover:text-gray-900"
              >
                LinkMe
              </Link>
              <span className="text-gray-300">|</span>
              <Link
                href="/canaux-vente/site-internet"
                className="text-gray-500 hover:text-gray-900"
              >
                Site Internet
              </Link>
              <span className="text-gray-300">|</span>
              <Link
                href="/canaux-vente/google-merchant"
                className="text-gray-500 hover:text-gray-900"
              >
                Google Merchant
              </Link>
              <span className="text-gray-300">|</span>
              <Link
                href="/canaux-vente/prix-clients"
                className="text-gray-500 hover:text-gray-900"
              >
                Prix Clients
              </Link>
            </div>
          </div>
        </div>

        {/* KPIs compacts */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white rounded-lg border border-gray-200 px-4 py-3">
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              Canaux actifs
            </p>
            <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 px-4 py-3">
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              CA LinkMe (mois)
            </p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(linkmeData?.revenue.current ?? 0)}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 px-4 py-3">
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              Commandes (mois)
            </p>
            <p className="text-2xl font-bold text-blue-600">
              {linkmeData?.orders.current ?? 0}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 px-4 py-3">
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              Affilies actifs
            </p>
            <p className="text-2xl font-bold text-purple-600">
              {linkmeData?.affiliates.active ?? 0}
            </p>
          </div>
        </div>

        {/* Channel cards — style BigCommerce */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {channels.map(channel => {
            const status = statusLabels[channel.status];
            const isClickable = channel.status !== 'coming_soon';

            const cardContent = (
              <div
                className={`bg-white rounded-xl border border-gray-200 p-5 transition-all ${
                  isClickable
                    ? 'hover:border-gray-300 hover:shadow-sm cursor-pointer group'
                    : 'opacity-70'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-lg ${
                        channel.color === 'blue'
                          ? 'bg-blue-50'
                          : channel.color === 'green'
                            ? 'bg-green-50'
                            : channel.color === 'orange'
                              ? 'bg-orange-50'
                              : 'bg-purple-50'
                      }`}
                    >
                      <channel.icon
                        className={`h-5 w-5 ${
                          channel.color === 'blue'
                            ? 'text-blue-600'
                            : channel.color === 'green'
                              ? 'text-green-600'
                              : channel.color === 'orange'
                                ? 'text-orange-600'
                                : 'text-purple-600'
                        }`}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-gray-900">
                          {channel.name}
                        </h3>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.className}`}
                        >
                          {status.text}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {channel.description}
                      </p>
                    </div>
                  </div>
                  {isClickable && (
                    <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 mt-1" />
                  )}
                </div>

                {channel.stats && (
                  <div className="grid grid-cols-2 gap-3">
                    {channel.stats.map(stat => (
                      <div key={stat.label}>
                        <p className="text-xs text-gray-500">{stat.label}</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {stat.value}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {channel.status === 'coming_soon' && (
                  <div className="mt-2 text-xs text-gray-400 italic">
                    Module en preparation — disponible prochainement
                  </div>
                )}
              </div>
            );

            return isClickable ? (
              <Link key={channel.name} href={channel.href}>
                {cardContent}
              </Link>
            ) : (
              <div key={channel.name}>{cardContent}</div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
