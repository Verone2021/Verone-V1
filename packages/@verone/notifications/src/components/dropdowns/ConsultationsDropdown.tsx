/**
 * ConsultationsDropdown - Dropdown consultations actives pour sidebar
 * Affiche les consultations en attente/en cours avec actions rapides
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
import { Popover, PopoverContent, PopoverTrigger } from '@verone/ui';
import { ScrollArea } from '@verone/ui';
import { Skeleton } from '@verone/ui';
import { cn } from '@verone/utils';
import { createClient } from '@verone/utils/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  MessageCircle,
  Clock,
  User,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  Play,
} from 'lucide-react';

import { useConsultationsCount } from '../../hooks';

// Type pour les consultations
interface Consultation {
  id: string;
  client_email: string;
  descriptif: string;
  status: 'en_attente' | 'en_cours' | 'terminee' | 'annulee';
  priority_level: number;
  source_channel: string;
  created_at: string;
  organisation?: { legal_name?: string; trade_name?: string };
}

/**
 * Configuration des statuts
 */
const STATUS_CONFIG = {
  en_attente: {
    label: 'En attente',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    icon: Clock,
  },
  en_cours: {
    label: 'En cours',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: Play,
  },
  terminee: {
    label: 'Terminée',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    icon: MessageCircle,
  },
  annulee: {
    label: 'Annulée',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    icon: MessageCircle,
  },
};

/**
 * Configuration des priorités
 */
const PRIORITY_CONFIG: Record<number, { label: string; color: string }> = {
  1: { label: 'Basse', color: 'text-gray-500' },
  2: { label: 'Normale', color: 'text-blue-500' },
  3: { label: 'Haute', color: 'text-orange-500' },
  4: { label: 'Urgente', color: 'text-red-500' },
};

interface ConsultationItemProps {
  consultation: Consultation;
}

/**
 * Item individuel de consultation
 */
function ConsultationItem({ consultation }: ConsultationItemProps) {
  const config = STATUS_CONFIG[consultation.status] || STATUS_CONFIG.en_attente;
  const priorityConfig =
    PRIORITY_CONFIG[consultation.priority_level] || PRIORITY_CONFIG[2];
  const Icon = config.icon;

  const timeAgo = formatDistanceToNow(new Date(consultation.created_at), {
    addSuffix: true,
    locale: fr,
  });

  const clientName =
    consultation.organisation?.trade_name ||
    consultation.organisation?.legal_name ||
    consultation.client_email.split('@')[0];

  return (
    <Link
      href={`/consultations/${consultation.id}`}
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
          <span className="font-medium text-sm truncate">{clientName}</span>
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

        <p className="text-xs text-black/60 mt-0.5 line-clamp-1">
          {consultation.descriptif}
        </p>

        <div className="flex items-center gap-2 mt-1 text-[10px] text-black/40">
          <span className={priorityConfig.color}>
            P{consultation.priority_level}
          </span>
          <span>•</span>
          <span>{timeAgo}</span>
          <span>•</span>
          <span className="capitalize">{consultation.source_channel}</span>
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

interface ConsultationsDropdownProps {
  /** Trigger element (badge cliquable) */
  children: React.ReactNode;
  /** Nombre max de consultations affichées */
  maxItems?: number;
  /** Callback quand dropdown s'ouvre */
  onOpen?: () => void;
  /** Côté du popover */
  side?: 'top' | 'right' | 'bottom' | 'left';
  /** Alignement du popover */
  align?: 'start' | 'center' | 'end';
}

/**
 * Dropdown des consultations actives
 *
 * Affiche les consultations en attente/en cours avec :
 * - Liste scrollable groupée par statut
 * - Actions rapides (voir tout, rafraîchir)
 * - Mise à jour temps réel via Supabase Realtime
 *
 * @example
 * ```tsx
 * <ConsultationsDropdown>
 *   <Badge variant="urgent">{count}</Badge>
 * </ConsultationsDropdown>
 * ```
 */
export function ConsultationsDropdown({
  children,
  maxItems = 5,
  onOpen,
  side = 'right',
  align = 'start',
}: ConsultationsDropdownProps) {
  const [open, setOpen] = useState(false);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { count, refetch: refetchCount } = useConsultationsCount();
  const supabase = createClient();

  /**
   * Fetch consultations when dropdown opens
   */
  const fetchConsultations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from('client_consultations')
        .select(
          `
          id,
          client_email,
          descriptif,
          status,
          priority_level,
          source_channel,
          created_at,
          organisation:organisations(legal_name, trade_name)
        `
        )
        .in('status', ['en_attente', 'en_cours'])
        .is('archived_at', null)
        .is('deleted_at', null)
        .order('priority_level', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(maxItems);

      if (queryError) {
        throw new Error(queryError.message);
      }

      setConsultations((data as any[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur chargement');
      console.error('[ConsultationsDropdown] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase, maxItems]);

  /**
   * Fetch on open
   */
  useEffect(() => {
    if (open) {
      fetchConsultations();
      onOpen?.();
    }
  }, [open, fetchConsultations, onOpen]);

  /**
   * Refresh handler
   */
  const handleRefresh = async () => {
    await Promise.all([fetchConsultations(), refetchCount()]);
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
            <MessageCircle className="h-4 w-4 text-blue-500" />
            <span className="font-semibold text-sm">Consultations</span>
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
          {loading && consultations.length === 0 ? (
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
          ) : consultations.length === 0 ? (
            <div className="p-6 text-center">
              <MessageCircle className="h-8 w-8 mx-auto text-green-400 mb-2" />
              <p className="text-sm text-black/60">
                Aucune consultation active
              </p>
              <p className="text-xs text-black/40 mt-1">
                Toutes les consultations sont traitées
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {consultations.map(consultation => (
                <ConsultationItem
                  key={consultation.id}
                  consultation={consultation}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {count > 0 && (
          <div className="border-t px-4 py-2 bg-gray-50/50">
            <Link
              href="/consultations?status=en_attente,en_cours"
              className="flex items-center justify-center gap-1.5 text-sm font-medium text-black hover:text-black/70 transition-colors"
              onClick={() => setOpen(false)}
            >
              Voir toutes les consultations
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
