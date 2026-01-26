'use client';

/**
 * Page Notifications - LinkMe App
 *
 * Centre de notifications complet pour les utilisateurs LinkMe
 * - Liste des notifications avec filtres (toutes, non lues, urgentes)
 * - Groupement par date
 * - Actions: marquer lu, supprimer
 * - Code couleur par sévérité
 *
 * @module NotificationsPage
 * @since 2026-01-22
 */

import { useState, useMemo } from 'react';

import Link from 'next/link';

import {
  useDatabaseNotifications,
  type DatabaseNotification,
} from '@verone/notifications';
import { Button, Card, Badge, cn } from '@verone/ui';
import {
  formatDistanceToNow,
  isToday,
  isYesterday,
  isThisWeek,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Bell,
  Search,
  CheckCheck,
  Trash2,
  Filter,
  X,
  ArrowLeft,
  AlertCircle,
  AlertTriangle,
  Info,
  ExternalLink,
  Check,
  Loader2,
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

type FilterTab = 'all' | 'unread' | 'urgent' | 'actionable';

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Grouper les notifications par date
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

const GROUP_LABELS: Record<string, string> = {
  today: "Aujourd'hui",
  yesterday: 'Hier',
  thisWeek: 'Cette semaine',
  older: 'Plus ancien',
};

// =============================================================================
// COMPONENTS
// =============================================================================

/**
 * Badge de sévérité avec code couleur
 */
function SeverityBadge({
  severity,
}: {
  severity: DatabaseNotification['severity'];
}) {
  const config = {
    urgent: {
      className: 'bg-red-100 text-red-700 border-red-200',
      icon: AlertCircle,
      label: 'Urgent',
    },
    important: {
      className: 'bg-orange-100 text-orange-700 border-orange-200',
      icon: AlertTriangle,
      label: 'Important',
    },
    info: {
      className: 'bg-blue-100 text-blue-700 border-blue-200',
      icon: Info,
      label: 'Info',
    },
  }[severity] || {
    className: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: Info,
    label: 'Info',
  };

  const Icon = config.icon;

  return (
    <Badge variant="outline" className={cn('gap-1', config.className)}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

/**
 * Carte de notification individuelle
 */
interface NotificationCardProps {
  notification: DatabaseNotification;
  onMarkAsRead: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function NotificationCard({
  notification,
  onMarkAsRead,
  onDelete,
}: NotificationCardProps) {
  const timeAgo = formatDistanceToNow(
    new Date(notification.created_at || new Date()),
    {
      addSuffix: true,
      locale: fr,
    }
  );

  const hasAction = notification.action_url && notification.action_label;
  const isActionable = hasAction;

  return (
    <Card
      className={cn(
        'group relative p-4 transition-all duration-200 hover:shadow-md',
        !notification.read && 'bg-blue-50/50 border-blue-200'
      )}
    >
      {/* Indicateur non lu */}
      {!notification.read && (
        <div className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-blue-500" />
      )}

      {/* Contenu */}
      <div className="space-y-3">
        {/* Header: titre + badge */}
        <div className="flex items-start justify-between gap-3 pr-6">
          <div className="space-y-1">
            <h3 className="font-semibold text-gray-900">
              {notification.title}
            </h3>
            <p className="text-xs text-gray-500">{timeAgo}</p>
          </div>
          <SeverityBadge severity={notification.severity} />
        </div>

        {/* Message */}
        <p className="text-sm text-gray-600 leading-relaxed">
          {notification.message}
        </p>

        {/* Indicateur actionable */}
        {isActionable && (
          <div className="flex items-center gap-1.5 text-xs text-amber-600">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span className="font-medium">Action requise</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          {/* Bouton action principale */}
          {hasAction && (
            <Button
              size="sm"
              onClick={() => {
                window.location.href = notification.action_url!;
              }}
            >
              {notification.action_label}
              <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          )}

          {/* Actions secondaires */}
          <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {!notification.read && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onMarkAsRead(notification.id)}
                title="Marquer comme lu"
              >
                <Check className="h-4 w-4" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={() => onDelete(notification.id)}
              title="Supprimer"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

/**
 * En-tête de groupe
 */
function GroupHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200 px-4 py-2 -mx-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-700">{label}</h3>
        <Badge variant="secondary">{count}</Badge>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN PAGE
// =============================================================================

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

  // Filtrage des notifications
  const filteredNotifications = useMemo(() => {
    let filtered = [...notifications];

    // Filtre par tab
    if (activeTab === 'unread') {
      filtered = filtered.filter(n => !n.read);
    } else if (activeTab === 'urgent') {
      filtered = filtered.filter(n => n.severity === 'urgent');
    } else if (activeTab === 'actionable') {
      filtered = filtered.filter(n => n.action_url && n.action_label);
    }

    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        n =>
          n.title.toLowerCase().includes(query) ||
          n.message.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [notifications, activeTab, searchQuery]);

  // Groupement par date
  const groupedNotifications = useMemo(() => {
    return groupNotificationsByDate(filteredNotifications);
  }, [filteredNotifications]);

  // Stats
  const urgentCount = notifications.filter(n => n.severity === 'urgent').length;
  const actionableCount = notifications.filter(
    n => n.action_url && n.action_label
  ).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-sm text-gray-500">
            Chargement des notifications...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link
              href="/dashboard"
              className="hover:text-gray-700 flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">Notifications</span>
          </div>

          {/* Title + Actions */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Bell className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Notifications
                </h1>
                <p className="text-sm text-gray-500">
                  {unreadCount > 0
                    ? `${unreadCount} non ${unreadCount > 1 ? 'lues' : 'lue'}`
                    : 'Tout est à jour'}
                </p>
              </div>
            </div>

            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAllAsRead()}
              >
                <CheckCheck className="h-4 w-4 mr-1.5" />
                Tout marquer lu
              </Button>
            )}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Tabs */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('all')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  activeTab === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                Toutes ({notifications.length})
              </button>

              <button
                onClick={() => setActiveTab('unread')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  activeTab === 'unread'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                Non lues ({unreadCount})
              </button>

              <button
                onClick={() => setActiveTab('urgent')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  activeTab === 'urgent'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                <AlertCircle className="inline h-3.5 w-3.5 mr-1" />
                Urgent ({urgentCount})
              </button>

              <button
                onClick={() => setActiveTab('actionable')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  activeTab === 'actionable'
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                <AlertTriangle className="inline h-3.5 w-3.5 mr-1" />
                Actions ({actionableCount})
              </button>
            </div>

            {/* Search */}
            <div className="flex-1 min-w-[200px] max-w-sm">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-9 py-1.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <Bell className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Aucune notification
            </h3>
            <p className="text-sm text-gray-500">
              {searchQuery
                ? 'Aucun résultat pour votre recherche'
                : activeTab === 'unread'
                  ? 'Toutes vos notifications sont lues'
                  : activeTab === 'urgent'
                    ? 'Aucune notification urgente'
                    : activeTab === 'actionable'
                      ? 'Aucune action requise'
                      : 'Vous êtes à jour !'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedNotifications).map(
              ([groupKey, groupNotifs]) => {
                if (groupNotifs.length === 0) return null;

                return (
                  <div key={groupKey}>
                    <GroupHeader
                      label={GROUP_LABELS[groupKey] || groupKey}
                      count={groupNotifs.length}
                    />
                    <div className="space-y-3 mt-3">
                      {groupNotifs.map(notification => (
                        <NotificationCard
                          key={notification.id}
                          notification={notification}
                          onMarkAsRead={markAsRead}
                          onDelete={deleteNotification}
                        />
                      ))}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>
    </div>
  );
}
