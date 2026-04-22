'use client';

import { useState, useCallback, useRef } from 'react';

import { cn } from '@verone/utils';
import { Lock, Pencil, Check, X } from 'lucide-react';

import type { Database } from '@verone/types';

type RoomType = Database['public']['Enums']['room_type'];

const ROOM_LABELS: Record<RoomType, string> = {
  salon: 'Salon',
  salle_a_manger: 'Salle à manger',
  chambre: 'Chambre',
  bureau: 'Bureau',
  bibliotheque: 'Bibliothèque',
  salon_sejour: 'Salon/Séjour',
  cuisine: 'Cuisine',
  salle_de_bain: 'Salle de bain',
  wc: 'WC',
  toilettes: 'Toilettes',
  hall_entree: "Hall d'entrée",
  couloir: 'Couloir',
  cellier: 'Cellier',
  buanderie: 'Buanderie',
  dressing: 'Dressing',
  cave: 'Cave',
  grenier: 'Grenier',
  garage: 'Garage',
  terrasse: 'Terrasse',
  balcon: 'Balcon',
  jardin: 'Jardin',
  veranda: 'Véranda',
  loggia: 'Loggia',
  cour: 'Cour',
  patio: 'Patio',
  salle_de_jeux: 'Salle de jeux',
  salle_de_sport: 'Salle de sport',
  atelier: 'Atelier',
  mezzanine: 'Mezzanine',
  sous_sol: 'Sous-sol',
};

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
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState<RoomType[]>([]);
  const draftRef = useRef<RoomType[]>([]);

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
                {ROOM_LABELS[room]}
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
            {Object.entries(ROOM_LABELS).map(([key, label]) => {
              const room = key as RoomType;
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
                  {label}
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
