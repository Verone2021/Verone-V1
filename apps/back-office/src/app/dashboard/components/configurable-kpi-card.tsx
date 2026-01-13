'use client';

import React, { useState } from 'react';

import { useRouter } from 'next/navigation';

import { cn } from '@verone/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@verone/ui';
import {
  MoreVertical,
  Settings,
  Trash2,
  GripVertical,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

import {
  type KPIDefinition,
  type KPIPeriod,
  PERIOD_LABELS,
} from '../lib/kpi-catalog';

interface ConfigurableKPICardProps {
  kpiDef: KPIDefinition;
  value: number | string | null;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  period: KPIPeriod;
  onPeriodChange?: (period: KPIPeriod) => void;
  onRemove?: () => void;
  isDragging?: boolean;
  isConfigMode?: boolean;
  dragHandleProps?: Record<string, unknown>;
  className?: string;
}

export function ConfigurableKPICard({
  kpiDef,
  value,
  trend,
  period,
  onPeriodChange,
  onRemove,
  isDragging = false,
  isConfigMode = false,
  dragHandleProps,
  className,
}: ConfigurableKPICardProps) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);

  const Icon = kpiDef.icon;

  // Format value based on type
  const formattedValue = React.useMemo(() => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'string') return value;

    switch (kpiDef.format) {
      case 'currency':
        return new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: 'EUR',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(value);
      case 'percent':
        return `${value.toFixed(1)}%`;
      case 'number':
      default:
        return new Intl.NumberFormat('fr-FR').format(value);
    }
  }, [value, kpiDef.format]);

  // Get navigation path based on category
  const getNavigationPath = () => {
    switch (kpiDef.category) {
      case 'sales':
        return '/commandes/clients';
      case 'stock':
        return '/stocks';
      case 'finance':
        return '/finances';
      case 'linkme':
        return '/canaux-vente/linkme';
      default:
        return null;
    }
  };

  const handleClick = () => {
    if (isConfigMode) return;
    const path = getNavigationPath();
    if (path) {
      router.push(path);
    }
  };

  return (
    <div
      className={cn(
        'relative bg-white rounded-xl border border-slate-200 p-4 transition-all duration-200',
        !isConfigMode &&
          'cursor-pointer hover:shadow-md hover:-translate-y-0.5',
        isDragging && 'shadow-lg ring-2 ring-blue-500 opacity-90',
        isConfigMode && 'ring-1 ring-dashed ring-slate-300',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Drag Handle (visible in config mode) */}
      {isConfigMode && dragHandleProps && (
        <div
          {...dragHandleProps}
          className="absolute top-2 left-2 p-1 cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600"
        >
          <GripVertical className="h-4 w-4" />
        </div>
      )}

      {/* Menu contextuel */}
      {(isHovered || isConfigMode) && (
        <div className="absolute top-2 right-2 z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="p-1.5 rounded-md hover:bg-slate-100 transition-colors"
                onClick={e => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4 text-slate-500" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {/* Période */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Période: {PERIOD_LABELS[period]}</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {kpiDef.availablePeriods.map(p => (
                    <DropdownMenuItem
                      key={p}
                      onClick={e => {
                        e.stopPropagation();
                        onPeriodChange?.(p);
                      }}
                      className={cn(period === p && 'bg-slate-100')}
                    >
                      {PERIOD_LABELS[p]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuSeparator />

              {/* Supprimer */}
              {onRemove && (
                <DropdownMenuItem
                  onClick={e => {
                    e.stopPropagation();
                    onRemove();
                  }}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Retirer</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Icon */}
      <div
        className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center mb-2',
          kpiDef.category === 'sales' && 'bg-blue-50 text-blue-600',
          kpiDef.category === 'stock' && 'bg-purple-50 text-purple-600',
          kpiDef.category === 'finance' && 'bg-green-50 text-green-600',
          kpiDef.category === 'linkme' && 'bg-orange-50 text-orange-600',
          kpiDef.category === 'general' && 'bg-slate-50 text-slate-600'
        )}
      >
        <Icon className="h-4 w-4" />
      </div>

      {/* Label & Period Badge */}
      <div className="flex items-center gap-2 mb-1">
        <h3 className="text-sm font-medium text-slate-600">{kpiDef.label}</h3>
        <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded">
          {PERIOD_LABELS[period]}
        </span>
      </div>

      {/* Value */}
      <div className="flex items-end gap-2">
        <span className="text-xl font-bold text-slate-900 font-mono">
          {formattedValue}
        </span>

        {/* Trend */}
        {kpiDef.showTrend && trend && (
          <div
            className={cn(
              'flex items-center gap-0.5 text-sm font-medium mb-1',
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            )}
          >
            {trend.isPositive ? (
              <ArrowUp className="h-3.5 w-3.5" />
            ) : (
              <ArrowDown className="h-3.5 w-3.5" />
            )}
            <span>{Math.abs(trend.value).toFixed(1)}%</span>
          </div>
        )}
      </div>

      {/* Description (tooltip on hover) */}
      <p className="text-xs text-slate-400 mt-1 truncate">
        {kpiDef.description}
      </p>
    </div>
  );
}
