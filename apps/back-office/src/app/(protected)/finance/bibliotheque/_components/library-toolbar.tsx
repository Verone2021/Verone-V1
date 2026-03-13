'use client';

import { useEffect, useRef, useState } from 'react';

import { Button } from '@verone/ui';
import { Download, Loader2, RefreshCw, Search } from 'lucide-react';
import { toast } from 'sonner';

interface LibraryToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
}

export function LibraryToolbar({
  search,
  onSearchChange,
  onRefresh,
}: LibraryToolbarProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [localSearch, setLocalSearch] = useState(search);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search — wait 300ms after last keystroke
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      onSearchChange(localSearch);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [localSearch, onSearchChange]);

  // Sync external changes (e.g. reset)
  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  const handleSync = () => {
    setIsSyncing(true);
    void fetch('/api/qonto/attachments/backfill-pdfs', { method: 'POST' })
      .then(async res => {
        if (!res.ok) {
          throw new Error(`Erreur serveur: ${res.status}`);
        }
        const data: unknown = await res.json();
        if (
          data &&
          typeof data === 'object' &&
          'success' in data &&
          data.success &&
          'results' in data &&
          data.results &&
          typeof data.results === 'object' &&
          'success' in data.results &&
          'failed' in data.results &&
          'skipped' in data.results
        ) {
          const r = data.results as {
            success: number;
            failed: number;
            skipped: number;
          };
          toast.success(
            `Synchronisation terminee : ${r.success} stockes, ${r.failed} erreurs, ${r.skipped} ignores`
          );
          onRefresh();
        } else {
          const errorMsg =
            data &&
            typeof data === 'object' &&
            'error' in data &&
            typeof data.error === 'string'
              ? data.error
              : 'Erreur lors de la synchronisation';
          toast.error(errorMsg);
        }
      })
      .catch((error: unknown) => {
        console.error('[LibraryToolbar] Sync error:', error);
        toast.error('Erreur de connexion');
      })
      .finally(() => {
        setIsSyncing(false);
      });
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Rechercher un partenaire..."
          value={localSearch}
          onChange={e => setLocalSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm bg-background"
          aria-label="Rechercher un partenaire"
        />
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleSync}
        disabled={isSyncing}
        className="gap-2"
        aria-label="Synchroniser les PDFs depuis Qonto"
      >
        {isSyncing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        Synchroniser
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onRefresh}
        className="gap-2"
        aria-label="Actualiser la liste des documents"
      >
        <RefreshCw className="h-4 w-4" />
        Actualiser
      </Button>
    </div>
  );
}
