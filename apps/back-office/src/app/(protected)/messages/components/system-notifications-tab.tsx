'use client';

import { useState, useMemo } from 'react';

import {
  useDatabaseNotifications,
  type DatabaseNotification,
} from '@verone/notifications';
import { ButtonUnified, IconButton } from '@verone/ui';
import { spacing, colors } from '@verone/ui/design-system';
import { cn } from '@verone/utils';
import {
  formatDistanceToNow,
  isToday,
  isYesterday,
  isThisWeek,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { Bell, Search, CheckCheck, Trash2, X } from 'lucide-react';

// ============================================================================
// Notification Card
// ============================================================================

interface NotificationCardProps {
  notification: DatabaseNotification;
  onMarkAsRead: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const NotificationCard = ({
  notification,
  onMarkAsRead,
  onDelete,
}: NotificationCardProps) => {
  const timeAgo = formatDistanceToNow(
    new Date(notification.created_at ?? new Date()),
    { addSuffix: true, locale: fr }
  );

  const severityConfig = {
    urgent: {
      className: 'bg-red-500/10 text-red-700 border border-red-200',
      label: 'Urgent',
    },
    important: {
      className: 'bg-orange-500/10 text-orange-700 border border-orange-200',
      label: 'Important',
    },
    info: {
      className: 'bg-blue-500/10 text-blue-700 border border-blue-200',
      label: 'Info',
    },
  }[notification.severity] ?? {
    className: 'bg-blue-500/10 text-blue-700 border border-blue-200',
    label: 'Info',
  };

  return (
    <div
      className={cn(
        'group relative transition-all duration-200',
        'border-b last:border-b-0',
        'hover:bg-neutral-50',
        !notification.read && 'bg-blue-50/30'
      )}
      style={{ padding: spacing[4] }}
    >
      {!notification.read && (
        <div
          className="absolute top-4 right-4 w-2 h-2 rounded-full"
          style={{ backgroundColor: colors.primary[500] }}
        />
      )}

      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4
              className="font-semibold text-[15px] leading-tight"
              style={{ color: colors.text.DEFAULT }}
            >
              {notification.title}
            </h4>
            <span
              className={cn(
                'text-xs font-medium px-2 py-0.5 rounded-md flex-shrink-0',
                severityConfig.className
              )}
            >
              {severityConfig.label}
            </span>
          </div>

          <p className="text-xs mb-2" style={{ color: colors.text.muted }}>
            {timeAgo}
          </p>

          <p
            className="text-sm leading-relaxed mb-3"
            style={{ color: colors.text.subtle }}
          >
            {notification.message}
          </p>

          <div className="flex items-center gap-2">
            {notification.action_url && notification.action_label && (
              <ButtonUnified
                variant="default"
                size="sm"
                onClick={() => {
                  window.location.href = notification.action_url!;
                }}
              >
                {notification.action_label}
              </ButtonUnified>
            )}

            <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {!notification.read && (
                <IconButton
                  variant="ghost"
                  icon={CheckCheck}
                  size="sm"
                  label="Marquer comme lu"
                  onClick={() => {
                    void onMarkAsRead(notification.id).catch(error => {
                      console.error(
                        '[SystemNotifications] onMarkAsRead failed:',
                        error
                      );
                    });
                  }}
                />
              )}

              <IconButton
                variant="ghost"
                icon={Trash2}
                size="sm"
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                label="Supprimer"
                onClick={() => {
                  void onDelete(notification.id).catch(error => {
                    console.error(
                      '[SystemNotifications] onDelete failed:',
                      error
                    );
                  });
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Group Header
// ============================================================================

const GroupHeader = ({ label, count }: { label: string; count: number }) => (
  <div
    className="sticky top-0 z-10 bg-white border-b"
    style={{
      padding: `${spacing[3]} ${spacing[4]}`,
      borderColor: colors.neutral[200],
    }}
  >
    <div className="flex items-center justify-between">
      <h3
        className="font-semibold text-base"
        style={{ color: colors.text.DEFAULT }}
      >
        {label}
      </h3>
      <span
        className="text-sm font-medium px-2 py-0.5 rounded-md"
        style={{
          backgroundColor: colors.neutral[100],
          color: colors.text.subtle,
        }}
      >
        {count}
      </span>
    </div>
  </div>
);

// ============================================================================
// Main Component
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

export function SystemNotificationsTab() {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useDatabaseNotifications();

  const [searchQuery, setSearchQuery] = useState('');

  const filteredNotifications = useMemo(() => {
    if (!searchQuery.trim()) return notifications;
    const query = searchQuery.toLowerCase();
    return notifications.filter(
      n =>
        n.title.toLowerCase().includes(query) ||
        n.message.toLowerCase().includes(query)
    );
  }, [notifications, searchQuery]);

  const grouped = useMemo(
    () => groupByDate(filteredNotifications),
    [filteredNotifications]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-3"
            style={{ borderColor: colors.primary[500] }}
          />
          <p className="text-sm" style={{ color: colors.text.subtle }}>
            Chargement...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Actions bar */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="flex-1 max-w-md relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
            style={{ color: colors.text.muted }}
          />
          <input
            type="text"
            placeholder="Rechercher dans les notifications..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2 rounded-lg border text-sm"
            style={{
              borderColor: colors.neutral[300],
              color: colors.text.DEFAULT,
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4" style={{ color: colors.text.muted }} />
            </button>
          )}
        </div>

        {/* Mark all read */}
        {unreadCount > 0 && (
          <ButtonUnified
            variant="secondary"
            size="sm"
            onClick={() => {
              void markAllAsRead().catch(error => {
                console.error(
                  '[SystemNotifications] markAllAsRead failed:',
                  error
                );
              });
            }}
          >
            <CheckCheck className="h-4 w-4 mr-1" />
            Tout marquer lu ({unreadCount})
          </ButtonUnified>
        )}
      </div>

      {/* Content */}
      {filteredNotifications.length === 0 ? (
        <div className="text-center py-16">
          <div
            className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{ backgroundColor: colors.neutral[100] }}
          >
            <Bell className="h-8 w-8" style={{ color: colors.text.muted }} />
          </div>
          <p
            className="text-sm font-medium mb-1"
            style={{ color: colors.text.DEFAULT }}
          >
            Aucune notification
          </p>
          <p className="text-xs" style={{ color: colors.text.muted }}>
            {searchQuery
              ? 'Aucun resultat pour votre recherche'
              : 'Vous etes a jour !'}
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          {Object.entries(grouped).map(([groupKey, groupNotifications]) => {
            if (groupNotifications.length === 0) return null;
            return (
              <div key={groupKey}>
                <GroupHeader
                  label={DATE_LABELS[groupKey] ?? groupKey}
                  count={groupNotifications.length}
                />
                {groupNotifications.map((notification, index) => (
                  <NotificationCard
                    key={`${notification.id}-${index}`}
                    notification={notification}
                    onMarkAsRead={markAsRead}
                    onDelete={deleteNotification}
                  />
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
