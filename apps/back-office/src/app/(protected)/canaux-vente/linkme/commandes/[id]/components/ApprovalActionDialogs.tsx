'use client';

import { useState } from 'react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@verone/ui';

import type { LinkMeOrderDetails } from '../../../hooks/use-linkme-order-actions';
import type { CreatedByProfile, OrderWithDetails } from './types';
import {
  getOrderMissingFields,
  generateCombinedMessage,
  type MissingFieldCategory,
  type MissingFieldsResult,
} from '../../../utils/order-missing-fields';
import {
  RejectReasonSelector,
  RequestInfoContent,
  type Recipient,
} from './ApprovalDialogParts';

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

// ---- Helpers ----

function buildRecipients(
  createdByProfile: CreatedByProfile | null,
  details: LinkMeOrderDetails | null
): Recipient[] {
  const recipients: Recipient[] = [];
  if (createdByProfile?.email) {
    const name = [createdByProfile.first_name, createdByProfile.last_name]
      .filter(Boolean)
      .join(' ');
    recipients.push({
      email: createdByProfile.email,
      label: name || 'Utilisateur',
      type: 'Createur de la commande',
    });
  }
  if (
    details?.requester_email &&
    !recipients.some(r => r.email === details.requester_email)
  ) {
    recipients.push({
      email: details.requester_email,
      label: details.requester_name ?? 'Responsable',
      type: 'Responsable',
    });
  }
  if (
    details?.owner_email &&
    !recipients.some(r => r.email === details.owner_email)
  ) {
    recipients.push({
      email: details.owner_email,
      label: details.owner_name ?? 'Responsable (franchise)',
      type: 'Responsable (franchise)',
    });
  }
  return recipients;
}

function buildMissingFields(
  order: OrderWithDetails,
  details: LinkMeOrderDetails | null
): MissingFieldsResult {
  return getOrderMissingFields({
    details,
    organisationSiret: order.organisation?.siret,
    organisationCountry: order.organisation?.country,
    organisationVatNumber: order.organisation?.vat_number,
    organisationLegalName: order.organisation?.legal_name,
    organisationBillingAddress: order.organisation?.billing_address_line1,
    organisationBillingPostalCode: order.organisation?.billing_postal_code,
    organisationBillingCity: order.organisation?.billing_city,
    ownerType: details?.owner_type,
  });
}

function getRelevantCats(
  missingFields: MissingFieldsResult
): MissingFieldCategory[] {
  return (
    Object.entries(missingFields.byCategory) as [
      MissingFieldCategory,
      unknown[],
    ][]
  )
    .filter(([cat, fields]) => cat !== 'custom' && fields.length > 0)
    .map(([cat]) => cat);
}

// ---- Request Info Dialog ----

interface RequestInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: OrderWithDetails;
  details: LinkMeOrderDetails | null;
  createdByProfile: CreatedByProfile | null;
  requestMessage: string;
  setRequestMessage: (msg: string) => void;
  selectedCategories: Set<MissingFieldCategory>;
  setSelectedCategories: (cats: Set<MissingFieldCategory>) => void;
  selectedEmails: string[];
  setSelectedEmails: (emails: string[]) => void;
  onSend: () => void;
  isPending: boolean;
}

interface UseRequestInfoDialogArgs {
  availableRecipients: Recipient[];
  missingFields: MissingFieldsResult;
  relevantCategories: MissingFieldCategory[];
  selectedEmails: string[];
  setSelectedEmails: (emails: string[]) => void;
  setSelectedCategories: (cats: Set<MissingFieldCategory>) => void;
  setRequestMessage: (msg: string) => void;
  setManualEmail: (email: string) => void;
  onOpenChange: (open: boolean) => void;
}

function makeHandleOpenChange({
  availableRecipients,
  missingFields,
  relevantCategories,
  selectedEmails: _selectedEmails,
  setSelectedEmails,
  setSelectedCategories,
  setRequestMessage,
  setManualEmail,
  onOpenChange,
}: UseRequestInfoDialogArgs) {
  return (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (nextOpen) {
      const cats = new Set<MissingFieldCategory>(
        relevantCategories.filter(
          (cat): cat is Exclude<MissingFieldCategory, 'custom'> =>
            cat !== 'custom'
        )
      );
      setSelectedCategories(cats);
      setRequestMessage(generateCombinedMessage(missingFields, cats));
      if (availableRecipients.length > 0) {
        setSelectedEmails([availableRecipients[0].email]);
      }
    } else {
      setSelectedCategories(new Set());
      setRequestMessage('');
      setSelectedEmails([]);
      setManualEmail('');
    }
  };
}

export function RequestInfoDialog({
  open,
  onOpenChange,
  order,
  details,
  createdByProfile,
  requestMessage,
  setRequestMessage,
  selectedCategories,
  setSelectedCategories,
  selectedEmails,
  setSelectedEmails,
  onSend,
  isPending,
}: RequestInfoDialogProps) {
  const [manualEmail, setManualEmail] = useState('');
  const availableRecipients = buildRecipients(createdByProfile, details);
  const missingFields = buildMissingFields(order, details);
  const relevantCategories = getRelevantCats(missingFields);
  const canSend = requestMessage.trim().length > 0 && selectedEmails.length > 0;
  const handleOpenChange = makeHandleOpenChange({
    availableRecipients,
    missingFields,
    relevantCategories,
    selectedEmails,
    setSelectedEmails,
    setSelectedCategories,
    setRequestMessage,
    setManualEmail,
    onOpenChange,
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Demander des complements</DialogTitle>
          <DialogDescription>
            Selectionnez les destinataires et les informations a demander.
          </DialogDescription>
        </DialogHeader>
        <RequestInfoContent
          availableRecipients={availableRecipients}
          selectedEmails={selectedEmails}
          setSelectedEmails={setSelectedEmails}
          manualEmail={manualEmail}
          setManualEmail={setManualEmail}
          missingFields={missingFields}
          relevantCategories={relevantCategories}
          selectedCategories={selectedCategories}
          setSelectedCategories={setSelectedCategories}
          requestMessage={requestMessage}
          setRequestMessage={setRequestMessage}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={() => {
              void Promise.resolve(onSend()).catch(error => {
                console.error('[RequestInfoDialog] Send failed:', error);
              });
            }}
            disabled={isPending || !canSend}
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
          <RejectReasonSelector
            selectedRejectReason={selectedRejectReason}
            setSelectedRejectReason={setSelectedRejectReason}
            setRejectReason={setRejectReason}
            rejectReason={rejectReason}
          />
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
