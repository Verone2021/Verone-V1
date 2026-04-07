'use client';

import { Activity, ExternalLink, Zap } from 'lucide-react';

import type { VeroneNotification } from './notification-system.types';

export const NotificationHelpers = {
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
