'use client';

/**
 * 🎨 ChannelFilter Component
 *
 * Dropdown select de canal de vente avec fetch Supabase automatique
 * Design System V2 - Best Practices 2025
 *
 * @example
 * ```tsx
 * const [channel, setChannel] = useState<string | null>(null)
 *
 * <ChannelFilter
 *   selectedChannel={channel}
 *   onChannelChange={setChannel}
 *   showAllOption
 * />
 * ```
 */

import * as React from 'react';
import { useState, useEffect } from 'react';

import { Loader2 } from 'lucide-react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';

import { ChannelBadge } from './ChannelBadge';
import { type ChannelCode } from './types';

export interface ChannelFilterProps {
  /**
   * Canal sélectionné (ID ou null)
   */
  selectedChannel: string | null;

  /**
   * Callback changement de canal
   */
  onChannelChange: (channelId: string | null) => void;

  /**
   * Afficher l'option "Tous les canaux"
   * @default true
   */
  showAllOption?: boolean;

  /**
   * Placeholder personnalisé
   * @default "Sélectionner un canal"
   */
  placeholder?: string;

  /**
   * Désactiver le select
   * @default false
   */
  disabled?: boolean;
}

interface SalesChannel {
  id: string;
  name: string;
  code: string;
  is_active: boolean | null;
}

/**
 * Dropdown filter de canaux de vente avec fetch automatique
 *
 * Features:
 * - Fetch sales_channels depuis Supabase (is_active=true)
 * - Option "Tous les canaux" configurable
 * - Badge coloré dans dropdown pour chaque canal
 * - Loading state pendant fetch
 * - Error handling avec console.error
 * - Responsive (w-64, mobile-friendly)
 * - Accessibility compliant
 */
export function ChannelFilter({
  selectedChannel,
  onChannelChange,
  showAllOption = true,
  placeholder = 'Sélectionner un canal',
  disabled = false,
}: ChannelFilterProps) {
  const [channels, setChannels] = useState<SalesChannel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchChannels() {
      try {
        setIsLoading(true);
        setError(null);

        const supabase = createClient();

        const { data, error: fetchError } = await supabase
          .from('sales_channels')
          .select('id, name, code, is_active')
          .eq('is_active', true)
          .order('name', { ascending: true });

        if (fetchError) {
          throw fetchError;
        }

        setChannels(data || []);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Erreur inconnue';
        setError(errorMessage);
        console.error('[ChannelFilter] Fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchChannels();
  }, []);

  /**
   * Normaliser les codes canaux pour affichage badge
   */
  const normalizeChannelCode = (code: string): ChannelCode => {
    const lowerCode = code.toLowerCase();

    if (lowerCode.includes('b2b')) return 'b2b';
    if (lowerCode.includes('ecommerce') || lowerCode.includes('e-commerce'))
      return 'ecommerce';
    if (lowerCode.includes('retail')) return 'retail';
    if (lowerCode.includes('wholesale')) return 'wholesale';

    // Fallback default
    return 'ecommerce';
  };

  return (
    <div className="flex flex-col gap-2 w-64">
      <label
        htmlFor="channel-filter"
        className="text-sm font-medium text-gray-700"
      >
        Canal de vente
      </label>

      <Select
        value={selectedChannel || 'all'}
        onValueChange={value => onChannelChange(value === 'all' ? null : value)}
        disabled={disabled || isLoading}
      >
        <SelectTrigger
          id="channel-filter"
          className="h-10 w-full"
          aria-label="Sélectionner un canal de vente"
        >
          {isLoading ? (
            <div className="flex items-center gap-2 text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Chargement...</span>
            </div>
          ) : (
            <SelectValue placeholder={placeholder} />
          )}
        </SelectTrigger>

        <SelectContent>
          {/* Option "Tous les canaux" */}
          {showAllOption && (
            <SelectItem value="all">
              <span className="font-medium">Tous les canaux</span>
            </SelectItem>
          )}

          {/* Options canaux */}
          {error ? (
            <div className="px-3 py-2 text-sm text-red-600">
              Erreur de chargement
            </div>
          ) : channels.length === 0 && !isLoading ? (
            <div className="px-3 py-2 text-sm text-gray-500">
              Aucun canal actif
            </div>
          ) : (
            channels.map(channel => (
              <SelectItem key={channel.id} value={channel.id}>
                <div className="flex items-center gap-2">
                  <ChannelBadge
                    channelCode={normalizeChannelCode(channel.code)}
                    size="sm"
                    showIcon={false}
                  />
                  <span className="text-sm">{channel.name}</span>
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * Type export pour usage externe
 */
ChannelFilter.displayName = 'ChannelFilter';
