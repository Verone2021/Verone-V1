'use client';

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  createContext,
  useContext,
} from 'react';

import type {
  NotificationContextValue,
  VeroneNotification,
} from './notification-system.types';

const NotificationContext = createContext<NotificationContextValue | null>(
  null
);

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

  useEffect(() => {
    if (enableBrowserNotifications && 'Notification' in window) {
      setIsPermissionGranted(Notification.permission === 'granted');
    }
  }, [enableBrowserNotifications]);

  useEffect(() => {
    if (enableSounds && !audioRef.current) {
      audioRef.current = new Audio('/sounds/notification.mp3');
      audioRef.current.volume = 0.3;
    }
  }, [enableSounds]);

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

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

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

      if (
        enableSounds &&
        audioRef.current &&
        notification.priority === 'critical'
      ) {
        audioRef.current.play().catch(console.error);
      }

      if (notification.autoClose) {
        setTimeout(() => {
          removeNotification(notification.id);
        }, notification.autoClose);
      }

      return notification.id;
    },
    [
      enableBrowserNotifications,
      enableSounds,
      isPermissionGranted,
      markAsRead,
      removeNotification,
    ]
  );

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

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

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      'useNotifications must be used within NotificationProvider'
    );
  }
  return context;
}
