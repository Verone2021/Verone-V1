import type React from 'react';

// Types pour les commandes
export interface CommandAction {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  shortcut?: string[];
  category:
    | 'navigation'
    | 'actions'
    | 'tools'
    | 'system'
    | 'recent'
    | 'favorites';
  keywords: string[];
  handler: () => void | Promise<void>;
  requiresConfirmation?: boolean;
  premium?: boolean;
}

export interface CommandPaletteProps {
  className?: string;
  commands?: CommandAction[];
  onCommandExecute?: (command: CommandAction) => void;
  placeholder?: string;
  maxResults?: number;
}

export const categoryLabels: Record<CommandAction['category'], string> = {
  navigation: 'Navigation',
  actions: 'Actions',
  tools: 'Outils',
  system: 'Système',
  recent: 'Récents',
  favorites: 'Favoris',
};
