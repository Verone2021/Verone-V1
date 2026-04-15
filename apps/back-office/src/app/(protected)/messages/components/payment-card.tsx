'use client';

import type { DatabaseNotification } from '@verone/notifications';
import { Badge, Button, Card, CardContent } from '@verone/ui';
import { cn } from '@verone/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCheck,
  Clock,
  Eye,
  FileUp,
  Link2,
  Trash2,
} from 'lucide-react';

import {
  isIncoming,
  parsePaymentMessage,
  type SheetAction,
} from './payment-notifications-helpers';

// ============================================================================
// GroupHeader
// ============================================================================

export const GroupHeader = ({
  label,
  count,
}: {
  label: string;
  count: number;
}) => (
  <div className="flex items-center justify-between py-2">
    <h3 className="font-semibold text-sm text-foreground">{label}</h3>
    <Badge variant="secondary" className="text-xs">
      {count}
    </Badge>
  </div>
);

// ============================================================================
// PaymentCard
// ============================================================================

export interface PaymentCardProps {
  notification: DatabaseNotification;
  onMarkAsRead: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onOpenSheet: (notif: DatabaseNotification, action: SheetAction) => void;
}

export const PaymentCard = ({
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
