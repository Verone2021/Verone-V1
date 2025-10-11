/**
 * NotificationsDropdown - Panneau déroulant notifications système
 * Affichage des notifications depuis la base de données avec actions CRUD
 *
 * Phase 1: UI Panel Notifications
 * - Liste scrollable avec max 5 visibles
 * - Marquer comme lu (individuel + tout)
 * - Supprimer notification
 * - État vide si aucune notification
 */

'use client';

import { Bell, Check, Trash2, CheckCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useNotifications, type Notification } from '@/hooks/use-notifications';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

/**
 * Badge de sévérité coloré selon le type de notification
 */
const SeverityBadge = ({ severity }: { severity: Notification['severity'] }) => {
  const variants = {
    urgent: 'bg-red-500 text-white',
    important: 'bg-orange-500 text-white',
    info: 'bg-blue-500 text-white',
  };

  const labels = {
    urgent: '🚨 Urgent',
    important: '⚠️ Important',
    info: '💡 Info',
  };

  return (
    <Badge className={cn('text-xs', variants[severity])}>
      {labels[severity]}
    </Badge>
  );
};

/**
 * Icône selon le type de notification
 */
const NotificationIcon = ({ type }: { type: Notification['type'] }) => {
  const icons = {
    system: '🔧',
    business: '💼',
    catalog: '📦',
    operations: '⚙️',
    performance: '📈',
    maintenance: '🛠️',
  };

  return <span className="text-lg">{icons[type]}</span>;
};

/**
 * Item notification individuel
 */
interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const NotificationItem = ({ notification, onMarkAsRead, onDelete }: NotificationItemProps) => {
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
    locale: fr,
  });

  return (
    <div
      className={cn(
        'group relative p-3 border-b last:border-b-0 hover:bg-gray-50 transition-colors',
        !notification.read && 'bg-blue-50/30'
      )}
    >
      {/* Badge "non lu" */}
      {!notification.read && (
        <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full" />
      )}

      {/* En-tête: icône + sévérité */}
      <div className="flex items-start gap-2 mb-2">
        <NotificationIcon type={notification.type} />
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-medium text-sm">{notification.title}</h4>
            <SeverityBadge severity={notification.severity} />
          </div>
          <p className="text-xs text-gray-500 mt-1">{timeAgo}</p>
        </div>
      </div>

      {/* Message */}
      <p className="text-sm text-gray-700 mb-2 pl-7">{notification.message}</p>

      {/* Actions: Action URL + Mark Read + Delete */}
      <div className="flex items-center gap-2 pl-7">
        {notification.action_url && notification.action_label && (
          <Button
            size="sm"
            variant="link"
            className="h-auto p-0 text-xs"
            onClick={() => {
              window.location.href = notification.action_url!;
            }}
          >
            {notification.action_label} →
          </Button>
        )}

        <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!notification.read && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              title="Marquer comme lu"
              onClick={() => onMarkAsRead(notification.id)}
            >
              <Check className="h-3 w-3" />
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
            title="Supprimer"
            onClick={() => onDelete(notification.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

/**
 * Dropdown principal des notifications
 */
export const NotificationsDropdown = () => {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          title={loading ? 'Chargement...' : `${unreadCount} notifications non lues`}
        >
          <Bell className="h-5 w-5" />
          {!loading && unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-auto min-w-[16px] px-1 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-medium">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
          <span className="sr-only">{unreadCount} Notifications</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[400px] p-0">
        {/* En-tête avec actions globales */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <DropdownMenuLabel className="p-0 font-semibold">
            Notifications
            {unreadCount > 0 && (
              <span className="ml-2 text-xs font-normal text-gray-500">
                ({unreadCount} non {unreadCount > 1 ? 'lues' : 'lue'})
              </span>
            )}
          </DropdownMenuLabel>

          {unreadCount > 0 && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs gap-1"
              onClick={() => markAllAsRead()}
            >
              <CheckCheck className="h-3 w-3" />
              Tout marquer lu
            </Button>
          )}
        </div>

        {/* Liste des notifications avec scroll */}
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-500">
            Chargement des notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-500 font-medium mb-1">
              Aucune notification
            </p>
            <p className="text-xs text-gray-400">
              Vous êtes à jour ! 🎉
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={markAsRead}
                onDelete={deleteNotification}
              />
            ))}
          </ScrollArea>
        )}

        {/* Pied avec lien "Voir toutes" (optionnel - Phase 2) */}
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2 text-center">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs w-full"
                onClick={() => {
                  // TODO Phase 2: Créer page dédiée /notifications
                  console.log('Navigation vers page notifications (à implémenter)');
                }}
              >
                Voir toutes les notifications →
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationsDropdown;
