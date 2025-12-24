'use client';

import { useCallback, useEffect, useState } from 'react';

import { useToast } from '@verone/common/hooks';
import { Badge, Button, Checkbox, Input, Label, Separator } from '@verone/ui';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@verone/ui';
import { Popover, PopoverContent, PopoverTrigger } from '@verone/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { cn } from '@verone/utils';
import {
  Building2,
  Check,
  ChevronsUpDown,
  Loader2,
  Plus,
  Search,
  User,
} from 'lucide-react';

import {
  useCounterparties,
  type Counterparty,
  type CreateCounterpartyData,
} from '../hooks/use-counterparties';
import {
  EXPENSE_CATEGORIES,
  type Expense,
  type ExpenseCategory,
} from '../hooks/use-expenses';

// Types de rôles possibles (valeurs alignées avec contrainte DB)
const ROLE_TYPES = {
  debit: [
    { id: 'supplier', label: 'Fournisseur matériel' },
    { id: 'partner', label: 'Prestataire de service' },
  ],
  credit: [
    { id: 'customer', label: 'Client professionnel' },
    { id: 'customer', label: 'Client particulier' },
  ],
} as const;

// Type aligné avec contrainte DB: 'supplier', 'customer', 'partner', 'internal'
export type RoleType = 'supplier' | 'customer' | 'partner' | 'internal';

export interface ClassificationData {
  expenseId: string;
  counterpartyId: string | null;
  newCounterparty?: CreateCounterpartyData;
  roleType: RoleType;
  category: ExpenseCategory;
  notes?: string;
  createRule: boolean;
  applyToHistory: boolean;
}

interface ExpenseClassificationModalProps {
  expense: Expense | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClassify: (data: ClassificationData) => Promise<void>;
}

// Format montant en euros
function formatAmount(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(Math.abs(amount));
}

// Format date
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function ExpenseClassificationModal({
  expense,
  open,
  onOpenChange,
  onClassify,
}: ExpenseClassificationModalProps) {
  const { toast } = useToast();
  const { search, create } = useCounterparties();

  // État du formulaire
  const [selectedCounterparty, setSelectedCounterparty] =
    useState<Counterparty | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newCounterpartyName, setNewCounterpartyName] = useState('');
  const [newCounterpartyIban, setNewCounterpartyIban] = useState('');
  const [roleType, setRoleType] = useState<RoleType | ''>('');
  const [category, setCategory] = useState<ExpenseCategory | ''>('');
  const [notes, setNotes] = useState('');
  const [createRule, setCreateRule] = useState(false);
  const [applyToHistory, setApplyToHistory] = useState(false);

  // État de recherche counterparty
  const [counterpartySearchOpen, setCounterpartySearchOpen] = useState(false);
  const [counterpartySearch, setCounterpartySearch] = useState('');
  const [searchResults, setSearchResults] = useState<Counterparty[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // État de soumission
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Réinitialiser le formulaire quand l'expense change
  useEffect(() => {
    if (expense) {
      setSelectedCounterparty(null);
      setIsCreatingNew(false);
      setNewCounterpartyName(
        expense.transaction_counterparty_name || expense.label || ''
      );
      // Extraire l'IBAN depuis raw_data si disponible
      const rawData = expense.raw_data as { counterparty_iban?: string };
      setNewCounterpartyIban(rawData.counterparty_iban || '');
      setRoleType('');
      setCategory('');
      setNotes('');
      setCreateRule(false);
      setApplyToHistory(false);
      setCounterpartySearch('');
      setSearchResults([]);

      // Définir le rôle par défaut selon le type de transaction
      if (expense.side === 'debit') {
        setRoleType('supplier');
      } else {
        setRoleType('customer');
      }
    }
  }, [expense]);

  // Recherche de counterparties
  const handleCounterpartySearch = useCallback(
    async (query: string) => {
      setCounterpartySearch(query);
      if (query.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const results = await search(query);
        setSearchResults(results);
      } finally {
        setIsSearching(false);
      }
    },
    [search]
  );

  // Sélection d'une counterparty existante
  const handleSelectCounterparty = (counterparty: Counterparty) => {
    setSelectedCounterparty(counterparty);
    setIsCreatingNew(false);
    setCounterpartySearchOpen(false);
  };

  // Créer une nouvelle counterparty
  const handleCreateNewCounterparty = () => {
    setSelectedCounterparty(null);
    setIsCreatingNew(true);
    setCounterpartySearchOpen(false);
  };

  // Soumission du formulaire
  const handleSubmit = async () => {
    if (!expense) return;

    // Validation
    if (!isCreatingNew && !selectedCounterparty) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner ou créer un tiers.',
        variant: 'destructive',
      });
      return;
    }

    if (isCreatingNew && !newCounterpartyName.trim()) {
      toast({
        title: 'Erreur',
        description: 'Veuillez saisir le nom du nouveau tiers.',
        variant: 'destructive',
      });
      return;
    }

    if (!roleType) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner un type de rôle.',
        variant: 'destructive',
      });
      return;
    }

    if (!category) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner une catégorie.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let counterpartyId = selectedCounterparty?.id || null;

      // Si création d'une nouvelle counterparty
      if (isCreatingNew) {
        const newCounterparty = await create({
          display_name: newCounterpartyName.trim(),
          iban: newCounterpartyIban.trim() || undefined,
        });

        if (newCounterparty) {
          counterpartyId = newCounterparty.id;
        }
      }

      // Appeler le callback de classification
      await onClassify({
        expenseId: expense.id,
        counterpartyId,
        newCounterparty: isCreatingNew
          ? {
              display_name: newCounterpartyName.trim(),
              iban: newCounterpartyIban.trim() || undefined,
            }
          : undefined,
        roleType,
        category,
        notes: notes.trim() || undefined,
        createRule,
        applyToHistory,
      });

      toast({
        title: 'Dépense classée',
        description: `La dépense "${expense.label}" a été classée avec succès.`,
      });

      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Erreur',
        description:
          error instanceof Error ? error.message : 'Erreur lors du classement',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!expense) return null;

  const isDebit = expense.side === 'debit';
  const availableRoles = isDebit ? ROLE_TYPES.debit : ROLE_TYPES.credit;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dialogSize="lg" className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Classer la dépense</DialogTitle>
          <DialogDescription>
            Associez cette transaction à un tiers et catégorisez-la.
          </DialogDescription>
        </DialogHeader>

        {/* Résumé de la transaction */}
        <div className="bg-slate-50 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Date</span>
            <span className="text-sm font-medium">
              {formatDate(expense.emitted_at)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Libellé</span>
            <span className="text-sm font-medium max-w-[60%] text-right truncate">
              {expense.label}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Montant</span>
            <span
              className={cn(
                'text-sm font-semibold',
                isDebit ? 'text-red-600' : 'text-green-600'
              )}
            >
              {isDebit ? '-' : '+'}
              {formatAmount(expense.amount)}
            </span>
          </div>
          {expense.transaction_counterparty_name && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Tiers (bancaire)</span>
              <span className="text-sm font-medium">
                {expense.transaction_counterparty_name}
              </span>
            </div>
          )}
          {expense.has_attachment && (
            <Badge variant="outline" className="mt-2">
              Pièce jointe disponible
            </Badge>
          )}
        </div>

        <Separator />

        {/* Sélection du tiers */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>
              Tiers <span className="text-red-500">*</span>
            </Label>

            {!isCreatingNew ? (
              <Popover
                open={counterpartySearchOpen}
                onOpenChange={setCounterpartySearchOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={counterpartySearchOpen}
                    className="w-full justify-between"
                  >
                    {selectedCounterparty
                      ? selectedCounterparty.display_name
                      : 'Rechercher un tiers...'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Rechercher par nom..."
                      value={counterpartySearch}
                      onValueChange={handleCounterpartySearch}
                    />
                    <CommandList>
                      {isSearching && (
                        <div className="p-4 text-center">
                          <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                        </div>
                      )}
                      <CommandEmpty>
                        {counterpartySearch.length < 2
                          ? 'Tapez au moins 2 caractères...'
                          : 'Aucun tiers trouvé.'}
                      </CommandEmpty>
                      <CommandGroup heading="Résultats">
                        {searchResults.map(counterparty => (
                          <CommandItem
                            key={counterparty.id}
                            value={counterparty.id}
                            onSelect={() =>
                              handleSelectCounterparty(counterparty)
                            }
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                selectedCounterparty?.id === counterparty.id
                                  ? 'opacity-100'
                                  : 'opacity-0'
                              )}
                            />
                            <Building2 className="mr-2 h-4 w-4 text-slate-400" />
                            {counterparty.display_name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                      <Separator />
                      <CommandGroup>
                        <CommandItem onSelect={handleCreateNewCounterparty}>
                          <Plus className="mr-2 h-4 w-4" />
                          Créer un nouveau tiers
                        </CommandItem>
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            ) : (
              <div className="space-y-3 border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Nouveau tiers</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsCreatingNew(false)}
                  >
                    Annuler
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newCounterpartyName">
                    Nom <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="newCounterpartyName"
                    value={newCounterpartyName}
                    onChange={e => setNewCounterpartyName(e.target.value)}
                    placeholder="Nom du tiers"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newCounterpartyIban">IBAN (optionnel)</Label>
                  <Input
                    id="newCounterpartyIban"
                    value={newCounterpartyIban}
                    onChange={e => setNewCounterpartyIban(e.target.value)}
                    placeholder="FR76 1234 5678 9012 3456 7890 123"
                  />
                  <p className="text-xs text-slate-500">
                    L'IBAN permet un matching automatique fiable des futures
                    transactions.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Type de rôle */}
          <div className="space-y-2">
            <Label>
              Type de tiers <span className="text-red-500">*</span>
            </Label>
            <Select
              value={roleType}
              onValueChange={value => setRoleType(value as RoleType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un type..." />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map(role => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.id.includes('supplier') ||
                    role.id.includes('service') ? (
                      <Building2 className="inline mr-2 h-4 w-4" />
                    ) : (
                      <User className="inline mr-2 h-4 w-4" />
                    )}
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500">
              {isDebit
                ? 'Cette transaction est un débit (sortie de fonds).'
                : 'Cette transaction est un crédit (entrée de fonds).'}
            </p>
          </div>

          {/* Catégorie */}
          <div className="space-y-2">
            <Label>
              Catégorie <span className="text-red-500">*</span>
            </Label>
            <Select
              value={category}
              onValueChange={value => setCategory(value as ExpenseCategory)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une catégorie..." />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Input
              id="notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Notes supplémentaires..."
            />
          </div>

          <Separator />

          {/* Options de règle automatique */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="createRule"
                checked={createRule}
                onCheckedChange={checked => setCreateRule(checked === true)}
              />
              <Label htmlFor="createRule" className="cursor-pointer">
                Créer une règle automatique pour ce tiers
              </Label>
            </div>

            {createRule && (
              <div className="ml-6 space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="applyToHistory"
                    checked={applyToHistory}
                    onCheckedChange={checked =>
                      setApplyToHistory(checked === true)
                    }
                  />
                  <Label htmlFor="applyToHistory" className="cursor-pointer">
                    Appliquer à l'historique des transactions
                  </Label>
                </div>
                <p className="text-xs text-slate-500">
                  {newCounterpartyIban
                    ? "La règle sera basée sur l'IBAN (matching le plus fiable)."
                    : 'La règle sera basée sur le nom du tiers.'}
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Classement...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                {createRule ? 'Classer + Créer règle' : 'Classer'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
