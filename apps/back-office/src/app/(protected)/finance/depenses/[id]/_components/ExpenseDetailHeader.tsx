'use client';

import Link from 'next/link';

import type { FinancialDocument, DocumentStatus } from '@verone/finance';
import { Badge, ButtonUnified, IconButton } from '@verone/ui';
import {
  ArrowLeft,
  Download,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import type { ComponentType } from 'react';

// =====================================================================
// TYPES
// =====================================================================

interface ExpenseDetailHeaderProps {
  document: FinancialDocument;
}

// =====================================================================
// HELPERS
// =====================================================================

type BadgeVariant =
  | 'default'
  | 'supplier'
  | 'customer'
  | 'partner'
  | 'warning'
  | 'secondary'
  | 'success'
  | 'destructive'
  | 'outline'
  | 'danger'
  | 'info';

const STATUS_CONFIG: Record<
  DocumentStatus,
  {
    variant: BadgeVariant;
    icon: ComponentType<{ className?: string }>;
    label: string;
  }
> = {
  draft: { variant: 'secondary', icon: FileText, label: 'Brouillon' },
  sent: { variant: 'secondary', icon: FileText, label: 'Envoyée' },
  received: { variant: 'secondary', icon: CheckCircle2, label: 'Reçue' },
  paid: { variant: 'success', icon: CheckCircle2, label: 'Payée' },
  partially_paid: { variant: 'warning', icon: Clock, label: 'Partiel' },
  overdue: { variant: 'destructive', icon: AlertCircle, label: 'En retard' },
  cancelled: { variant: 'secondary', icon: FileText, label: 'Annulée' },
  refunded: { variant: 'secondary', icon: FileText, label: 'Remboursée' },
};

export function getStatusBadge(status: DocumentStatus) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

// =====================================================================
// COMPONENT
// =====================================================================

export function ExpenseDetailHeader({ document }: ExpenseDetailHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Link href="/finance/depenses">
          <IconButton
            icon={ArrowLeft}
            variant="outline"
            size="sm"
            label="Retour à la liste des dépenses"
          />
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{document.document_number}</h1>
          <p className="text-gray-500 mt-1">Dépense opérationnelle</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {getStatusBadge(document.status)}
        {document.uploaded_file_url && (
          <a
            href={document.uploaded_file_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ButtonUnified
              variant="outline"
              icon={Download}
              iconPosition="left"
            >
              Télécharger justificatif
            </ButtonUnified>
          </a>
        )}
      </div>
    </div>
  );
}
