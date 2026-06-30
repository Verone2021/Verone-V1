'use client';

import { useEffect, useRef, useState } from 'react';

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
