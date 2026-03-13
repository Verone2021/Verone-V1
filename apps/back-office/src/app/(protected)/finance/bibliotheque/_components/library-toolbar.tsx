'use client';

import { Button } from '@verone/ui';
import { RefreshCw, Search } from 'lucide-react';

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
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Rechercher un partenaire..."
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm bg-background"
        />
      </div>
      <Button variant="outline" size="sm" onClick={onRefresh} className="gap-2">
        <RefreshCw className="h-4 w-4" />
        Actualiser
      </Button>
    </div>
  );
}
