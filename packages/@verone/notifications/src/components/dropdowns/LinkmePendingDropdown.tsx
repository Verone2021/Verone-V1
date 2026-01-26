/**
 * LinkmePendingDropdown - Dropdown commandes LinkMe actives pour sidebar
 * Affiche les commandes à traiter avec actions rapides
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
  Link2,
  ShoppingBag,
  CheckCircle,
  Truck,
  Package,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';

import { useLinkmePendingCount } from '../../hooks';

// Type pour les commandes LinkMe enrichies
interface LinkmeOrder {
  id: string;
  order_number: string;
  status: string;
  total_ttc: number;
  customer_name: string;
  customer_city?: string;
  affiliate_name?: string;
  created_at: string;
}

/**
 * Configuration des statuts de commandes
 */
const STATUS_CONFIG: Record<string, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: any;
}> = {
  draft: {
    label: 'Brouillon',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    icon: ShoppingBag,
  },
  validated: {
    label: 'Validée',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: CheckCircle,
  },
  partially_shipped: {
    label: 'En cours',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    icon: Package,
  },
  shipped: {
    label: 'Expédiée',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    icon: Truck,
  },
  delivered: {
    label: 'Livrée',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    icon: CheckCircle,
  },
  cancelled: {
    label: 'Annulée',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: AlertCircle,
  },
};

interface LinkmeOrderItemProps {
  order: LinkmeOrder;
}

/**
 * Item individuel de commande LinkMe
 */
function LinkmeOrderItem({ order }: LinkmeOrderItemProps) {
  const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.draft;
  const Icon = config.icon;

  const timeAgo = formatDistanceToNow(new Date(order.created_at), {
    addSuffix: true,
    locale: fr,
  });

  // Format prix avec € et séparateur milliers
  const formattedPrice = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(order.total_ttc || 0);

  return (
    <Link
      href={`/linkme/commandes/${order.id}`}
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
            #{order.order_number}
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
          <span className="truncate">{order.customer_name}</span>
          {order.customer_city && (
            <>
              <span>•</span>
              <span>{order.customer_city}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 mt-1 text-[10px] text-black/40">
          <span className="font-semibold text-black/60">{formattedPrice}</span>
          <span>•</span>
          <span>{timeAgo}</span>
          {order.affiliate_name && (
            <>
              <span>•</span>
              <span className="text-blue-500">{order.affiliate_name}</span>
            </>
          )}
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

interface LinkmePendingDropdownProps {
  /** Trigger element (badge cliquable) */
  children: React.ReactNode;
  /** Nombre max de commandes affichées */
  maxItems?: number;
  /** Callback quand dropdown s'ouvre */
  onOpen?: () => void;
  /** Côté du popover */
  side?: 'top' | 'right' | 'bottom' | 'left';
  /** Alignement du popover */
  align?: 'start' | 'center' | 'end';
}

/**
 * Dropdown des commandes LinkMe actives
 *
 * Affiche les commandes à traiter avec :
 * - Liste scrollable triée par date
 * - Actions rapides (voir tout, rafraîchir)
 * - Mise à jour temps réel via Supabase Realtime
 *
 * @example
 * ```tsx
 * <LinkmePendingDropdown>
 *   <Badge variant="urgent">{count}</Badge>
 * </LinkmePendingDropdown>
 * ```
 */
export function LinkmePendingDropdown({
  children,
  maxItems = 5,
  onOpen,
  side = 'right',
  align = 'start',
}: LinkmePendingDropdownProps) {
  const [open, setOpen] = useState(false);
  const [orders, setOrders] = useState<LinkmeOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { count, refetch: refetchCount } = useLinkmePendingCount();
  const supabase = createClient();

  /**
   * Fetch orders when dropdown opens
   */
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Utiliser la vue enrichie pour performance
      const { data, error: queryError } = await supabase
        .from('linkme_orders_enriched' as any)
        .select(`
          id,
          order_number,
          status,
          total_ttc,
          customer_name,
          customer_city,
          affiliate_name,
          created_at
        `)
        .not('status', 'in', '(delivered,cancelled)')
        .order('created_at', { ascending: false })
        .limit(maxItems);

      if (queryError) {
        throw new Error(queryError.message);
      }

      setOrders((data as unknown as LinkmeOrder[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur chargement');
      console.error('[LinkmePendingDropdown] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase, maxItems]);

  /**
   * Fetch on open
   */
  useEffect(() => {
    if (open) {
      fetchOrders();
      onOpen?.();
    }
  }, [open, fetchOrders, onOpen]);

  /**
   * Refresh handler
   */
  const handleRefresh = async () => {
    await Promise.all([fetchOrders(), refetchCount()]);
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
            <Link2 className="h-4 w-4 text-purple-500" />
            <span className="font-semibold text-sm">LinkMe</span>
            {count > 0 && (
              <Badge className="bg-purple-500 text-white text-xs px-1.5 py-0">
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
          {loading && orders.length === 0 ? (
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
          ) : orders.length === 0 ? (
            <div className="p-6 text-center">
              <CheckCircle className="h-8 w-8 mx-auto text-green-400 mb-2" />
              <p className="text-sm text-black/60">Aucune commande active</p>
              <p className="text-xs text-black/40 mt-1">
                Toutes les commandes sont livrées
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {orders.map(order => (
                <LinkmeOrderItem key={order.id} order={order} />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {count > 0 && (
          <div className="border-t px-4 py-2 bg-gray-50/50">
            <Link
              href="/linkme/commandes/a-traiter"
              className="flex items-center justify-center gap-1.5 text-sm font-medium text-black hover:text-black/70 transition-colors"
              onClick={() => setOpen(false)}
            >
              Voir toutes les commandes
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
