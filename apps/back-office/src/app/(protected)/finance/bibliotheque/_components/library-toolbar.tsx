'use client';

import { useState } from 'react';

import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { Download, RefreshCw, Search, Cloud } from 'lucide-react';
import { toast } from 'sonner';

import type { LibraryCategory } from '@verone/finance/hooks';

// =====================================================================
// TYPES
// =====================================================================

interface LibraryToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  category: LibraryCategory | 'all';
  onCategoryChange: (value: LibraryCategory | 'all') => void;
  selectedCount: number;
  onRefresh: () => void;
  onExportZip: () => void;
  loading?: boolean;
}

// =====================================================================
// COMPONENT
// =====================================================================

export function LibraryToolbar({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  selectedCount,
  onRefresh,
  onExportZip,
  loading,
}: LibraryToolbarProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    onRefresh();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/qonto/supplier-invoices/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syncScope: 'incremental' }),
      });

      const result = (await response.json()) as {
        success?: boolean;
        itemsFetched?: number;
        itemsCreated?: number;
        itemsUpdated?: number;
        error?: string;
      };

      if (result.success) {
        toast.success(
          `Sync terminée : ${result.itemsFetched ?? 0} récupérées, ${result.itemsCreated ?? 0} créées, ${result.itemsUpdated ?? 0} mises à jour`
        );
        onRefresh();
      } else {
        toast.error(result.error ?? 'Erreur lors de la synchronisation');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur réseau';
      toast.error(`Sync échouée : ${msg}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b flex-shrink-0">
      {/* Search */}
      <div className="relative flex-1 max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Rechercher un document..."
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm bg-background"
        />
      </div>

      {/* Category filter */}
      <Select
        value={category}
        onValueChange={v => onCategoryChange(v as LibraryCategory | 'all')}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les types</SelectItem>
          <SelectItem value="ventes">Ventes</SelectItem>
          <SelectItem value="achats">Achats</SelectItem>
          <SelectItem value="avoirs">Avoirs</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex-1" />

      {/* Sync Qonto */}
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => {
          void handleSync();
        }}
        disabled={syncing || loading}
      >
        <Cloud className={`h-4 w-4 ${syncing ? 'animate-pulse' : ''}`} />
        {syncing ? 'Sync...' : 'Sync Qonto'}
      </Button>

      {/* Export ZIP */}
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => {
          if (selectedCount === 0) {
            toast.info('Sélectionnez des documents à exporter');
            return;
          }
          onExportZip();
        }}
        disabled={loading}
      >
        <Download className="h-4 w-4" />
        Export ZIP
        {selectedCount > 0 && (
          <span className="ml-1 text-xs bg-primary text-primary-foreground rounded-full px-1.5">
            {selectedCount}
          </span>
        )}
      </Button>

      {/* Refresh */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleRefresh}
        disabled={refreshing || loading}
      >
        <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
      </Button>
    </div>
  );
}
