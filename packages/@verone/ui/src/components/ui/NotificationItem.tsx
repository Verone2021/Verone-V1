'use client';

import { useState } from 'react';

import { cn } from '@verone/utils';
import {
  AlertTriangle,
  CheckCircle,
  Info,
  X,
  XCircle,
  RefreshCw,
} from 'lucide-react';

import { Badge } from './badge';
import { Button } from './button';
import { Card, CardContent } from './card';
import { useNotifications } from './notification-system.context';
import type {
  NotificationAction,
  VeroneNotification,
} from './notification-system.types';

interface NotificationItemProps {
  notification: VeroneNotification;
  compact?: boolean;
  onDismiss?: (id: string) => void;
}

function getTypeIcon(type: VeroneNotification['type']) {
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
}

function getPriorityBadge(priority: VeroneNotification['priority']) {
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
}

const borderClass = (type: VeroneNotification['type']) =>
  cn(
    type === 'critical' && 'border-red-500',
    type === 'error' && 'border-red-400',
    type === 'warning' && 'border-gray-400',
    type === 'success' && 'border-green-400',
    type === 'info' && 'border-gray-400'
  );

export function NotificationItem({
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

  if (compact) {
    return (
      <div
        className={cn(
          'p-3 text-sm border-l-4 cursor-pointer hover:bg-gray-50 transition-colors',
          notification.read ? 'opacity-60' : '',
          borderClass(notification.type)
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

  return (
    <Card
      className={cn(
        'w-80 shadow-lg border-l-4 animate-in slide-in-from-right duration-300',
        borderClass(notification.type)
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
            <Button
              variant="ghost"
              size="sm"
              className="w-6 h-6 p-0"
              onClick={() => {
                if (onDismiss) {
                  onDismiss(notification.id);
                } else {
                  removeNotification(notification.id);
                }
              }}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-3">
          {notification.message}
        </p>

        {notification.actions && notification.actions.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {notification.actions.map(action => (
              <Button
                key={action.id}
                size="sm"
                variant={
                  action.variant === 'primary'
                    ? 'default'
                    : (action.variant ?? 'outline')
                }
                onClick={() => void handleActionClick(action)}
                disabled={isExecuting}
              >
                {isExecuting ? (
                  <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  action.icon && <span className="mr-1">{action.icon}</span>
                )}
                {action.label}
              </Button>
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
