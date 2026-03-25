'use client';

import { useState, useEffect } from 'react';

import type { ProductFormData } from './selection-types';

type SelectionData = {
  name?: string | null;
  description?: string | null;
  archived_at?: string | null;
  price_display_mode?: 'HT' | 'TTC' | null;
};

export function useSelectionForm(selection: SelectionData | null | undefined) {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    archived_at: null,
    price_display_mode: 'TTC',
  });
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (selection) {
      setFormData({
        name: selection.name ?? '',
        description: selection.description ?? '',
        archived_at: selection.archived_at ?? null,
        price_display_mode: selection.price_display_mode ?? 'TTC',
      });
    }
  }, [selection]);

  return { formData, setFormData, isDirty, setIsDirty };
}
