'use client';

import { useState, useMemo, useCallback } from 'react';

import { TransactionDetailDialog } from '@verone/finance/components';
import type { UnifiedTransaction } from '@verone/finance/hooks';
import {
  useDatabaseNotifications,
  type DatabaseNotification,
} from '@verone/notifications';
import { Badge, Button, Card, CardContent, Input } from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import { CheckCheck, Search, X, Inbox } from 'lucide-react';

import { GroupHeader, PaymentCard } from './payment-card';
import {
  isPaymentNotification,
  extractTransactionId,
  groupByDate,
  DATE_LABELS,
  type SheetAction,
} from './payment-notifications-helpers';

// ============================================================================
// Fetch UnifiedTransaction from v_transactions_unified view
// ============================================================================

async function fetchUnifiedTransaction(
  transactionId: string
): Promise<UnifiedTransaction | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('v_transactions_unified')
    .select('*')
    .eq('id', transactionId)
    .single();

  if (error) {
    console.error(
      '[PaymentNotifications] fetchUnifiedTransaction error:',
      error
    );
    return null;
  }
  return data as unknown as UnifiedTransaction;
}

// ============================================================================
// Main Component
// ============================================================================

export function PaymentNotificationsTab() {
  const { notifications, loading, markAsRead, deleteNotification } =
    useDatabaseNotifications();

  const [searchQuery, setSearchQuery] = useState('');

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTransaction, setDialogTransaction] =
    useState<UnifiedTransaction | null>(null);
  const [autoOpenRapprochement, setAutoOpenRapprochement] = useState(false);
  const [autoOpenUpload, setAutoOpenUpload] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  // Filter payment notifications only
  const paymentNotifications = useMemo(() => {
    const payments = notifications.filter(isPaymentNotification);
    if (!searchQuery.trim()) return payments;
    const query = searchQuery.toLowerCase();
    return payments.filter(
      n =>
        n.title.toLowerCase().includes(query) ||
        n.message.toLowerCase().includes(query)
    );
  }, [notifications, searchQuery]);

  const paymentUnreadCount = useMemo(
    () => paymentNotifications.filter(n => !n.read).length,
    [paymentNotifications]
  );

  const grouped = useMemo(
    () => groupByDate(paymentNotifications),
    [paymentNotifications]
  );

  const markAllPaymentsRead = useCallback(async () => {
    const unreadPayments = paymentNotifications.filter(n => !n.read);
    for (const n of unreadPayments) {
      await markAsRead(n.id);
    }
  }, [paymentNotifications, markAsRead]);

  const handleOpenDialog = useCallback(
    async (notif: DatabaseNotification, action: SheetAction) => {
      const txId = extractTransactionId(notif.action_url ?? null);
      if (!txId) return;

      setModalLoading(true);
      const tx = await fetchUnifiedTransaction(txId);
      setModalLoading(false);

      if (!tx) return;

      setDialogTransaction(tx);
      setAutoOpenRapprochement(action === 'rapprocher');
      setAutoOpenUpload(action === 'upload');
      setDialogOpen(true);

      if (!notif.read) {
        void markAsRead(notif.id).catch(err => {
          console.error('[PaymentNotifications] markAsRead failed:', err);
        });
      }
    },
    [markAsRead]
  );

  const handleDialogRefresh = useCallback(async () => {
    if (!dialogTransaction) return;
    const tx = await fetchUnifiedTransaction(dialogTransaction.id);
    if (tx) {
      setDialogTransaction(tx);
    }
  }, [dialogTransaction]);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-2/3 bg-muted rounded" />
                  <div className="h-3 w-1/2 bg-muted rounded" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Actions bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Rechercher par contrepartie, montant..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {paymentUnreadCount > 0 && (
          <Badge className="bg-orange-100 text-orange-700 text-xs">
            {paymentUnreadCount} non lu{paymentUnreadCount > 1 ? 's' : ''}
          </Badge>
        )}

        {paymentUnreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void markAllPaymentsRead().catch(error => {
                console.error(
                  '[PaymentNotifications] markAllPaymentsRead failed:',
                  error
                );
              });
            }}
          >
            <CheckCheck className="h-4 w-4 mr-1" />
            Tout marquer lu
          </Button>
        )}
      </div>

      {modalLoading && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 text-blue-700 text-sm">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          Chargement de la transaction...
        </div>
      )}

      {paymentNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Inbox className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-sm text-muted-foreground">
            {searchQuery
              ? 'Aucun resultat pour votre recherche'
              : 'Aucune notification de paiement'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([groupKey, groupNotifications]) => {
            if (groupNotifications.length === 0) return null;
            return (
              <div key={groupKey}>
                <GroupHeader
                  label={DATE_LABELS[groupKey] ?? groupKey}
                  count={groupNotifications.length}
                />
                <div className="space-y-2">
                  {groupNotifications.map((notification, index) => (
                    <PaymentCard
                      key={`${notification.id}-${index}`}
                      notification={notification}
                      onMarkAsRead={markAsRead}
                      onDelete={deleteNotification}
                      onOpenSheet={(notif, action) => {
                        void handleOpenDialog(notif, action).catch(err => {
                          console.error(
                            '[PaymentNotifications] handleOpenDialog failed:',
                            err
                          );
                        });
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <TransactionDetailDialog
        transaction={dialogTransaction}
        open={dialogOpen}
        onOpenChange={open => {
          setDialogOpen(open);
          if (!open) {
            setDialogTransaction(null);
            setAutoOpenRapprochement(false);
            setAutoOpenUpload(false);
          }
        }}
        onRefresh={handleDialogRefresh}
        autoOpenRapprochement={autoOpenRapprochement}
        autoOpenUpload={autoOpenUpload}
      />
    </div>
  );
}
