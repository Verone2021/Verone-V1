'use client';

import { useState, useEffect, useMemo } from 'react';

import {
  Building2,
  Search,
  Plus,
  X,
  Check,
  Star,
  Loader2,
  Users,
} from 'lucide-react';

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
import { Checkbox } from '@verone/ui';
import { Badge } from '@verone/ui';
import { cn } from '@verone/utils';
import { createClient } from '@verone/utils/supabase/client';

import type { EnseigneOrganisation, Enseigne } from '../../hooks/use-enseignes';

interface OrganisationListItem {
  id: string;
  legal_name: string;
  trade_name: string | null;
  is_active: boolean | null;
  city: string | null;
  country: string | null;
  enseigne_id: string | null;
  is_enseigne_parent: boolean;
}

interface AssignOrganisationsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  enseigne: Enseigne | null;
  currentOrganisations: EnseigneOrganisation[];
  onAssign: (
    organisationId: string,
    isParent: boolean
  ) => Promise<boolean>;
  onUnassign: (organisationId: string) => Promise<boolean>;
  onSuccess?: () => void;
}

/**
 * Modal pour assigner/dissocier des organisations d'une enseigne
 * Permet de :
 * - Voir les organisations actuellement membres
 * - Rechercher des organisations disponibles (non liées à une enseigne)
 * - Assigner une organisation comme membre ou comme société mère
 * - Dissocier une organisation
 */
export function AssignOrganisationsModal({
  open,
  onOpenChange,
  enseigne,
  currentOrganisations,
  onAssign,
  onUnassign,
  onSuccess,
}: AssignOrganisationsModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [availableOrganisations, setAvailableOrganisations] = useState<
    OrganisationListItem[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  // Charger les organisations disponibles (sans enseigne)
  useEffect(() => {
    if (!open) return;

    const fetchAvailableOrganisations = async () => {
      setLoading(true);
      setError(null);

      try {
        let query = supabase
          .from('organisations')
          .select(
            'id, legal_name, trade_name, is_active, city, country, enseigne_id, is_enseigne_parent'
          )
          .is('enseigne_id', null)
          .eq('is_active', true)
          .order('legal_name', { ascending: true });

        if (searchQuery.trim()) {
          query = query.or(
            `legal_name.ilike.%${searchQuery}%,trade_name.ilike.%${searchQuery}%`
          );
        }

        const { data, error: fetchError } = await query.limit(50);

        if (fetchError) {
          setError(fetchError.message);
          return;
        }

        setAvailableOrganisations(data || []);
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
  }, [open, searchQuery]);

  // Check if there's already a parent organisation
  const hasParentOrganisation = useMemo(() => {
    return currentOrganisations.some(org => org.is_enseigne_parent);
  }, [currentOrganisations]);

  const handleAssign = async (orgId: string, asParent: boolean = false) => {
    setActionLoading(orgId);
    setError(null);

    try {
      const success = await onAssign(orgId, asParent);
      if (success) {
        // Retirer de la liste disponible
        setAvailableOrganisations(prev =>
          prev.filter(org => org.id !== orgId)
        );
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de l'attribution"
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnassign = async (orgId: string) => {
    setActionLoading(orgId);
    setError(null);

    try {
      const success = await onUnassign(orgId);
      if (success && onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erreur lors de la dissociation'
      );
    } finally {
      setActionLoading(null);
    }
  };

  const getDisplayName = (org: OrganisationListItem | EnseigneOrganisation) => {
    return org.trade_name || org.legal_name;
  };

  if (!enseigne) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center text-lg">
            <Users className="h-5 w-5 mr-2" />
            Gérer les organisations de "{enseigne.name}"
          </DialogTitle>
          <DialogDescription>
            Assignez ou dissociez des organisations de cette enseigne.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Section organisations actuelles */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-900 flex items-center">
            <Building2 className="h-4 w-4 mr-2" />
            Organisations membres ({currentOrganisations.length})
          </h4>

          {currentOrganisations.length === 0 ? (
            <p className="text-sm text-gray-500 italic py-4 text-center">
              Aucune organisation assignée
            </p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {currentOrganisations.map(org => (
                <div
                  key={org.id}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg border',
                    org.is_enseigne_parent
                      ? 'bg-amber-50 border-amber-200'
                      : 'bg-gray-50 border-gray-200'
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <Building2 className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">
                          {getDisplayName(org)}
                        </span>
                        {org.is_enseigne_parent && (
                          <Badge variant="warning" className="text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            Société mère
                          </Badge>
                        )}
                        {!org.is_active && (
                          <Badge variant="secondary" className="text-xs">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      {org.city && (
                        <span className="text-xs text-gray-500">
                          {org.city}
                          {org.country && `, ${org.country}`}
                        </span>
                      )}
                    </div>
                  </div>

                  <ButtonV2
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUnassign(org.id)}
                    disabled={actionLoading === org.id}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {actionLoading === org.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </ButtonV2>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Séparateur */}
        <div className="border-t my-2" />

        {/* Section ajouter organisations */}
        <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
          <h4 className="text-sm font-semibold text-gray-900 flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter des organisations
          </h4>

          {/* Recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher une organisation..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Liste organisations disponibles */}
          <div className="flex-1 overflow-y-auto space-y-2 min-h-[150px]">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : availableOrganisations.length === 0 ? (
              <p className="text-sm text-gray-500 italic py-8 text-center">
                {searchQuery
                  ? 'Aucune organisation trouvée'
                  : 'Toutes les organisations sont déjà assignées'}
              </p>
            ) : (
              availableOrganisations.map(org => (
                <div
                  key={org.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Building2 className="h-5 w-5 text-gray-400" />
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        {getDisplayName(org)}
                      </span>
                      {org.city && (
                        <span className="text-xs text-gray-500 block">
                          {org.city}
                          {org.country && `, ${org.country}`}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Bouton assigner comme membre */}
                    <ButtonV2
                      variant="outline"
                      size="sm"
                      onClick={() => handleAssign(org.id, false)}
                      disabled={actionLoading === org.id}
                    >
                      {actionLoading === org.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-1" />
                          Membre
                        </>
                      )}
                    </ButtonV2>

                    {/* Bouton assigner comme société mère (si pas déjà de parent) */}
                    {!hasParentOrganisation && (
                      <ButtonV2
                        variant="secondary"
                        size="sm"
                        onClick={() => handleAssign(org.id, true)}
                        disabled={actionLoading === org.id}
                      >
                        {actionLoading === org.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Star className="h-4 w-4 mr-1" />
                            Société mère
                          </>
                        )}
                      </ButtonV2>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <DialogFooter>
          <ButtonV2 variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </ButtonV2>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
