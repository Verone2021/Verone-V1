'use client';

import { Star, Bookmark } from 'lucide-react';

import { cn } from '@verone/utils';

import { Badge } from './badge';
import { Button } from './button';
import { CommandItem, CommandShortcut } from './command';
import type { CommandAction } from './command-palette.types';

interface CommandPaletteItemProps {
  command: CommandAction;
  isSelected: boolean;
  isFavorite: boolean;
  onSelect: () => void;
  onToggleFavorite: (commandId: string) => void;
}

export function CommandPaletteItem({
  command,
  isSelected,
  isFavorite,
  onSelect,
  onToggleFavorite,
}: CommandPaletteItemProps) {
  return (
    <CommandItem
      key={command.id}
      value={command.id}
      onSelect={onSelect}
      className={cn(
        'flex items-center justify-between',
        'data-[selected=true]:bg-black data-[selected=true]:text-white',
        isSelected && 'bg-black text-white'
      )}
    >
      <div className="flex items-center gap-3 flex-1">
        <div className="flex items-center justify-center w-8 h-8 rounded border">
          {command.icon}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{command.title}</span>
            {command.premium && (
              <Badge variant="outline" className="text-xs">
                Pro
              </Badge>
            )}
            {isFavorite && <Star className="w-3 h-3 fill-current" />}
          </div>
          {command.description && (
            <p className="text-xs text-muted-foreground">
              {command.description}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {command.shortcut && (
          <CommandShortcut className="text-xs">
            {command.shortcut.join(' + ')}
          </CommandShortcut>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="w-6 h-6 p-0 opacity-50 hover:opacity-100"
          onClick={e => {
            e.stopPropagation();
            onToggleFavorite(command.id);
          }}
        >
          {isFavorite ? (
            <Star className="w-3 h-3 fill-current" />
          ) : (
            <Bookmark className="w-3 h-3" />
          )}
        </Button>
      </div>
    </CommandItem>
  );
}
