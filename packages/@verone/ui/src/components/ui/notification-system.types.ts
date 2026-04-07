import type React from 'react';

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
  metadata?: Record<string, unknown>;
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

export interface NotificationSystemProps {
  className?: string;
  maxVisible?: number;
  defaultPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  enableBrowserNotifications?: boolean;
  enableSounds?: boolean;
}

export interface NotificationContextValue {
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
