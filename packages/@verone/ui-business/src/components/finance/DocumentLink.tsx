'use client';

import * as React from 'react';

import { Button } from '@verone/ui';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@verone/ui';
import { cn } from '@verone/utils';
import {
  FileText,
  FileSpreadsheet,
  Receipt,
  Download,
  ExternalLink,
  Eye,
  Loader2,
} from 'lucide-react';

/**
 * Types de documents financiers
 */
export type FinancialDocumentType =
  | 'customer_invoice'
  | 'supplier_invoice'
  | 'expense'
  | 'purchase_order'
  | 'sales_order'
  | 'credit_note'
  | 'receipt';

/**
 * Props pour le composant DocumentLink
 */
export interface DocumentLinkProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Numéro du document */
  documentNumber: string;
  /** Type de document */
  documentType: FinancialDocumentType;
  /** URL du document (PDF ou lien externe) */
  documentUrl?: string | null;
  /** Callback pour prévisualisation */
  onPreview?: () => void;
  /** Callback pour téléchargement */
  onDownload?: () => void;
  /** Lien vers la page détail */
  href?: string;
  /** Affichage compact */
  compact?: boolean;
  /** En cours de chargement */
  loading?: boolean;
  /** Document existe ? */
  hasDocument?: boolean;
}

/**
 * Configuration des types de documents
 */
const documentTypeConfig: Record<
  FinancialDocumentType,
  {
    label: string;
    prefix: string;
    icon: typeof FileText;
    color: string;
  }
> = {
  customer_invoice: {
    label: 'Facture client',
    prefix: 'FC',
    icon: FileText,
    color: 'text-blue-600 dark:text-blue-400',
  },
  supplier_invoice: {
    label: 'Facture fournisseur',
    prefix: 'FF',
    icon: FileText,
    color: 'text-orange-600 dark:text-orange-400',
  },
  expense: {
    label: 'Note de frais',
    prefix: 'NF',
    icon: Receipt,
    color: 'text-purple-600 dark:text-purple-400',
  },
  purchase_order: {
    label: 'Bon de commande',
    prefix: 'BC',
    icon: FileSpreadsheet,
    color: 'text-green-600 dark:text-green-400',
  },
  sales_order: {
    label: 'Commande client',
    prefix: 'CC',
    icon: FileSpreadsheet,
    color: 'text-cyan-600 dark:text-cyan-400',
  },
  credit_note: {
    label: 'Avoir',
    prefix: 'AV',
    icon: FileText,
    color: 'text-red-600 dark:text-red-400',
  },
  receipt: {
    label: 'Reçu',
    prefix: 'RC',
    icon: Receipt,
    color: 'text-gray-600 dark:text-gray-400',
  },
};

/**
 * Composant DocumentLink - Lien vers un document financier avec actions
 *
 * @example
 * <DocumentLink
 *   documentNumber="FC-2024-0001"
 *   documentType="customer_invoice"
 *   documentUrl="/api/documents/123.pdf"
 *   onPreview={() => openPreview()}
 * />
 */
export function DocumentLink({
  documentNumber,
  documentType,
  documentUrl,
  onPreview,
  onDownload,
  href,
  compact = false,
  loading = false,
  hasDocument = true,
  className,
  ...props
}: DocumentLinkProps) {
  const config = documentTypeConfig[documentType];
  const Icon = config.icon;

  // Mode chargement
  if (loading) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-2 text-muted-foreground',
          className
        )}
        {...props}
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Chargement...</span>
      </div>
    );
  }

  // Mode compact
  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className={cn(
                'inline-flex items-center gap-1 text-sm font-mono cursor-pointer hover:underline',
                config.color,
                !hasDocument && 'opacity-50',
                className
              )}
              onClick={onPreview || (href ? undefined : undefined)}
              {...props}
            >
              <Icon className="h-3.5 w-3.5" />
              {documentNumber}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{config.label}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Mode standard
  return (
    <div className={cn('inline-flex items-center gap-2', className)} {...props}>
      {/* Icône et numéro */}
      <div
        className={cn(
          'flex items-center gap-1.5',
          config.color,
          !hasDocument && 'opacity-50'
        )}
      >
        <Icon className="h-4 w-4" />
        <span className="font-mono text-sm font-medium">{documentNumber}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Prévisualisation */}
        {onPreview && hasDocument && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onPreview}
            title="Prévisualiser"
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
        )}

        {/* Téléchargement */}
        {(onDownload || documentUrl) && hasDocument && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={
              onDownload ||
              (() => documentUrl && window.open(documentUrl, '_blank'))
            }
            title="Télécharger"
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
        )}

        {/* Lien externe */}
        {href && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => window.open(href, '_blank')}
            title="Ouvrir dans un nouvel onglet"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Indicateur document manquant */}
      {!hasDocument && (
        <span className="text-xs text-muted-foreground italic">
          (non disponible)
        </span>
      )}
    </div>
  );
}

/**
 * Version badge du DocumentLink pour les tableaux
 */
export function DocumentBadge({
  documentNumber,
  documentType,
  className,
}: {
  documentNumber: string;
  documentType: FinancialDocumentType;
  className?: string;
}) {
  const config = documentTypeConfig[documentType];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-medium',
        'bg-muted',
        config.color,
        className
      )}
      title={config.label}
    >
      <Icon className="h-3 w-3" />
      {documentNumber}
    </span>
  );
}

/**
 * Génère un numéro de document avec le bon préfixe
 */
export function generateDocumentNumber(
  type: FinancialDocumentType,
  sequence: number,
  year?: number
): string {
  const prefix = documentTypeConfig[type].prefix;
  const currentYear = year || new Date().getFullYear();
  const paddedSequence = sequence.toString().padStart(4, '0');
  return `${prefix}-${currentYear}-${paddedSequence}`;
}

/**
 * Export de la configuration pour réutilisation
 */
export { documentTypeConfig };
