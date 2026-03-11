'use client';

import { useState, useMemo, useCallback } from 'react';

import { TransactionDetailDialog } from '@verone/finance/components';
import type { UnifiedTransaction } from '@verone/finance/hooks';
import {
  useDatabaseNotifications,
  type DatabaseNotification,
} from '@verone/notifications';
import { Badge, Button, Card, CardContent, Input } from '@verone/ui';
import { cn } from '@verone/utils';
import { createClient } from '@verone/utils/supabase/client';
import {
  formatDistanceToNow,
  isToday,
  isYesterday,
  isThisWeek,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  CheckCheck,
  Trash2,
  X,
  Clock,
  Inbox,
  Eye,
  FileUp,
  Link2,
} from 'lucide-react';

// ============================================================================
// Helpers
// ============================================================================

function isPaymentNotification(n: DatabaseNotification): boolean {
  return (
    n.title === 'Paiement entrant' ||
    n.title === 'Paiement recu' ||
    n.title === 'Paiement sortant'
  );
}

function isIncoming(title: string): boolean {
  return title === 'Paiement entrant' || title === 'Paiement recu';
}

function extractTransactionId(actionUrl: string | null): string | null {
  if (!actionUrl) return null;
  try {
    const url = new URL(actionUrl, 'http://localhost');
    return url.searchParams.get('transaction');
  } catch {
    return null;
  }
}

interface ParsedPayment {
  sign: string;
  amount: number;
  counterparty: string;
  date: string;
  isMatched: boolean;
  statusLabel: string;
}

function parsePaymentMessage(message: string): ParsedPayment {
  const parts = message.split(' | ');
  const mainPart = parts[0] ?? '';
  const datePart = parts[1] ?? '';
  const statusPart = parts[2] ?? '';

  const match = mainPart.match(/^([+-])\s*([\d.,]+)\s*E\s*--\s*(.+)$/);
  return {
    sign: match?.[1] ?? '+',
    amount: parseFloat(match?.[2]?.replace(',', '.') ?? '0'),
    counterparty: match?.[3]?.trim() ?? '',
    date: datePart.trim(),
    isMatched:
      statusPart.trim() === 'Rapproche' || statusPart.trim() === 'Rapproché',
    statusLabel: statusPart.trim(),
  };
}

// ============================================================================
// Date grouping (same as SystemNotificationsTab)
// ============================================================================

function groupByDate(notifications: DatabaseNotification[]) {
  const groups: Record<string, DatabaseNotification[]> = {
    today: [],
    yesterday: [],
    thisWeek: [],
    older: [],
  };

  notifications.forEach(notif => {
    const date = new Date(notif.created_at ?? new Date());
    if (isToday(date)) groups.today.push(notif);
    else if (isYesterday(date)) groups.yesterday.push(notif);
    else if (isThisWeek(date, { weekStartsOn: 1 })) groups.thisWeek.push(notif);
    else groups.older.push(notif);
  });

  return groups;
}

const DATE_LABELS: Record<string, string> = {
  today: "Aujourd'hui",
  yesterday: 'Hier',
  thisWeek: 'Cette semaine',
  older: 'Plus ancien',
};

const GroupHeader = ({ label, count }: { label: string; count: number }) => (
  <div className="flex items-center justify-between py-2">
    <h3 className="font-semibold text-sm text-foreground">{label}</h3>
    <Badge variant="secondary" className="text-xs">
      {count}
    </Badge>
  </div>
);

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
// Payment Card
// ============================================================================

type SheetAction = 'view' | 'rapprocher' | 'upload';

interface PaymentCardProps {
  notification: DatabaseNotification;
  onMarkAsRead: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onOpenSheet: (notif: DatabaseNotification, action: SheetAction) => void;
}

const PaymentCard = ({
  notification,
  onMarkAsRead,
  onDelete,
  onOpenSheet,
}: PaymentCardProps) => {
  const incoming = isIncoming(notification.title);
  const parsed = parsePaymentMessage(notification.message);

  const timeAgo = formatDistanceToNow(
    new Date(notification.created_at ?? new Date()),
    { addSuffix: true, locale: fr }
  );

  const Icon = incoming ? ArrowDownLeft : ArrowUpRight;
  const iconBg = incoming
    ? 'bg-green-50 text-green-600'
    : 'bg-red-50 text-red-600';
  const borderColor = !notification.read
    ? incoming
      ? 'border-l-green-400'
      : 'border-l-red-400'
    : 'border-l-transparent';
  const amountColor = incoming ? 'text-green-600' : 'text-red-600';

  return (
    <Card
      className={cn(
        'group transition-all duration-150 hover:shadow-md',
        'border-l-4',
        borderColor
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="relative flex-shrink-0">
            <div
              className={cn(
                'flex items-center justify-center w-9 h-9 rounded-lg',
                iconBg
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
            {!notification.read && (
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-medium text-sm truncate">
                {notification.title}
              </span>
              <Badge
                className={cn(
                  'text-[10px] px-1.5 py-0 font-medium',
                  notification.read
                    ? 'bg-gray-100 text-gray-600'
                    : 'bg-blue-100 text-blue-700'
                )}
              >
                {notification.read ? 'Lu' : 'Non lu'}
              </Badge>
            </div>

            {/* Parsed payment info */}
            <div className="flex items-center gap-2 text-xs">
              <span className={cn('font-medium', amountColor)}>
                {parsed.sign} {parsed.amount.toFixed(2)} EUR
              </span>
              {parsed.counterparty && (
                <span className="text-muted-foreground">
                  — {parsed.counterparty}
                </span>
              )}
              {parsed.date && (
                <span className="text-muted-foreground">{parsed.date}</span>
              )}
              {parsed.statusLabel && (
                <Badge
                  className={cn(
                    'text-[10px] px-1.5 py-0 font-medium',
                    parsed.isMatched
                      ? 'bg-green-100 text-green-700'
                      : 'bg-orange-100 text-orange-700'
                  )}
                >
                  {parsed.statusLabel}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {timeAgo}
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 mt-2">
              {/* "Voir transaction" — always available, opens full Sheet */}
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => onOpenSheet(notification, 'view')}
              >
                <Eye className="h-3.5 w-3.5 mr-1" />
                Voir transaction
              </Button>

              {!parsed.isMatched && (
                <>
                  <Button
                    variant="default"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => onOpenSheet(notification, 'rapprocher')}
                  >
                    <Link2 className="h-3.5 w-3.5 mr-1" />
                    Rapprocher
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => onOpenSheet(notification, 'upload')}
                  >
                    <FileUp className="h-3.5 w-3.5 mr-1" />
                    Deposer facture
                  </Button>
                </>
              )}

              {/* Hover actions */}
              <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {!notification.read && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    title="Marquer comme lu"
                    onClick={() => {
                      void onMarkAsRead(notification.id).catch(error => {
                        console.error(
                          '[PaymentNotifications] onMarkAsRead failed:',
                          error
                        );
                      });
                    }}
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                  title="Supprimer"
                  onClick={() => {
                    void onDelete(notification.id).catch(error => {
                      console.error(
                        '[PaymentNotifications] onDelete failed:',
                        error
                      );
                    });
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

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

  // Mark all payment notifications as read
  const markAllPaymentsRead = useCallback(async () => {
    const unreadPayments = paymentNotifications.filter(n => !n.read);
    for (const n of unreadPayments) {
      await markAsRead(n.id);
    }
  }, [paymentNotifications, markAsRead]);

  // Open TransactionDetailDialog with specified action
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

      // Mark as read when opening
      if (!notif.read) {
        void markAsRead(notif.id).catch(err => {
          console.error('[PaymentNotifications] markAsRead failed:', err);
        });
      }
    },
    [markAsRead]
  );

  // Refresh handler for the Dialog (re-fetch the current transaction)
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
        {/* Search */}
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

        {/* Non-matched counter */}
        {paymentUnreadCount > 0 && (
          <Badge className="bg-orange-100 text-orange-700 text-xs">
            {paymentUnreadCount} non lu{paymentUnreadCount > 1 ? 's' : ''}
          </Badge>
        )}

        {/* Mark all read */}
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

      {/* Loading overlay for transaction fetch */}
      {modalLoading && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 text-blue-700 text-sm">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          Chargement de la transaction...
        </div>
      )}

      {/* Content */}
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

      {/* Transaction Detail Dialog (centered modal for /messages) */}
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
