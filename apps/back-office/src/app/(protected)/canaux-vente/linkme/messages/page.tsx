'use client';

/**
 * Centre de Messagerie LinkMe
 *
 * 4 onglets :
 * 1. Infos manquantes - Commandes avec champs a completer (sans demande en cours)
 * 2. En attente de retour - Commandes avec demande envoyee, en attente de reponse
 * 3. Historique - Toutes les demandes d'info envoyees avec leur statut
 * 4. Notifications affilies - Broadcast notifications
 *
 * @module MessagesPage
 * @since 2026-01-22
 * @updated 2026-02-17 - Refonte 4 onglets + cartes enrichies + historique
 */

import { useMemo } from 'react';
import { Badge, Tabs, TabsContent, TabsList, TabsTrigger } from '@verone/ui';
import {
  Bell,
  FileText,
  History,
  Hourglass,
  MessageSquare,
} from 'lucide-react';

import { hasPendingRequest } from './components/types';
import { useOrdersWithMissingFields } from './components/hooks';
import { MissingFieldsTab } from './components/MissingFieldsTab';
import { WaitingTab } from './components/WaitingTab';
import { HistoryTab } from './components/HistoryTab';
import { NotificationsTab } from './components/NotificationsTab';

function PageHeader() {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
        <MessageSquare className="h-5 w-5 text-blue-600" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Centre de messagerie LinkMe
        </h1>
        <p className="text-sm text-gray-500">
          Demandes d&apos;informations, suivi et notifications affilies
        </p>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  const { data: orders, isLoading } = useOrdersWithMissingFields();

  const missingCount = useMemo(() => {
    if (!orders) return 0;
    return orders.filter(o => !hasPendingRequest(o)).length;
  }, [orders]);

  const waitingCount = useMemo(() => {
    if (!orders) return 0;
    return orders.filter(o => hasPendingRequest(o)).length;
  }, [orders]);

  return (
    <div className="p-6 space-y-6">
      <PageHeader />

      {/* Tabs */}
      <Tabs defaultValue="missing-fields">
        <TabsList>
          <TabsTrigger value="missing-fields" className="gap-2">
            <FileText className="h-4 w-4" />
            Infos manquantes
            {missingCount > 0 && (
              <Badge
                variant="destructive"
                className="ml-1 h-5 min-w-[20px] px-1.5"
              >
                {missingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="waiting" className="gap-2">
            <Hourglass className="h-4 w-4" />
            En attente de retour
            {waitingCount > 0 && (
              <Badge
                variant="secondary"
                className="ml-1 h-5 min-w-[20px] px-1.5"
              >
                {waitingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            Historique
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications affilies
          </TabsTrigger>
        </TabsList>

        <TabsContent value="missing-fields" className="mt-6">
          <MissingFieldsTab orders={orders} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="waiting" className="mt-6">
          <WaitingTab orders={orders} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <HistoryTab />
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <NotificationsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
