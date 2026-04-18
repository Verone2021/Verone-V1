'use client';

/**
 * InvoiceActions — ResponsiveActionMenu partage desktop + mobile
 *
 * Technique T3 : dropdown pour >2 actions.
 * Breakpoint lg : boutons separes >= 1024px, dropdown < 1024px.
 *
 * HOOKS : aucun hook interne, composant pur basé sur props.
 */

import { useRouter } from 'next/navigation';
import { ResponsiveActionMenu } from '@verone/ui';
import type { ResponsiveAction } from '@verone/ui';
import {
  Archive,
  ArchiveRestore,
  Banknote,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  Pencil,
  Trash2,
} from 'lucide-react';

import type { Invoice } from './types';

export interface InvoiceActionsProps {
  invoice: Invoice;
  isDraft?: boolean;
  isArchived?: boolean;
  onView?: (id: string) => void;
  onDownloadPdf?: (invoice: Invoice) => void;
  onOpenOrder?: (orderId: string) => void;
  onOpenOrg?: (orgId: string) => void;
  onRapprochement?: (invoice: Invoice) => void;
  onArchive?: (invoice: Invoice) => Promise<void>;
  onUnarchive?: (invoice: Invoice) => Promise<void>;
  onFinalize?: (invoice: Invoice) => Promise<void>;
  onDelete?: (invoice: Invoice) => Promise<void>;
}

export function InvoiceActions({
  invoice,
  isDraft = false,
  isArchived = false,
  onView,
  onDownloadPdf,
  onRapprochement,
  onArchive,
  onUnarchive,
  onFinalize,
  onDelete,
}: InvoiceActionsProps) {
  const router = useRouter();

  const actions: ResponsiveAction[] = [];

  if (isDraft) {
    // Brouillon : Modifier (link), Finaliser, Supprimer
    actions.push({
      label: 'Modifier le brouillon',
      icon: Pencil,
      onClick: () => {
        router.push(`/factures/${invoice.id}/edit?type=invoice`);
      },
      alwaysVisible: true,
    });

    if (onFinalize) {
      actions.push({
        label: 'Finaliser',
        icon: CheckCircle2,
        onClick: () => {
          void onFinalize(invoice).catch(err =>
            console.error('[InvoiceActions] finalize error:', err)
          );
        },
      });
    }

    if (onDelete) {
      actions.push({
        label: 'Supprimer le brouillon',
        icon: Trash2,
        onClick: () => {
          void onDelete(invoice).catch(err =>
            console.error('[InvoiceActions] delete error:', err)
          );
        },
        variant: 'destructive',
        separatorBefore: true,
      });
    }
  } else {
    // Finalisee : Voir (detail), PDF, Telecharger, Rapprocher, Archiver/Desarchiver
    if (onView) {
      actions.push({
        label: 'Voir',
        icon: Eye,
        onClick: () => {
          router.push(`/factures/${invoice.id}?type=invoice`);
        },
        alwaysVisible: true,
      });
    }

    actions.push({
      label: 'Voir PDF',
      icon: FileText,
      onClick: () => {
        window.open(`/api/qonto/invoices/${invoice.id}/pdf`, '_blank');
      },
    });

    if (onDownloadPdf) {
      actions.push({
        label: 'Telecharger PDF',
        icon: Download,
        onClick: () => {
          onDownloadPdf(invoice);
        },
      });
    }

    if (
      onRapprochement &&
      invoice.sales_order_id &&
      invoice.status !== 'paid' &&
      invoice.status !== 'canceled'
    ) {
      actions.push({
        label: 'Rapprocher',
        icon: Banknote,
        onClick: () => {
          onRapprochement(invoice);
        },
        separatorBefore: true,
      });
    }

    if (!isArchived && onArchive) {
      actions.push({
        label: 'Archiver',
        icon: Archive,
        onClick: () => {
          void onArchive(invoice).catch(err =>
            console.error('[InvoiceActions] archive error:', err)
          );
        },
      });
    }

    if (isArchived && onUnarchive) {
      actions.push({
        label: 'Desarchiver',
        icon: ArchiveRestore,
        onClick: () => {
          void onUnarchive(invoice).catch(err =>
            console.error('[InvoiceActions] unarchive error:', err)
          );
        },
      });
    }
  }

  return (
    <ResponsiveActionMenu
      actions={actions}
      breakpoint="lg"
      align="end"
    />
  );
}
