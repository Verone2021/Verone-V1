'use client';

/**
 * COMMAND PALETTE - Vérone Back Office
 * Interface Cmd+K style avec AI-powered search
 * Design System: Noir/Blanc strict, animations subtiles
 */

import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from 'react';

import { cn } from '@verone/utils';
import { Search } from 'lucide-react';

import { Button } from './button';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
  CommandSeparator,
} from './command';
import { CommandPaletteItem } from './CommandPaletteItem';
import { defaultCommands, categoryIcons } from './command-palette.defaults';
import {
  type CommandAction,
  type CommandPaletteProps,
  categoryLabels,
} from './command-palette.types';

export type { CommandAction, CommandPaletteProps };

/**
 * COMMAND PALETTE PRINCIPAL
 */
export function CommandPalette({
  className,
  commands = defaultCommands,
  onCommandExecute,
  placeholder = 'Tapez une commande ou recherchez...',
  maxResults = 10,
}: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentCommands, setRecentCommands] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mount check pour éviter les erreurs SSR
  useEffect(() => {
    setMounted(true);

    const savedRecent = localStorage.getItem('verone-recent-commands');
    const savedFavorites = localStorage.getItem('verone-favorite-commands');

    if (savedRecent) {
      const parsed: unknown = JSON.parse(savedRecent);
      if (Array.isArray(parsed)) setRecentCommands(parsed as string[]);
    }
    if (savedFavorites) {
      const parsed: unknown = JSON.parse(savedFavorites);
      if (Array.isArray(parsed)) setFavorites(parsed as string[]);
    }
  }, []);

  // Exécuter une commande
  const executeCommand = useCallback(
    async (command: CommandAction) => {
      try {
        const updatedRecent = [
          command.id,
          ...recentCommands.filter(id => id !== command.id),
        ].slice(0, 5);
        setRecentCommands(updatedRecent);
        localStorage.setItem(
          'verone-recent-commands',
          JSON.stringify(updatedRecent)
        );

        if (command.requiresConfirmation) {
          const confirmed = confirm(
            `Êtes-vous sûr de vouloir exécuter "${command.title}" ?`
          );
          if (!confirmed) return;
        }

        setOpen(false);
        setSearch('');

        await command.handler();

        if (onCommandExecute) {
          onCommandExecute(command);
        }
      } catch (error) {
        console.error('Erreur exécution commande:', error);
      }
    },
    [recentCommands, onCommandExecute]
  );

  // Vérifier si un raccourci correspond
  const isShortcutMatch = useCallback(
    (e: KeyboardEvent, shortcut: string[]): boolean => {
      const pressedKeys: string[] = [];
      if (e.ctrlKey) pressedKeys.push('ctrl');
      if (e.metaKey) pressedKeys.push('cmd', 'meta');
      if (e.shiftKey) pressedKeys.push('shift');
      if (e.altKey) pressedKeys.push('alt');
      pressedKeys.push(e.key.toLowerCase());
      return shortcut.every(key => pressedKeys.includes(key.toLowerCase()));
    },
    []
  );

  // Gestion des raccourcis clavier globaux
  useEffect(() => {
    if (!mounted) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k' && !e.shiftKey) {
        e.preventDefault();
        setOpen(true);
        return;
      }

      if (e.key === 'Escape' && open) {
        e.preventDefault();
        setOpen(false);
        return;
      }

      commands.forEach(command => {
        if (command.shortcut && isShortcutMatch(e, command.shortcut)) {
          e.preventDefault();
          void executeCommand(command);
        }
      });
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mounted, open, commands, executeCommand, isShortcutMatch]);

  // Filtrer et trier les commandes selon la recherche
  const filteredCommands = useMemo(() => {
    if (!search) {
      const recentCmds = commands.filter(cmd =>
        recentCommands.includes(cmd.id)
      );
      const favoriteCmds = commands.filter(cmd => favorites.includes(cmd.id));
      const otherCmds = commands
        .filter(
          cmd => !recentCommands.includes(cmd.id) && !favorites.includes(cmd.id)
        )
        .slice(0, 6);

      return [...favoriteCmds, ...recentCmds, ...otherCmds].slice(
        0,
        maxResults
      );
    }

    const query = search.toLowerCase();
    return commands
      .filter(
        command =>
          command.title.toLowerCase().includes(query) ||
          (command.description?.toLowerCase().includes(query) ?? false) ||
          command.keywords.some(keyword =>
            keyword.toLowerCase().includes(query)
          )
      )
      .sort((a, b) => {
        const aExact = a.title.toLowerCase() === query;
        const bExact = b.title.toLowerCase() === query;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;

        const aStarts = a.title.toLowerCase().startsWith(query);
        const bStarts = b.title.toLowerCase().startsWith(query);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;

        const aFav = favorites.includes(a.id);
        const bFav = favorites.includes(b.id);
        if (aFav && !bFav) return -1;
        if (!aFav && bFav) return 1;

        return a.title.localeCompare(b.title);
      })
      .slice(0, maxResults);
  }, [search, commands, recentCommands, favorites, maxResults]);

  // Grouper les commandes par catégorie
  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandAction[]> = {};
    filteredCommands.forEach(command => {
      const category = command.category;
      if (!groups[category]) groups[category] = [];
      groups[category].push(command);
    });
    return groups;
  }, [filteredCommands]);

  // Toggle favori
  const toggleFavorite = useCallback(
    (commandId: string) => {
      const updatedFavorites = favorites.includes(commandId)
        ? favorites.filter(id => id !== commandId)
        : [...favorites, commandId];

      setFavorites(updatedFavorites);
      localStorage.setItem(
        'verone-favorite-commands',
        JSON.stringify(updatedFavorites)
      );
    },
    [favorites]
  );

  // Navigation clavier dans les résultats
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev =>
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selectedCommand = filteredCommands[selectedIndex];
        if (selectedCommand) {
          void executeCommand(selectedCommand);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, filteredCommands, selectedIndex, executeCommand]);

  // Reset index sélectionné quand la recherche change
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  if (!mounted) return null;

  return (
    <>
      {/* Trigger Button */}
      <Button
        variant="outline"
        className={cn(
          'relative w-full justify-start text-sm text-muted-foreground',
          'hover:bg-black hover:text-white transition-colors',
          className
        )}
        onClick={() => setOpen(true)}
      >
        <Search className="w-4 h-4 mr-2" />
        {placeholder}
        <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 select-none items-center gap-1 rounded border bg-muted px-1.5 py-0.5 font-mono text-xs font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      {/* Command Dialog */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          ref={inputRef}
          placeholder={placeholder}
          value={search}
          onValueChange={setSearch}
          className="border-none focus:ring-0"
        />

        <CommandList className="max-h-96">
          <CommandEmpty>
            <div className="text-center py-6">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground">
                Aucune commande trouvée
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Essayez "dashboard", "sync", "aide"...
              </p>
            </div>
          </CommandEmpty>

          {Object.entries(groupedCommands).map(
            ([category, cmds], groupIndex) => (
              <React.Fragment key={category}>
                {groupIndex > 0 && <CommandSeparator />}

                <CommandGroup
                  heading={
                    <div className="flex items-center gap-2">
                      {categoryIcons[category as keyof typeof categoryIcons]}
                      {categoryLabels[category as keyof typeof categoryLabels]}
                    </div>
                  }
                >
                  {cmds.map(command => {
                    const globalIndex = filteredCommands.indexOf(command);
                    return (
                      <CommandPaletteItem
                        key={command.id}
                        command={command}
                        isSelected={globalIndex === selectedIndex}
                        isFavorite={favorites.includes(command.id)}
                        onSelect={() => void executeCommand(command)}
                        onToggleFavorite={toggleFavorite}
                      />
                    );
                  })}
                </CommandGroup>
              </React.Fragment>
            )
          )}
        </CommandList>

        {/* Footer avec raccourcis */}
        <div className="flex items-center justify-between p-3 border-t bg-muted/30">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-background rounded text-xs border">
                ⏎
              </kbd>
              <span>Exécuter</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-background rounded text-xs border">
                ↑↓
              </kbd>
              <span>Naviguer</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-background rounded text-xs border">
                Esc
              </kbd>
              <span>Fermer</span>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            {filteredCommands.length} commande
            {filteredCommands.length > 1 ? 's' : ''}
          </div>
        </div>
      </CommandDialog>
    </>
  );
}

/**
 * HOOK POUR INTÉGRER COMMAND PALETTE
 */
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);

  const openPalette = useCallback(() => setIsOpen(true), []);
  const closePalette = useCallback(() => setIsOpen(false), []);

  return {
    isOpen,
    openPalette,
    closePalette,
  };
}

export default CommandPalette;
