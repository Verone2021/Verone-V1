'use client';

import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Textarea,
} from '@verone/ui';
import { AlertTriangle, Check } from 'lucide-react';

import type { LinkMeOrderDetails } from '../../../hooks/use-linkme-order-actions';
import type { OrderWithDetails } from './types';
import {
  getOrderMissingFields,
  generateCombinedMessage,
  CATEGORY_LABELS,
  REJECT_REASON_TEMPLATES,
  type MissingFieldCategory,
  type RejectReasonTemplate,
} from '../../../utils/order-missing-fields';

// ---- Approve Dialog ----

interface ApproveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
}

export function ApproveDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: ApproveDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Approuver la commande</DialogTitle>
          <DialogDescription>
            Un email sera envoye au proprietaire avec un lien pour completer
            l&apos;Etape 4 (informations de livraison).
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={() => {
              void Promise.resolve(onConfirm()).catch(error => {
                console.error('[ApproveDialog] Approve failed:', error);
              });
            }}
            disabled={isPending}
          >
            {isPending ? 'En cours...' : 'Confirmer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---- Request Info Dialog ----

interface RequestInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: OrderWithDetails;
  details: LinkMeOrderDetails | null;
  requestMessage: string;
  setRequestMessage: (msg: string) => void;
  selectedCategories: Set<MissingFieldCategory>;
  setSelectedCategories: (cats: Set<MissingFieldCategory>) => void;
  onSend: () => void;
  isPending: boolean;
}

export function RequestInfoDialog({
  open,
  onOpenChange,
  order,
  details,
  requestMessage,
  setRequestMessage,
  selectedCategories,
  setSelectedCategories,
  onSend,
  isPending,
}: RequestInfoDialogProps) {
  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (nextOpen) {
      // Auto-check missing categories on open
      const mf = getOrderMissingFields({
        details,
        organisationSiret: order.organisation?.siret,
        organisationCountry: order.organisation?.country,
        organisationVatNumber: order.organisation?.vat_number,
        ownerType: details?.owner_type,
      });
      const cats = new Set<MissingFieldCategory>(
        (Object.entries(mf.byCategory) as [MissingFieldCategory, unknown[]][])
          .filter(([, fields]) => fields.length > 0)
          .map(([cat]) => cat)
          .filter(
            (cat): cat is Exclude<MissingFieldCategory, 'custom'> =>
              cat !== 'custom'
          )
      );
      setSelectedCategories(cats);
      setRequestMessage(generateCombinedMessage(mf, cats));
    } else {
      setSelectedCategories(new Set());
      setRequestMessage('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Demander des complements</DialogTitle>
          <DialogDescription>
            Un email sera envoye au demandeur ({details?.requester_email}).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          {(() => {
            const missingFields = getOrderMissingFields({
              details,
              organisationSiret: order.organisation?.siret,
              organisationCountry: order.organisation?.country,
              organisationVatNumber: order.organisation?.vat_number,
              ownerType: details?.owner_type,
            });
            const relevantCategories = (
              Object.entries(missingFields.byCategory) as [
                MissingFieldCategory,
                unknown[],
              ][]
            )
              .filter(([cat, fields]) => cat !== 'custom' && fields.length > 0)
              .map(([cat]) => cat);

            return (
              <>
                {/* Missing fields summary */}
                {missingFields.total > 0 && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm font-medium text-amber-800">
                      <AlertTriangle className="h-4 w-4 inline mr-1" />
                      {missingFields.totalCategories} categorie(s) a completer (
                      {missingFields.total} champs)
                    </p>
                  </div>
                )}

                {/* Checkboxes per category */}
                <div className="space-y-2">
                  <Label>Categories a demander</Label>
                  <div className="grid grid-cols-1 gap-2">
                    {relevantCategories.map(category => (
                      <label
                        key={category}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedCategories.has(category)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <Checkbox
                          checked={selectedCategories.has(category)}
                          onCheckedChange={checked => {
                            const next = new Set(selectedCategories);
                            if (checked) {
                              next.add(category);
                            } else {
                              next.delete(category);
                            }
                            setSelectedCategories(next);
                            setRequestMessage(
                              generateCombinedMessage(missingFields, next)
                            );
                          }}
                          className="mt-0.5"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {CATEGORY_LABELS[category]}
                          </p>
                          <p className="text-xs text-gray-500">
                            {missingFields.byCategory[category]
                              .map(f => f.label)
                              .join(', ')}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            );
          })()}

          {/* Message (auto-generated or free) */}
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={requestMessage}
              onChange={e => setRequestMessage(e.target.value)}
              placeholder="Precisez les informations manquantes..."
              rows={8}
            />
            <p className="text-xs text-gray-500">
              Message auto-genere. Vous pouvez le modifier avant envoi.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={() => {
              void Promise.resolve(onSend()).catch(error => {
                console.error(
                  '[RequestInfoDialog] Request info failed:',
                  error
                );
              });
            }}
            disabled={isPending || !requestMessage.trim()}
          >
            {isPending ? 'En cours...' : 'Envoyer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---- Reject Dialog ----

interface RejectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  details: LinkMeOrderDetails | null;
  rejectReason: string;
  setRejectReason: (reason: string) => void;
  selectedRejectReason: string | null;
  setSelectedRejectReason: (id: string | null) => void;
  onReject: () => void;
  isPending: boolean;
}

export function RejectDialog({
  open,
  onOpenChange,
  details,
  rejectReason,
  setRejectReason,
  selectedRejectReason,
  setSelectedRejectReason,
  onReject,
  isPending,
}: RejectDialogProps) {
  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setSelectedRejectReason(null);
      setRejectReason('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Refuser la commande</DialogTitle>
          <DialogDescription>
            Un email sera envoye au demandeur ({details?.requester_email}).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          {/* Predefined reasons */}
          <div className="space-y-2">
            <Label>Motif du refus</Label>
            <div className="grid grid-cols-1 gap-2">
              {REJECT_REASON_TEMPLATES.map((reason: RejectReasonTemplate) => (
                <button
                  key={reason.id}
                  type="button"
                  className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                    selectedRejectReason === reason.id
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    setSelectedRejectReason(reason.id);
                    setRejectReason(reason.message);
                  }}
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">{reason.label}</p>
                  </div>
                  {selectedRejectReason === reason.id && (
                    <Check className="h-4 w-4 text-red-600 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Rejection message */}
          <div className="space-y-2">
            <Label htmlFor="reason">Message envoye au demandeur</Label>
            <Textarea
              id="reason"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Expliquez la raison du refus..."
              rows={5}
            />
            <p className="text-xs text-gray-500">
              Le message peut etre modifie avant envoi.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              void Promise.resolve(onReject()).catch(error => {
                console.error('[RejectDialog] Reject failed:', error);
              });
            }}
            disabled={isPending || !rejectReason.trim()}
          >
            {isPending ? 'En cours...' : 'Refuser'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
