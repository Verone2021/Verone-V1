'use client';

import React, { useState } from 'react';

import { ExternalLink, Truck } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@verone/ui/components/ui/alert-dialog';
import { Badge } from '@verone/ui/components/ui/badge';
import { Button } from '@verone/ui/components/ui/button';
import { Checkbox } from '@verone/ui/components/ui/checkbox';
import { Input } from '@verone/ui/components/ui/input';
import { Label } from '@verone/ui/components/ui/label';
import { Textarea } from '@verone/ui/components/ui/textarea';
import { cn } from '@verone/utils';

import {
  useSupplierAvailability,
  type SupplierAvailabilityStatus,
} from '../../hooks/use-supplier-availability';

// ============================================================================
// TYPES
// ============================================================================

interface SupplierAvailabilitySectionProps {
  productId: string;
  className?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

function StatusBadge({ status }: { status: SupplierAvailabilityStatus }) {
  if (status === 'available') {
    return (
      <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
        Encore disponible
      </Badge>
    );
  }
  if (status === 'unavailable') {
    return (
      <Badge variant="destructive" className="text-xs">
        Plus disponible
      </Badge>
    );
  }
  return (
    <Badge className="bg-orange-100 text-orange-800 border-orange-200 text-xs">
      À re-vérifier
    </Badge>
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return 'Jamais';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(iso));
}

// ============================================================================
// COMPONENT
// ============================================================================

export function SupplierAvailabilitySection({
  productId,
  className,
}: SupplierAvailabilitySectionProps) {
  const {
    status,
    lastCheckedAt,
    notes,
    supplierPageUrl,
    needsRecheck,
    daysSinceCheck,
    loading,
    saving,
    error,
    updateStatus,
    setUrl,
    refresh: _refresh,
  } = useSupplierAvailability(productId);

  // Local state
  const [localNotes, setLocalNotes] = useState('');
  const [localUrl, setLocalUrl] = useState('');
  const [urlEditing, setUrlEditing] = useState(false);
  const [unavailableDialogOpen, setUnavailableDialogOpen] = useState(false);
  const [alsoMarkDiscontinued, setAlsoMarkDiscontinued] = useState(true);

  React.useEffect(() => {
    if (!loading) {
      setLocalNotes(notes ?? '');
      setLocalUrl(supplierPageUrl ?? '');
      setUrlEditing(!supplierPageUrl);
    }
  }, [loading, notes, supplierPageUrl]);

  const handleMarkUnavailable = () => {
    setUnavailableDialogOpen(true);
  };

  const confirmUnavailable = () => {
    void updateStatus('unavailable', {
      notes: localNotes.trim() || null,
      alsoMarkDiscontinued,
    }).catch(err =>
      console.error('[SupplierAvailabilitySection] unavailable failed:', err)
    );
    setUnavailableDialogOpen(false);
  };

  const handleMarkAvailable = () => {
    void updateStatus('available', { notes: localNotes.trim() || null }).catch(
      err =>
        console.error('[SupplierAvailabilitySection] available failed:', err)
    );
  };

  const handleMarkToCheck = () => {
    void updateStatus('to_check', { notes: localNotes.trim() || null }).catch(
      err =>
        console.error('[SupplierAvailabilitySection] to_check failed:', err)
    );
  };

  const handleSaveUrl = () => {
    void setUrl(localUrl.trim() || null).catch(err =>
      console.error('[SupplierAvailabilitySection] setUrl failed:', err)
    );
    setUrlEditing(false);
  };

  if (loading) {
    return (
      <div
        className={cn(
          'rounded-lg border border-gray-200 bg-white p-4 shadow-sm',
          className
        )}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
            <Truck className="h-4 w-4 text-blue-600" />
          </div>
          <h3 className="font-medium text-gray-900">
            Disponibilité fournisseur
          </h3>
        </div>
        <p className="text-sm text-gray-400">Chargement…</p>
      </div>
    );
  }

  return (
    <>
      <div
        className={cn(
          'rounded-lg border border-gray-200 bg-white p-4 shadow-sm',
          className
        )}
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
              <Truck className="h-4 w-4 text-blue-600" />
            </div>
            <h3 className="font-medium text-gray-900">
              Disponibilité fournisseur
            </h3>
          </div>
          <StatusBadge status={status} />
        </div>

        {/* Alerte relance > 90 j */}
        {needsRecheck && (
          <div className="mb-3 rounded-md bg-orange-50 border border-orange-200 px-3 py-2">
            <p className="text-xs text-orange-700">
              {daysSinceCheck === null
                ? 'Jamais vérifié — pense à contacter le fournisseur.'
                : `Dernière vérification il y a ${daysSinceCheck} jours — relance recommandée.`}
            </p>
          </div>
        )}

        {/* Date + auteur */}
        <p className="mb-3 text-xs text-gray-500">
          Dernière vérification : {formatDate(lastCheckedAt)}
        </p>

        {/* Lien fournisseur */}
        <div className="mb-4">
          {supplierPageUrl && !urlEditing ? (
            <div className="flex items-center gap-2">
              <a
                href={supplierPageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-blue-600 hover:underline truncate max-w-[200px]"
                title={supplierPageUrl}
              >
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                Page fournisseur
              </a>
              <button
                type="button"
                onClick={() => setUrlEditing(true)}
                className="text-xs text-gray-400 hover:text-gray-600 underline"
              >
                Modifier
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Input
                value={localUrl}
                onChange={e => setLocalUrl(e.target.value)}
                placeholder="https://fournisseur.com/produit/…"
                className="h-8 flex-1 text-sm"
                disabled={saving}
              />
              <Button
                size="sm"
                onClick={handleSaveUrl}
                disabled={saving}
                className="h-8 shrink-0"
              >
                Enregistrer
              </Button>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="mb-4 space-y-1">
          <Label className="text-xs text-gray-600">Notes (optionnel)</Label>
          <Textarea
            value={localNotes}
            onChange={e => setLocalNotes(e.target.value)}
            placeholder="Informations utiles pour la prochaine vérification…"
            rows={2}
            className="resize-none text-sm"
            disabled={saving}
          />
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            size="sm"
            variant={status === 'available' ? 'default' : 'outline'}
            onClick={handleMarkAvailable}
            disabled={saving}
            className="flex-1 min-h-[44px] md:min-h-[36px]"
          >
            Encore dispo
          </Button>
          <Button
            size="sm"
            variant={status === 'unavailable' ? 'destructive' : 'outline'}
            onClick={handleMarkUnavailable}
            disabled={saving}
            className="flex-1 min-h-[44px] md:min-h-[36px]"
          >
            Plus dispo
          </Button>
          <Button
            size="sm"
            variant={status === 'to_check' ? 'secondary' : 'outline'}
            onClick={handleMarkToCheck}
            disabled={saving}
            className="flex-1 min-h-[44px] md:min-h-[36px]"
          >
            À re-vérifier
          </Button>
        </div>

        {error && <p className="mt-2 text-xs text-red-600">Erreur : {error}</p>}
      </div>

      {/* AlertDialog — confirmation "Plus dispo" */}
      <AlertDialog
        open={unavailableDialogOpen}
        onOpenChange={setUnavailableDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Marquer le produit comme arrêté ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Le fournisseur ne fait plus cette référence. Tu peux aussi passer
              le produit en « Arrêté » dans le catalogue. Cela mettra min_stock
              à 0 et désactivera les alertes stock.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex items-center gap-2 px-1 py-2">
            <Checkbox
              id="also-discontinued"
              checked={alsoMarkDiscontinued}
              onCheckedChange={v => setAlsoMarkDiscontinued(Boolean(v))}
            />
            <Label
              htmlFor="also-discontinued"
              className="text-sm font-normal cursor-pointer"
            >
              Passer aussi le produit en Arrêté
            </Label>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmUnavailable}
              className="bg-destructive hover:bg-destructive/90"
            >
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
