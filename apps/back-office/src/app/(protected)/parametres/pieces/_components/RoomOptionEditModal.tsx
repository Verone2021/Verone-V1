'use client';

import { useEffect, useState } from 'react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Switch,
} from '@verone/ui';

import type { RoomOption } from '@/hooks/use-room-options';

/** Converts a French label into a snake_case value slug. */
function slugify(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

const VALUE_REGEX = /^[a-z][a-z0-9_]*$/;

interface RoomOptionEditModalProps {
  item: RoomOption | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  onCreate: (input: {
    value: string;
    label: string;
    sort_order: number;
    is_active: boolean;
  }) => Promise<RoomOption>;
  onUpdate: (
    id: string,
    updates: {
      value?: string;
      label?: string;
      sort_order?: number;
      is_active?: boolean;
    }
  ) => Promise<RoomOption>;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-medium text-gray-700">{label}</Label>
      {children}
    </div>
  );
}

export function RoomOptionEditModal({
  item,
  open,
  onClose,
  onSaved,
  onCreate,
  onUpdate,
}: RoomOptionEditModalProps) {
  const isNew = item === null;

  const [label, setLabel] = useState('');
  const [value, setValue] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [valueManuallyEdited, setValueManuallyEdited] = useState(false);

  useEffect(() => {
    if (item) {
      setLabel(item.label);
      setValue(item.value);
      setIsActive(item.is_active);
      setSortOrder(item.sort_order);
      setValueManuallyEdited(false);
    } else {
      setLabel('');
      setValue('');
      setIsActive(true);
      setSortOrder(0);
      setValueManuallyEdited(false);
    }
    setError(null);
  }, [item, open]);

  // Auto-generate value from label unless manually edited
  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLabel = e.target.value;
    setLabel(newLabel);
    if (!valueManuallyEdited) {
      setValue(slugify(newLabel));
    }
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    setValueManuallyEdited(true);
  };

  const isValueValid = VALUE_REGEX.test(value);
  const isFormValid = label.trim().length > 0 && isValueValid;

  const save = async () => {
    if (!isFormValid) return;
    setSaving(true);
    setError(null);

    try {
      if (isNew) {
        await onCreate({
          label: label.trim(),
          value,
          is_active: isActive,
          sort_order: sortOrder,
        });
      } else {
        await onUpdate(item.id, {
          label: label.trim(),
          value,
          is_active: isActive,
          sort_order: sortOrder,
        });
      }
      onSaved();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={next => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="h-screen md:h-auto md:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isNew ? 'Créer une pièce' : `Éditer · ${item?.label}`}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto md:max-h-[70vh] space-y-4 px-1">
          <Field label="Nom affiché (label) *">
            <Input
              value={label}
              onChange={handleLabelChange}
              placeholder="ex: Salle à manger"
              className="w-full"
              autoFocus
            />
          </Field>

          <Field label="Identifiant technique (value)">
            <Input
              value={value}
              onChange={handleValueChange}
              placeholder="ex: salle_a_manger"
              className="w-full font-mono text-sm"
            />
            {!isValueValid && value.length > 0 && (
              <p className="text-xs text-red-600 mt-1">
                Lettres minuscules, chiffres et _ uniquement, doit commencer par
                une lettre.
              </p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              Généré automatiquement depuis le nom. Modifiable manuellement.
            </p>
          </Field>

          <Field label="Ordre d'affichage">
            <Input
              type="number"
              value={sortOrder}
              onChange={e => setSortOrder(Number(e.target.value))}
              min={0}
              className="w-full"
            />
          </Field>

          <div className="flex items-center justify-between rounded border border-gray-200 p-3">
            <div>
              <Label className="text-sm">Pièce active</Label>
              <p className="text-xs text-gray-500 mt-0.5">
                Une pièce inactive n'apparaît plus dans les formulaires ni dans
                les filtres catalogue.
              </p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>

          {error && (
            <p className="text-sm text-red-600 rounded border border-red-200 bg-red-50 p-2">
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 md:flex-row">
          <Button
            variant="outline"
            className="w-full md:w-auto h-11 md:h-9"
            onClick={onClose}
            disabled={saving}
          >
            Annuler
          </Button>
          <Button
            className="w-full md:w-auto h-11 md:h-9"
            disabled={saving || !isFormValid}
            onClick={() => {
              void save().catch(err => {
                console.error('[RoomOptionEditModal] save failed:', err);
              });
            }}
          >
            {saving ? 'Enregistrement…' : isNew ? 'Créer' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
