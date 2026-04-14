'use client';

import { useState, useCallback, useRef } from 'react';
import { createClient } from '@verone/utils';

interface SupplierResult {
  id: string;
  trade_name: string | null;
  legal_name: string | null;
}

export function useSupplierSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SupplierResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const search = useCallback((q: string) => {
    setQuery(q);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (q.length < 2) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const supabase = createClient();
      const { data } = await supabase
        .from('organisations')
        .select('id, trade_name, legal_name')
        .or(`trade_name.ilike.%${q}%,legal_name.ilike.%${q}%`)
        .eq('is_supplier', true)
        .limit(10);

      setResults((data as SupplierResult[]) ?? []);
      setLoading(false);
    }, 300);
  }, []);

  return {
    query,
    results,
    setQuery: search,
    loading,
  };
}
