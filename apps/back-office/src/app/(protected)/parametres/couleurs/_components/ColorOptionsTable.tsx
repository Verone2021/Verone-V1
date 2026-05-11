'use client';

import { useState } from 'react';

import {
  Button,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import { Pencil, Plus } from 'lucide-react';

import type { ColorOption } from '@/hooks/use-color-options';
import { useColorOptions } from '@/hooks/use-color-options';

import { ColorOptionEditModal } from './ColorOptionEditModal';

export function ColorOptionsTable() {
  const {
    colorOptions,
    isLoading,
    createColorOption,
    updateColorOption,
    isUpdating,
  } = useColorOptions();

  const [editing, setEditing] = useState<ColorOption | null | undefined>(
    undefined
  );

  const handleToggleActive = (item: ColorOption) => {
    void updateColorOption(item.id, { is_active: !item.is_active }).catch(err =>
      console.error('[ColorOptionsTable] toggle failed:', err)
    );
  };

  const handleSaved = () => {
    setEditing(undefined);
  };

  if (isLoading) {
    return <p className="text-sm text-gray-500">Chargement…</p>;
  }

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={() => setEditing(null)} className="h-11 md:h-9 gap-1">
          <Plus className="h-4 w-4" />
          Ajouter une couleur
        </Button>
      </div>

      {/* Mobile : cartes */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {colorOptions.map(item => (
          <ColorCard
            key={item.id}
            item={item}
            onEdit={() => setEditing(item)}
            onToggle={() => handleToggleActive(item)}
            isUpdating={isUpdating}
          />
        ))}
        {colorOptions.length === 0 && (
          <p className="text-sm text-gray-400 italic text-center py-6">
            Aucune couleur configurée
          </p>
        )}
      </div>

      {/* Desktop : tableau */}
      <div className="hidden md:block w-full overflow-x-auto rounded border border-gray-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[56px]">Aperçu</TableHead>
              <TableHead className="min-w-[160px]">Nom</TableHead>
              <TableHead className="hidden lg:table-cell w-[120px]">
                Hex
              </TableHead>
              <TableHead className="hidden xl:table-cell w-[80px] text-center">
                Ordre
              </TableHead>
              <TableHead className="w-[80px] text-center">Actif</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {colorOptions.map(item => (
              <TableRow key={item.id}>
                <TableCell>
                  <ColorSwatch hex={item.hex_code} name={item.name} />
                </TableCell>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell className="hidden lg:table-cell">
                  <code className="text-xs text-gray-600 font-mono">
                    {item.hex_code}
                  </code>
                </TableCell>
                <TableCell className="hidden xl:table-cell text-center text-sm text-gray-600">
                  {item.sort_order}
                </TableCell>
                <TableCell className="text-center">
                  <Switch
                    checked={item.is_active}
                    onCheckedChange={() => handleToggleActive(item)}
                    disabled={isUpdating}
                    aria-label={`Activer/désactiver ${item.name}`}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditing(item)}
                    className="h-9 gap-1"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    <span>Éditer</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {colorOptions.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-sm text-gray-400 italic py-8"
                >
                  Aucune couleur configurée
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {editing !== undefined && (
        <ColorOptionEditModal
          item={editing}
          open={editing !== undefined}
          onClose={() => setEditing(undefined)}
          onSaved={handleSaved}
          onCreate={createColorOption}
          onUpdate={updateColorOption}
        />
      )}
    </>
  );
}

function ColorSwatch({ hex, name }: { hex: string; name: string }) {
  return (
    <span
      className="inline-block h-8 w-8 rounded-full border border-gray-300"
      style={{ backgroundColor: hex }}
      title={`${name} — ${hex}`}
      aria-label={name}
    />
  );
}

interface ColorCardProps {
  item: ColorOption;
  onEdit: () => void;
  onToggle: () => void;
  isUpdating: boolean;
}

function ColorCard({ item, onEdit, onToggle, isUpdating }: ColorCardProps) {
  return (
    <div className="rounded border border-gray-200 bg-white p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ColorSwatch hex={item.hex_code} name={item.name} />
          <div>
            <p className="font-medium text-sm">{item.name}</p>
            <code className="text-xs text-gray-500 font-mono">
              {item.hex_code}
            </code>
          </div>
        </div>
        <Switch
          checked={item.is_active}
          onCheckedChange={onToggle}
          disabled={isUpdating}
          aria-label={`Activer/désactiver ${item.name}`}
        />
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onEdit}
        className="h-11 w-full gap-1"
      >
        <Pencil className="h-4 w-4" />
        <span>Éditer</span>
      </Button>
    </div>
  );
}
