'use client';

import * as React from 'react';

import type { ButtonProps } from '@verone/ui';
import { Button } from '@verone/ui';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@verone/ui';
import { cn } from '@verone/utils';
import { RefreshCw, Check, AlertCircle } from 'lucide-react';

/**
 * État de synchronisation
 */
export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

/**
 * Props pour le composant SyncButton
 */
export interface SyncButtonProps extends Omit<ButtonProps, 'onClick'> {
  /** Callback appelé lors du clic */
  onSync: () => void | Promise<void>;
  /** Statut actuel de la sync */
  status?: SyncStatus;
  /** Date de dernière sync */
  lastSyncAt?: Date | string | null;
  /** Texte du bouton */
  label?: string;
  /** Afficher la date de dernière sync */
  showLastSync?: boolean;
  /** Message d'erreur */
  errorMessage?: string;
}

/**
 * Formate une date relative (il y a X minutes/heures/jours)
 */
function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;

  return then.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });
}

/**
 * Composant SyncButton - Bouton de synchronisation avec état et dernière sync
 *
 * @example
 * <SyncButton
 *   onSync={handleSync}
 *   status={syncStatus}
 *   lastSyncAt={lastSync}
 *   showLastSync
 * />
 */
export function SyncButton({
  onSync,
  status = 'idle',
  lastSyncAt,
  label = 'Synchroniser',
  showLastSync = true,
  errorMessage,
  className,
  disabled,
  ...props
}: SyncButtonProps) {
  const [internalStatus, setInternalStatus] =
    React.useState<SyncStatus>(status);

  // Synchroniser le status externe avec l'interne
  React.useEffect(() => {
    setInternalStatus(status);
  }, [status]);

  const handleClick = async () => {
    if (internalStatus === 'syncing') return;

    setInternalStatus('syncing');
    try {
      await onSync();
      setInternalStatus('success');
      // Revenir à idle après 2s
      setTimeout(() => setInternalStatus('idle'), 2000);
    } catch (error) {
      setInternalStatus('error');
      // Revenir à idle après 3s
      setTimeout(() => setInternalStatus('idle'), 3000);
    }
  };

  const isSyncing = internalStatus === 'syncing';
  const isSuccess = internalStatus === 'success';
  const isError = internalStatus === 'error';

  // Icône selon l'état
  const Icon = isSuccess ? Check : isError ? AlertCircle : RefreshCw;

  // Texte du bouton
  const buttonText = isSyncing
    ? 'Synchronisation...'
    : isSuccess
      ? 'Synchronisé'
      : isError
        ? 'Erreur'
        : label;

  const button = (
    <Button
      variant={isError ? 'destructive' : isSuccess ? 'outline' : 'secondary'}
      size="sm"
      onClick={handleClick}
      disabled={disabled || isSyncing}
      className={cn(
        'min-w-[140px]',
        isSuccess && 'border-green-500 text-green-600',
        className
      )}
      {...props}
    >
      <Icon
        className={cn(
          'mr-2 h-4 w-4',
          isSyncing && 'animate-spin',
          isSuccess && 'text-green-500'
        )}
      />
      {buttonText}
    </Button>
  );

  // Si on a une date de dernière sync ou une erreur, afficher dans un tooltip
  if ((showLastSync && lastSyncAt) || errorMessage) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent>
            {errorMessage ? (
              <p className="text-red-500">{errorMessage}</p>
            ) : lastSyncAt ? (
              <p>Dernière sync: {formatRelativeTime(lastSyncAt)}</p>
            ) : null}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
}
