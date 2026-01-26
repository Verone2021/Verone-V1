/**
 * ExpeditionsPendingDropdown - Dropdown expéditions en attente pour sidebar
 * Affiche les commandes validées prêtes à expédier
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
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Truck,
  CheckCircle,
  Package,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

import { useExpeditionsPendingCount } from '../../hooks';

// Type pour les expéditions en attente
interface PendingExpedition {
  id: string;
  order_number: string;
  status: string;
  customer_name: string;
  customer_city: string | null;
  items_count: number;
  validated_at: string;
}

/**
 * Configuration des statuts
 */
const STATUS_CONFIG: Record<string, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: any;
}> = {
  validated: {
    label: 'À expédier',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: Package,
  },
  partially_shipped: {
    label: 'Partielle',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    icon: Truck,
  },
};

interface ExpeditionItemProps {
  expedition: PendingExpedition;
}

/**
 * Item individuel d'expédition
 */
function ExpeditionItem({ expedition }: ExpeditionItemProps) {
  const config = STATUS_CONFIG[expedition.status] || STATUS_CONFIG.validated;
  const Icon = config.icon;

  const timeAgo = formatDistanceToNow(new Date(expedition.validated_at), {
    addSuffix: true,
    locale: fr,
  });

  return (
    <Link
      href={`/stocks/expeditions?order=${expedition.id}`}
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
          <span className="font-mono text-sm font-medium">
            #{expedition.order_number}
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
          <span className="truncate">{expedition.customer_name}</span>
          {expedition.customer_city && (
            <>
              <span>•</span>
              <span>{expedition.customer_city}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 mt-1 text-[10px] text-black/40">
          <span className="font-semibold text-black/60">
            {expedition.items_count} article{expedition.items_count > 1 ? 's' : ''}
          </span>
          <span>•</span>
          <span>Validée {timeAgo}</span>
        </div>
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

interface ExpeditionsPendingDropdownProps {
  /** Trigger element (badge cliquable) */
  children: React.ReactNode;
  /** Nombre max d'expéditions affichées */
  maxItems?: number;
  /** Callback quand dropdown s'ouvre */
  onOpen?: () => void;
  /** Côté du popover */
  side?: 'top' | 'right' | 'bottom' | 'left';
  /** Alignement du popover */
  align?: 'start' | 'center' | 'end';
}

/**
 * Dropdown des expéditions en attente
 */
export function ExpeditionsPendingDropdown({
  children,
  maxItems = 5,
  onOpen,
  side = 'right',
  align = 'start',
}: ExpeditionsPendingDropdownProps) {
  const [open, setOpen] = useState(false);
  const [expeditions, setExpeditions] = useState<PendingExpedition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { count, refetch: refetchCount } = useExpeditionsPendingCount();
  const supabase = createClient();

  /**
   * Fetch expeditions when dropdown opens
   */
  const fetchExpeditions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from('sales_orders')
        .select(`
          id,
          order_number,
          status,
          validated_at,
          organisation:organisations(name, city),
          items:sales_order_items(count)
        `)
        .in('status', ['validated', 'partially_shipped'])
        .order('validated_at', { ascending: true }) // Plus anciennes d'abord
        .limit(maxItems);

      if (queryError) {
        throw new Error(queryError.message);
      }

      const enrichedExpeditions: PendingExpedition[] = (data || []).map((o: any) => ({
        id: o.id,
        order_number: o.order_number || 'N/A',
        status: o.status,
        customer_name: o.organisation?.name || 'Client inconnu',
        customer_city: o.organisation?.city || null,
        items_count: o.items?.length || 0,
        validated_at: o.validated_at || o.created_at,
      }));

      setExpeditions(enrichedExpeditions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur chargement');
      console.error('[ExpeditionsPendingDropdown] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase, maxItems]);

  useEffect(() => {
    if (open) {
      fetchExpeditions();
      onOpen?.();
    }
  }, [open, fetchExpeditions, onOpen]);

  const handleRefresh = async () => {
    await Promise.all([fetchExpeditions(), refetchCount()]);
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
            <Truck className="h-4 w-4 text-blue-500" />
            <span className="font-semibold text-sm">Expéditions</span>
            {count > 0 && (
              <Badge className="bg-blue-500 text-white text-xs px-1.5 py-0">
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
          {loading && expeditions.length === 0 ? (
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
          ) : expeditions.length === 0 ? (
            <div className="p-6 text-center">
              <CheckCircle className="h-8 w-8 mx-auto text-green-400 mb-2" />
              <p className="text-sm text-black/60">Aucune expédition en attente</p>
              <p className="text-xs text-black/40 mt-1">
                Toutes les commandes sont expédiées
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {expeditions.map(expedition => (
                <ExpeditionItem key={expedition.id} expedition={expedition} />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {count > 0 && (
          <div className="border-t px-4 py-2 bg-gray-50/50">
            <Link
              href="/stocks/expeditions"
              className="flex items-center justify-center gap-1.5 text-sm font-medium text-black hover:text-black/70 transition-colors"
              onClick={() => setOpen(false)}
            >
              Voir toutes les expéditions
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
