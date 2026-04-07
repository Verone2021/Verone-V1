'use client';

import { Button } from '@verone/ui/components/ui/button';
import { Dialog, DialogContent } from '@verone/ui/components/ui/dialog';
import { Check, Loader2 } from 'lucide-react';

import { useOrganisationLinkingModal } from './hooks';
import type { IOrganisationLinkingModalProps } from './types';
import { ModalHeader } from './components/ModalHeader';
import { TypeSelector } from './components/TypeSelector';
import { CounterpartySearch } from './components/CounterpartySearch';
import { RuleCheckbox } from './components/RuleCheckbox';

export function OrganisationLinkingModal({
  open,
  onOpenChange,
  label,
  transactionCount = 0,
  totalAmount = 0,
  onSuccess,
  transactionSide = 'debit',
}: IOrganisationLinkingModalProps): React.JSX.Element {
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    selectedCounterparty,
    setSelectedCounterparty,
    isCreatingNew,
    setIsCreatingNew,
    newName,
    setNewName,
    newEmail,
    setNewEmail,
    counterpartyType,
    setCounterpartyType,
    isLoading,
    isSubmitting,
    createRule,
    setCreateRule,
    existingRule,
    canSubmit,
    isCredit,
    handleSubmit,
    formatAmount,
  } = useOrganisationLinkingModal({
    open,
    label,
    transactionSide,
    onSuccess,
    onOpenChange,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-lg overflow-hidden p-0"
        data-testid="modal-link-org"
      >
        <ModalHeader
          isCredit={isCredit}
          label={label}
          transactionCount={transactionCount}
          totalAmount={totalAmount}
          existingRule={existingRule}
          formatAmount={formatAmount}
        />

        <div className="space-y-6 px-6 py-6">
          {/* Type selection - masqué si contrepartie déjà sélectionnée */}
          {!selectedCounterparty && (
            <TypeSelector
              isCredit={isCredit}
              counterpartyType={counterpartyType}
              onTypeChange={setCounterpartyType}
            />
          )}

          <CounterpartySearch
            counterpartyType={counterpartyType}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            searchResults={searchResults}
            isLoading={isLoading}
            isCreatingNew={isCreatingNew}
            newName={newName}
            onNewNameChange={setNewName}
            newEmail={newEmail}
            onNewEmailChange={setNewEmail}
            selectedCounterparty={selectedCounterparty}
            onSelectCounterparty={c => {
              setSelectedCounterparty(c);
              setIsCreatingNew(false);
            }}
            onClearCounterparty={() => setSelectedCounterparty(null)}
            onStartCreating={name => {
              setIsCreatingNew(true);
              setNewName(name);
            }}
          />

          <RuleCheckbox
            createRule={createRule}
            onCreateRuleChange={setCreateRule}
          />
        </div>

        <div className="flex justify-between border-t bg-slate-50/50 px-6 py-4">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-slate-500"
          >
            Annuler
          </Button>

          <Button
            onClick={() => void handleSubmit()}
            disabled={
              isSubmitting ||
              !canSubmit ||
              Boolean(existingRule?.organisation_id)
            }
            className="gap-2 bg-blue-500 hover:bg-blue-600"
            title={
              existingRule?.organisation_id
                ? 'Organisation verrouillée par règle'
                : undefined
            }
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Check size={16} />
                Enregistrer
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
