'use client';

import {
  Badge,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { cn } from '@verone/utils';
import { ROOM_TYPES, DECORATIVE_STYLES } from '@verone/types';

interface WizardStep2StyleProps {
  style: string;
  suitableRooms: string[];
  dimensionsLength: number | '';
  dimensionsWidth: number | '';
  dimensionsHeight: number | '';
  dimensionsUnit: string;
  onUpdate: (updates: Record<string, unknown>) => void;
  onToggleRoom: (room: string) => void;
}

export function WizardStep2Style({
  style,
  suitableRooms,
  dimensionsLength,
  dimensionsWidth,
  dimensionsHeight,
  dimensionsUnit,
  onUpdate,
  onToggleRoom,
}: WizardStep2StyleProps) {
  return (
    <div className="space-y-6">
      {/* Style decoratif */}
      <div>
        <Label>Style decoratif</Label>
        <div className="grid grid-cols-2 gap-3 mt-2">
          {DECORATIVE_STYLES.map(option => {
            const Icon = option.icon;
            const isSelected = style === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onUpdate({ style: option.value })}
                className={cn(
                  'flex items-center space-x-3 p-3 rounded-lg border-2 transition-colors text-left',
                  isSelected
                    ? 'border-black bg-black text-white'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{option.label}</div>
                  <div
                    className={cn(
                      'text-xs',
                      isSelected ? 'text-gray-200' : 'text-gray-500'
                    )}
                  >
                    {option.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Pieces compatibles */}
      <div>
        <Label>Pieces compatibles</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {ROOM_TYPES.map(room => {
            const isSelected = suitableRooms.includes(room.value);
            return (
              <Badge
                key={room.value}
                variant={isSelected ? 'secondary' : 'outline'}
                className={cn(
                  'cursor-pointer transition-colors',
                  isSelected && 'bg-black hover:bg-black/90'
                )}
                onClick={() => onToggleRoom(room.value)}
              >
                {room.emoji} {room.label}
              </Badge>
            );
          })}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Cliquez pour selectionner les pieces adaptees
        </p>
      </div>

      {/* Dimensions communes */}
      <div>
        <Label>Dimensions communes (optionnel)</Label>
        <div className="grid grid-cols-4 gap-3 mt-2">
          <Input
            type="number"
            value={dimensionsLength}
            onChange={e =>
              onUpdate({
                dimensions_length: e.target.value ? Number(e.target.value) : '',
              })
            }
            placeholder="Longueur"
            min="0"
            step="0.1"
          />
          <Input
            type="number"
            value={dimensionsWidth}
            onChange={e =>
              onUpdate({
                dimensions_width: e.target.value ? Number(e.target.value) : '',
              })
            }
            placeholder="Largeur"
            min="0"
            step="0.1"
          />
          <Input
            type="number"
            value={dimensionsHeight}
            onChange={e =>
              onUpdate({
                dimensions_height: e.target.value ? Number(e.target.value) : '',
              })
            }
            placeholder="Hauteur"
            min="0"
            step="0.1"
          />
          <Select
            value={dimensionsUnit}
            onValueChange={(value: string) =>
              onUpdate({ dimensions_unit: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cm">cm</SelectItem>
              <SelectItem value="m">m</SelectItem>
              <SelectItem value="mm">mm</SelectItem>
              <SelectItem value="in">in</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Dimensions partagees par tous les produits du groupe
        </p>
      </div>
    </div>
  );
}
