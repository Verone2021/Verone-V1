import type React from 'react';

import { Bug, Code, FileText, Monitor, User, Zap } from 'lucide-react';

export type ErrorType =
  | 'console_error'
  | 'ui_bug'
  | 'performance'
  | 'functionality'
  | 'accessibility'
  | 'design';
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ReportStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface BrowserInfo {
  userAgent: string;
  url: string;
  viewport: string;
  timestamp: string;
}

export interface ErrorReport {
  id?: string;
  testId: string;
  title: string;
  description: string;
  errorType: ErrorType;
  severity: ErrorSeverity;
  status: ReportStatus;
  screenshots: File[];
  codeSnippet?: string;
  browserInfo?: BrowserInfo;
  steps?: string[];
  expectedBehavior?: string;
  actualBehavior?: string;
  assignedTo?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface ErrorReportModalProps {
  testId: string;
  testTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (report: ErrorReport) => Promise<void>;
  existingReport?: ErrorReport;
  children?: React.ReactNode;
}

export const ERROR_TYPE_CONFIG = {
  console_error: {
    label: 'Erreur Console',
    icon: Code,
    description: 'Erreurs JavaScript dans la console',
    color: 'text-red-600',
  },
  ui_bug: {
    label: 'Bug Interface',
    icon: Monitor,
    description: "Problème d'affichage ou d'interaction",
    color: 'text-black',
  },
  performance: {
    label: 'Performance',
    icon: Zap,
    description: 'Lenteur ou problème de performance',
    color: 'text-gray-700',
  },
  functionality: {
    label: 'Fonctionnalité',
    icon: Bug,
    description: 'Fonctionnalité qui ne marche pas',
    color: 'text-blue-600',
  },
  accessibility: {
    label: 'Accessibilité',
    icon: User,
    description: "Problème d'accessibilité (A11y)",
    color: 'text-purple-600',
  },
  design: {
    label: 'Design System',
    icon: FileText,
    description: 'Non-respect du Design System Vérone',
    color: 'text-pink-600',
  },
} as const;

export const SEVERITY_CONFIG = {
  low: {
    label: 'Faible',
    color: 'bg-gray-200 text-gray-800',
    description: 'Problème mineur, peut attendre',
  },
  medium: {
    label: 'Moyenne',
    color: 'bg-gray-400 text-white',
    description: 'Problème notable, à corriger',
  },
  high: {
    label: 'Élevée',
    color: 'bg-gray-600 text-white',
    description: 'Problème important, prioritaire',
  },
  critical: {
    label: 'Critique',
    color: 'bg-red-600 text-white',
    description: 'Problème bloquant, urgent',
  },
} as const;

export function useBrowserInfo(): BrowserInfo {
  return {
    userAgent: navigator.userAgent,
    url: window.location.href,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    timestamp: new Date().toISOString(),
  };
}
