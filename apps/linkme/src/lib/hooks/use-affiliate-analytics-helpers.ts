'use client';

/**
 * Helpers pour use-affiliate-analytics
 *
 * @module use-affiliate-analytics-helpers
 * @since 2026-04-14
 */

import type { AnalyticsPeriod } from '../../types/analytics';

export function formatDateLabel(date: Date, period: AnalyticsPeriod): string {
  if (period === 'week') {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
    });
  }
  if (period === 'month') {
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  }
  if (period === 'quarter') {
    return `S${getWeekNumber(date)}`;
  }
  return date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
}

export function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

export function getDateKey(date: Date, period: AnalyticsPeriod): string {
  if (period === 'week' || period === 'month') {
    return date.toISOString().split('T')[0];
  }
  if (period === 'quarter') {
    return `${date.getFullYear()}-W${getWeekNumber(date)}`;
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}
