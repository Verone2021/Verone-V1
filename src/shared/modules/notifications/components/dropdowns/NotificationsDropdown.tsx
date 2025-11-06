/**
 * NotificationsDropdown - Panneau déroulant notifications système V2
 * Design System 2025 - Minimaliste, élégant, professionnel
 *
 * Refonte complète :
 * - ButtonV2 avec micro-interactions
 * - Badges minimalistes sans emojis
 * - Typography hiérarchisée
 * - Spacing Design System tokens
 * - Phrases claires et professionnelles
 */

'use client';

import { Bell, Check, Trash2, CheckCheck, AlertCircle, CheckCircle, Info, ExternalLink } from 'lucide-react';
import { ButtonV2 } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useNotifications, type Notification } from '@/shared/modules/notifications/hooks';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { spacing, colors } from '@/lib/design-system';

/**
 * Badge de sévérité - Style minimaliste Design System V2
 * Suppression des emojis, design professionnel
 */
const SeverityBadge = ({ severity }: { severity: Notification['severity'] }) => {
  const variants = {
    urgent: {
      className: 'bg-red-500/10 text-red-700 border border-red-200',
      label: 'Urgent'
    },
    important: {
      className: 'bg-orange-500/10 text-orange-700 border border-orange-200',
      label: 'Important'
    },
    info: {
      className: 'bg-blue-500/10 text-blue-700 border border-blue-200',
      label: 'Info'
    },
  };

  const config = variants[severity];

  return (
    <Badge className={cn('text-xs font-medium px-2 py-0.5', config.className)}>
      {config.label}
    </Badge>
  );
};

/**
 * Icône selon le type de notification - Lucide icons professionnels
 * Remplacement des emojis par des icônes React
 */
const NotificationIcon = ({ type, severity }: { type: Notification['type']; severity: Notification['severity'] }) => {
  // Couleur selon sévérité
  const colorClass = {
    urgent: 'text-red-600',
    important: 'text-orange-600',
    info: 'text-blue-600',
  }[severity];

  // Icône selon type
  const IconComponent = {
    system: Info,
    business: CheckCircle,
    catalog: Info,
    operations: Info,
    performance: Info,
    maintenance: AlertCircle,
  }[type];

  return (
    <div className={cn('flex items-center justify-center w-8 h-8 rounded-lg', colorClass, 'bg-current/10')}>
      <IconComponent className={cn('h-4 w-4', colorClass)} />
    </div>
  );
};

/**
 * Item notification individuel - Refonte Design System V2
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
        'group relative transition-all duration-200',
        'border-b last:border-b-0',
        'hover:bg-neutral-50',
        !notification.read && 'bg-blue-50/30'
      )}
      style={{
        padding: spacing[4], // Design System: 16px
      }}
    >
      {/* Badge "non lu" */}
      {!notification.read && (
        <div
          className="absolute top-4 right-4 w-2 h-2 rounded-full"
          style={{ backgroundColor: colors.primary[500] }}
        />
      )}

      {/* Layout principal */}
      <div className="flex items-start gap-3">
        {/* Icône */}
        <NotificationIcon type={notification.type} severity={notification.severity} />

        {/* Contenu */}
        <div className="flex-1 min-w-0">
          {/* En-tête: titre + sévérité */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4
              className="font-semibold text-[15px] leading-tight"
              style={{ color: colors.text.DEFAULT }}
            >
              {notification.title}
            </h4>
            <SeverityBadge severity={notification.severity} />
          </div>

          {/* Timestamp */}
          <p
            className="text-xs mb-2"
            style={{ color: colors.text.muted }}
          >
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
            {/* Bouton action principale */}
            {notification.action_url && notification.action_label && (
              <ButtonV2
                variant="primary"
                size="sm"
                icon={ExternalLink}
                iconPosition="right"
                onClick={() => {
                  window.location.href = notification.action_url!;
                }}
              >
                {notification.action_label}
              </ButtonV2>
            )}

            {/* Actions secondaires (hover) */}
            <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {!notification.read && (
                <ButtonV2
                  variant="ghost"
                  size="sm"
                  icon={Check}
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
 * Dropdown principal des notifications - Design System V2
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
        <button
          className={cn(
            'relative flex items-center justify-center',
            'w-10 h-10 rounded-lg',
            'transition-all duration-200',
            'hover:bg-neutral-100',
            'focus:outline-none focus:ring-2 focus:ring-neutral-200'
          )}
          title={loading ? 'Chargement...' : `${unreadCount} notifications non lues`}
        >
          <Bell className="h-5 w-5" style={{ color: colors.text.DEFAULT }} />
          {!loading && unreadCount > 0 && (
            <span
              className="absolute -top-1 -right-1 h-5 w-auto min-w-[20px] px-1.5 rounded-full text-xs text-white flex items-center justify-center font-semibold"
              style={{ backgroundColor: colors.danger[500] }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
          <span className="sr-only">{unreadCount} Notifications</span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-[420px] p-0"
        style={{ borderRadius: '10px' }}
      >
        {/* En-tête avec actions globales */}
        <div
          className="flex items-center justify-between border-b"
          style={{
            padding: `${spacing[4]} ${spacing[4]}`,
          }}
        >
          <div>
            <DropdownMenuLabel
              className="p-0 font-semibold text-base"
              style={{ color: colors.text.DEFAULT }}
            >
              Notifications
            </DropdownMenuLabel>
            {unreadCount > 0 && (
              <span
                className="text-xs font-normal"
                style={{ color: colors.text.subtle }}
              >
                ({unreadCount} non {unreadCount > 1 ? 'lues' : 'lue'})
              </span>
            )}
          </div>

          {unreadCount > 0 && (
            <ButtonV2
              variant="ghost"
              size="sm"
              icon={CheckCheck}
              onClick={() => markAllAsRead()}
            >
              Tout marquer lu
            </ButtonV2>
          )}
        </div>

        {/* Liste des notifications avec scroll */}
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-3" style={{ borderColor: colors.primary[500] }} />
            <p className="text-sm" style={{ color: colors.text.subtle }}>
              Chargement des notifications...
            </p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center">
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
            <p
              className="text-xs"
              style={{ color: colors.text.muted }}
            >
              Vous êtes à jour ! 🎉
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
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

        {/* Pied avec lien "Voir toutes" */}
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div style={{ padding: spacing[2] }}>
              <ButtonV2
                variant="ghost"
                size="sm"
                className="w-full"
                icon={ExternalLink}
                iconPosition="right"
                onClick={() => {
                  window.location.href = '/notifications';
                }}
              >
                Voir toutes les notifications
              </ButtonV2>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationsDropdown;
