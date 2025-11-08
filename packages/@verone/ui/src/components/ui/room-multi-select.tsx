/**
 * Room Multi-Select Component
 *
 * DISABLED: Dépend de ../../types/room-types non disponible dans package @verone/ui
 * TODO: Déplacer vers app principale ou créer @verone/types avec room-types
 */

// @ts-nocheck - DISABLED COMPONENT
'use client';

import { useState, useRef, useEffect } from 'react';

import { cn } from '@verone/utils';
import { Check, ChevronDown, X } from 'lucide-react';

import { Badge } from './badge';
import { Button } from './button';
import type { RoomType } from '../../types/room-types';
import {
  ROOM_CONFIGS,
  ROOM_CATEGORIES,
  getRoomLabel,
  getRoomsByCategory,
} from '../../types/room-types';

interface RoomMultiSelectProps {
  value: RoomType[];
  onChange: (value: RoomType[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  error?: string;
}

export function RoomMultiSelect({
  value = [],
  onChange,
  placeholder = 'Sélectionner les pièces...',
  className,
  disabled = false,
  error,
}: RoomMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fermer le dropdown en cliquant à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtrer les pièces selon le terme de recherche
  const filteredRooms = ROOM_CONFIGS.filter(
    room =>
      room.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Grouper les pièces filtrées par catégorie
  const groupedRooms = Object.entries(ROOM_CATEGORIES).reduce(
    (acc, [categoryKey, categoryLabel]) => {
      const categoryRooms = filteredRooms.filter(
        room => room.category === categoryKey
      );
      if (categoryRooms.length > 0) {
        acc[categoryKey as keyof typeof ROOM_CATEGORIES] = categoryRooms;
      }
      return acc;
    },
    {} as Record<keyof typeof ROOM_CATEGORIES, typeof filteredRooms>
  );

  const handleSelect = (roomType: RoomType) => {
    if (disabled) return;

    const newValue = value.includes(roomType)
      ? value.filter(r => r !== roomType)
      : [...value, roomType];

    onChange(newValue);
  };

  const handleRemove = (roomType: RoomType) => {
    if (disabled) return;
    onChange(value.filter(r => r !== roomType));
  };

  const handleClearAll = () => {
    if (disabled) return;
    onChange([]);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      }
    } else if (event.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      {/* Trigger Button */}
      <Button
        type="button"
        variant="outline"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'w-full justify-between text-left font-normal min-h-10',
          !value.length && 'text-muted-foreground',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onKeyDown={handleKeyDown}
      >
        <div className="flex flex-1 flex-wrap items-center gap-1">
          {value.length === 0 ? (
            <span>{placeholder}</span>
          ) : (
            <>
              {value.slice(0, 2).map(roomType => (
                <Badge
                  key={roomType}
                  variant="secondary"
                  className="bg-black text-white hover:bg-gray-800"
                >
                  {getRoomLabel(roomType)}
                  {!disabled && (
                    <span
                      onClick={e => {
                        e.stopPropagation();
                        handleRemove(roomType);
                      }}
                      className="ml-1 hover:text-red-300 cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </span>
                  )}
                </Badge>
              ))}
              {value.length > 2 && (
                <Badge variant="outline" className="border-gray-300">
                  +{value.length - 2} autre{value.length - 2 > 1 ? 's' : ''}
                </Badge>
              )}
            </>
          )}
        </div>
        <ChevronDown
          className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')}
        />
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-80 overflow-hidden">
          {/* Header avec recherche et actions */}
          <div className="p-3 border-b border-gray-200">
            <input
              ref={inputRef}
              type="text"
              placeholder="Rechercher une pièce..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
              autoFocus
            />
            {value.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="mt-2 text-xs text-red-600 hover:text-red-800"
              >
                Effacer toutes les sélections
              </button>
            )}
          </div>

          {/* Liste des pièces par catégorie */}
          <div className="max-h-60 overflow-y-auto">
            {Object.keys(groupedRooms).length === 0 ? (
              <div className="p-3 text-sm text-gray-500 text-center">
                Aucune pièce trouvée
              </div>
            ) : (
              Object.entries(groupedRooms).map(([categoryKey, rooms]) => (
                <div key={categoryKey}>
                  <div className="px-3 py-2 text-xs font-semibold text-gray-600 bg-gray-50 border-b border-gray-100">
                    {
                      ROOM_CATEGORIES[
                        categoryKey as keyof typeof ROOM_CATEGORIES
                      ]
                    }
                  </div>
                  {rooms.map(room => {
                    const isSelected = value.includes(room.value);
                    return (
                      <button
                        key={room.value}
                        type="button"
                        onClick={() => handleSelect(room.value)}
                        className={cn(
                          'w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between group',
                          isSelected && 'bg-black text-white hover:bg-gray-800'
                        )}
                      >
                        <div className="flex-1">
                          <div className="font-medium">{room.label}</div>
                          {room.description && (
                            <div
                              className={cn(
                                'text-xs mt-1',
                                isSelected ? 'text-gray-300' : 'text-gray-500'
                              )}
                            >
                              {room.description}
                            </div>
                          )}
                        </div>
                        {isSelected && <Check className="h-4 w-4 ml-2" />}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer avec compteur */}
          {value.length > 0 && (
            <div className="p-2 border-t border-gray-200 bg-gray-50">
              <div className="text-xs text-gray-600 text-center">
                {value.length} pièce{value.length > 1 ? 's' : ''} sélectionnée
                {value.length > 1 ? 's' : ''}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Message d'erreur */}
      {error && <div className="mt-1 text-sm text-red-600">{error}</div>}
    </div>
  );
}
