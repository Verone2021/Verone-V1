'use client';

/**
 * 🔔 NOTIFICATION SYSTEM - Vérone Back Office
 * Système de notifications push avancées avec actions intégrées
 * Design System: Noir/Blanc strict, micro-animations élégantes
 */

import { NotificationProvider } from './notification-system.context';
import type { NotificationSystemProps } from './notification-system.types';
import { NotificationToasts } from './NotificationToasts';

export { NotificationProvider } from './notification-system.context';
export { useNotifications } from './notification-system.context';
export { NotificationBell } from './NotificationBell';
export { NotificationToasts } from './NotificationToasts';
export { NotificationHelpers } from './notification-system.helpers';
export type {
  VeroneNotification,
  NotificationAction,
  NotificationSystemProps,
  NotificationContextValue,
} from './notification-system.types';

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
