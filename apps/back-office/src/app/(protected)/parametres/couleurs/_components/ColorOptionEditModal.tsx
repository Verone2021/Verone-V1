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

import type { ColorOption } from '@/hooks/use-color-options';

const HEX_REGEX = /^#[0-9A-Fa-f]{6}$/;

interface ColorOptionEditModalProps {
  item: ColorOption | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  onCreate: (input: {
    name: string;
    hex_code: string;
    sort_order: number;
    is_active: boolean;
  }) => Promise<ColorOption>;
  onUpdate: (
    id: string,
    updates: {
      name?: string;
      hex_code?: string;
      sort_order?: number;
      is_active?: boolean;
    }
  ) => Promise<ColorOption>;
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

export function ColorOptionEditModal({
  item,
  open,
  onClose,
  onSaved,
  onCreate,
  onUpdate,
}: ColorOptionEditModalProps) {
  const isNew = item === null;

  const [name, setName] = useState('');
  const [hexCode, setHexCode] = useState('#000000');
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setName(item.name);
      setHexCode(item.hex_code);
      setIsActive(item.is_active);
      setSortOrder(item.sort_order);
    } else {
      setName('');
      setHexCode('#000000');
      setIsActive(true);
      setSortOrder(0);
    }
    setError(null);
  }, [item, open]);

  const isHexValid = HEX_REGEX.test(hexCode);
  const isFormValid = name.trim().length > 0 && isHexValid;

  const handleColorPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHexCode(e.target.value);
  };

  const handleHexTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setHexCode(val);
  };

  const save = async () => {
    if (!isFormValid) return;
    setSaving(true);
    setError(null);

    try {
      if (isNew) {
        await onCreate({
          name: name.trim(),
          hex_code: hexCode,
          is_active: isActive,
          sort_order: sortOrder,
        });
      } else {
        await onUpdate(item.id, {
          name: name.trim(),
          hex_code: hexCode,
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
            {isNew ? 'Créer une couleur' : `Éditer · ${item?.name}`}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto md:max-h-[70vh] space-y-4 px-1">
          <Field label="Nom de la couleur *">
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="ex: Bleu nuit"
              className="w-full"
              autoFocus
            />
          </Field>

          <Field label="Couleur *">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={isHexValid ? hexCode : '#000000'}
                onChange={handleColorPickerChange}
                className="h-11 md:h-9 w-14 rounded border border-gray-300 cursor-pointer"
                aria-label="Sélecteur de couleur visuel"
              />
              <Input
                value={hexCode}
                onChange={handleHexTextChange}
                placeholder="#000000"
                className={`w-full font-mono text-sm ${!isHexValid && hexCode !== '#000000' ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
                aria-label="Code hexadécimal de la couleur"
              />
            </div>
            {!isHexValid && hexCode.length > 1 && (
              <p className="text-xs text-red-600 mt-1">
                Format attendu : #RRGGBB (ex: #1A2B3C)
              </p>
            )}
            {isHexValid && (
              <div
                className="mt-2 h-8 w-full rounded border border-gray-200"
                style={{ backgroundColor: hexCode }}
                aria-hidden
              />
            )}
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
              <Label className="text-sm">Couleur active</Label>
              <p className="text-xs text-gray-500 mt-0.5">
                Une couleur inactive n'apparaît plus dans les formulaires ni
                dans les filtres catalogue.
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
                console.error('[ColorOptionEditModal] save failed:', err);
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
