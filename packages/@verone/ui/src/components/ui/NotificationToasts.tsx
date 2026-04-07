'use client';

import { useState, useEffect } from 'react';

import { cn } from '@verone/utils';
import { createPortal } from 'react-dom';

import { NotificationItem } from './NotificationItem';
import { useNotifications } from './notification-system.context';

const POSITION_CLASSES = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
};

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

  const visibleNotifications = notifications
    .filter(n => !n.persistent)
    .slice(0, maxVisible);

  if (visibleNotifications.length === 0) return null;

  return createPortal(
    <div
      className={cn(
        'fixed z-50 flex flex-col gap-2 pointer-events-none',
        POSITION_CLASSES[position]
      )}
    >
      {visibleNotifications.map((notification, index) => (
        <div
          key={notification.id}
          className="pointer-events-auto"
          style={{ animationDelay: `${index * 100}ms` }}
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
