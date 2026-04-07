'use client';

import { useState } from 'react';

import { cn } from '@verone/utils';
import { Bell, Eye, Filter } from 'lucide-react';

import { Badge } from './badge';
import { Button } from './button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu';
import { NotificationItem } from './NotificationItem';
import { useNotifications } from './notification-system.context';

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
    .slice(0, 10);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={cn('relative', className)}>
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center text-xs bg-red-500 text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 max-h-96 overflow-y-auto"
      >
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          <div className="flex items-center gap-2">
            <Button
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
            </Button>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                <Eye className="w-3 h-3 mr-1" />
                Marquer lues
              </Button>
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
            setOpen(false);
          }}
        >
          Voir toutes les notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
