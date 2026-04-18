'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { createClient } from '@verone/utils/supabase/client';
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Loader2,
  Package,
  Plus,
  Truck,
} from 'lucide-react';

interface AchatsData {
  totalPOs: number;
  totalValue: number;
  received: number;
  inProgress: number;
  totalReceptions: number;
  recentPOs: Array<{
    id: string;
    po_number: string;
    supplier_name: string;
    total_amount: number;
    status: string;
    created_at: string;
  }>;
}

export default function AchatsPage() {
  const router = useRouter();
  const [data, setData] = useState<AchatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function loadData() {
      const [posResult, receptionsResult] = await Promise.all([
        supabase
          .from('purchase_orders')
          .select(
            'id, po_number, status, created_at, organisations(id, trade_name, legal_name)'
          )
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('purchase_order_receptions')
          .select('id', { count: 'exact', head: true }),
      ]);

      const pos = (posResult.data ?? []) as Array<{
        id: string;
        po_number: string | null;
        status: string | null;
        created_at: string | null;
        organisations: {
          id: string;
          trade_name: string | null;
          legal_name: string | null;
        } | null;
      }>;

      setData({
        totalPOs: pos.length,
        totalValue: 0,
        received: pos.filter(po => po.status === 'received').length,
        inProgress: pos.filter(
          po => po.status !== 'received' && po.status !== 'cancelled'
        ).length,
        totalReceptions: receptionsResult.count ?? 0,
        recentPOs: pos.slice(0, 5).map(po => ({
          id: po.id,
          po_number: po.po_number ?? '',
          supplier_name:
            po.organisations?.trade_name ??
            po.organisations?.legal_name ??
            'Inconnu',
          total_amount: 0,
          status: po.status ?? 'draft',
          created_at: po.created_at ?? '',
        })),
      });
      setLoading(false);
    }

    void loadData().catch((err: unknown) => {
      console.error('[Achats] Load failed:', err);
      setLoading(false);
    });
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

  const STATUS_LABELS: Record<string, string> = {
    draft: 'Brouillon',
    validated: 'Validee',
    partially_received: 'Partiellement recue',
    received: 'Recue',
    cancelled: 'Annulee',
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="w-full px-4 sm:px-6 py-6 space-y-5">
        {/* Header + Navigation rapide */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Achats</h1>
            <div className="flex items-center gap-3 mt-1 text-xs">
              <Link
                href="/commandes/fournisseurs"
                className="text-gray-500 hover:text-gray-900"
              >
                Commandes fournisseurs
              </Link>
              <span className="text-gray-300">|</span>
              <Link
                href="/stocks/receptions"
                className="text-gray-500 hover:text-gray-900"
              >
                Receptions
              </Link>
              <span className="text-gray-300">|</span>
              <Link
                href="/contacts-organisations/suppliers"
                className="text-gray-500 hover:text-gray-900"
              >
                Fournisseurs
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/commandes/fournisseurs')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800"
            >
              <Plus className="h-3.5 w-3.5" />
              Commande fournisseur
            </button>
          </div>
        </div>

        {/* Alertes */}
        {data.inProgress > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
              <span className="text-xs font-semibold text-amber-900">
                A traiter ({data.inProgress})
              </span>
            </div>
            <div className="divide-y divide-gray-100">
              <Link
                href="/commandes/fournisseurs?status=validated"
                className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                  <span className="text-sm text-gray-900">
                    <strong>{data.inProgress}</strong> commande(s) en cours de
                    traitement
                  </span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
              </Link>
            </div>
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white rounded-lg border border-gray-200 px-4 py-3">
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              Total commandes
            </p>
            <p className="text-2xl font-bold text-gray-900">{data.totalPOs}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 px-4 py-3">
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              Valeur totale
            </p>
            <p className="text-2xl font-bold text-blue-600">
              {data.totalValue.toLocaleString('fr-FR')} EUR
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 px-4 py-3">
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              Recues
            </p>
            <p className="text-2xl font-bold text-green-600">{data.received}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 px-4 py-3">
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              Receptions
            </p>
            <p className="text-2xl font-bold text-purple-600">
              {data.totalReceptions}
            </p>
          </div>
        </div>

        {/* Grille 2 colonnes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Commandes fournisseurs recentes */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                <h2 className="text-base font-semibold text-gray-900">
                  Commandes fournisseurs
                </h2>
              </div>
              <Link
                href="/commandes/fournisseurs"
                className="text-xs text-gray-500 hover:text-gray-900"
              >
                Voir toutes →
              </Link>
            </div>
            <div className="space-y-2">
              {data.recentPOs.length === 0 ? (
                <p className="text-sm text-gray-500 py-4 text-center">
                  Aucune commande fournisseur
                </p>
              ) : (
                data.recentPOs.map(po => (
                  <Link
                    key={po.id}
                    href={`/commandes/fournisseurs?id=${po.id}`}
                    className="flex items-center justify-between py-2 text-sm hover:bg-gray-50 rounded px-2 -mx-2"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {po.po_number}
                      </p>
                      <p className="text-xs text-gray-500">
                        {po.supplier_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {po.total_amount.toLocaleString('fr-FR')} EUR
                      </p>
                      <span className="text-xs text-gray-500">
                        {STATUS_LABELS[po.status] ?? po.status}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Receptions + Fournisseurs */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-green-600" />
                <h2 className="text-base font-semibold text-gray-900">
                  Receptions & Fournisseurs
                </h2>
              </div>
            </div>
            <div className="space-y-2">
              <Link
                href="/stocks/receptions"
                className="flex items-center justify-between py-1.5 text-sm text-gray-700 hover:text-gray-900"
              >
                <span>
                  <Package className="h-3.5 w-3.5 inline mr-1" />
                  {data.totalReceptions} receptions enregistrees
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
              </Link>
              <Link
                href="/contacts-organisations/suppliers"
                className="flex items-center justify-between py-1.5 text-sm text-gray-700 hover:text-gray-900"
              >
                <span>
                  <Building2 className="h-3.5 w-3.5 inline mr-1" />
                  Annuaire fournisseurs
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
              </Link>
              <Link
                href="/produits/sourcing"
                className="flex items-center justify-between py-1.5 text-sm text-gray-700 hover:text-gray-900"
              >
                <span>Sourcing produits</span>
                <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
