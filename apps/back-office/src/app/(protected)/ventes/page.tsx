'use client';

import { useEffect, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  AlertTriangle,
  ArrowRight,
  FileText,
  Loader2,
  MessageCircle,
  Package,
  Plus,
  ShoppingBag,
  Truck,
} from 'lucide-react';

import {
  getSalesDashboard,
  type SalesDashboardData,
} from './actions/get-sales-dashboard';

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  pending_approval: 'bg-orange-100 text-orange-700',
  en_attente: 'bg-amber-100 text-amber-700',
  en_cours: 'bg-blue-100 text-blue-700',
  validated: 'bg-blue-100 text-blue-700',
  partially_shipped: 'bg-indigo-100 text-indigo-700',
  shipped: 'bg-green-100 text-green-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
};

function StatusBadge({ status, label }: { status: string; label: string }) {
  const color = STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600';
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${color}`}
    >
      {label}
    </span>
  );
}

export default function VentesDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<SalesDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void getSalesDashboard()
      .then(setData)
      .catch((err: unknown) => console.error('[Ventes] Load failed:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">Chargement...</span>
      </div>
    );
  }

  if (!data) return null;

  const { alerts, kpis, recentConsultations, recentOrders, recentShipments } =
    data;
  const totalAlerts =
    alerts.draftOrders +
    alerts.validatedOrders +
    alerts.consultationsEnAttente +
    alerts.commissionsAPayer;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Header + Navigation rapide */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Ventes</h1>
            <div className="flex items-center gap-3 mt-1 text-xs">
              <Link
                href="/consultations"
                className="text-gray-500 hover:text-gray-900"
              >
                Consultations
              </Link>
              <span className="text-gray-300">|</span>
              <Link
                href="/factures?tab=devis"
                className="text-gray-500 hover:text-gray-900"
              >
                Devis
              </Link>
              <span className="text-gray-300">|</span>
              <Link
                href="/commandes/clients"
                className="text-gray-500 hover:text-gray-900"
              >
                Commandes
              </Link>
              <span className="text-gray-300">|</span>
              <Link
                href="/stocks/expeditions"
                className="text-gray-500 hover:text-gray-900"
              >
                Expeditions
              </Link>
              <span className="text-gray-300">|</span>
              <Link
                href="/canaux-vente/linkme/commissions"
                className="text-gray-500 hover:text-gray-900"
              >
                Commissions
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/consultations/create')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800"
            >
              <Plus className="h-3.5 w-3.5" />
              Consultation
            </button>
            <button
              onClick={() => router.push('/commandes/clients/nouvelle')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-gray-700 text-xs font-medium rounded-lg border border-gray-300 hover:bg-gray-50"
            >
              <Plus className="h-3.5 w-3.5" />
              Commande
            </button>
            <button
              onClick={() => router.push('/factures?tab=devis')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-gray-700 text-xs font-medium rounded-lg border border-gray-300 hover:bg-gray-50"
            >
              <Plus className="h-3.5 w-3.5" />
              Devis
            </button>
          </div>
        </div>

        {/* Alertes - A traiter */}
        {totalAlerts > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
              <span className="text-xs font-semibold text-amber-900">
                A traiter ({totalAlerts})
              </span>
            </div>
            <div className="divide-y divide-gray-100">
              {alerts.draftOrders > 0 && (
                <Link
                  href="/commandes/clients?status=draft"
                  className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    <span className="text-sm text-gray-900">
                      <strong>{alerts.draftOrders}</strong> commande(s) en
                      brouillon a approuver
                    </span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
                </Link>
              )}
              {alerts.validatedOrders > 0 && (
                <Link
                  href="/commandes/clients?status=validated"
                  className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                    <span className="text-sm text-gray-900">
                      <strong>{alerts.validatedOrders}</strong> commande(s)
                      validee(s) a expedier
                    </span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
                </Link>
              )}
              {alerts.consultationsEnAttente > 0 && (
                <Link
                  href="/consultations"
                  className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span className="text-sm text-gray-900">
                      <strong>{alerts.consultationsEnAttente}</strong>{' '}
                      consultation(s) en attente de reponse
                    </span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
                </Link>
              )}
              {alerts.commissionsAPayer > 0 && (
                <Link
                  href="/canaux-vente/linkme/commissions"
                  className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    <span className="text-sm text-gray-900">
                      <strong>{alerts.commissionsAPayer}</strong> commission(s)
                      a payer (
                      {alerts.commissionsAPayer_montant.toLocaleString('fr-FR')}
                      &nbsp;&euro;)
                    </span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
                </Link>
              )}
            </div>
          </div>
        )}

        {/* KPIs compacts */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white rounded-lg border border-gray-200 px-3 py-2.5">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">
              CA mois
            </p>
            <p className="text-base font-bold text-gray-900">
              {kpis.caMois.toLocaleString('fr-FR')} &euro;
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 px-3 py-2.5">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">
              CA annee
            </p>
            <p className="text-base font-bold text-gray-900">
              {kpis.caAnnee.toLocaleString('fr-FR')} &euro;
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 px-3 py-2.5">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">
              Expediees
            </p>
            <p className="text-base font-bold text-gray-900">
              {kpis.ordersShipped}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 px-3 py-2.5">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">
              Panier moyen
            </p>
            <p className="text-base font-bold text-gray-900">
              {kpis.panierMoyen.toLocaleString('fr-FR')} &euro;
            </p>
          </div>
        </div>

        {/* 2x2 Grid : Consultations, Devis, Commandes, Expeditions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Consultations */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-gray-500" />
                <h2 className="text-sm font-semibold text-gray-900">
                  Consultations
                </h2>
              </div>
              <Link
                href="/consultations"
                className="text-xs text-gray-500 hover:text-gray-900"
              >
                Voir toutes &rarr;
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {recentConsultations.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <p className="text-sm text-gray-400">Aucune consultation</p>
                </div>
              ) : (
                recentConsultations.map(c => (
                  <Link
                    key={c.id}
                    href={`/consultations/${c.id}`}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50"
                  >
                    {c.imageUrl ? (
                      <Image
                        src={c.imageUrl}
                        alt=""
                        width={36}
                        height={36}
                        className="w-9 h-9 rounded object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <MessageCircle className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {c.descriptif || c.clientName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {c.clientName}
                        {c.budget ? ` · ${c.budget}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <StatusBadge status={c.status} label={c.statusLabel} />
                      <span className="text-xs text-gray-400">{c.date}</span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Devis (Qonto) */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <h2 className="text-sm font-semibold text-gray-900">Devis</h2>
              </div>
              <Link
                href="/factures?tab=devis"
                className="text-xs text-gray-500 hover:text-gray-900"
              >
                Voir tous &rarr;
              </Link>
            </div>
            <div className="px-4 py-6 text-center">
              <FileText className="h-8 w-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Devis via Qonto</p>
              <Link
                href="/factures?tab=devis"
                className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 hover:text-blue-800"
              >
                Acceder aux devis &rarr;
              </Link>
            </div>
          </div>

          {/* Commandes recentes */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-gray-500" />
                <h2 className="text-sm font-semibold text-gray-900">
                  Commandes
                </h2>
              </div>
              <Link
                href="/commandes/clients"
                className="text-xs text-gray-500 hover:text-gray-900"
              >
                Voir toutes &rarr;
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {recentOrders.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <p className="text-sm text-gray-400">Aucune commande</p>
                </div>
              ) : (
                recentOrders.map(o => (
                  <Link
                    key={o.id}
                    href={`/commandes/${o.id}/details`}
                    className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900">
                          {o.orderNumber}
                        </p>
                        {o.channel === 'linkme' && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-teal-50 text-teal-700 rounded font-medium">
                            LinkMe
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {o.customerName}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                      <span className="text-sm font-medium text-gray-900">
                        {o.totalTtc.toLocaleString('fr-FR')} &euro;
                      </span>
                      <StatusBadge status={o.status} label={o.statusLabel} />
                      <span className="text-xs text-gray-400">{o.date}</span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Expeditions recentes */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-gray-500" />
                <h2 className="text-sm font-semibold text-gray-900">
                  Expeditions
                </h2>
              </div>
              <Link
                href="/stocks/expeditions"
                className="text-xs text-gray-500 hover:text-gray-900"
              >
                Voir toutes &rarr;
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {recentShipments.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <p className="text-sm text-gray-400">Aucune expedition</p>
                </div>
              ) : (
                recentShipments.map(s => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between px-4 py-2.5"
                  >
                    <div className="flex items-center gap-3">
                      <Package
                        className={`h-4 w-4 ${s.isExpedied ? 'text-green-500' : 'text-amber-500'}`}
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {s.orderNumber}
                        </p>
                        <p className="text-xs text-gray-500">
                          {s.deliveryMethodLabel}
                          {s.carrierName ? ` · ${s.carrierName}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {s.packlinkStatus === 'a_payer' && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded font-medium">
                          A payer
                        </span>
                      )}
                      {!s.isExpedied && !s.packlinkStatus && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded font-medium">
                          A traiter
                        </span>
                      )}
                      {s.isExpedied && s.packlinkStatus !== 'a_payer' && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded font-medium">
                          Expediee
                        </span>
                      )}
                      {s.shippedAt && (
                        <span className="text-xs text-gray-400">
                          {s.shippedAt}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
