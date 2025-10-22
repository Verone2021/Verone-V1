'use client'

/**
 * 🎛️ COMMAND PALETTE - Vérone Back Office
 * Interface Cmd+K style révolutionnaire avec AI-powered search
 * Design System: Noir/Blanc strict, animations subtiles
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { ButtonV2 } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'
import {
  Search,
  Zap,
  Settings,
  Database,
  Bug,
  Brain,
  Activity,
  Download,
  RefreshCw,
  Eye,
  Code,
  Network,
  Users,
  Moon,
  Sun,
  Palette,
  Keyboard,
  HelpCircle,
  ArrowRight,
  Clock,
  Star,
  Bookmark,
  History,
  Globe,
  Shield,
  Gauge
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Types pour les commandes
export interface CommandAction {
  id: string
  title: string
  description?: string
  icon?: React.ReactNode
  shortcut?: string[]
  category: 'navigation' | 'actions' | 'tools' | 'system' | 'recent' | 'favorites'
  keywords: string[]
  handler: () => void | Promise<void>
  requiresConfirmation?: boolean
  premium?: boolean
}

interface CommandPaletteProps {
  className?: string
  commands?: CommandAction[]
  onCommandExecute?: (command: CommandAction) => void
  placeholder?: string
  maxResults?: number
}

// Commandes par défaut Vérone
const defaultCommands: CommandAction[] = [
  // Navigation
  {
    id: 'nav-dashboard',
    title: 'Ouvrir Dashboard',
    description: 'Accéder au tableau de bord principal',
    icon: <Activity className="w-4 h-4" />,
    shortcut: ['g', 'd'],
    category: 'navigation',
    keywords: ['dashboard', 'accueil', 'tableau', 'bord'],
    handler: () => window.location.href = '/dashboard'
  },
  {
    id: 'nav-catalogue',
    title: 'Aller au Catalogue',
    description: 'Gérer les produits et collections',
    icon: <Database className="w-4 h-4" />,
    shortcut: ['g', 'c'],
    category: 'navigation',
    keywords: ['catalogue', 'produits', 'collections'],
    handler: () => window.location.href = '/catalogue'
  },
  {
    id: 'nav-consultations',
    title: 'Consultations Clients',
    description: 'Voir les consultations en cours',
    icon: <Users className="w-4 h-4" />,
    shortcut: ['g', 'o'],
    category: 'navigation',
    keywords: ['consultations', 'clients', 'projets'],
    handler: () => window.location.href = '/consultations'
  },
  {
    id: 'nav-stocks',
    title: 'Gestion des Stocks',
    description: 'Inventaire et mouvements',
    icon: <Database className="w-4 h-4" />,
    shortcut: ['g', 's'],
    category: 'navigation',
    keywords: ['stocks', 'inventaire', 'mouvements'],
    handler: () => window.location.href = '/stocks'
  },

  // Actions principales
  {
    id: 'action-force-sync',
    title: 'Force Sync + AI Check',
    description: 'Analyser tous les systèmes avec IA',
    icon: <Zap className="w-4 h-4" />,
    shortcut: ['shift', 'ctrl', 's'],
    category: 'actions',
    keywords: ['sync', 'analyse', 'erreurs', 'ia', 'diagnostic'],
    handler: async () => {
      const event = new CustomEvent('force-sync-ai-check')
      window.dispatchEvent(event)
    }
  },
  {
    id: 'action-generate-report',
    title: 'Générer Rapport',
    description: 'Créer rapport complet des erreurs',
    icon: <Download className="w-4 h-4" />,
    shortcut: ['ctrl', 'r'],
    category: 'actions',
    keywords: ['rapport', 'export', 'télécharger', 'erreurs'],
    handler: async () => {
      const event = new CustomEvent('generate-error-report')
      window.dispatchEvent(event)
    }
  },
  {
    id: 'action-clear-errors',
    title: 'Clear All Errors',
    description: 'Effacer toutes les erreurs détectées',
    icon: <RefreshCw className="w-4 h-4" />,
    shortcut: ['ctrl', 'shift', 'x'],
    category: 'actions',
    keywords: ['clear', 'effacer', 'reset', 'erreurs'],
    requiresConfirmation: true,
    handler: async () => {
      const event = new CustomEvent('clear-all-errors')
      window.dispatchEvent(event)
    }
  },

  // Outils
  {
    id: 'tool-ai-insights',
    title: 'AI Insights Panel',
    description: 'Ouvrir les insights IA avancés',
    icon: <Brain className="w-4 h-4" />,
    shortcut: ['ctrl', 'i'],
    category: 'tools',
    keywords: ['ia', 'intelligence', 'insights', 'analyse', 'prédictions'],
    handler: () => {
      const event = new CustomEvent('open-ai-insights')
      window.dispatchEvent(event)
    }
  },
  {
    id: 'tool-performance-monitor',
    title: 'Performance Monitor',
    description: 'Surveiller les performances système',
    icon: <Gauge className="w-4 h-4" />,
    shortcut: ['ctrl', 'p'],
    category: 'tools',
    keywords: ['performance', 'monitoring', 'vitesse', 'optimisation'],
    handler: () => {
      const event = new CustomEvent('open-performance-monitor')
      window.dispatchEvent(event)
    }
  },
  {
    id: 'tool-console-check',
    title: 'Browser Console Check',
    description: 'Vérifier les erreurs console',
    icon: <Code className="w-4 h-4" />,
    shortcut: ['ctrl', 'shift', 'c'],
    category: 'tools',
    keywords: ['console', 'browser', 'javascript', 'erreurs'],
    handler: () => {
      // Ouvrir les DevTools ou déclencher un check console
      const event = new CustomEvent('browser-console-check')
      window.dispatchEvent(event)
    }
  },

  // Système
  {
    id: 'system-dark-mode',
    title: 'Toggle Dark Mode',
    description: 'Basculer entre thème clair et sombre',
    icon: <Moon className="w-4 h-4" />,
    shortcut: ['ctrl', 'd'],
    category: 'system',
    keywords: ['dark', 'mode', 'thème', 'sombre', 'clair'],
    handler: () => {
      const event = new CustomEvent('toggle-dark-mode')
      window.dispatchEvent(event)
    }
  },
  {
    id: 'system-shortcuts',
    title: 'Keyboard Shortcuts',
    description: 'Voir tous les raccourcis clavier',
    icon: <Keyboard className="w-4 h-4" />,
    shortcut: ['?'],
    category: 'system',
    keywords: ['raccourcis', 'clavier', 'shortcuts', 'aide'],
    handler: () => {
      const event = new CustomEvent('show-shortcuts')
      window.dispatchEvent(event)
    }
  },
  {
    id: 'system-help',
    title: 'Help & Support',
    description: 'Documentation et support',
    icon: <HelpCircle className="w-4 h-4" />,
    shortcut: ['f1'],
    category: 'system',
    keywords: ['aide', 'help', 'support', 'documentation'],
    handler: () => window.open('/help', '_blank')
  }
]

/**
 * 🎛️ COMMAND PALETTE PRINCIPAL
 */
export function CommandPalette({
  className,
  commands = defaultCommands,
  onCommandExecute,
  placeholder = "Tapez une commande ou recherchez...",
  maxResults = 10
}: CommandPaletteProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [recentCommands, setRecentCommands] = useState<string[]>([])
  const [favorites, setFavorites] = useState<string[]>([])
  const [mounted, setMounted] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Mount check pour éviter les erreurs SSR
  useEffect(() => {
    setMounted(true)

    // Charger les commandes récentes et favorites depuis localStorage
    const savedRecent = localStorage.getItem('verone-recent-commands')
    const savedFavorites = localStorage.getItem('verone-favorite-commands')

    if (savedRecent) setRecentCommands(JSON.parse(savedRecent))
    if (savedFavorites) setFavorites(JSON.parse(savedFavorites))
  }, [])

  // Gestion des raccourcis clavier globaux
  useEffect(() => {
    if (!mounted) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K ou Ctrl+K pour ouvrir la palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k' && !e.shiftKey) {
        e.preventDefault()
        setOpen(true)
        return
      }

      // Escape pour fermer
      if (e.key === 'Escape' && open) {
        e.preventDefault()
        setOpen(false)
        return
      }

      // Vérifier les raccourcis de commandes
      commands.forEach(command => {
        if (command.shortcut && isShortcutMatch(e, command.shortcut)) {
          e.preventDefault()
          executeCommand(command)
        }
      })
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [mounted, open, commands])

  // Vérifier si un raccourci correspond
  const isShortcutMatch = (e: KeyboardEvent, shortcut: string[]): boolean => {
    const pressedKeys = []
    if (e.ctrlKey) pressedKeys.push('ctrl')
    if (e.metaKey) pressedKeys.push('cmd', 'meta')
    if (e.shiftKey) pressedKeys.push('shift')
    if (e.altKey) pressedKeys.push('alt')
    pressedKeys.push(e.key.toLowerCase())

    return shortcut.every(key => pressedKeys.includes(key.toLowerCase()))
  }

  // Filtrer et trier les commandes selon la recherche
  const filteredCommands = useMemo(() => {
    if (!search) {
      // Sans recherche, montrer les favoris et récents en premier
      const recentCmds = commands.filter(cmd => recentCommands.includes(cmd.id))
      const favoriteCmds = commands.filter(cmd => favorites.includes(cmd.id))
      const otherCmds = commands.filter(cmd =>
        !recentCommands.includes(cmd.id) && !favorites.includes(cmd.id)
      ).slice(0, 6) // Limiter les autres commandes

      return [...favoriteCmds, ...recentCmds, ...otherCmds].slice(0, maxResults)
    }

    const query = search.toLowerCase()
    return commands
      .filter(command =>
        command.title.toLowerCase().includes(query) ||
        command.description?.toLowerCase().includes(query) ||
        command.keywords.some(keyword => keyword.toLowerCase().includes(query))
      )
      .sort((a, b) => {
        // Prioriser les matches exacts dans le titre
        const aExactMatch = a.title.toLowerCase() === query
        const bExactMatch = b.title.toLowerCase() === query
        if (aExactMatch && !bExactMatch) return -1
        if (!aExactMatch && bExactMatch) return 1

        // Prioriser les matches au début du titre
        const aStartsWithQuery = a.title.toLowerCase().startsWith(query)
        const bStartsWithQuery = b.title.toLowerCase().startsWith(query)
        if (aStartsWithQuery && !bStartsWithQuery) return -1
        if (!aStartsWithQuery && bStartsWithQuery) return 1

        // Prioriser les favoris
        const aIsFavorite = favorites.includes(a.id)
        const bIsFavorite = favorites.includes(b.id)
        if (aIsFavorite && !bIsFavorite) return -1
        if (!aIsFavorite && bIsFavorite) return 1

        // Tri alphabétique
        return a.title.localeCompare(b.title)
      })
      .slice(0, maxResults)
  }, [search, commands, recentCommands, favorites, maxResults])

  // Grouper les commandes par catégorie
  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandAction[]> = {}

    filteredCommands.forEach(command => {
      const category = command.category
      if (!groups[category]) groups[category] = []
      groups[category].push(command)
    })

    return groups
  }, [filteredCommands])

  // Exécuter une commande
  const executeCommand = useCallback(async (command: CommandAction) => {
    try {
      // Ajouter aux commandes récentes
      const updatedRecent = [command.id, ...recentCommands.filter(id => id !== command.id)].slice(0, 5)
      setRecentCommands(updatedRecent)
      localStorage.setItem('verone-recent-commands', JSON.stringify(updatedRecent))

      // Confirmation si nécessaire
      if (command.requiresConfirmation) {
        const confirmed = confirm(`Êtes-vous sûr de vouloir exécuter "${command.title}" ?`)
        if (!confirmed) return
      }

      // Fermer la palette
      setOpen(false)
      setSearch("")

      // Exécuter la commande
      await command.handler()

      // Callback externe
      if (onCommandExecute) {
        onCommandExecute(command)
      }
    } catch (error) {
      console.error('Erreur exécution commande:', error)
    }
  }, [recentCommands, onCommandExecute])

  // Toggle favori
  const toggleFavorite = useCallback((commandId: string) => {
    const updatedFavorites = favorites.includes(commandId)
      ? favorites.filter(id => id !== commandId)
      : [...favorites, commandId]

    setFavorites(updatedFavorites)
    localStorage.setItem('verone-favorite-commands', JSON.stringify(updatedFavorites))
  }, [favorites])

  // Navigation clavier dans les résultats
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev =>
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        )
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev =>
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        )
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const selectedCommand = filteredCommands[selectedIndex]
        if (selectedCommand) {
          executeCommand(selectedCommand)
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, filteredCommands, selectedIndex, executeCommand])

  // Reset de l'index sélectionné quand la recherche change
  useEffect(() => {
    setSelectedIndex(0)
  }, [search])

  if (!mounted) return null

  const categoryLabels = {
    navigation: 'Navigation',
    actions: 'Actions',
    tools: 'Outils',
    system: 'Système',
    recent: 'Récents',
    favorites: 'Favoris'
  }

  const categoryIcons = {
    navigation: <Globe className="w-3 h-3" />,
    actions: <Zap className="w-3 h-3" />,
    tools: <Settings className="w-3 h-3" />,
    system: <Shield className="w-3 h-3" />,
    recent: <Clock className="w-3 h-3" />,
    favorites: <Star className="w-3 h-3" />
  }

  return (
    <>
      {/* Trigger Button */}
      <ButtonV2
        variant="outline"
        className={cn(
          "relative w-full justify-start text-sm text-muted-foreground",
          "hover:bg-black hover:text-white transition-colors",
          className
        )}
        onClick={() => setOpen(true)}
      >
        <Search className="w-4 h-4 mr-2" />
        {placeholder}
        <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 select-none items-center gap-1 rounded border bg-muted px-1.5 py-0.5 font-mono text-xs font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </ButtonV2>

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
              <p className="text-sm text-muted-foreground">Aucune commande trouvée</p>
              <p className="text-xs text-muted-foreground mt-1">
                Essayez "dashboard", "sync", "aide"...
              </p>
            </div>
          </CommandEmpty>

          {Object.entries(groupedCommands).map(([category, commands], groupIndex) => (
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
                {commands.map((command, index) => {
                  const globalIndex = filteredCommands.indexOf(command)
                  const isSelected = globalIndex === selectedIndex
                  const isFavorite = favorites.includes(command.id)

                  return (
                    <CommandItem
                      key={command.id}
                      value={command.id}
                      onSelect={() => executeCommand(command)}
                      className={cn(
                        "flex items-center justify-between",
                        "data-[selected=true]:bg-black data-[selected=true]:text-white",
                        isSelected && "bg-black text-white"
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
                              <Badge variant="outline" className="text-xs">Pro</Badge>
                            )}
                            {isFavorite && (
                              <Star className="w-3 h-3 fill-current" />
                            )}
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

                        <ButtonV2
                          variant="ghost"
                          size="sm"
                          className="w-6 h-6 p-0 opacity-50 hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleFavorite(command.id)
                          }}
                        >
                          {isFavorite ? (
                            <Star className="w-3 h-3 fill-current" />
                          ) : (
                            <Bookmark className="w-3 h-3" />
                          )}
                        </ButtonV2>
                      </div>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </React.Fragment>
          ))}
        </CommandList>

        {/* Footer avec raccourcis */}
        <div className="flex items-center justify-between p-3 border-t bg-muted/30">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-background rounded text-xs border">⏎</kbd>
              <span>Exécuter</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-background rounded text-xs border">↑↓</kbd>
              <span>Naviguer</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-background rounded text-xs border">Esc</kbd>
              <span>Fermer</span>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            {filteredCommands.length} commande{filteredCommands.length > 1 ? 's' : ''}
          </div>
        </div>
      </CommandDialog>
    </>
  )
}

/**
 * 🎯 HOOK POUR INTÉGRER COMMAND PALETTE
 */
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false)

  const openPalette = useCallback(() => setIsOpen(true), [])
  const closePalette = useCallback(() => setIsOpen(false), [])

  return {
    isOpen,
    openPalette,
    closePalette
  }
}

export default CommandPalette