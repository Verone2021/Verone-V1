'use client';

import { useState, useMemo } from 'react';

import { useCustomers } from '@verone/customers/hooks';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@verone/ui';
import { Popover, PopoverContent, PopoverTrigger } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { cn } from '@verone/utils';
import { Check, ChevronsUpDown, Building2, User, Loader2 } from 'lucide-react';

interface ClientAssignmentSelectorProps {
  value: string;
  onChange: (clientId: string, client: any) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export function ClientAssignmentSelector({
  value,
  onChange,
  label,
  placeholder = 'Sélectionner un client...',
  required = false,
  className,
}: ClientAssignmentSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Charger tous les clients (professionnels + particuliers)
  const { customers, loading } = useCustomers({
    customerType: 'all',
    is_active: true,
  });

  // Filtrer les clients selon la recherche
  const filteredCustomers = useMemo(() => {
    if (!search.trim()) return customers;
    const searchLower = search.toLowerCase();
    return customers.filter(
      customer =>
        customer.displayName.toLowerCase().includes(searchLower) ||
        customer.email?.toLowerCase().includes(searchLower)
    );
  }, [customers, search]);

  // Trouver le client sélectionné
  const selectedCustomer = useMemo(
    () => customers.find(c => c.id === value),
    [customers, value]
  );

  return (
    <div className={className}>
      {label && (
        <label className="text-sm font-medium text-gray-700 mb-1 block">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <ButtonV2
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              'w-full justify-between font-normal',
              !value && 'text-gray-500'
            )}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Chargement...
              </span>
            ) : selectedCustomer ? (
              <span className="flex items-center gap-2 truncate">
                {selectedCustomer.type === 'professional' ? (
                  <Building2 className="h-4 w-4 text-blue-500 flex-shrink-0" />
                ) : (
                  <User className="h-4 w-4 text-green-500 flex-shrink-0" />
                )}
                <span className="truncate">{selectedCustomer.displayName}</span>
              </span>
            ) : (
              placeholder
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </ButtonV2>
        </PopoverTrigger>

        <PopoverContent className="w-[400px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Rechercher un client..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>
                {loading ? 'Chargement...' : 'Aucun client trouvé'}
              </CommandEmpty>

              {/* Option pour effacer la sélection */}
              {value && (
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      onChange('', null);
                      setOpen(false);
                      setSearch('');
                    }}
                    className="text-gray-500"
                  >
                    <span className="ml-6">
                      Aucun client (sourcing interne)
                    </span>
                  </CommandItem>
                </CommandGroup>
              )}

              {/* Clients professionnels */}
              {filteredCustomers.filter(c => c.type === 'professional').length >
                0 && (
                <CommandGroup heading="Clients professionnels">
                  {filteredCustomers
                    .filter(c => c.type === 'professional')
                    .map(customer => (
                      <CommandItem
                        key={customer.id}
                        value={customer.id}
                        onSelect={() => {
                          onChange(customer.id, customer);
                          setOpen(false);
                          setSearch('');
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            value === customer.id ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        <Building2 className="mr-2 h-4 w-4 text-blue-500" />
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {customer.displayName}
                          </span>
                          {customer.email && (
                            <span className="text-xs text-gray-500">
                              {customer.email}
                            </span>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                </CommandGroup>
              )}

              {/* Clients particuliers */}
              {filteredCustomers.filter(c => c.type === 'individual').length >
                0 && (
                <CommandGroup heading="Clients particuliers">
                  {filteredCustomers
                    .filter(c => c.type === 'individual')
                    .map(customer => (
                      <CommandItem
                        key={customer.id}
                        value={customer.id}
                        onSelect={() => {
                          onChange(customer.id, customer);
                          setOpen(false);
                          setSearch('');
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            value === customer.id ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        <User className="mr-2 h-4 w-4 text-green-500" />
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {customer.displayName}
                          </span>
                          {customer.email && (
                            <span className="text-xs text-gray-500">
                              {customer.email}
                            </span>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
