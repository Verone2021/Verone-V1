/**
 * Utility functions for transforming user LinkMe activity data into timeline events.
 * User-level: shows what THIS user did (orders created, notifications, onboarding).
 *
 * @module affiliate-activity-utils
 * @since 2026-03-04
 */

import {
  Bell,
  CheckCircle2,
  PackageCheck,
  ShoppingCart,
  XCircle,
} from 'lucide-react';

import type { TimelineItem } from '@verone/ui';

import type {
  UserActivityData,
  UserNotification,
  UserOrder,
} from './use-affiliate-activity';

// ============================================
// TYPES
// ============================================

export type ActivityFilter = 'all' | 'orders' | 'notifications';

export interface ActivityTimelineItem extends TimelineItem {
  category: ActivityFilter;
  sortDate: string;
}

// ============================================
// FORMAT HELPERS
// ============================================

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

function getDisplayNumber(order: UserOrder): string {
  return order.linkme_display_number ?? order.order_number;
}

// ============================================
// BUILD EVENTS
// ============================================

function buildOrderEvents(orders: UserOrder[]): ActivityTimelineItem[] {
  const events: ActivityTimelineItem[] = [];

  for (const order of orders) {
    const displayNum = getDisplayNumber(order);

    events.push({
      id: `order-created-${order.id}`,
      title: `Commande ${displayNum} passee`,
      description: `Total HT : ${formatCurrency(order.total_ht)}`,
      timestamp: formatDate(order.created_at),
      icon: ShoppingCart,
      iconColor: 'primary',
      category: 'orders',
      sortDate: order.created_at,
    });

    if (order.confirmed_at) {
      events.push({
        id: `order-confirmed-${order.id}`,
        title: `Commande ${displayNum} confirmee`,
        timestamp: formatDate(order.confirmed_at),
        icon: CheckCircle2,
        iconColor: 'success',
        category: 'orders',
        sortDate: order.confirmed_at,
      });
    }

    if (order.delivered_at) {
      events.push({
        id: `order-delivered-${order.id}`,
        title: `Commande ${displayNum} livree`,
        timestamp: formatDate(order.delivered_at),
        icon: PackageCheck,
        iconColor: 'success',
        category: 'orders',
        sortDate: order.delivered_at,
      });
    }

    if (order.cancelled_at) {
      events.push({
        id: `order-cancelled-${order.id}`,
        title: `Commande ${displayNum} annulee`,
        timestamp: formatDate(order.cancelled_at),
        icon: XCircle,
        iconColor: 'danger',
        category: 'orders',
        sortDate: order.cancelled_at,
      });
    }
  }

  return events;
}

function buildNotificationEvents(
  notifications: UserNotification[]
): ActivityTimelineItem[] {
  return notifications.map(notif => ({
    id: `notif-${notif.id}`,
    title: notif.title,
    description: notif.message ?? undefined,
    timestamp: formatDate(notif.created_at),
    icon: Bell,
    iconColor: 'neutral' as const,
    category: 'notifications' as const,
    sortDate: notif.created_at,
  }));
}

// ============================================
// PUBLIC API
// ============================================

/**
 * Build all timeline events from user activity data, sorted by date descending
 */
export function buildTimelineEvents(
  data: UserActivityData
): ActivityTimelineItem[] {
  const allEvents = [
    ...buildOrderEvents(data.orders),
    ...buildNotificationEvents(data.notifications),
  ];

  allEvents.sort(
    (a, b) => new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime()
  );

  return allEvents;
}

/**
 * Filter timeline events by category
 */
export function filterTimelineEvents(
  events: ActivityTimelineItem[],
  filter: ActivityFilter
): ActivityTimelineItem[] {
  if (filter === 'all') return events;
  return events.filter(e => e.category === filter);
}
