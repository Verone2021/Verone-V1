import type { Database } from '@verone/types';

export type DatabaseNotification =
  Database['public']['Tables']['notifications']['Row'];

export interface NotificationBase {
  id: string;
  type:
    | 'system'
    | 'business'
    | 'catalog'
    | 'operations'
    | 'performance'
    | 'maintenance';
  severity: 'urgent' | 'important' | 'info';
  title: string;
  message: string;
  action_url?: string;
  action_label?: string;
  user_id: string | null;
  read: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateNotificationData {
  type: NotificationBase['type'];
  severity: NotificationBase['severity'];
  title: string;
  message: string;
  action_url?: string;
  action_label?: string;
  user_id?: string;
}

export interface NotificationsState {
  notifications: DatabaseNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
}

export interface DatabaseNotificationsHook {
  notifications: DatabaseNotification[];
  loading: boolean;
  error: Error | null;
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
  createNotification?: (
    data: CreateNotificationData
  ) => Promise<DatabaseNotification>;
  getByType?: (type: NotificationBase['type']) => DatabaseNotification[];
  getBySeverity?: (
    severity: NotificationBase['severity']
  ) => DatabaseNotification[];
  getUnread?: () => DatabaseNotification[];
  stats?: {
    total: number;
    unread: number;
    urgent: number;
    important: number;
    byType: {
      system: number;
      business: number;
      catalog: number;
      operations: number;
      performance: number;
      maintenance: number;
    };
  };
}
