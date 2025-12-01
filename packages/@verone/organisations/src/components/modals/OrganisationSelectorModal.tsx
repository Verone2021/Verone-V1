'use client';

/**
 * OrganisationSelectorModal - Modal deux colonnes pour gestion enseignes
 *
 * Design moderne avec layout 2 colonnes (dual-pane selector pattern)
 * - Colonne gauche: Organisations disponibles avec recherche
 * - Colonne droite: Organisations sélectionnées avec société mère
 *
 * Features:
 * - Recherche simple avec debounce
 * - Désignation société mère (1 seule par enseigne)
 * - Micro-interactions fluides
 * - Design System V2 colors
 *
 * @module OrganisationSelectorModal
 */

import { useState, useEffect, useMemo, useCallback } from 'react';

import { ButtonV2 } from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@verone/ui';
import { Input } from '@verone/ui';
import { Badge } from '@verone/ui';
import { cn } from '@verone/utils';
import { createClient } from '@verone/utils/supabase/client';
import {
  Building2,
  Search,
  Plus,
  X,
  Star,
  Loader2,
  Users,
  MapPin,
  ChevronRight,
  Check,
} from 'lucide-react';

import type { EnseigneOrganisation, Enseigne } from '../../hooks/use-enseignes';
import { OrganisationLogo } from '../display/OrganisationLogo';

// ============================================================================
// TYPES
// ============================================================================

interface OrganisationListItem {
  id: string;
  legal_name: string;
  trade_name: string | null;
  is_active: boolean | null;
  city: string | null;
  country: string | null;
  enseigne_id: string | null;
  is_enseigne_parent: boolean;
  type: string;
  logo_url: string | null;
}

interface SelectedOrganisation {
  id: string;
  legal_name: string;
  trade_name: string | null;
  is_active: boolean | null;
  city: string | null;
  country: string | null;
  is_enseigne_parent: boolean;
  logo_url: string | null;
}

interface OrganisationSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  enseigne: Enseigne | null;
  currentOrganisations: EnseigneOrganisation[];
  onSave: (
    organisationIds: string[],
    parentId: string | null
  ) => Promise<boolean>;
  onSuccess?: () => void;
}

// ============================================================================
// COMPOSANTS INTERNES
// ============================================================================

/**
 * Skeleton pour la liste d'organisations
 */
function OrganisationSkeleton() {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 animate-pulse">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gray-200 rounded-lg" />
        <div className="space-y-2">
          <div className="w-32 h-4 bg-gray-200 rounded" />
          <div className="w-20 h-3 bg-gray-200 rounded" />
        </div>
      </div>
      <div className="w-8 h-8 bg-gray-200 rounded" />
    </div>
  );
}

/**
 * Item organisation disponible (colonne gauche)
 */
function AvailableOrganisationItem({
  organisation,
  onAdd,
  loading,
}: {
  organisation: OrganisationListItem;
  onAdd: () => void;
  loading: boolean;
}) {
  const displayName = organisation.trade_name || organisation.legal_name;

  return (
    <div
      className={cn(
        'flex items-center justify-between p-3 rounded-lg border border-gray-200',
        'hover:border-gray-300 hover:bg-gray-50 transition-all duration-200',
        'group cursor-pointer'
      )}
      onClick={onAdd}
    >
      <div className="flex items-center gap-3 min-w-0">
        <OrganisationLogo
          logoUrl={organisation.logo_url}
          organisationName={organisation.legal_name}
          size="sm"
          fallback="initials"
          className="flex-shrink-0"
        />
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {displayName}
          </p>
          {organisation.city && (
            <p className="text-xs text-gray-500 flex items-center">
              <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="truncate">
                {organisation.city}
                {organisation.country && `, ${organisation.country}`}
              </span>
            </p>
          )}
        </div>
      </div>

      <ButtonV2
        variant="ghost"
        size="sm"
        disabled={loading}
        className="opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={e => {
          e.stopPropagation();
          onAdd();
        }}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
      </ButtonV2>
    </div>
  );
}

/**
 * Item organisation sélectionnée (colonne droite)
 */
function SelectedOrganisationItem({
  organisation,
  isParent,
  onRemove,
  onSetParent,
  canSetParent,
  loading,
}: {
  organisation: SelectedOrganisation;
  isParent: boolean;
  onRemove: () => void;
  onSetParent: () => void;
  canSetParent: boolean;
  loading: boolean;
}) {
  const displayName = organisation.trade_name || organisation.legal_name;

  return (
    <div
      className={cn(
        'flex items-center justify-between p-3 rounded-lg border transition-all duration-200',
        isParent
          ? 'bg-amber-50 border-amber-200 shadow-sm'
          : 'bg-white border-gray-200 hover:border-gray-300'
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <OrganisationLogo
          logoUrl={organisation.logo_url}
          organisationName={organisation.legal_name}
          size="sm"
          fallback="initials"
          className="flex-shrink-0"
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-gray-900 truncate">
              {displayName}
            </p>
            {isParent && (
              <Badge variant="warning" className="text-xs flex-shrink-0">
                Mère
              </Badge>
            )}
          </div>
          {organisation.city && (
            <p className="text-xs text-gray-500 flex items-center">
              <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="truncate">
                {organisation.city}
                {organisation.country && `, ${organisation.country}`}
              </span>
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-1 flex-shrink-0">
        {/* Bouton pour définir comme société mère */}
        {!isParent && canSetParent && (
          <ButtonV2
            variant="ghost"
            size="sm"
            onClick={onSetParent}
            disabled={loading}
            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
            title="Définir comme société mère"
          >
            <Star className="h-4 w-4" />
          </ButtonV2>
        )}

        {/* Bouton supprimer */}
        <ButtonV2
          variant="ghost"
          size="sm"
          onClick={onRemove}
          disabled={loading}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <X className="h-4 w-4" />
          )}
        </ButtonV2>
      </div>
    </div>
  );
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

/**
 * Modal pour gérer les organisations d'une enseigne
 * Layout deux colonnes: disponibles | sélectionnées
 */
export function OrganisationSelectorModal({
  open,
  onOpenChange,
  enseigne,
  currentOrganisations,
  onSave,
  onSuccess,
}: OrganisationSelectorModalProps) {
  // États locaux
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [availableOrganisations, setAvailableOrganisations] = useState<
    OrganisationListItem[]
  >([]);
  const [selectedOrganisations, setSelectedOrganisations] = useState<
    SelectedOrganisation[]
  >([]);
  const [parentId, setParentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const supabase = createClient();

  // Debounce de la recherche (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Initialiser les organisations sélectionnées depuis currentOrganisations
  useEffect(() => {
    if (open && currentOrganisations) {
      const selected: SelectedOrganisation[] = currentOrganisations.map(
        org => ({
          id: org.id,
          legal_name: org.legal_name,
          trade_name: org.trade_name,
          is_active: org.is_active,
          city: org.city,
          country: org.country,
          is_enseigne_parent: org.is_enseigne_parent,
          logo_url: org.logo_url ?? null,
        })
      );
      setSelectedOrganisations(selected);

      // Trouver la société mère
      const parent = currentOrganisations.find(org => org.is_enseigne_parent);
      setParentId(parent?.id || null);

      setHasChanges(false);
    }
  }, [open, currentOrganisations]);

  // Charger les organisations disponibles
  useEffect(() => {
    if (!open) return;

    const fetchAvailableOrganisations = async () => {
      setLoading(true);
      setError(null);

      try {
        // Filtrer uniquement les organisations clientes (type = 'customer')
        // Les fournisseurs et autres types ne peuvent pas être membres d'une enseigne
        let query = (supabase as any)
          .from('organisations')
          .select(
            'id, legal_name, trade_name, is_active, city, country, enseigne_id, is_enseigne_parent, type, logo_url'
          )
          .eq('type', 'customer')
          .is('enseigne_id', null)
          .eq('is_active', true)
          .order('legal_name', { ascending: true });

        if (debouncedSearch.trim()) {
          query = query.or(
            `legal_name.ilike.%${debouncedSearch}%,trade_name.ilike.%${debouncedSearch}%,city.ilike.%${debouncedSearch}%`
          );
        }

        const { data, error: fetchError } = await query.limit(100);

        if (fetchError) {
          setError(fetchError.message);
          return;
        }

        // Double vérification côté client : ne garder que les customers
        // (car le .or() peut annuler les filtres précédents)
        const filteredData: OrganisationListItem[] = ((data as any[]) || [])
          .filter(org => org.type === 'customer')
          .map(org => ({
            ...org,
            type: org.type ?? 'customer', // Garantir que type est non-null
          }));
        setAvailableOrganisations(filteredData);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Erreur lors de la récupération des organisations'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableOrganisations();
  }, [open, debouncedSearch]);

  // IDs des organisations déjà sélectionnées
  const selectedIds = useMemo(
    () => new Set(selectedOrganisations.map(org => org.id)),
    [selectedOrganisations]
  );

  // Filtrer les organisations disponibles (exclure celles déjà sélectionnées)
  const filteredAvailable = useMemo(
    () => availableOrganisations.filter(org => !selectedIds.has(org.id)),
    [availableOrganisations, selectedIds]
  );

  // Ajouter une organisation à la sélection
  const handleAdd = useCallback((org: OrganisationListItem) => {
    setSelectedOrganisations(prev => [
      ...prev,
      {
        id: org.id,
        legal_name: org.legal_name,
        trade_name: org.trade_name,
        is_active: org.is_active,
        city: org.city,
        country: org.country,
        is_enseigne_parent: false,
        logo_url: org.logo_url,
      },
    ]);
    setHasChanges(true);
  }, []);

  // Retirer une organisation de la sélection
  const handleRemove = useCallback(
    (orgId: string) => {
      setSelectedOrganisations(prev => prev.filter(org => org.id !== orgId));
      // Si c'était la société mère, reset
      if (parentId === orgId) {
        setParentId(null);
      }
      setHasChanges(true);
    },
    [parentId]
  );

  // Définir comme société mère
  const handleSetParent = useCallback((orgId: string) => {
    setParentId(orgId);
    setHasChanges(true);
  }, []);

  // Sauvegarder les changements
  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const organisationIds = selectedOrganisations.map(org => org.id);
      const success = await onSave(organisationIds, parentId);

      if (success) {
        onSuccess?.();
        onOpenChange(false);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erreur lors de la sauvegarde'
      );
    } finally {
      setSaving(false);
    }
  };

  // Reset et fermer
  const handleClose = () => {
    setSearchQuery('');
    setError(null);
    onOpenChange(false);
  };

  if (!enseigne) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[85vh] flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center text-lg">
            <Users className="h-5 w-5 mr-2" />
            Gérer les organisations de "{enseigne.name}"
          </DialogTitle>
          <DialogDescription>
            Ajoutez ou retirez des organisations de cette enseigne. Vous pouvez
            également désigner une société mère.
          </DialogDescription>
        </DialogHeader>

        {/* Erreur */}
        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Corps - Deux colonnes */}
        <div className="flex-1 grid grid-cols-2 gap-0 min-h-0">
          {/* Colonne Gauche - Organisations Disponibles */}
          <div className="border-r flex flex-col min-h-0">
            <div className="px-4 py-3 border-b bg-gray-50 flex-shrink-0">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Organisations disponibles
              </h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par nom ou ville..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto">
              <div className="p-4 space-y-2">
                {loading ? (
                  <>
                    <OrganisationSkeleton />
                    <OrganisationSkeleton />
                    <OrganisationSkeleton />
                  </>
                ) : filteredAvailable.length === 0 ? (
                  <div className="py-12 text-center">
                    <Building2 className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                    <p className="text-sm text-gray-500">
                      {debouncedSearch
                        ? 'Aucune organisation trouvée'
                        : 'Toutes les organisations sont assignées'}
                    </p>
                  </div>
                ) : (
                  filteredAvailable.map(org => (
                    <AvailableOrganisationItem
                      key={org.id}
                      organisation={org}
                      onAdd={() => handleAdd(org)}
                      loading={actionLoading === org.id}
                    />
                  ))
                )}
              </div>
            </div>

            <div className="px-4 py-2 border-t bg-gray-50 text-xs text-gray-500 flex-shrink-0">
              {filteredAvailable.length} organisation(s) disponible(s)
            </div>
          </div>

          {/* Colonne Droite - Organisations Sélectionnées */}
          <div className="flex flex-col min-h-0">
            <div className="px-4 py-3 border-b bg-gray-50 flex-shrink-0">
              <h3 className="text-sm font-semibold text-gray-900">
                Organisations de l'enseigne
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Cliquez sur l'étoile pour définir la société mère
              </p>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto">
              <div className="p-4 space-y-2">
                {selectedOrganisations.length === 0 ? (
                  <div className="py-12 text-center">
                    <Users className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                    <p className="text-sm text-gray-500">
                      Aucune organisation sélectionnée
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Ajoutez des organisations depuis la colonne de gauche
                    </p>
                  </div>
                ) : (
                  // Afficher société mère en premier si elle existe
                  [...selectedOrganisations]
                    .sort((a, b) => {
                      if (a.id === parentId) return -1;
                      if (b.id === parentId) return 1;
                      return 0;
                    })
                    .map(org => (
                      <SelectedOrganisationItem
                        key={org.id}
                        organisation={org}
                        isParent={org.id === parentId}
                        onRemove={() => handleRemove(org.id)}
                        onSetParent={() => handleSetParent(org.id)}
                        canSetParent={parentId !== org.id}
                        loading={actionLoading === org.id}
                      />
                    ))
                )}
              </div>
            </div>

            <div className="px-4 py-2 border-t bg-gray-50 flex items-center justify-between flex-shrink-0">
              <span className="text-xs text-gray-500">
                {selectedOrganisations.length} organisation(s) sélectionnée(s)
              </span>
              {parentId && (
                <Badge variant="warning" className="text-xs">
                  <Star className="h-3 w-3 mr-1" />1 société mère
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t bg-gray-50">
          <div className="flex items-center justify-between w-full">
            <div className="text-xs text-gray-500">
              {hasChanges && (
                <span className="text-amber-600 font-medium">
                  Modifications non sauvegardées
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <ButtonV2 variant="outline" onClick={handleClose}>
                Annuler
              </ButtonV2>
              <ButtonV2 onClick={handleSave} disabled={saving || !hasChanges}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Enregistrer
                  </>
                )}
              </ButtonV2>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
