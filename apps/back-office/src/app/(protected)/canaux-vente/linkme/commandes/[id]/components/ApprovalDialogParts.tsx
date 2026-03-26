'use client';

import { Button, Checkbox, Input, Label, Textarea } from '@verone/ui';
import { AlertTriangle, Check, Plus, X, User, Mail } from 'lucide-react';

import {
  generateCombinedMessage,
  CATEGORY_LABELS,
  REJECT_REASON_TEMPLATES,
  type MissingFieldCategory,
  type RejectReasonTemplate,
  type MissingFieldsResult,
} from '../../../utils/order-missing-fields';

// ---- Shared types ----

export interface Recipient {
  email: string;
  label: string;
  type: string;
}

// ---- Recipient list ----

interface RecipientListProps {
  availableRecipients: Recipient[];
  selectedEmails: string[];
  manualOnlyEmails: string[];
  onToggle: (email: string) => void;
  onRemoveManual: (email: string) => void;
}

export function RecipientList({
  availableRecipients,
  selectedEmails,
  manualOnlyEmails,
  onToggle,
  onRemoveManual,
}: RecipientListProps) {
  return (
    <>
      {availableRecipients.map(r => (
        <label
          key={r.email}
          className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors text-sm ${
            selectedEmails.includes(r.email)
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <Checkbox
            checked={selectedEmails.includes(r.email)}
            onCheckedChange={() => onToggle(r.email)}
          />
          <User className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="font-medium">{r.label}</span>
            <span className="text-gray-400 mx-1">·</span>
            <span className="text-gray-500">{r.type}</span>
          </div>
          <span className="text-xs text-gray-400 truncate">{r.email}</span>
        </label>
      ))}

      {manualOnlyEmails.map(email => (
        <div
          key={email}
          className="flex items-center gap-2 p-2 rounded-lg border border-blue-500 bg-blue-50 text-sm"
        >
          <Mail className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
          <span className="flex-1 text-sm">{email}</span>
          <button
            type="button"
            onClick={() => onRemoveManual(email)}
            className="text-gray-400 hover:text-red-500"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </>
  );
}

// ---- Manual email input ----

interface ManualEmailInputProps {
  manualEmail: string;
  setManualEmail: (email: string) => void;
  onAdd: () => void;
}

export function ManualEmailInput({
  manualEmail,
  setManualEmail,
  onAdd,
}: ManualEmailInputProps) {
  return (
    <div className="flex items-center gap-2">
      <Input
        type="email"
        placeholder="Ajouter un email..."
        value={manualEmail}
        onChange={e => setManualEmail(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onAdd();
          }
        }}
        className="flex-1 h-8 text-sm"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onAdd}
        disabled={!manualEmail.trim() || !manualEmail.includes('@')}
      >
        <Plus className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

// ---- Recipient Selector ----

interface RecipientSelectorProps {
  availableRecipients: Recipient[];
  selectedEmails: string[];
  setSelectedEmails: (emails: string[]) => void;
  manualEmail: string;
  setManualEmail: (email: string) => void;
}

export function RecipientSelector({
  availableRecipients,
  selectedEmails,
  setSelectedEmails,
  manualEmail,
  setManualEmail,
}: RecipientSelectorProps) {
  const toggleEmail = (email: string) => {
    if (selectedEmails.includes(email)) {
      setSelectedEmails(selectedEmails.filter(e => e !== email));
    } else {
      setSelectedEmails([...selectedEmails, email]);
    }
  };

  const addManualEmail = () => {
    const trimmed = manualEmail.trim();
    if (trimmed && trimmed.includes('@') && !selectedEmails.includes(trimmed)) {
      setSelectedEmails([...selectedEmails, trimmed]);
      setManualEmail('');
    }
  };

  const manualOnlyEmails = selectedEmails.filter(
    e => !availableRecipients.some(r => r.email === e)
  );

  return (
    <div className="space-y-2">
      <Label>Destinataires</Label>
      <div className="space-y-1.5">
        <RecipientList
          availableRecipients={availableRecipients}
          selectedEmails={selectedEmails}
          manualOnlyEmails={manualOnlyEmails}
          onToggle={toggleEmail}
          onRemoveManual={email =>
            setSelectedEmails(selectedEmails.filter(e => e !== email))
          }
        />
        <ManualEmailInput
          manualEmail={manualEmail}
          setManualEmail={setManualEmail}
          onAdd={addManualEmail}
        />
      </div>
    </div>
  );
}

// ---- Category Selector ----

interface CategorySelectorProps {
  missingFields: MissingFieldsResult;
  relevantCategories: MissingFieldCategory[];
  selectedCategories: Set<MissingFieldCategory>;
  setSelectedCategories: (cats: Set<MissingFieldCategory>) => void;
  setRequestMessage: (msg: string) => void;
}

export function CategorySelector({
  missingFields,
  relevantCategories,
  selectedCategories,
  setSelectedCategories,
  setRequestMessage,
}: CategorySelectorProps) {
  return (
    <>
      {missingFields.total > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm font-medium text-amber-800">
            <AlertTriangle className="h-4 w-4 inline mr-1" />
            {missingFields.totalCategories} categorie(s) a completer (
            {missingFields.total} champs)
          </p>
        </div>
      )}

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
}

// ---- Reject Reason Selector ----

interface RejectReasonSelectorProps {
  selectedRejectReason: string | null;
  setSelectedRejectReason: (id: string | null) => void;
  setRejectReason: (reason: string) => void;
  rejectReason: string;
}

export function RejectReasonSelector({
  selectedRejectReason,
  setSelectedRejectReason,
  setRejectReason,
  rejectReason,
}: RejectReasonSelectorProps) {
  return (
    <div className="space-y-4">
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
  );
}

// ---- Request Info Content (dialog body) ----

interface RequestInfoContentProps {
  availableRecipients: Recipient[];
  selectedEmails: string[];
  setSelectedEmails: (emails: string[]) => void;
  manualEmail: string;
  setManualEmail: (email: string) => void;
  missingFields: MissingFieldsResult;
  relevantCategories: MissingFieldCategory[];
  selectedCategories: Set<MissingFieldCategory>;
  setSelectedCategories: (cats: Set<MissingFieldCategory>) => void;
  requestMessage: string;
  setRequestMessage: (msg: string) => void;
}

export function RequestInfoContent({
  availableRecipients,
  selectedEmails,
  setSelectedEmails,
  manualEmail,
  setManualEmail,
  missingFields,
  relevantCategories,
  selectedCategories,
  setSelectedCategories,
  requestMessage,
  setRequestMessage,
}: RequestInfoContentProps) {
  return (
    <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
      <RecipientSelector
        availableRecipients={availableRecipients}
        selectedEmails={selectedEmails}
        setSelectedEmails={setSelectedEmails}
        manualEmail={manualEmail}
        setManualEmail={setManualEmail}
      />
      <CategorySelector
        missingFields={missingFields}
        relevantCategories={relevantCategories}
        selectedCategories={selectedCategories}
        setSelectedCategories={setSelectedCategories}
        setRequestMessage={setRequestMessage}
      />
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
  );
}
