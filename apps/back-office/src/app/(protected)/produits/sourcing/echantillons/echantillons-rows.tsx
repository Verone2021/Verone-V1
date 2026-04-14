'use client';

/**
 * Row components for the echantillons table (active + archived)
 */

import { CustomerBadge } from '@verone/customers';
import type { CustomerSample } from '@verone/customers';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@verone/ui';
import {
  Archive,
  ArchiveRestore,
  Building,
  Calendar,
  Eye,
  Package,
  RefreshCw,
  Trash2,
  Truck,
  User,
} from 'lucide-react';

import {
  getSampleTypeBadge,
  getStatusBadge,
  getStatusIcon,
} from './echantillons-badges';

// ---------------------------------------------------------------------------
// CustomerCell
// ---------------------------------------------------------------------------

interface CustomerCellProps {
  sample: CustomerSample;
}

function CustomerCell({ sample }: CustomerCellProps) {
  if (sample.sample_type === 'internal') {
    return (
      <Badge variant="outline" className="text-xs">
        Interne - Catalogue
      </Badge>
    );
  }
  return (
    <CustomerBadge
      organisationId={sample.customer_org_id}
      organisationLegalName={sample.customer_org_legal_name}
      organisationTradeName={sample.customer_org_trade_name}
      individualId={sample.customer_ind_id}
      individualFirstName={sample.customer_ind_first_name}
      individualLastName={sample.customer_ind_last_name}
      individualEmail={sample.customer_ind_email}
      compact
    />
  );
}

// ---------------------------------------------------------------------------
// SampleInfoGrid
// ---------------------------------------------------------------------------

interface SampleInfoGridProps {
  sample: CustomerSample;
  showArchivedDate?: boolean;
}

function SampleInfoGrid({
  sample,
  showArchivedDate = false,
}: SampleInfoGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
      <div className="flex items-center space-x-2">
        <Building className="h-4 w-4 text-gray-400" />
        <span className="text-gray-600">Fournisseur:</span>
        <span className="font-medium text-black">{sample.supplier_name}</span>
      </div>
      <div className="flex items-center space-x-2">
        <User className="h-4 w-4 text-gray-400" />
        <span className="text-gray-600">Client:</span>
        <CustomerCell sample={sample} />
      </div>
      <div className="flex items-center space-x-2">
        {showArchivedDate ? (
          <>
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">Archive le:</span>
            <span className="text-black">
              {sample.archived_at
                ? new Date(sample.archived_at).toLocaleDateString('fr-FR')
                : 'N/A'}
            </span>
          </>
        ) : (
          <>
            <Package className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">Quantite:</span>
            <span className="font-medium text-black">{sample.quantity}</span>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ArchiveButton
// ---------------------------------------------------------------------------

interface ArchiveButtonProps {
  sample: CustomerSample;
  onArchive: (id: string) => void;
}

function ArchiveButton({ sample, onArchive }: ArchiveButtonProps) {
  if (sample.po_status === 'draft') {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          void Promise.resolve(onArchive(sample.sample_id)).catch(err => {
            console.error('[EchantillonsPage] Archive failed:', err);
          });
        }}
        className="border-red-300 text-red-600 hover:bg-red-50"
      >
        <Archive className="h-4 w-4 mr-2" />
        Archiver
      </Button>
    );
  }
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            disabled
            className="border-gray-300 text-gray-400 cursor-not-allowed"
          >
            <Archive className="h-4 w-4 mr-2" />
            Archiver
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Impossible d'archiver : commande deja envoyee au fournisseur</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ---------------------------------------------------------------------------
// ActiveSampleRow
// ---------------------------------------------------------------------------

interface ActiveSampleRowProps {
  sample: CustomerSample;
  onArchive: (id: string) => void;
}

export function ActiveSampleRow({ sample, onArchive }: ActiveSampleRowProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {getStatusIcon(sample.sample_status)}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-black">
                {sample.product_name}
              </h3>
              {getSampleTypeBadge(sample.sample_type)}
            </div>
            <p className="text-sm text-gray-600">SKU: {sample.product_sku}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {getStatusBadge(sample.sample_status)}
        </div>
      </div>
      <SampleInfoGrid sample={sample} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span className="text-gray-600">Cree le:</span>
          <span className="text-black">
            {new Date(sample.sample_created_at).toLocaleDateString('fr-FR')}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Truck className="h-4 w-4 text-gray-400" />
          <span className="text-gray-600">PO:</span>
          <span className="text-black">{sample.po_number}</span>
          <Badge variant="outline" className="text-xs">
            {sample.po_status}
          </Badge>
        </div>
      </div>
      {sample.sample_notes && (
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 mb-4">
          <p className="text-sm text-blue-800">
            <strong>Notes:</strong> {sample.sample_notes}
          </p>
        </div>
      )}
      <div className="flex items-center justify-end pt-4 border-t border-gray-200 space-x-2">
        <Button variant="outline" size="sm" className="border-gray-300">
          <Eye className="h-4 w-4 mr-2" />
          Voir details
        </Button>
        <ArchiveButton sample={sample} onArchive={onArchive} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ArchivedSampleRow
// ---------------------------------------------------------------------------

interface ArchivedSampleRowProps {
  sample: CustomerSample;
  onReactivate: (id: string) => void;
  onReinsert: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ArchivedSampleRow({
  sample,
  onReactivate,
  onReinsert,
  onDelete,
}: ArchivedSampleRowProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Archive className="h-4 w-4 text-red-600" />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-black">
                {sample.product_name}
              </h3>
              {getSampleTypeBadge(sample.sample_type)}
              <Badge variant="outline" className="border-red-300 text-red-600">
                Archive
              </Badge>
            </div>
            <p className="text-sm text-gray-600">SKU: {sample.product_sku}</p>
          </div>
        </div>
      </div>
      <SampleInfoGrid sample={sample} showArchivedDate />
      <div className="flex items-center justify-end pt-4 border-t border-gray-200 space-x-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            void Promise.resolve(onReactivate(sample.sample_id)).catch(err => {
              console.error('[EchantillonsPage] Reactivate failed:', err);
            });
          }}
          className="border-green-300 text-green-600 hover:bg-green-50"
        >
          <ArchiveRestore className="h-4 w-4 mr-2" />
          Reactiver
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            void Promise.resolve(onReinsert(sample.sample_id)).catch(err => {
              console.error('[EchantillonsPage] Reinsert failed:', err);
            });
          }}
          className="border-blue-300 text-blue-600 hover:bg-blue-50"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Reinsérer dans PO
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onDelete(sample.sample_id)}
          className="border-red-500 text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Supprimer
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ActiveSamplesTab
// ---------------------------------------------------------------------------

interface ActiveSamplesTabProps {
  samples: CustomerSample[];
  onArchive: (id: string) => void;
}

export function ActiveSamplesTab({
  samples,
  onArchive,
}: ActiveSamplesTabProps) {
  return (
    <Card className="border-black">
      <CardHeader>
        <CardTitle className="text-black">
          Echantillons Actifs ({samples.length})
        </CardTitle>
        <CardDescription>Echantillons en cours ou commandes</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {samples.map(sample => (
            <ActiveSampleRow
              key={sample.sample_id}
              sample={sample}
              onArchive={onArchive}
            />
          ))}
          {samples.length === 0 && (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucun echantillon actif trouve</p>
              <p className="text-sm text-gray-500">
                Essayez de modifier vos filtres
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// ArchivedSamplesTab
// ---------------------------------------------------------------------------

interface ArchivedSamplesTabProps {
  samples: CustomerSample[];
  onReactivate: (id: string) => void;
  onReinsert: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ArchivedSamplesTab({
  samples,
  onReactivate,
  onReinsert,
  onDelete,
}: ArchivedSamplesTabProps) {
  return (
    <Card className="border-black">
      <CardHeader>
        <CardTitle className="text-black">
          Echantillons Archives ({samples.length})
        </CardTitle>
        <CardDescription>Echantillons annules ou retires</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {samples.map(sample => (
            <ArchivedSampleRow
              key={sample.sample_id}
              sample={sample}
              onReactivate={onReactivate}
              onReinsert={onReinsert}
              onDelete={onDelete}
            />
          ))}
          {samples.length === 0 && (
            <div className="text-center py-8">
              <Archive className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucun echantillon archive trouve</p>
              <p className="text-sm text-gray-500">
                Tous vos echantillons sont actifs
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// DeleteConfirmDialog
// ---------------------------------------------------------------------------

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
}: DeleteConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
          <AlertDialogDescription>
            Etes-vous sur de vouloir supprimer definitivement cet echantillon ?
            Cette action est irreversible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              void Promise.resolve(onConfirm()).catch(err => {
                console.error('[EchantillonsPage] Delete confirm failed:', err);
              });
            }}
            className="bg-red-600 hover:bg-red-700"
          >
            Supprimer definitivement
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
