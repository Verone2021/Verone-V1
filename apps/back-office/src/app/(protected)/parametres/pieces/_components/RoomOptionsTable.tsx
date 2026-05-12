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

import type { RoomOption } from '@/hooks/use-room-options';
import { useRoomOptions } from '@/hooks/use-room-options';

import { RoomOptionEditModal } from './RoomOptionEditModal';

export function RoomOptionsTable() {
  const {
    roomOptions,
    isLoading,
    createRoomOption,
    updateRoomOption,
    isUpdating,
  } = useRoomOptions();

  const [editing, setEditing] = useState<RoomOption | null | undefined>(
    undefined
  );

  const handleToggleActive = (item: RoomOption) => {
    void updateRoomOption(item.id, { is_active: !item.is_active }).catch(err =>
      console.error('[RoomOptionsTable] toggle failed:', err)
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
          Ajouter une pièce
        </Button>
      </div>

      {/* Mobile : cartes */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {roomOptions.map(item => (
          <RoomCard
            key={item.id}
            item={item}
            onEdit={() => setEditing(item)}
            onToggle={() => handleToggleActive(item)}
            isUpdating={isUpdating}
          />
        ))}
        {roomOptions.length === 0 && (
          <p className="text-sm text-gray-400 italic text-center py-6">
            Aucune pièce configurée
          </p>
        )}
      </div>

      {/* Desktop : tableau */}
      <div className="hidden md:block w-full overflow-x-auto rounded border border-gray-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[160px]">Nom</TableHead>
              <TableHead className="hidden lg:table-cell w-[180px]">
                Identifiant
              </TableHead>
              <TableHead className="hidden xl:table-cell w-[80px] text-center">
                Ordre
              </TableHead>
              <TableHead className="w-[80px] text-center">Actif</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roomOptions.map(item => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.label}</TableCell>
                <TableCell className="hidden lg:table-cell">
                  <code className="text-xs text-gray-600 font-mono">
                    {item.value}
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
                    aria-label={`Activer/désactiver ${item.label}`}
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
            {roomOptions.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-sm text-gray-400 italic py-8"
                >
                  Aucune pièce configurée
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {editing !== undefined && (
        <RoomOptionEditModal
          item={editing}
          open={editing !== undefined}
          onClose={() => setEditing(undefined)}
          onSaved={handleSaved}
          onCreate={createRoomOption}
          onUpdate={updateRoomOption}
        />
      )}
    </>
  );
}

interface RoomCardProps {
  item: RoomOption;
  onEdit: () => void;
  onToggle: () => void;
  isUpdating: boolean;
}

function RoomCard({ item, onEdit, onToggle, isUpdating }: RoomCardProps) {
  return (
    <div className="rounded border border-gray-200 bg-white p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-sm">{item.label}</p>
          <code className="text-xs text-gray-500 font-mono">{item.value}</code>
        </div>
        <Switch
          checked={item.is_active}
          onCheckedChange={onToggle}
          disabled={isUpdating}
          aria-label={`Activer/désactiver ${item.label}`}
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
