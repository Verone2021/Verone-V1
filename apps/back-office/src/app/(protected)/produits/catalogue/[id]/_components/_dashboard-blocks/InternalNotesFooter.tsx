'use client';

/**
 * InternalNotesFooter — textarea inline-edit pour `products.internal_notes`.
 * Footer pleine largeur du dashboard Général.
 */

import { useState, useEffect } from 'react';

import { ButtonUnified, Textarea } from '@verone/ui';

interface InternalNotesFooterProps {
  initialValue: string | null;
  onSave: (value: string | null) => Promise<void> | void;
}

export function InternalNotesFooter({
  initialValue,
  onSave,
}: InternalNotesFooterProps) {
  const [value, setValue] = useState(initialValue ?? '');
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setValue(initialValue ?? '');
    setDirty(false);
  }, [initialValue]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(value.trim() === '' ? null : value);
      setDirty(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="bg-white rounded-lg border border-neutral-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-neutral-900">
          Notes internes
        </h3>
        {dirty && (
          <span className="text-[10px] text-orange-600 italic">
            Modifications non enregistrées
          </span>
        )}
      </div>
      <Textarea
        value={value}
        onChange={e => {
          setValue(e.target.value);
          setDirty(true);
        }}
        rows={3}
        placeholder="Ajoutez une note technique pour l'équipe logistique ou pricing…"
        className="text-sm"
      />
      {dirty && (
        <div className="flex justify-end gap-2 mt-2">
          <ButtonUnified
            variant="outline"
            size="sm"
            onClick={() => {
              setValue(initialValue ?? '');
              setDirty(false);
            }}
            disabled={saving}
          >
            Annuler
          </ButtonUnified>
          <ButtonUnified
            variant="default"
            size="sm"
            onClick={() => {
              void handleSave();
            }}
            disabled={saving}
          >
            {saving ? 'Enregistrement…' : 'Enregistrer la note'}
          </ButtonUnified>
        </div>
      )}
    </section>
  );
}
