'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

import { Badge } from '@verone/ui';
import { Button } from '@verone/ui';
import { Popover, PopoverContent, PopoverTrigger } from '@verone/ui';
import { ScrollArea } from '@verone/ui';
import { Skeleton } from '@verone/ui';
import { cn } from '@verone/utils';
import { createClient } from '@verone/utils/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  MessageSquare,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  CheckCircle,
  Clock,
  Mail,
} from 'lucide-react';

import { useLinkmeMissingInfoCount } from '../../hooks';

interface PendingInfoRequest {
  id: string;
  recipient_email: string;
  recipient_name: string | null;
  sent_at: string;
  token_expires_at: string;
  order_number: string;
  sales_order_id: string;
}

interface InfoRequestItemProps {
  request: PendingInfoRequest;
}

function InfoRequestItem({ request }: InfoRequestItemProps) {
  const timeAgo = formatDistanceToNow(new Date(request.sent_at), {
    addSuffix: true,
    locale: fr,
  });

  const expiresIn = formatDistanceToNow(new Date(request.token_expires_at), {
    locale: fr,
  });

  return (
    <Link
      href={`/canaux-vente/linkme/commandes/${request.sales_order_id}`}
      className={cn(
        'group flex items-start gap-3 p-3 rounded-lg transition-all duration-150',
        'hover:bg-black/5 hover:translate-x-0.5',
        'border-l-2 border-orange-200'
      )}
    >
      <div className="flex items-center justify-center w-8 h-8 rounded-md flex-shrink-0 bg-orange-50">
        <Mail className="h-4 w-4 text-orange-600" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-medium">
            #{request.order_number}
          </span>
        </div>

        <div className="flex items-center gap-2 mt-0.5 text-xs text-black/60">
          <span className="truncate">
            {request.recipient_name ?? request.recipient_email}
          </span>
        </div>

        <div className="flex items-center gap-2 mt-1 text-[10px] text-black/40">
          <span>{timeAgo}</span>
          <span>&bull;</span>
          <span className="flex items-center gap-0.5">
            <Clock className="h-2.5 w-2.5" />
            Expire dans {expiresIn}
          </span>
        </div>
      </div>

      <ArrowRight
        className={cn(
          'h-4 w-4 text-black/20 transition-all duration-150',
          'group-hover:text-black group-hover:translate-x-0.5'
        )}
      />
    </Link>
  );
}

interface LinkmeMissingInfoDropdownProps {
  children: React.ReactNode;
  maxItems?: number;
  onOpen?: () => void;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
}

export function LinkmeMissingInfoDropdown({
  children,
  maxItems = 5,
  onOpen,
  side = 'right',
  align = 'start',
}: LinkmeMissingInfoDropdownProps) {
  const [open, setOpen] = useState(false);
  const [requests, setRequests] = useState<PendingInfoRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { count, refetch: refetchCount } = useLinkmeMissingInfoCount();
  const supabase = createClient();

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from('linkme_info_requests')
        .select(
          `
          id,
          recipient_email,
          recipient_name,
          sent_at,
          token_expires_at,
          sales_order_id,
          sales_orders!inner(order_number)
        `
        )
        .not('sent_at', 'is', null)
        .is('completed_at', null)
        .is('cancelled_at', null)
        .gt('token_expires_at', new Date().toISOString())
        .order('sent_at', { ascending: false })
        .limit(maxItems);

      if (queryError) {
        throw new Error(queryError.message);
      }

      const enrichedRequests: PendingInfoRequest[] = (data || []).map(
        (r: Record<string, unknown>) => {
          const salesOrder = r.sales_orders as Record<string, unknown> | null;
          return {
            id: r.id as string,
            recipient_email: r.recipient_email as string,
            recipient_name: r.recipient_name as string | null,
            sent_at: r.sent_at as string,
            token_expires_at: r.token_expires_at as string,
            sales_order_id: r.sales_order_id as string,
            order_number:
              (salesOrder?.order_number as string | undefined) ?? 'N/A',
          };
        }
      );

      setRequests(enrichedRequests);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur chargement');
      console.error('[LinkmeMissingInfoDropdown] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase, maxItems]);

  useEffect(() => {
    if (open) {
      void fetchRequests().catch(err => {
        console.error('[LinkmeMissingInfoDropdown] Fetch error:', err);
      });
      onOpen?.();
    }
  }, [open, fetchRequests, onOpen]);

  const handleRefresh = async () => {
    await Promise.all([fetchRequests(), refetchCount()]);
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
            <MessageSquare className="h-4 w-4 text-orange-500" />
            <span className="font-semibold text-sm">En attente de retour</span>
            {count > 0 && (
              <Badge className="bg-orange-500 text-white text-xs px-1.5 py-0">
                {count}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => {
              void handleRefresh().catch(err => {
                console.error(
                  '[LinkmeMissingInfoDropdown] Refresh error:',
                  err
                );
              });
            }}
            disabled={loading}
          >
            <RefreshCw
              className={cn('h-3.5 w-3.5', loading && 'animate-spin')}
            />
          </Button>
        </div>

        {/* Content */}
        <ScrollArea className="max-h-80">
          {loading && requests.length === 0 ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
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
                onClick={() => {
                  void handleRefresh().catch(err => {
                    console.error(
                      '[LinkmeMissingInfoDropdown] Retry error:',
                      err
                    );
                  });
                }}
                className="mt-2"
              >
                Reessayer
              </Button>
            </div>
          ) : requests.length === 0 ? (
            <div className="p-6 text-center">
              <CheckCircle className="h-8 w-8 mx-auto text-green-400 mb-2" />
              <p className="text-sm text-black/60">Aucune demande en attente</p>
              <p className="text-xs text-black/40 mt-1">
                Toutes les demandes ont recu une reponse
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {requests.map(request => (
                <InfoRequestItem key={request.id} request={request} />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {count > 0 && (
          <div className="border-t px-4 py-2 bg-gray-50/50">
            <Link
              href="/canaux-vente/linkme/messages"
              className="flex items-center justify-center gap-1.5 text-sm font-medium text-black hover:text-black/70 transition-colors"
              onClick={() => setOpen(false)}
            >
              Voir toutes les demandes
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
