'use client';

/**
 * Commandes par défaut et icônes catégories pour la Command Palette
 */

import {
  Activity,
  Database,
  Users,
  Zap,
  Download,
  RefreshCw,
  Brain,
  Gauge,
  Code,
  Moon,
  Keyboard,
  HelpCircle,
  Globe,
  Shield,
  Clock,
  Star,
  Settings,
} from 'lucide-react';

import type { CommandAction } from './command-palette.types';

export const defaultCommands: CommandAction[] = [
  // Navigation
  {
    id: 'nav-dashboard',
    title: 'Ouvrir Dashboard',
    description: 'Accéder au tableau de bord principal',
    icon: <Activity className="w-4 h-4" />,
    shortcut: ['g', 'd'],
    category: 'navigation',
    keywords: ['dashboard', 'accueil', 'tableau', 'bord'],
    handler: () => {
      window.location.href = '/dashboard';
    },
  },
  {
    id: 'nav-catalogue',
    title: 'Aller au Catalogue',
    description: 'Gérer les produits et collections',
    icon: <Database className="w-4 h-4" />,
    shortcut: ['g', 'c'],
    category: 'navigation',
    keywords: ['catalogue', 'produits', 'collections'],
    handler: () => {
      window.location.href = '/catalogue';
    },
  },
  {
    id: 'nav-consultations',
    title: 'Consultations Clients',
    description: 'Voir les consultations en cours',
    icon: <Users className="w-4 h-4" />,
    shortcut: ['g', 'o'],
    category: 'navigation',
    keywords: ['consultations', 'clients', 'projets'],
    handler: () => {
      window.location.href = '/consultations';
    },
  },
  {
    id: 'nav-stocks',
    title: 'Gestion des Stocks',
    description: 'Inventaire et mouvements',
    icon: <Database className="w-4 h-4" />,
    shortcut: ['g', 's'],
    category: 'navigation',
    keywords: ['stocks', 'inventaire', 'mouvements'],
    handler: () => {
      window.location.href = '/stocks';
    },
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
      const event = new CustomEvent('force-sync-ai-check');
      window.dispatchEvent(event);
    },
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
      const event = new CustomEvent('generate-error-report');
      window.dispatchEvent(event);
    },
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
      const event = new CustomEvent('clear-all-errors');
      window.dispatchEvent(event);
    },
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
      const event = new CustomEvent('open-ai-insights');
      window.dispatchEvent(event);
    },
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
      const event = new CustomEvent('open-performance-monitor');
      window.dispatchEvent(event);
    },
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
      const event = new CustomEvent('browser-console-check');
      window.dispatchEvent(event);
    },
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
      const event = new CustomEvent('toggle-dark-mode');
      window.dispatchEvent(event);
    },
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
      const event = new CustomEvent('show-shortcuts');
      window.dispatchEvent(event);
    },
  },
  {
    id: 'system-help',
    title: 'Help & Support',
    description: 'Documentation et support',
    icon: <HelpCircle className="w-4 h-4" />,
    shortcut: ['f1'],
    category: 'system',
    keywords: ['aide', 'help', 'support', 'documentation'],
    handler: () => {
      window.open('/help', '_blank');
    },
  },
];

export const categoryIcons: Record<CommandAction['category'], React.ReactNode> =
  {
    navigation: <Globe className="w-3 h-3" />,
    actions: <Zap className="w-3 h-3" />,
    tools: <Settings className="w-3 h-3" />,
    system: <Shield className="w-3 h-3" />,
    recent: <Clock className="w-3 h-3" />,
    favorites: <Star className="w-3 h-3" />,
  };
