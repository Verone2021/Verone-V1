/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/prefer-nullish-coalescing */
'use client';

import { useState, useEffect, useMemo } from 'react';

import { useEnseignes, useOrganisations } from '@verone/organisations';
import type {
  EnseigneWithStats,
  EnseigneOrganisation,
} from '@verone/organisations';
import {
  Command,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandEmpty,
} from '@verone/ui';
import { Popover, PopoverTrigger, PopoverContent } from '@verone/ui';
import { Button } from '@verone/ui';
import { Badge } from '@verone/ui';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@verone/ui';
import { cn } from '@verone/utils';
import {
  Check,
  ChevronsUpDown,
  Store,
  Building2,
  X,
  Loader2,
} from 'lucide-react';

interface ClientOrEnseigneSelectorProps {
  enseigneId: string | null;
  organisationId: string | null;
  onEnseigneChange: (
    enseigneId: string | null,
    enseigneName: string | null,
    parentOrgId: string | null
  ) => void;
  onOrganisationChange: (
    organisationId: string | null,
    organisationName: string | null
  ) => void;
  disabled?: boolean;
  label?: string;
  required?: boolean;
  className?: string;
}

export function ClientOrEnseigneSelector({
  enseigneId,
  organisationId,
  onEnseigneChange,
  onOrganisationChange,
  disabled = false,
  label = 'Client destinataire',
  required = false,
  className,
}: ClientOrEnseigneSelectorProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'enseigne' | 'organisation'>(
    'enseigne'
  );

  const [selectedEnseigneData, setSelectedEnseigneData] =
    useState<EnseigneWithStats | null>(null);
  // État local pour stocker le nom sélectionné (évite le bug de timing avec le hook)
  const [selectedOrganisationName, setSelectedOrganisationName] = useState<
    string | null
  >(null);

  // Hooks pour récupérer les données
  const {
    enseignes,
    loading: enseignesLoading,
    getEnseigneById,
  } = useEnseignes({ is_active: true });
  // Filtrer uniquement les organisations indépendantes (sans enseigne)
  // Les organisations appartenant à une enseigne doivent être sélectionnées via l'onglet Enseignes
  const { organisations, loading: organisationsLoading } = useOrganisations({
    type: 'customer',
    customer_type: 'professional',
    is_active: true,
    exclude_with_enseigne: true, // Exclure les organisations liées à une enseigne
  });

  // Charger les détails de l'enseigne sélectionnée
  useEffect(() => {
    if (!enseigneId) {
      setSelectedEnseigneData(null);
      return;
    }

    const loadEnseigneDetails = async () => {
      const data = await getEnseigneById(enseigneId);
      setSelectedEnseigneData(data);
    };

    loadEnseigneDetails();
  }, [enseigneId, getEnseigneById]);

  // Données sélectionnées
  const selectedEnseigne = useMemo(() => {
    if (!enseigneId) return null;
    return enseignes.find(e => e.id === enseigneId);
  }, [enseigneId, enseignes]);

  const selectedOrganisation = useMemo(() => {
    if (!organisationId) return null;
    return organisations.find(org => org.id === organisationId);
  }, [organisationId, organisations]);

  // Trouver la société mère de l'enseigne sélectionnée
  const enseigneParentOrg = useMemo(() => {
    if (!selectedEnseigneData?.organisations) return null;
    return selectedEnseigneData.organisations.find(
      (org: EnseigneOrganisation) => org.is_enseigne_parent === true
    );
  }, [selectedEnseigneData]);

  // Synchroniser le nom local avec la liste chargée (après refetch parent)
  useEffect(() => {
    if (organisationId && selectedOrganisation) {
      setSelectedOrganisationName(selectedOrganisation.name);
    } else if (!organisationId) {
      setSelectedOrganisationName(null);
    }
  }, [organisationId, selectedOrganisation]);

  // Auto-switch tab based on selection
  useEffect(() => {
    if (enseigneId && !organisationId) {
      setActiveTab('enseigne');
    } else if (organisationId && !enseigneId) {
      setActiveTab('organisation');
    }
  }, [enseigneId, organisationId]);

  // Handlers
  const handleEnseigneSelect = (enseigne: (typeof enseignes)[0]) => {
    // Reset état local organisation
    setSelectedOrganisationName(null);
    // Un seul appel — le parent gère assigned_client_id: null
    // Le useEffect [enseigneId] charge les détails (société mère) automatiquement
    onEnseigneChange(enseigne.id, enseigne.name, null);
    setOpen(false);
  };

  const handleOrganisationSelect = (
    organisation: (typeof organisations)[0]
  ) => {
    // Stocker le nom localement pour l'affichage immédiat
    setSelectedOrganisationName(organisation.name);
    onOrganisationChange(organisation.id, organisation.name);
    // NE PAS appeler onEnseigneChange ici — le parent gère déjà enseigne_id: null
    setOpen(false);
  };

  const handleReset = () => {
    setSelectedOrganisationName(null);
    setSelectedEnseigneData(null);
    // Un seul appel suffit — le parent met les 2 champs à null
    onEnseigneChange(null, null, null);
    setOpen(false);
  };

  // Loading state
  const isLoading = enseignesLoading || organisationsLoading;

  // Display value - utilise le nom local stocké pour éviter les problèmes de timing
  const displayValue = useMemo(() => {
    if (selectedEnseigne) {
      return (
        <div className="flex items-center gap-2">
          <Store className="h-4 w-4 text-muted-foreground" />
          <span>{selectedEnseigne.name}</span>
        </div>
      );
    }
    // Utiliser le nom stocké localement OU celui trouvé dans la liste
    const orgName = selectedOrganisationName || selectedOrganisation?.name;
    if (organisationId && orgName) {
      return (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span>{orgName}</span>
        </div>
      );
    }
    return (
      <span className="text-muted-foreground">Sélectionner un client...</span>
    );
  }, [
    selectedEnseigne,
    selectedOrganisation,
    selectedOrganisationName,
    organisationId,
  ]);

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {/* Label */}
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}

      {/* Popover Selector */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              'w-full justify-between',
              !enseigneId && !organisationId && 'text-muted-foreground'
            )}
            disabled={disabled || isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Chargement...</span>
              </div>
            ) : (
              displayValue
            )}
            {(enseigneId || organisationId) && !disabled ? (
              <X
                className="ml-2 h-4 w-4 shrink-0 opacity-50 hover:opacity-100"
                onClick={e => {
                  e.stopPropagation();
                  handleReset();
                }}
              />
            ) : (
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Tabs
            value={activeTab}
            onValueChange={v => setActiveTab(v as typeof activeTab)}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="enseigne" className="flex items-center gap-2">
                <Store className="h-4 w-4" />
                Enseignes
              </TabsTrigger>
              <TabsTrigger
                value="organisation"
                className="flex items-center gap-2"
              >
                <Building2 className="h-4 w-4" />
                Organisations
              </TabsTrigger>
            </TabsList>

            {/* Enseigne Tab */}
            <TabsContent value="enseigne" className="m-0">
              <Command>
                <CommandInput placeholder="Rechercher une enseigne..." />
                <CommandList>
                  <CommandEmpty>Aucune enseigne trouvée.</CommandEmpty>
                  <CommandGroup>
                    {enseignes.map(enseigne => (
                      <CommandItem
                        key={enseigne.id}
                        value={enseigne.name}
                        onSelect={() => handleEnseigneSelect(enseigne)}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <Store className="h-4 w-4 text-muted-foreground" />
                          <span>{enseigne.name}</span>
                        </div>
                        <Check
                          className={cn(
                            'h-4 w-4',
                            enseigneId === enseigne.id
                              ? 'opacity-100'
                              : 'opacity-0'
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </TabsContent>

            {/* Organisation Tab */}
            <TabsContent value="organisation" className="m-0">
              <Command>
                <CommandInput placeholder="Rechercher une organisation..." />
                <CommandList>
                  <CommandEmpty>Aucune organisation trouvée.</CommandEmpty>
                  <CommandGroup>
                    {organisations.map(organisation => (
                      <CommandItem
                        key={organisation.id}
                        value={organisation.name}
                        onSelect={() => handleOrganisationSelect(organisation)}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span>{organisation.name}</span>
                        </div>
                        <Check
                          className={cn(
                            'h-4 w-4',
                            organisationId === organisation.id
                              ? 'opacity-100'
                              : 'opacity-0'
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </TabsContent>
          </Tabs>
        </PopoverContent>
      </Popover>

      {/* Summary Badge */}
      {(selectedEnseigne || organisationId) && (
        <div className="flex items-center gap-2 text-sm">
          {selectedEnseigne && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Store className="h-3 w-3" />
              Enseigne : {selectedEnseigne.name}
              {enseigneParentOrg && (
                <span className="ml-1 text-xs text-muted-foreground">
                  (Société mère :{' '}
                  {enseigneParentOrg.trade_name || enseigneParentOrg.legal_name}
                  )
                </span>
              )}
            </Badge>
          )}
          {organisationId &&
            (selectedOrganisationName || selectedOrganisation?.name) && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                Organisation :{' '}
                {selectedOrganisationName || selectedOrganisation?.name}
              </Badge>
            )}
        </div>
      )}
    </div>
  );
}

export default ClientOrEnseigneSelector;
