/**
 * StockAlertsDropdown - Dropdown alertes stock pour sidebar
 * Affiche les produits en alerte avec actions rapides
 *
 * Design System 2026 - Minimaliste, professionnel
 *
 * @author Romeo Dos Santos
 * @date 2026-01-23
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

import { Badge } from '@verone/ui';
import { Button } from '@verone/ui';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@verone/ui';
import { ScrollArea } from '@verone/ui';
import { Skeleton } from '@verone/ui';
import { cn } from '@verone/utils';
import { createClient } from '@verone/utils/supabase/client';
import {
  AlertTriangle,
  AlertCircle,
  Package,
  ArrowRight,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

import { useStockAlertsCount } from '../../hooks';

// Type pour les alertes stock depuis la vue
interface StockAlert {
  id: string;
  product_id: string;
  product_name: string;
  sku: string;
  current_stock: number;
  alert_type: 'out_of_stock' | 'critical' | 'low' | 'none';
  threshold_critical: number;
  threshold_low: number;
  supplier_name?: string;
}

/**
 * Configuration des alertes par type
 */
const ALERT_CONFIG = {
  out_of_stock: {
    label: 'Rupture',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: AlertTriangle,
  },
  critical: {
    label: 'Critique',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    icon: AlertCircle,
  },
  low: {
    label: 'Faible',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    icon: Package,
  },
  none: {
    label: 'Normal',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    icon: Package,
  },
};

interface StockAlertItemProps {
  alert: StockAlert;
}

/**
 * Item individuel d'alerte stock
 */
function StockAlertItem({ alert }: StockAlertItemProps) {
  const config = ALERT_CONFIG[alert.alert_type] || ALERT_CONFIG.none;
  const Icon = config.icon;

  return (
    <Link
      href={`/stocks/alertes?product=${alert.product_id}`}
      className={cn(
        'group flex items-start gap-3 p-3 rounded-lg transition-all duration-150',
        'hover:bg-black/5 hover:translate-x-0.5',
        'border-l-2',
        config.borderColor
      )}
    >
      {/* Icône */}
      <div
        className={cn(
          'flex items-center justify-center w-8 h-8 rounded-md flex-shrink-0',
          config.bgColor
        )}
      >
        <Icon className={cn('h-4 w-4', config.color)} />
      </div>

      {/* Contenu */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">
            {alert.product_name}
          </span>
          <Badge
            className={cn(
              'text-[10px] px-1.5 py-0 font-medium',
              config.bgColor,
              config.color
            )}
          >
            {config.label}
          </Badge>
        </div>

        <div className="flex items-center gap-2 mt-0.5 text-xs text-black/60">
          <span className="font-mono">{alert.sku}</span>
          <span>•</span>
          <span className={cn('font-semibold', config.color)}>
            Stock: {alert.current_stock}
          </span>
        </div>

        {alert.supplier_name && (
          <div className="text-[10px] text-black/40 mt-0.5 truncate">
            {alert.supplier_name}
          </div>
        )}
      </div>

      {/* Flèche hover */}
      <ArrowRight
        className={cn(
          'h-4 w-4 text-black/20 transition-all duration-150',
          'group-hover:text-black group-hover:translate-x-0.5'
        )}
      />
    </Link>
  );
}

interface StockAlertsDropdownProps {
  /** Trigger element (badge cliquable) */
  children: React.ReactNode;
  /** Nombre max d'alertes affichées */
  maxItems?: number;
  /** Callback quand dropdown s'ouvre */
  onOpen?: () => void;
  /** Côté du popover */
  side?: 'top' | 'right' | 'bottom' | 'left';
  /** Alignement du popover */
  align?: 'start' | 'center' | 'end';
}

/**
 * Dropdown des alertes stock
 *
 * Affiche les alertes stock groupées par sévérité avec :
 * - Liste scrollable des produits en alerte
 * - Actions rapides (voir tout, rafraîchir)
 * - Mise à jour temps réel via Supabase Realtime
 *
 * @example
 * ```tsx
 * <StockAlertsDropdown>
 *   <Badge variant="urgent">{count}</Badge>
 * </StockAlertsDropdown>
 * ```
 */
export function StockAlertsDropdown({
  children,
  maxItems = 5,
  onOpen,
  side = 'right',
  align = 'start',
}: StockAlertsDropdownProps) {
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { count, refetch: refetchCount } = useStockAlertsCount();
  const supabase = createClient();

  /**
   * Fetch detailed alerts when dropdown opens
   */
  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from('stock_alerts_unified_view')
        .select('*')
        .neq('alert_type', 'none')
        .order('alert_type', { ascending: true }) // out_of_stock first
        .limit(maxItems);

      if (queryError) {
        throw new Error(queryError.message);
      }

      setAlerts((data as unknown as StockAlert[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur chargement');
      console.error('[StockAlertsDropdown] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase, maxItems]);

  /**
   * Fetch on open
   */
  useEffect(() => {
    if (open) {
      fetchAlerts();
      onOpen?.();
    }
  }, [open, fetchAlerts, onOpen]);

  /**
   * Refresh handler
   */
  const handleRefresh = async () => {
    await Promise.all([fetchAlerts(), refetchCount()]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>

      <PopoverContent
        side={side}
        align={align}
        className="w-80 p-0"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50/50">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="font-semibold text-sm">Alertes Stock</span>
            {count > 0 && (
              <Badge className="bg-red-500 text-white text-xs px-1.5 py-0">
                {count}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw
              className={cn('h-3.5 w-3.5', loading && 'animate-spin')}
            />
          </Button>
        </div>

        {/* Content */}
        <ScrollArea className="max-h-80">
          {loading && alerts.length === 0 ? (
            <div className="p-4 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="w-8 h-8 rounded-md" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <AlertCircle className="h-8 w-8 mx-auto text-red-400 mb-2" />
              <p className="text-sm text-red-600">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="mt-2"
              >
                Réessayer
              </Button>
            </div>
          ) : alerts.length === 0 ? (
            <div className="p-6 text-center">
              <Package className="h-8 w-8 mx-auto text-green-400 mb-2" />
              <p className="text-sm text-black/60">Aucune alerte stock</p>
              <p className="text-xs text-black/40 mt-1">
                Tous les produits sont en stock normal
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {alerts.map(alert => (
                <StockAlertItem key={alert.id} alert={alert} />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {count > 0 && (
          <div className="border-t px-4 py-2 bg-gray-50/50">
            <Link
              href="/stocks/alertes"
              className="flex items-center justify-center gap-1.5 text-sm font-medium text-black hover:text-black/70 transition-colors"
              onClick={() => setOpen(false)}
            >
              Voir toutes les alertes
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
