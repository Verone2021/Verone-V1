'use client';

/**
 * 🔔 NOTIFICATION SYSTEM - Vérone Back Office
 * Système de notifications push avancées avec actions intégrées
 * Design System: Noir/Blanc strict, micro-animations élégantes
 */

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  createContext,
  useContext,
} from 'react';

import { cn } from '@verone/utils';
import {
  AlertTriangle,
  Bell,
  CheckCircle,
  Info,
  X,
  XCircle,
  Filter,
  ExternalLink,
  Zap,
  Activity,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { createPortal } from 'react-dom';

import { Badge } from './badge';
import { ButtonV2 } from './button';
import { Card, CardContent } from './card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu';

// Types pour les notifications
export interface VeroneNotification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'critical';
  category: 'system' | 'security' | 'performance' | 'business' | 'user';
  timestamp: Date;
  read: boolean;
  persistent: boolean;
  autoClose?: number; // ms
  actions?: NotificationAction[];
  metadata?: Record<string, any>;
  priority: 'low' | 'medium' | 'high' | 'critical';
  source?: string;
  relatedErrorId?: string;
}

export interface NotificationAction {
  id: string;
  label: string;
  variant?: 'primary' | 'secondary' | 'destructive';
  handler: (notification: VeroneNotification) => void | Promise<void>;
  icon?: React.ReactNode;
  requiresConfirmation?: boolean;
}

interface NotificationSystemProps {
  className?: string;
  maxVisible?: number;
  defaultPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  enableBrowserNotifications?: boolean;
  enableSounds?: boolean;
}

// Context pour les notifications
interface NotificationContextValue {
  notifications: VeroneNotification[];
  unreadCount: number;
  addNotification: (
    notification: Omit<VeroneNotification, 'id' | 'timestamp' | 'read'>
  ) => string;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  requestPermission: () => Promise<boolean>;
  isPermissionGranted: boolean;
}

const NotificationContext = createContext<NotificationContextValue | null>(
  null
);

/**
 * 🔔 NOTIFICATION PROVIDER
 */
export function NotificationProvider({
  children,
  enableBrowserNotifications = true,
  enableSounds = false,
}: {
  children: React.ReactNode;
  maxVisible?: number;
  enableBrowserNotifications?: boolean;
  enableSounds?: boolean;
}) {
  const [notifications, setNotifications] = useState<VeroneNotification[]>([]);
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Vérifier les permissions de notification au montage
  useEffect(() => {
    if (enableBrowserNotifications && 'Notification' in window) {
      setIsPermissionGranted(Notification.permission === 'granted');
    }
  }, [enableBrowserNotifications]);

  // Créer l'audio pour les sons de notification
  useEffect(() => {
    if (enableSounds && !audioRef.current) {
      audioRef.current = new Audio('/sounds/notification.mp3');
      audioRef.current.volume = 0.3;
    }
  }, [enableSounds]);

  // Demander la permission pour les notifications browser
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) return false;

    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      setIsPermissionGranted(granted);
      return granted;
    } catch (error) {
      console.error('Erreur demande permission notifications:', error);
      return false;
    }
  }, []);

  // Ajouter une notification
  const addNotification = useCallback(
    (
      notificationData: Omit<VeroneNotification, 'id' | 'timestamp' | 'read'>
    ): string => {
      const notification: VeroneNotification = {
        ...notificationData,
        id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        read: false,
      };

      setNotifications(prev => [notification, ...prev]);

      // Notification browser native si autorisée
      if (
        enableBrowserNotifications &&
        isPermissionGranted &&
        notification.type === 'critical'
      ) {
        try {
          const browserNotification = new Notification(notification.title, {
            body: notification.message,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: notification.id,
            requireInteraction: notification.persistent,
          });

          browserNotification.onclick = () => {
            window.focus();
            markAsRead(notification.id);
            browserNotification.close();
          };
        } catch (error) {
          console.error('Erreur notification browser:', error);
        }
      }

      // Son de notification
      if (
        enableSounds &&
        audioRef.current &&
        notification.priority === 'critical'
      ) {
        audioRef.current.play().catch(console.error);
      }

      // Auto-suppression si configurée
      if (notification.autoClose) {
        setTimeout(() => {
          removeNotification(notification.id);
        }, notification.autoClose);
      }

      return notification.id;
    },
    [enableBrowserNotifications, enableSounds, isPermissionGranted]
  );

  // Supprimer une notification
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Marquer comme lue
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  // Marquer toutes comme lues
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  // Effacer toutes les notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Compter les non lues
  const unreadCount = notifications.filter(n => !n.read).length;

  const contextValue: NotificationContextValue = {
    notifications,
    unreadCount,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    requestPermission,
    isPermissionGranted,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

/**
 * 🪝 HOOK POUR UTILISER LES NOTIFICATIONS
 */
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      'useNotifications must be used within NotificationProvider'
    );
  }
  return context;
}

/**
 * 🔔 NOTIFICATION BELL - Icône avec badge
 */
export function NotificationBell({ className }: { className?: string }) {
  const { notifications, unreadCount, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'critical'>('all');

  const filteredNotifications = notifications
    .filter(notification => {
      switch (filter) {
        case 'unread':
          return !notification.read;
        case 'critical':
          return notification.type === 'critical';
        default:
          return true;
      }
    })
    .slice(0, 10); // Limiter l'affichage

  // getCategoryIcon unused - commenté
  // const getCategoryIcon = (category: VeroneNotification['category']) => {
  //   switch (category) {
  //     case 'system':
  //       return <Settings className="w-4 h-4" />;
  //     case 'security':
  //       return <Shield className="w-4 h-4" />;
  //     case 'performance':
  //       return <Activity className="w-4 h-4" />;
  //     case 'business':
  //       return <Globe className="w-4 h-4" />;
  //     case 'user':
  //       return <Users className="w-4 h-4" />;
  //     default:
  //       return <Info className="w-4 h-4" />;
  //   }
  // };

  // getTypeIcon unused - commenté
  // const getTypeIcon = (type: VeroneNotification['type']) => {
  //   switch (type) {
  //     case 'success':
  //       return <CheckCircle className="w-4 h-4 text-green-600" />;
  //     case 'error':
  //       return <XCircle className="w-4 h-4 text-red-600" />;
  //     case 'warning':
  //       return <AlertTriangle className="w-4 h-4 text-black" />;
  //     case 'critical':
  //       return <AlertTriangle className="w-4 h-4 text-red-700" />;
  //     default:
  //       return <Info className="w-4 h-4 text-gray-600" />;
  //   }
  // };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <ButtonV2
          variant="ghost"
          size="sm"
          className={cn('relative', className)}
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center text-xs bg-red-500 text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </ButtonV2>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 max-h-96 overflow-y-auto"
      >
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          <div className="flex items-center gap-2">
            <ButtonV2
              variant="ghost"
              size="sm"
              onClick={() =>
                setFilter(
                  filter === 'all'
                    ? 'unread'
                    : filter === 'unread'
                      ? 'critical'
                      : 'all'
                )
              }
            >
              <Filter className="w-3 h-3 mr-1" />
              {filter === 'all'
                ? 'Toutes'
                : filter === 'unread'
                  ? 'Non lues'
                  : 'Critiques'}
            </ButtonV2>
            {unreadCount > 0 && (
              <ButtonV2 variant="ghost" size="sm" onClick={markAllAsRead}>
                <Eye className="w-3 h-3 mr-1" />
                Marquer lues
              </ButtonV2>
            )}
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {filteredNotifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
            {filter === 'unread'
              ? 'Aucune notification non lue'
              : 'Aucune notification'}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredNotifications.map(notification => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                compact
              />
            ))}
          </div>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-center justify-center text-sm"
          onClick={() => {
            // Ouvrir le centre de notifications complet
            setOpen(false);
          }}
        >
          Voir toutes les notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * 🎯 NOTIFICATION ITEM - Item individuel
 */
interface NotificationItemProps {
  notification: VeroneNotification;
  compact?: boolean;
  onDismiss?: (id: string) => void;
}

function NotificationItem({
  notification,
  compact = false,
  onDismiss,
}: NotificationItemProps) {
  const { markAsRead, removeNotification } = useNotifications();
  const [isExecuting, setIsExecuting] = useState(false);

  const handleActionClick = async (action: NotificationAction) => {
    if (action.requiresConfirmation) {
      const confirmed = confirm(
        `Êtes-vous sûr de vouloir ${action.label.toLowerCase()} ?`
      );
      if (!confirmed) return;
    }

    setIsExecuting(true);
    try {
      await action.handler(notification);
      markAsRead(notification.id);
    } catch (error) {
      console.error('Erreur action notification:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  const getTypeIcon = (type: VeroneNotification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-black" />;
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-red-700" />;
      default:
        return <Info className="w-4 h-4 text-gray-600" />;
    }
  };

  const getPriorityBadge = (priority: VeroneNotification['priority']) => {
    switch (priority) {
      case 'critical':
        return <Badge className="bg-red-500 text-white">Critique</Badge>;
      case 'high':
        return <Badge className="bg-gray-500 text-white">Haute</Badge>;
      case 'medium':
        return <Badge variant="outline">Moyenne</Badge>;
      case 'low':
        return <Badge variant="secondary">Faible</Badge>;
    }
  };

  if (compact) {
    return (
      <div
        className={cn(
          'p-3 text-sm border-l-4 cursor-pointer hover:bg-gray-50 transition-colors',
          notification.read ? 'opacity-60' : '',
          notification.type === 'critical' && 'border-red-500',
          notification.type === 'error' && 'border-red-400',
          notification.type === 'warning' && 'border-gray-400',
          notification.type === 'success' && 'border-green-400',
          notification.type === 'info' && 'border-gray-400'
        )}
        onClick={() => !notification.read && markAsRead(notification.id)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {getTypeIcon(notification.type)}
              <span className="font-medium">{notification.title}</span>
              {!notification.read && (
                <div className="w-2 h-2 bg-black rounded-full" />
              )}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {notification.message}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground">
                {notification.timestamp.toLocaleTimeString()}
              </span>
              {getPriorityBadge(notification.priority)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Version complète pour les toasts
  return (
    <Card
      className={cn(
        'w-80 shadow-lg border-l-4 animate-in slide-in-from-right duration-300',
        notification.type === 'critical' && 'border-red-500',
        notification.type === 'error' && 'border-red-400',
        notification.type === 'warning' && 'border-gray-400',
        notification.type === 'success' && 'border-green-400',
        notification.type === 'info' && 'border-gray-400'
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            {getTypeIcon(notification.type)}
            <span className="font-semibold">{notification.title}</span>
          </div>
          <div className="flex items-center gap-1">
            {getPriorityBadge(notification.priority)}
            <ButtonV2
              variant="ghost"
              size="sm"
              className="w-6 h-6 p-0"
              onClick={() =>
                onDismiss?.(notification.id) ||
                removeNotification(notification.id)
              }
            >
              <X className="w-3 h-3" />
            </ButtonV2>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-3">
          {notification.message}
        </p>

        {notification.actions && notification.actions.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {notification.actions.map(action => (
              <ButtonV2
                key={action.id}
                size="sm"
                variant={action.variant || 'outline'}
                onClick={() => handleActionClick(action)}
                disabled={isExecuting}
                className={cn(
                  action.variant === 'primary' &&
                    'bg-black hover:bg-gray-800 text-white'
                )}
              >
                {isExecuting ? (
                  <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  action.icon && <span className="mr-1">{action.icon}</span>
                )}
                {action.label}
              </ButtonV2>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {notification.category}
            </Badge>
            {notification.source && <span>• {notification.source}</span>}
          </div>
          <span>{notification.timestamp.toLocaleTimeString()}</span>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 🌊 TOAST NOTIFICATIONS - Container flottant
 */
export function NotificationToasts({
  position = 'top-right',
  maxVisible = 5,
}: {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  maxVisible?: number;
}) {
  const { notifications, removeNotification } = useNotifications();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Afficher seulement les notifications non persistantes et récentes
  const visibleNotifications = notifications
    .filter(n => !n.persistent)
    .slice(0, maxVisible);

  if (visibleNotifications.length === 0) return null;

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  return createPortal(
    <div
      className={cn(
        'fixed z-50 flex flex-col gap-2 pointer-events-none',
        positionClasses[position]
      )}
    >
      {visibleNotifications.map((notification, index) => (
        <div
          key={notification.id}
          className="pointer-events-auto"
          style={{
            animationDelay: `${index * 100}ms`,
          }}
        >
          <NotificationItem
            notification={notification}
            onDismiss={removeNotification}
          />
        </div>
      ))}
    </div>,
    document.body
  );
}

/**
 * 🔔 NOTIFICATION SYSTEM COMPOSANT PRINCIPAL
 */
export default function NotificationSystem({
  maxVisible = 5,
  defaultPosition = 'top-right',
  enableBrowserNotifications = true,
  enableSounds = false,
}: NotificationSystemProps) {
  return (
    <NotificationProvider
      maxVisible={maxVisible}
      enableBrowserNotifications={enableBrowserNotifications}
      enableSounds={enableSounds}
    >
      <NotificationToasts position={defaultPosition} maxVisible={maxVisible} />
    </NotificationProvider>
  );
}

/**
 * 🎯 HELPERS POUR CRÉER DES NOTIFICATIONS SPÉCIALISÉES
 */
export const NotificationHelpers = {
  // Notification d'erreur critique
  createCriticalError: (
    title: string,
    message: string,
    errorId?: string
  ): Omit<VeroneNotification, 'id' | 'timestamp' | 'read'> => ({
    title,
    message,
    type: 'critical',
    category: 'system',
    priority: 'critical',
    persistent: true,
    relatedErrorId: errorId,
    actions: [
      {
        id: 'resolve',
        label: 'Résoudre',
        variant: 'primary',
        icon: <Zap className="w-3 h-3" />,
        handler: async notification => {
          if (notification.relatedErrorId) {
            const event = new CustomEvent('resolve-error', {
              detail: { errorId: notification.relatedErrorId },
            });
            window.dispatchEvent(event);
          }
        },
      },
      {
        id: 'details',
        label: 'Détails',
        icon: <ExternalLink className="w-3 h-3" />,
        handler: notification => {
          const event = new CustomEvent('show-error-details', {
            detail: { errorId: notification.relatedErrorId },
          });
          window.dispatchEvent(event);
        },
      },
    ],
  }),

  // Notification de succès
  createSuccess: (
    title: string,
    message: string
  ): Omit<VeroneNotification, 'id' | 'timestamp' | 'read'> => ({
    title,
    message,
    type: 'success',
    category: 'system',
    priority: 'medium',
    persistent: false,
    autoClose: 5000,
  }),

  // Notification d'activité utilisateur
  createUserActivity: (
    title: string,
    message: string
  ): Omit<VeroneNotification, 'id' | 'timestamp' | 'read'> => ({
    title,
    message,
    type: 'info',
    category: 'user',
    priority: 'low',
    persistent: false,
    autoClose: 3000,
  }),

  // Notification de performance
  createPerformanceAlert: (
    title: string,
    message: string
  ): Omit<VeroneNotification, 'id' | 'timestamp' | 'read'> => ({
    title,
    message,
    type: 'warning',
    category: 'performance',
    priority: 'high',
    persistent: false,
    autoClose: 10000,
    actions: [
      {
        id: 'optimize',
        label: 'Optimiser',
        variant: 'primary',
        icon: <Activity className="w-3 h-3" />,
        handler: () => {
          const event = new CustomEvent('optimize-performance');
          window.dispatchEvent(event);
        },
      },
    ],
  }),
};
