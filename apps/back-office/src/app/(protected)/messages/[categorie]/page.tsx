'use client';

/**
 * Page categorie notifications — /messages/[categorie]
 *
 * 2 onglets : "A traiter" (non lues) et "Historique" (lues, en gris)
 * Memes composants que le hub mais avec TOUTES les notifications de la categorie.
 */

import { useState, useMemo, useCallback } from 'react';

import Link from 'next/link';
import { useParams } from 'next/navigation';

import { RapprochementModal } from '@verone/finance/components';
import { useDatabaseNotifications } from '@verone/notifications';
import { ArrowLeft, Bell, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@verone/ui';

import {
  CATEGORIES,
  categorize,
  parsePaymentMessage,
} from '../components/constants';
import { NotificationCard } from '../components/notification-card';
import { TreatModal } from '../components/treat-modal';

export default function CategoryPage() {
  const params = useParams();
  const slug = params.categorie as string;
  const config = CATEGORIES.find(c => c.key === slug);

  const { notifications, loading, markAsRead } = useDatabaseNotifications();

  // Modal traiter
  const [treatTarget, setTreatTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);

  // Modal rapprochement
  const [rapprochementData, setRapprochementData] = useState<{
    open: boolean;
    transactionId: string;
    label: string;
    amount: number;
    counterpartyName: string;
  }>({
    open: false,
    transactionId: '',
    label: '',
    amount: 0,
    counterpartyName: '',
  });

  // Filtrer les notifications de cette categorie
  const { toTreat, history } = useMemo(() => {
    const catNotifs = notifications.filter(n => categorize(n) === slug);
    return {
      toTreat: catNotifs.filter(n => !n.read),
      history: catNotifs.filter(n => n.read),
    };
  }, [notifications, slug]);

  const handleTreat = useCallback((id: string, title: string) => {
    setTreatTarget({ id, title });
  }, []);

  const handleConfirmTreat = useCallback(() => {
    if (!treatTarget) return;
    void markAsRead(treatTarget.id).catch(() => {});
    setTreatTarget(null);
  }, [treatTarget, markAsRead]);

  const handleRapprocher = useCallback(
    (transactionId: string, message: string) => {
      const parsed = parsePaymentMessage(message);
      setRapprochementData({ open: true, transactionId, ...parsed });
    },
    []
  );

  if (!config) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Categorie inconnue</p>
        <Link
          href="/messages"
          className="text-blue-600 hover:underline text-sm mt-2 inline-block"
        >
          Retour aux messages
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const Icon = config.icon;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/messages"
            className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-gray-200 hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4 text-gray-600" />
          </Link>
          <div className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${config.color}`} />
            <h1 className="text-xl font-bold text-gray-900">{config.label}</h1>
          </div>
          <span className="text-xs text-gray-500">{config.description}</span>
        </div>

        {/* Onglets */}
        <Tabs defaultValue="to-treat" className="w-full">
          <TabsList className="grid w-full max-w-sm grid-cols-2">
            <TabsTrigger value="to-treat" className="gap-1.5">
              A traiter
              {toTreat.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">
                  {toTreat.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5">
              Historique
              <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-full font-medium">
                {history.length}
              </span>
            </TabsTrigger>
          </TabsList>

          {/* A traiter */}
          <TabsContent value="to-treat" className="mt-4">
            {toTreat.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 px-6 py-12 text-center">
                <Bell className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-900">
                  Rien a traiter
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Toutes les notifications {config.label.toLowerCase()} sont
                  traitees.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-50">
                {toTreat.map(n => (
                  <NotificationCard
                    key={n.id}
                    notification={n}
                    onTreat={handleTreat}
                    onRapprocher={
                      slug === 'paiements' ? handleRapprocher : undefined
                    }
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Historique */}
          <TabsContent value="history" className="mt-4">
            {history.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 px-6 py-12 text-center">
                <p className="text-sm text-gray-400">Aucun historique</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-50">
                {history.map(n => (
                  <NotificationCard
                    key={n.id}
                    notification={n}
                    onTreat={handleTreat}
                    variant="history"
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Lien vers la page metier */}
        <Link
          href={config.actionUrl}
          className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900"
        >
          Aller vers {config.label.toLowerCase()} &rarr;
        </Link>
      </div>

      {/* Modal traiter */}
      <TreatModal
        open={treatTarget !== null}
        onOpenChange={open => {
          if (!open) setTreatTarget(null);
        }}
        onConfirm={handleConfirmTreat}
        title={treatTarget?.title}
      />

      {/* Modal rapprochement */}
      <RapprochementModal
        open={rapprochementData.open}
        onOpenChange={open => setRapprochementData(prev => ({ ...prev, open }))}
        transactionId={rapprochementData.transactionId}
        label={rapprochementData.label}
        amount={rapprochementData.amount}
        counterpartyName={rapprochementData.counterpartyName}
        onSuccess={() =>
          setRapprochementData(prev => ({ ...prev, open: false }))
        }
      />
    </div>
  );
}
