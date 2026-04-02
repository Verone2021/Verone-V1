'use client';

/**
 * Messages Hub — Design standardise (pattern Ventes)
 *
 * Centralise toutes les notifications :
 * - Paiements (Qonto: entrants, sortants, recus)
 * - Commandes (nouvelles, validees, annulees, site internet)
 * - Expeditions (expediees, partielles, receptions)
 * - Stock (alertes, ruptures, previsionnel negatif)
 * - Organisations (nouvelles a valider)
 * - Formulaires de contact (form_submissions)
 * - Demandes d'info LinkMe (linkme_info_requests)
 */

import { useState, useMemo, useCallback } from 'react';

import Link from 'next/link';

import {
  useDatabaseNotifications,
  useFormSubmissionsCount,
  useLinkmeMissingInfoCount,
} from '@verone/notifications';
import type { DatabaseNotification } from '@verone/notifications';
import { useRouter } from 'next/navigation';

import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CheckCheck,
  AlertCircle,
  CreditCard,
  FileText,
  Link2,
  Loader2,
  Package,
  ShoppingBag,
  Truck,
} from 'lucide-react';

// Regrouper notifications par categorie
type NotifCategory =
  | 'paiements'
  | 'commandes'
  | 'expeditions'
  | 'stock'
  | 'organisations'
  | 'autre';

function categorize(n: DatabaseNotification): NotifCategory {
  const t = (n.title ?? '').toLowerCase();
  if (t.includes('paiement')) return 'paiements';
  // Expeditions AVANT commandes (sinon "Commande expédiée" va dans commandes)
  if (
    t.includes('expédi') ||
    t.includes('expedi') ||
    t.includes('réception') ||
    t.includes('reception')
  )
    return 'expeditions';
  if (t.includes('commande') || t.includes('site internet')) return 'commandes';
  if (t.includes('stock') || t.includes('rupture')) return 'stock';
  if (t.includes('organisation')) return 'organisations';
  return 'autre';
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `il y a ${diffMin}min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `il y a ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `il y a ${diffD}j`;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

const CATEGORIES = [
  {
    key: 'paiements' as const,
    label: 'Paiements',
    icon: CreditCard,
    color: 'text-green-600',
    actionUrl: '/finance/transactions',
  },
  {
    key: 'commandes' as const,
    label: 'Commandes',
    icon: ShoppingBag,
    color: 'text-blue-600',
    actionUrl: '/commandes/clients',
  },
  {
    key: 'expeditions' as const,
    label: 'Expeditions',
    icon: Truck,
    color: 'text-indigo-600',
    actionUrl: '/stocks/expeditions',
  },
  {
    key: 'stock' as const,
    label: 'Stock',
    icon: Package,
    color: 'text-orange-600',
    actionUrl: '/stocks/alertes',
  },
  {
    key: 'organisations' as const,
    label: 'Organisations',
    icon: Link2,
    color: 'text-purple-600',
    actionUrl: '/canaux-vente/linkme/organisations',
  },
] as const;

export default function MessagesHubPage() {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    loading: notifLoading,
    markAllAsRead,
    markAsRead,
  } = useDatabaseNotifications();
  const { count: formSubmissionsCount } = useFormSubmissionsCount();
  const { count: linkmeMissingInfoCount } = useLinkmeMissingInfoCount();

  const [markingRead, setMarkingRead] = useState(false);

  // Grouper par categorie
  const grouped = useMemo(() => {
    const map = new Map<
      NotifCategory,
      { total: number; unread: number; recent: DatabaseNotification[] }
    >();
    for (const cat of [
      'paiements',
      'commandes',
      'expeditions',
      'stock',
      'organisations',
      'autre',
    ] as NotifCategory[]) {
      map.set(cat, { total: 0, unread: 0, recent: [] });
    }
    for (const n of notifications) {
      const cat = categorize(n);
      const g = map.get(cat)!;
      g.total++;
      if (!n.read) g.unread++;
      if (g.recent.length < 4) g.recent.push(n);
    }
    return map;
  }, [notifications]);

  // Alertes urgentes (a traiter)
  const urgentAlerts = useMemo(() => {
    const alerts: { label: string; count: number; href: string }[] = [];
    const commandes = grouped.get('commandes');
    const commandesUnread = commandes?.unread ?? 0;
    if (commandesUnread > 0) {
      alerts.push({
        label: 'notification(s) commandes non lue(s)',
        count: commandesUnread,
        href: '/commandes/clients',
      });
    }
    if (formSubmissionsCount > 0) {
      alerts.push({
        label: 'formulaire(s) de contact en attente',
        count: formSubmissionsCount,
        href: '/messages?onglet=formulaires',
      });
    }
    if (linkmeMissingInfoCount > 0) {
      alerts.push({
        label: "demande(s) d'info LinkMe en attente",
        count: linkmeMissingInfoCount,
        href: '/canaux-vente/linkme/commandes',
      });
    }
    const stockUnread = grouped.get('stock')?.unread ?? 0;
    if (stockUnread > 0) {
      alerts.push({
        label: 'alerte(s) stock',
        count: stockUnread,
        href: '/stocks/alertes',
      });
    }
    return alerts;
  }, [grouped, formSubmissionsCount, linkmeMissingInfoCount]);

  const totalAlerts = urgentAlerts.reduce((s, a) => s + a.count, 0);

  const handleMarkAllRead = useCallback(() => {
    setMarkingRead(true);
    void markAllAsRead()
      .then(() => {
        setMarkingRead(false);
      })
      .catch(() => {
        setMarkingRead(false);
      });
  }, [markAllAsRead]);

  if (notifLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">Chargement...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Header + Navigation rapide */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Messages & Notifications
            </h1>
            <div className="flex items-center gap-3 mt-1 text-xs">
              <Link
                href="/commandes/clients"
                className="text-gray-500 hover:text-gray-900"
              >
                Commandes
              </Link>
              <span className="text-gray-300">|</span>
              <Link
                href="/finance/transactions"
                className="text-gray-500 hover:text-gray-900"
              >
                Paiements
              </Link>
              <span className="text-gray-300">|</span>
              <Link
                href="/stocks/alertes"
                className="text-gray-500 hover:text-gray-900"
              >
                Alertes stock
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
                href="/canaux-vente/linkme/commandes"
                className="text-gray-500 hover:text-gray-900"
              >
                LinkMe
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={markingRead}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                {markingRead
                  ? 'En cours...'
                  : `Tout marquer lu (${unreadCount})`}
              </button>
            )}
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
              {urgentAlerts.map(alert => (
                <Link
                  key={alert.href}
                  href={alert.href}
                  className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    <span className="text-sm text-gray-900">
                      <strong>{alert.count}</strong> {alert.label}
                    </span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* KPIs compacts */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {CATEGORIES.map(cat => {
            const g = grouped.get(cat.key);
            return (
              <div
                key={cat.key}
                className="bg-white rounded-lg border border-gray-200 px-3 py-2.5"
              >
                <p className="text-[10px] text-gray-500 uppercase tracking-wide">
                  {cat.label}
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-base font-bold text-gray-900">
                    {g?.total ?? 0}
                  </p>
                  {(g?.unread ?? 0) > 0 && (
                    <span className="text-xs text-red-600 font-medium">
                      {g?.unread} non lu(s)
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Cartes par categorie */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {CATEGORIES.map(cat => {
            const g = grouped.get(cat.key);
            const Icon = cat.icon;
            return (
              <div
                key={cat.key}
                className="bg-white rounded-xl border border-gray-200"
              >
                <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${cat.color}`} />
                    <h2 className="text-sm font-semibold text-gray-900">
                      {cat.label}
                    </h2>
                    {(g?.unread ?? 0) > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">
                        {g?.unread} non lu(s)
                      </span>
                    )}
                  </div>
                  <Link
                    href={cat.actionUrl}
                    className="text-xs text-gray-500 hover:text-gray-900"
                  >
                    Voir tout &rarr;
                  </Link>
                </div>
                <div className="divide-y divide-gray-50">
                  {!g || g.recent.length === 0 ? (
                    <div className="px-4 py-6 text-center">
                      <Icon className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">
                        Aucune notification
                      </p>
                    </div>
                  ) : (
                    g.recent.map(n => {
                      const isNonRapproche = (n.message ?? '').includes(
                        'Non rapproche'
                      );
                      return (
                        <button
                          key={n.id}
                          className="w-full flex items-start gap-3 px-4 py-2.5 hover:bg-gray-50 text-left"
                          onClick={() => {
                            if (!n.read) {
                              void markAsRead(n.id).catch(() => {});
                            }
                            if (n.action_url) {
                              router.push(n.action_url);
                            }
                          }}
                        >
                          <div
                            className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${n.read ? 'bg-gray-300' : 'bg-red-500'}`}
                          />
                          <div className="min-w-0 flex-1">
                            <p
                              className={`text-sm truncate ${n.read ? 'text-gray-600' : 'font-medium text-gray-900'}`}
                            >
                              {n.title}
                              {isNonRapproche && (
                                <span className="ml-2 inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">
                                  <AlertCircle className="h-2.5 w-2.5" />
                                  Non rapproché
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {n.message}
                            </p>
                          </div>
                          <span className="text-xs text-gray-400 flex-shrink-0">
                            {formatDate(n.created_at ?? '')}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}

          {/* Carte Formulaires de contact */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-teal-600" />
                <h2 className="text-sm font-semibold text-gray-900">
                  Formulaires de contact
                </h2>
                {formSubmissionsCount > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-teal-100 text-teal-700 rounded-full font-medium">
                    {formSubmissionsCount} nouveau(x)
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-400">
                Site internet & LinkMe
              </span>
            </div>
            <div className="px-4 py-6 text-center">
              {formSubmissionsCount > 0 ? (
                <>
                  <Bell className="h-8 w-8 text-teal-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-700 font-medium">
                    {formSubmissionsCount} formulaire(s) en attente
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Demandes de contact depuis le site ou LinkMe
                  </p>
                </>
              ) : (
                <>
                  <FileText className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">
                    Aucun formulaire en attente
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-800">
          <Bell className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            <strong>A propos des notifications</strong> — Les notifications sont
            generees automatiquement par le systeme (paiements Qonto, commandes
            LinkMe, alertes stock, expeditions). Elles sont identiques a celles
            de la cloche en haut a droite. Utilisez &laquo; Tout marquer lu
            &raquo; pour nettoyer les anciennes.
          </div>
        </div>
      </div>
    </div>
  );
}
