/**
 * LinkmeApprovalsDropdown - Dropdown approbations LinkMe pour sidebar
 * Affiche les commandes LinkMe en attente d'approbation
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
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  CheckCircle,
  User,
} from 'lucide-react';

import { useLinkmeApprovalsCount } from '../../hooks';

// Channel ID LinkMe constant
const LINKME_CHANNEL_ID = '93c68db1-5a30-4168-89ec-6383152be405';

// Type pour les commandes en attente d'approbation
interface PendingApproval {
  id: string;
  order_number: string;
  total_ttc: number;
  customer_name: string;
  affiliate_name: string | null;
  created_at: string;
  margin_rate: number | null;
}

interface ApprovalItemProps {
  approval: PendingApproval;
}

/**
 * Item individuel d'approbation
 */
function ApprovalItem({ approval }: ApprovalItemProps) {
  const timeAgo = formatDistanceToNow(new Date(approval.created_at), {
    addSuffix: true,
    locale: fr,
  });

  const formattedPrice = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(approval.total_ttc || 0);

  // Indicateur de marge (traffic light)
  const marginIndicator = approval.margin_rate !== null
    ? approval.margin_rate >= 30
      ? 'bg-green-500'
      : approval.margin_rate >= 20
        ? 'bg-yellow-500'
        : 'bg-red-500'
    : 'bg-gray-300';

  return (
    <Link
      href={`/linkme/commandes/${approval.id}`}
      className={cn(
        'group flex items-start gap-3 p-3 rounded-lg transition-all duration-150',
        'hover:bg-black/5 hover:translate-x-0.5',
        'border-l-2 border-purple-200'
      )}
    >
      {/* Icône */}
      <div className="flex items-center justify-center w-8 h-8 rounded-md flex-shrink-0 bg-purple-50">
        <ShieldCheck className="h-4 w-4 text-purple-600" />
      </div>

      {/* Contenu */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-medium">
            #{approval.order_number}
          </span>
          {approval.margin_rate !== null && (
            <span
              className={cn(
                'inline-block w-2 h-2 rounded-full',
                marginIndicator
              )}
              title={`Marge: ${approval.margin_rate.toFixed(1)}%`}
            />
          )}
        </div>

        <div className="flex items-center gap-2 mt-0.5 text-xs text-black/60">
          <span className="truncate">{approval.customer_name}</span>
        </div>

        <div className="flex items-center gap-2 mt-1 text-[10px] text-black/40">
          <span className="font-semibold text-black/60">{formattedPrice}</span>
          <span>•</span>
          <span>{timeAgo}</span>
          {approval.affiliate_name && (
            <>
              <span>•</span>
              <span className="flex items-center gap-0.5 text-purple-500">
                <User className="h-2.5 w-2.5" />
                {approval.affiliate_name}
              </span>
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

interface LinkmeApprovalsDropdownProps {
  /** Trigger element (badge cliquable) */
  children: React.ReactNode;
  /** Nombre max d'approbations affichées */
  maxItems?: number;
  /** Callback quand dropdown s'ouvre */
  onOpen?: () => void;
  /** Côté du popover */
  side?: 'top' | 'right' | 'bottom' | 'left';
  /** Alignement du popover */
  align?: 'start' | 'center' | 'end';
}

/**
 * Dropdown des approbations LinkMe
 */
export function LinkmeApprovalsDropdown({
  children,
  maxItems = 5,
  onOpen,
  side = 'right',
  align = 'start',
}: LinkmeApprovalsDropdownProps) {
  const [open, setOpen] = useState(false);
  const [approvals, setApprovals] = useState<PendingApproval[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { count, refetch: refetchCount } = useLinkmeApprovalsCount();
  const supabase = createClient();

  /**
   * Fetch approvals when dropdown opens
   */
  const fetchApprovals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from('sales_orders')
        .select(`
          id,
          order_number,
          total_ttc,
          created_at,
          organisation:organisations(name),
          affiliate:affiliates(name)
        `)
        .eq('channel_id', LINKME_CHANNEL_ID)
        .eq('status', 'draft')
        .order('created_at', { ascending: false })
        .limit(maxItems);

      if (queryError) {
        throw new Error(queryError.message);
      }

      const enrichedApprovals: PendingApproval[] = (data || []).map((o: any) => ({
        id: o.id,
        order_number: o.order_number || 'N/A',
        total_ttc: o.total_ttc || 0,
        customer_name: o.organisation?.name || 'Client inconnu',
        affiliate_name: o.affiliate?.name || null,
        created_at: o.created_at,
        margin_rate: null, // Calcul complexe, simplification
      }));

      setApprovals(enrichedApprovals);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur chargement');
      console.error('[LinkmeApprovalsDropdown] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase, maxItems]);

  useEffect(() => {
    if (open) {
      fetchApprovals();
      onOpen?.();
    }
  }, [open, fetchApprovals, onOpen]);

  const handleRefresh = async () => {
    await Promise.all([fetchApprovals(), refetchCount()]);
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
            <span className="font-semibold text-sm">À valider</span>
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
          {loading && approvals.length === 0 ? (
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
          ) : approvals.length === 0 ? (
            <div className="p-6 text-center">
              <CheckCircle className="h-8 w-8 mx-auto text-green-400 mb-2" />
              <p className="text-sm text-black/60">Aucune approbation en attente</p>
              <p className="text-xs text-black/40 mt-1">
                Toutes les commandes sont validées
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {approvals.map(approval => (
                <ApprovalItem key={approval.id} approval={approval} />
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
