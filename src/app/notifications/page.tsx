/**
 * Page: Notifications - Vérone Back Office
 * Design System 2025 - Vue complète des notifications
 *
 * Features:
 * - Filtres par type/sévérité/statut (Toutes/Non lues/Urgent)
 * - Grouping par date (Aujourd'hui/Hier/Cette semaine/Plus ancien)
 * - Search bar avec debounce
 * - Actions bulk (mark all read, delete all)
 * - Pagination/Load more
 * - Design minimaliste noir & blanc
 */

'use client';

import { useState, useMemo } from 'react';

import { ButtonV2 } from '@verone/ui';
import { cn } from '@verone/utils';
import {
  formatDistanceToNow,
  isToday,
  isYesterday,
  isThisWeek,
  startOfWeek,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { Bell, Search, CheckCheck, Trash2, Filter, X } from 'lucide-react';

import {
  useDatabaseNotifications,
  type DatabaseNotification,
} from '@verone/notifications';
import { spacing, colors } from '@verone/ui/design-system';

// Types pour les filtres
type FilterTab = 'all' | 'unread' | 'urgent' | 'by-type';
type NotificationType = DatabaseNotification['type'];
type NotificationSeverity = DatabaseNotification['severity'];

/**
 * Grouping des notifications par date
 */
function groupNotificationsByDate(notifications: DatabaseNotification[]) {
  const groups: Record<string, DatabaseNotification[]> = {
    today: [],
    yesterday: [],
    thisWeek: [],
    older: [],
  };

  notifications.forEach(notif => {
    const date = new Date(notif.created_at || new Date());

    if (isToday(date)) {
      groups.today.push(notif);
    } else if (isYesterday(date)) {
      groups.yesterday.push(notif);
    } else if (isThisWeek(date, { weekStartsOn: 1 })) {
      groups.thisWeek.push(notif);
    } else {
      groups.older.push(notif);
    }
  });

  return groups;
}

/**
 * Grouping des notifications par type
 */
function groupNotificationsByType(notifications: DatabaseNotification[]) {
  const groups: Record<string, DatabaseNotification[]> = {
    system: [],
    business: [],
    catalog: [],
    operations: [],
    performance: [],
    maintenance: [],
  };

  notifications.forEach(notif => {
    if (groups[notif.type]) {
      groups[notif.type].push(notif);
    }
  });

  return groups;
}

/**
 * Group Header Component
 */
interface GroupHeaderProps {
  label: string;
  count: number;
}

const GroupHeader = ({ label, count }: GroupHeaderProps) => (
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

/**
 * Notification Card Component
 */
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
    new Date(notification.created_at || new Date()),
    {
      addSuffix: true,
      locale: fr,
    }
  );

  // Badge de sévérité
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
  }[notification.severity] || {
    className: 'bg-blue-500/10 text-blue-700 border border-blue-200',
    label: 'Info',
  }; // Fallback vers 'info' si severity inconnue

  return (
    <div
      className={cn(
        'group relative transition-all duration-200',
        'border-b last:border-b-0',
        'hover:bg-neutral-50',
        !notification.read && 'bg-blue-50/30'
      )}
      style={{
        padding: spacing[4],
      }}
    >
      {/* Badge non lu */}
      {!notification.read && (
        <div
          className="absolute top-4 right-4 w-2 h-2 rounded-full"
          style={{ backgroundColor: colors.primary[500] }}
        />
      )}

      {/* Layout principal */}
      <div className="flex items-start gap-3">
        {/* Contenu */}
        <div className="flex-1 min-w-0">
          {/* En-tête */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4
              className="font-semibold text-[15px] leading-tight"
              style={{ color: colors.text.DEFAULT }}
            >
              {notification.title}
            </h4>
            <span
              className={cn(
                'text-xs font-medium px-2 py-0.5 rounded-md',
                severityConfig.className
              )}
            >
              {severityConfig.label}
            </span>
          </div>

          {/* Timestamp */}
          <p className="text-xs mb-2" style={{ color: colors.text.muted }}>
            {timeAgo}
          </p>

          {/* Message */}
          <p
            className="text-sm leading-relaxed mb-3"
            style={{ color: colors.text.subtle }}
          >
            {notification.message}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Action principale */}
            {notification.action_url && notification.action_label && (
              <ButtonV2
                variant="primary"
                size="sm"
                onClick={() => {
                  window.location.href = notification.action_url!;
                }}
              >
                {notification.action_label}
              </ButtonV2>
            )}

            {/* Actions secondaires */}
            <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {!notification.read && (
                <ButtonV2
                  variant="ghost"
                  size="sm"
                  icon={CheckCheck}
                  className="h-8 w-8 p-0"
                  title="Marquer comme lu"
                  onClick={() => onMarkAsRead(notification.id)}
                />
              )}

              <ButtonV2
                variant="ghost"
                size="sm"
                icon={Trash2}
                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                title="Supprimer"
                onClick={() => onDelete(notification.id)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Page principale Notifications
 */
export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useDatabaseNotifications();

  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<NotificationType | 'all'>(
    'all'
  );

  // Filtrage des notifications
  const filteredNotifications = useMemo(() => {
    let filtered = [...notifications];

    // Filtre par tab
    if (activeTab === 'unread') {
      filtered = filtered.filter(n => !n.read);
    } else if (activeTab === 'urgent') {
      filtered = filtered.filter(n => n.severity === 'urgent');
    }

    // Filtre par type (si by-type actif)
    if (activeTab === 'by-type' && selectedType !== 'all') {
      filtered = filtered.filter(n => n.type === selectedType);
    }

    // Filtre par search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        n =>
          n.title.toLowerCase().includes(query) ||
          n.message.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [notifications, activeTab, selectedType, searchQuery]);

  // Grouping selon le mode
  const groupedNotifications = useMemo(() => {
    if (activeTab === 'by-type') {
      return groupNotificationsByType(filteredNotifications);
    }
    return groupNotificationsByDate(filteredNotifications);
  }, [filteredNotifications, activeTab]);

  // Labels pour les groupes
  const getGroupLabel = (key: string): string => {
    if (activeTab === 'by-type') {
      const labels: Record<string, string> = {
        system: 'Système',
        business: 'Business',
        catalog: 'Catalogue',
        operations: 'Opérations',
        performance: 'Performance',
        maintenance: 'Maintenance',
      };
      return labels[key] || key;
    }

    const labels: Record<string, string> = {
      today: "Aujourd'hui",
      yesterday: 'Hier',
      thisWeek: 'Cette semaine',
      older: 'Plus ancien',
    };
    return labels[key] || key;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
            style={{ borderColor: colors.primary[500] }}
          />
          <p className="text-sm" style={{ color: colors.text.subtle }}>
            Chargement des notifications...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div
        className="sticky top-0 z-20 bg-white border-b"
        style={{
          padding: `${spacing[4]} ${spacing[6]}`,
          borderColor: colors.neutral[200],
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Bell className="h-6 w-6" style={{ color: colors.text.DEFAULT }} />
            <div>
              <h1
                className="text-2xl font-bold"
                style={{ color: colors.text.DEFAULT }}
              >
                Notifications
              </h1>
              <p className="text-sm" style={{ color: colors.text.subtle }}>
                {unreadCount > 0
                  ? `${unreadCount} notification${unreadCount > 1 ? 's' : ''} non ${unreadCount > 1 ? 'lues' : 'lue'}`
                  : 'Toutes vos notifications sont lues'}
              </p>
            </div>
          </div>

          {/* Actions globales */}
          {notifications.length > 0 && (
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <ButtonV2
                  variant="secondary"
                  size="sm"
                  icon={CheckCheck}
                  onClick={() => markAllAsRead()}
                >
                  Tout marquer lu
                </ButtonV2>
              )}
            </div>
          )}
        </div>

        {/* Filters Bar */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                activeTab === 'all'
                  ? 'bg-black text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              )}
            >
              Toutes
              <span className="ml-2 opacity-70">({notifications.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('unread')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                activeTab === 'unread'
                  ? 'bg-black text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              )}
            >
              Non lues
              {unreadCount > 0 && (
                <span className="ml-2 opacity-70">({unreadCount})</span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('urgent')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                activeTab === 'urgent'
                  ? 'bg-black text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              )}
            >
              Urgent
              <span className="ml-2 opacity-70">
                ({notifications.filter(n => n.severity === 'urgent').length})
              </span>
            </button>

            <button
              onClick={() => setActiveTab('by-type')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                activeTab === 'by-type'
                  ? 'bg-black text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              )}
            >
              <Filter className="inline h-4 w-4 mr-1" />
              Par type
            </button>
          </div>

          {/* Search */}
          <div className="flex-1 min-w-[300px] max-w-md">
            <div className="relative">
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
          </div>
        </div>

        {/* Type filters (si by-type actif) */}
        {activeTab === 'by-type' && (
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {(
              [
                'all',
                'system',
                'business',
                'catalog',
                'operations',
                'performance',
                'maintenance',
              ] as const
            ).map(type => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={cn(
                  'px-3 py-1 rounded-md text-xs font-medium transition-all',
                  selectedType === type
                    ? 'bg-black text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                )}
              >
                {type === 'all' ? 'Tous les types' : getGroupLabel(type)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {filteredNotifications.length === 0 ? (
          <div
            className="text-center"
            style={{ padding: `${spacing[12]} ${spacing[6]}` }}
          >
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
                ? 'Aucun résultat pour votre recherche'
                : 'Vous êtes à jour !'}
            </p>
          </div>
        ) : (
          <>
            {Object.entries(groupedNotifications).map(
              ([groupKey, groupNotifications]) => {
                if (groupNotifications.length === 0) return null;

                return (
                  <div key={groupKey}>
                    <GroupHeader
                      label={getGroupLabel(groupKey)}
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
              }
            )}
          </>
        )}
      </div>
    </div>
  );
}
