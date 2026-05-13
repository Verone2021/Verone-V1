'use client';

import { useState, useCallback, useRef } from 'react';

import { cn } from '@verone/utils';
import { Lock, Pencil, Check, X } from 'lucide-react';

import type { Database } from '@verone/types';

import { useActiveRoomOptions } from '@/hooks/use-room-options';

type RoomType = Database['public']['Enums']['room_type'];

export interface CompatibleRoomsEditorProps {
  rooms: RoomType[];
  isInherited: boolean;
  initialRooms: RoomType[];
  onSave: (rooms: RoomType[]) => void;
}

export function CompatibleRoomsEditor({
  rooms,
  isInherited,
  initialRooms,
  onSave,
}: CompatibleRoomsEditorProps) {
  const { roomOptions } = useActiveRoomOptions();

  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState<RoomType[]>([]);
  const draftRef = useRef<RoomType[]>([]);

  // Build lookup map from DB options (value → label)
  const roomLabelMap = useCallback(
    (roomValue: RoomType): string => {
      const found = roomOptions.find(opt => opt.value === roomValue);
      // Fallback to the raw value formatted (replace underscores, capitalize)
      return (
        found?.label ??
        roomValue.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())
      );
    },
    [roomOptions]
  );

  const handleEditStart = useCallback(() => {
    setDraft(initialRooms);
    draftRef.current = initialRooms;
    setEditMode(true);
  }, [initialRooms]);

  const handleToggle = useCallback((room: RoomType) => {
    setDraft(prev => {
      const next = prev.includes(room)
        ? prev.filter(r => r !== room)
        : [...prev, room];
      draftRef.current = next;
      return next;
    });
  }, []);

  const handleSave = useCallback(() => {
    onSave(draftRef.current);
    setEditMode(false);
  }, [onSave]);

  const handleCancel = useCallback(() => {
    setEditMode(false);
    setDraft([]);
    draftRef.current = [];
  }, []);

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] uppercase tracking-wide text-neutral-500 font-medium">
          Pièces compatibles
        </span>
        {isInherited && (
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-blue-200 bg-blue-50 text-[10px] text-blue-700">
            <Lock className="h-2.5 w-2.5" />
            Hérité du groupe
          </span>
        )}
        {!isInherited && !editMode && (
          <button
            onClick={handleEditStart}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-neutral-200 bg-white text-[10px] text-neutral-600 hover:border-neutral-400 hover:text-neutral-800 transition-colors"
          >
            <Pencil className="h-2.5 w-2.5" />
            Modifier
          </button>
        )}
      </div>

      {/* Mode VIEW */}
      {!editMode && (
        <div className="flex flex-wrap gap-1.5">
          {rooms.length > 0 ? (
            rooms.map(room => (
              <span
                key={room}
                className={cn(
                  'px-1.5 py-0.5 text-[10px] rounded border',
                  isInherited
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-indigo-50 border-indigo-200 text-indigo-700'
                )}
              >
                {roomLabelMap(room)}
              </span>
            ))
          ) : (
            <span className="text-[10px] text-neutral-400 italic">
              Aucune pièce sélectionnée
            </span>
          )}
        </div>
      )}

      {/* Mode EDIT */}
      {editMode && (
        <div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {roomOptions.map(opt => {
              const room = opt.value as RoomType;
              const isActive = draft.includes(room);
              return (
                <button
                  key={room}
                  onClick={() => handleToggle(room)}
                  className={cn(
                    'px-1.5 py-0.5 text-[10px] rounded border transition-colors',
                    isActive
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'border-neutral-200 text-neutral-500 hover:border-neutral-400 hover:text-neutral-700'
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="flex items-center gap-1 px-2 py-1 rounded bg-indigo-600 text-white text-[10px] font-medium hover:bg-indigo-700 transition-colors"
            >
              <Check className="h-2.5 w-2.5" />
              Enregistrer
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center gap-1 px-2 py-1 rounded border border-neutral-200 text-neutral-600 text-[10px] hover:bg-neutral-50 transition-colors"
            >
              <X className="h-2.5 w-2.5" />
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
