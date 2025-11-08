'use client';

import type { LucideIcon } from 'lucide-react';

import { colors } from '../../tokens/colors';

export interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  icon: LucideIcon;
  iconColor?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
}

export interface ActivityTimelineProps {
  items: TimelineItem[];
  maxItems?: number;
}

export function ActivityTimeline({
  items,
  maxItems = 5,
}: ActivityTimelineProps) {
  const displayedItems = items.slice(0, maxItems);

  const getIconColor = (color?: string) => {
    const colorMap = {
      primary: colors.primary.DEFAULT,
      success: colors.success.DEFAULT,
      warning: colors.warning.DEFAULT,
      danger: colors.danger.DEFAULT,
      neutral: colors.neutral[500],
    };
    return color
      ? colorMap[color as keyof typeof colorMap]
      : colors.neutral[500];
  };

  const getIconBg = (color?: string) => {
    const bgMap = {
      primary: colors.primary[50],
      success: colors.success[50],
      warning: colors.warning[50],
      danger: colors.danger[50],
      neutral: colors.neutral[50],
    };
    return color ? bgMap[color as keyof typeof bgMap] : colors.neutral[50];
  };

  return (
    <div className="space-y-3">
      {displayedItems.map((item, index) => {
        const Icon = item.icon;
        const iconColor = getIconColor(item.iconColor);
        const iconBg = getIconBg(item.iconColor);
        const isLast = index === displayedItems.length - 1;

        return (
          <div key={item.id} className="relative flex gap-3">
            {/* Timeline line */}
            {!isLast && (
              <div
                className="absolute left-4 top-8 bottom-0 w-px"
                style={{ backgroundColor: colors.neutral[200] }}
              />
            )}

            {/* Icon */}
            <div
              className="relative z-10 flex items-center justify-center rounded-full flex-shrink-0"
              style={{
                width: '32px',
                height: '32px',
                backgroundColor: iconBg,
              }}
            >
              <Icon size={16} style={{ color: iconColor }} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 leading-snug">
                    {item.title}
                  </p>
                  {item.description && (
                    <p className="text-xs text-slate-600 leading-snug mt-0.5 line-clamp-1">
                      {item.description}
                    </p>
                  )}
                </div>
                <span className="text-xs text-slate-500 flex-shrink-0">
                  {item.timestamp}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
