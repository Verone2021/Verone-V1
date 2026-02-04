'use client';

import { useEffect, useState, useMemo } from 'react';

import type { Database } from '@verone/types';

import { useToast } from '@verone/common';
import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@verone/ui';
import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { Skeleton } from '@verone/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import {
  Plus,
  Search,
  Building2,
  User,
  CheckCircle,
  Clock,
  XCircle,
  Edit,
  Trash2,
  Store,
  Briefcase,
} from 'lucide-react';

interface Affiliate {
  id: string;
  organisation_id: string | null;
  enseigne_id: string | null;
  affiliate_type: string; // 'enseigne' | 'client_professionnel' | 'client_particulier'
  display_name: string;
  slug: string;
  logo_url: string | null;
  bio: string | null;
  default_margin_rate: number | null;
  linkme_commission_rate: number | null;
  status: string | null; // 'pending' | 'active' | 'suspended' - relaxed for Supabase types
  verified_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  // Joined data
  organisation_name?: string | null;
  enseigne_name?: string | null;
}

interface Organisation {
  id: string;
  legal_name: string;
  trade_name: string | null;
  logo_url: string | null;
}

type AffiliateRow = Database['public']['Tables']['linkme_affiliates']['Row'];
type AffiliateInsert =
  Database['public']['Tables']['linkme_affiliates']['Insert'];
type AffiliateUpdate =
  Database['public']['Tables']['linkme_affiliates']['Update'];
type AffiliateWithOrg = AffiliateRow & {
  organisations: {
    legal_name: string;
    trade_name: string | null;
  } | null;
};

interface Enseigne {
  id: string;
  name: string;
  logo_url: string | null;
}

const statusConfig = {
  pending: {
    label: 'En attente',
    variant: 'outline' as const,
    icon: Clock,
    color: 'text-orange-600',
  },
  active: {
    label: 'Actif',
    variant: 'default' as const,
    icon: CheckCircle,
    color: 'text-green-600',
  },
  suspended: {
    label: 'Suspendu',
    variant: 'destructive' as const,
    icon: XCircle,
    color: 'text-red-600',
  },
};

const typeConfig = {
  enseigne: {
    label: 'Enseigne',
    icon: Building2,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  client_professionnel: {
    label: 'Client Pro',
    icon: Briefcase,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  client_particulier: {
    label: 'Particulier',
    icon: User,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
};

/**
 * AffiliatesSection - Gestion des apporteurs/affiliés LinkMe
 *
 * Types d'affiliés valides :
 * - enseigne : Réseau d'enseignes (ex: Pokawa)
 * - client_professionnel : Client B2B
 * - client_particulier : Client B2C
 *
 * Note : Commission et marge sont gérées au niveau produit, pas affilié
 */
export function AffiliatesSection() {
  const { toast } = useToast();
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [enseignes, setEnseignes] = useState<Enseigne[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [enseigneFilter, setEnseigneFilter] = useState<string>('all');
  const [organisationFilter, setOrganisationFilter] = useState<string>('all');

  // Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(
    null
  );

  // Form state - entity_type = 'organisation' | 'enseigne'
  type AffiliateType =
    | 'enseigne'
    | 'client_professionnel'
    | 'client_particulier';
  const [formData, setFormData] = useState({
    entity_type: 'organisation' as 'organisation' | 'enseigne',
    entity_id: '',
    display_name: '',
    slug: '',
    affiliate_type: 'enseigne' as AffiliateType,
    bio: '',
  });
  const [saving, setSaving] = useState(false);
  const [entitySearch, setEntitySearch] = useState('');

  useEffect(() => {
    void fetchAffiliates().catch(error => {
      console.error('[Affiliates] Fetch failed:', error);
    });
    void fetchOrganisations().catch(error => {
      console.error('[Affiliates] Fetch organisations failed:', error);
    });
    void fetchEnseignes().catch(error => {
      console.error('[Affiliates] Fetch enseignes failed:', error);
    });
  }, []);

  // Filtrer les entités déjà liées à un affilié
  const availableOrganisations = useMemo(() => {
    const linkedOrgIds = new Set(
      affiliates.map(a => a.organisation_id).filter(Boolean)
    );
    return organisations.filter(org => !linkedOrgIds.has(org.id));
  }, [organisations, affiliates]);

  const availableEnseignes = useMemo(() => {
    const linkedEnsIds = new Set(
      affiliates.map(a => a.enseigne_id).filter(Boolean)
    );
    return enseignes.filter(ens => !linkedEnsIds.has(ens.id));
  }, [enseignes, affiliates]);

  // Filtrer par recherche
  const filteredEntities = useMemo(() => {
    const searchLower = entitySearch.toLowerCase();
    if (formData.entity_type === 'organisation') {
      return availableOrganisations.filter(
        org =>
          org.legal_name.toLowerCase().includes(searchLower) ||
          org.trade_name?.toLowerCase().includes(searchLower)
      );
    } else {
      return availableEnseignes.filter(ens =>
        ens.name.toLowerCase().includes(searchLower)
      );
    }
  }, [
    formData.entity_type,
    entitySearch,
    availableOrganisations,
    availableEnseignes,
  ]);

  async function fetchAffiliates() {
    const supabase = createClient();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('linkme_affiliates')
        .select(
          `
          *,
          organisations:organisation_id(legal_name, trade_name)
        `
        )
        .order('created_at', { ascending: false })
        .returns<AffiliateWithOrg[]>();

      if (error) throw error;

      // Mapper les données avec les noms des entités liées
      const affiliatesWithNames = (data ?? []).map(
        (a: AffiliateWithOrg): Affiliate => {
          const { organisations, ...affiliateData } = a;
          return {
            ...affiliateData,
            organisation_name:
              organisations?.trade_name ?? organisations?.legal_name ?? null,
            enseigne_name: null, // Sera peuplé via le mapping organisations->enseignes
          };
        }
      );

      setAffiliates(affiliatesWithNames);
    } catch (error) {
      console.error('Error fetching affiliates:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les affiliés',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function fetchOrganisations() {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('organisations')
        .select('id, legal_name, trade_name, logo_url')
        .eq('is_active', true)
        .order('legal_name');

      if (error) throw error;
      setOrganisations(data ?? []);
    } catch (error) {
      console.error('Error fetching organisations:', error);
    }
  }

  async function fetchEnseignes() {
    const supabase = createClient();
    try {
      // Note: la table enseignes n'existe pas encore dans les types générés
      // La fonctionnalité Enseignes LinkMe utilise les organisations avec is_enseigne_parent=true
      // TODO: Migrer vers organisations filtrées ou créer table enseignes dédiée
      const { data, error } = await supabase
        .from('organisations')
        .select('id, legal_name, trade_name, logo_url')
        .eq('is_active', true)
        .order('legal_name');

      if (error) throw error;
      // Mapper vers interface Enseigne pour compatibilité
      const mappedData = (data ?? []).map(org => ({
        id: org.id,
        name: org.trade_name ?? org.legal_name,
        logo_url: org.logo_url,
      }));
      setEnseignes(mappedData);
    } catch (error) {
      console.error('Error fetching enseignes:', error);
    }
  }

  async function handleCreateAffiliate() {
    const supabase = createClient();
    setSaving(true);

    try {
      // Construire les données avec l'entité liée (sans marge/commission - gérés au niveau produit)
      const insertData = {
        display_name: formData.display_name,
        slug: formData.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        affiliate_type: formData.affiliate_type,
        bio: formData.bio ?? null,
        status: 'pending' as const,
        organisation_id:
          formData.entity_type === 'organisation' && formData.entity_id
            ? formData.entity_id
            : null,
        enseigne_id:
          formData.entity_type === 'enseigne' && formData.entity_id
            ? formData.entity_id
            : null,
      };

      const { error } = await supabase
        .from('linkme_affiliates')
        .insert(insertData as AffiliateInsert);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Affilié créé avec succès',
      });

      setIsCreateModalOpen(false);
      resetForm();
      void fetchAffiliates().catch(error => {
        console.error('[Affiliates] Fetch failed:', error);
      });
    } catch (error) {
      console.error('Error creating affiliate:', error);
      toast({
        title: 'Erreur',
        description: "Impossible de créer l'affilié",
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateAffiliate() {
    if (!selectedAffiliate) return;
    const supabase = createClient();
    setSaving(true);

    try {
      const updateData: AffiliateUpdate = {
        display_name: formData.display_name,
        slug: formData.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        affiliate_type: formData.affiliate_type,
        bio: formData.bio ?? null,
      };

      const { error } = await supabase
        .from('linkme_affiliates')
        .update(updateData)
        .eq('id', selectedAffiliate.id);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Affilié mis à jour',
      });

      setIsEditModalOpen(false);
      setSelectedAffiliate(null);
      resetForm();
      void fetchAffiliates().catch(error => {
        console.error('[Affiliates] Fetch failed:', error);
      });
    } catch (error) {
      console.error('Error updating affiliate:', error);
      toast({
        title: 'Erreur',
        description: "Impossible de mettre à jour l'affilié",
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(
    affiliateId: string,
    newStatus: 'active' | 'suspended'
  ) {
    const supabase = createClient();

    try {
      const updateData: { status: string; verified_at?: string } = {
        status: newStatus,
      };

      if (newStatus === 'active') {
        updateData.verified_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('linkme_affiliates')
        .update(updateData as AffiliateUpdate)
        .eq('id', affiliateId);

      if (error) throw error;

      toast({
        title: 'Succès',
        description:
          newStatus === 'active' ? 'Affilié activé' : 'Affilié suspendu',
      });

      void fetchAffiliates().catch(error => {
        console.error('[Affiliates] Fetch failed:', error);
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de changer le statut',
        variant: 'destructive',
      });
    }
  }

  async function handleDeleteAffiliate(affiliateId: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet affilié ?')) return;

    const supabase = createClient();

    try {
      const { error } = await supabase
        .from('linkme_affiliates')
        .delete()
        .eq('id', affiliateId);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Affilié supprimé',
      });

      void fetchAffiliates().catch(error => {
        console.error('[Affiliates] Fetch failed:', error);
      });
    } catch (error) {
      console.error('Error deleting affiliate:', error);
      toast({
        title: 'Erreur',
        description: "Impossible de supprimer l'affilié",
        variant: 'destructive',
      });
    }
  }

  function resetForm() {
    setFormData({
      entity_type: 'organisation',
      entity_id: '',
      display_name: '',
      slug: '',
      affiliate_type: 'enseigne',
      bio: '',
    });
    setEntitySearch('');
  }

  // Quand on sélectionne une entité, auto-remplir le nom et slug
  function handleEntitySelect(entityId: string) {
    if (formData.entity_type === 'organisation') {
      const org = organisations.find(o => o.id === entityId);
      if (org) {
        const displayName = org.trade_name ?? org.legal_name;
        const slug = displayName
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        setFormData(prev => ({
          ...prev,
          entity_id: entityId,
          display_name: displayName,
          slug: slug,
        }));
      }
    } else {
      const ens = enseignes.find(e => e.id === entityId);
      if (ens) {
        const displayName = ens.name;
        const slug = displayName
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        setFormData(prev => ({
          ...prev,
          entity_id: entityId,
          display_name: displayName,
          slug: slug,
          affiliate_type: 'enseigne', // Auto-type enseigne
        }));
      }
    }
  }

  function openEditModal(affiliate: Affiliate) {
    setSelectedAffiliate(affiliate);
    setFormData({
      entity_type: affiliate.enseigne_id ? 'enseigne' : 'organisation',
      entity_id: affiliate.enseigne_id ?? affiliate.organisation_id ?? '',
      display_name: affiliate.display_name,
      slug: affiliate.slug,
      affiliate_type: (affiliate.affiliate_type ?? 'enseigne') as AffiliateType,
      bio: affiliate.bio ?? '',
    });
    setIsEditModalOpen(true);
  }

  // Filter affiliates
  const filteredAffiliates = affiliates.filter(affiliate => {
    const matchesSearch =
      affiliate.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      affiliate.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType =
      typeFilter === 'all' || affiliate.affiliate_type === typeFilter;
    const matchesStatus =
      statusFilter === 'all' || affiliate.status === statusFilter;
    const matchesEnseigne =
      enseigneFilter === 'all' || affiliate.enseigne_id === enseigneFilter;
    const matchesOrganisation =
      organisationFilter === 'all' ||
      affiliate.organisation_id === organisationFilter;
    return (
      matchesSearch &&
      matchesType &&
      matchesStatus &&
      matchesEnseigne &&
      matchesOrganisation
    );
  });

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Apporteurs / Affiliés</CardTitle>
              <CardDescription>
                Gestion des enseignes et clients LinkMe
              </CardDescription>
            </div>
            <ButtonV2 onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvel Affilié
            </ButtonV2>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="enseigne">Enseignes</SelectItem>
                <SelectItem value="client_professionnel">
                  Clients Pro
                </SelectItem>
                <SelectItem value="client_particulier">Particuliers</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="active">Actifs</SelectItem>
                <SelectItem value="suspended">Suspendus</SelectItem>
              </SelectContent>
            </Select>
            <Select value={enseigneFilter} onValueChange={setEnseigneFilter}>
              <SelectTrigger className="w-[180px]">
                <Building2 className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Enseigne" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les enseignes</SelectItem>
                {enseignes.map(enseigne => (
                  <SelectItem key={enseigne.id} value={enseigne.id}>
                    {enseigne.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={organisationFilter}
              onValueChange={setOrganisationFilter}
            >
              <SelectTrigger className="w-[180px]">
                <Store className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Organisation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les organisations</SelectItem>
                {organisations.map(org => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.trade_name ?? org.legal_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {filteredAffiliates.length === 0 ? (
            <div className="text-center py-12">
              <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucun affilié</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
                  ? 'Aucun résultat pour ces filtres'
                  : 'Commencez par créer votre premier affilié'}
              </p>
              {!searchTerm &&
                typeFilter === 'all' &&
                statusFilter === 'all' && (
                  <ButtonV2 onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Créer un affilié
                  </ButtonV2>
                )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Affilié</TableHead>
                  <TableHead>Entité liée</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAffiliates.map(affiliate => {
                  const typeInfo =
                    typeConfig[
                      (affiliate.affiliate_type ||
                        'enseigne') as keyof typeof typeConfig
                    ];
                  const statusInfo =
                    statusConfig[
                      (affiliate.status ??
                        'pending') as keyof typeof statusConfig
                    ];
                  const linkedEntityName =
                    affiliate.organisation_name ?? affiliate.enseigne_name;
                  const linkedEntityType = affiliate.enseigne_id
                    ? 'enseigne'
                    : affiliate.organisation_id
                      ? 'organisation'
                      : null;

                  return (
                    <TableRow key={affiliate.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-full ${typeInfo.bgColor}`}
                          >
                            <typeInfo.icon
                              className={`h-4 w-4 ${typeInfo.color}`}
                            />
                          </div>
                          <div>
                            <div className="font-medium">
                              {affiliate.display_name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Créé le{' '}
                              {affiliate.created_at
                                ? new Date(
                                    affiliate.created_at
                                  ).toLocaleDateString('fr-FR')
                                : '-'}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {linkedEntityName ? (
                          <div className="flex items-center gap-2">
                            <div
                              className={`p-1 rounded ${linkedEntityType === 'enseigne' ? 'bg-purple-100' : 'bg-blue-100'}`}
                            >
                              {linkedEntityType === 'enseigne' ? (
                                <Store className="h-3 w-3 text-purple-600" />
                              ) : (
                                <Briefcase className="h-3 w-3 text-blue-600" />
                              )}
                            </div>
                            <span className="text-sm">{linkedEntityName}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            -
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{typeInfo.label}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        /{affiliate.slug}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusInfo.variant}>
                          <statusInfo.icon className="h-3 w-3 mr-1" />
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {affiliate.status === 'pending' && (
                            <ButtonV2
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                void handleStatusChange(
                                  affiliate.id,
                                  'active'
                                ).catch(error => {
                                  console.error(
                                    '[Affiliates] Status change failed:',
                                    error
                                  );
                                });
                              }}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Valider
                            </ButtonV2>
                          )}
                          {affiliate.status === 'active' && (
                            <ButtonV2
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                void handleStatusChange(
                                  affiliate.id,
                                  'suspended'
                                ).catch(error => {
                                  console.error(
                                    '[Affiliates] Status change failed:',
                                    error
                                  );
                                });
                              }}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Suspendre
                            </ButtonV2>
                          )}
                          {affiliate.status === 'suspended' && (
                            <ButtonV2
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                void handleStatusChange(
                                  affiliate.id,
                                  'active'
                                ).catch(error => {
                                  console.error(
                                    '[Affiliates] Status change failed:',
                                    error
                                  );
                                });
                              }}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Réactiver
                            </ButtonV2>
                          )}
                          <ButtonV2
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(affiliate)}
                          >
                            <Edit className="h-4 w-4" />
                          </ButtonV2>
                          <ButtonV2
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              void handleDeleteAffiliate(affiliate.id).catch(
                                error => {
                                  console.error(
                                    '[Affiliates] Delete failed:',
                                    error
                                  );
                                }
                              );
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </ButtonV2>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Nouvel Affilié</DialogTitle>
            <DialogDescription>
              Sélectionnez une organisation ou une enseigne existante pour créer
              un affilié LinkMe
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Sélection du type d'entité */}
            <div className="grid gap-2">
              <Label>Type d'entité *</Label>
              <div className="flex gap-2">
                <ButtonV2
                  type="button"
                  variant={
                    formData.entity_type === 'organisation'
                      ? 'default'
                      : 'outline'
                  }
                  className="flex-1"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      entity_type: 'organisation',
                      entity_id: '',
                      display_name: '',
                      slug: '',
                      affiliate_type: 'client_professionnel',
                    }));
                    setEntitySearch('');
                  }}
                >
                  <Briefcase className="h-4 w-4 mr-2" />
                  Organisation
                </ButtonV2>
                <ButtonV2
                  type="button"
                  variant={
                    formData.entity_type === 'enseigne' ? 'default' : 'outline'
                  }
                  className="flex-1"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      entity_type: 'enseigne',
                      entity_id: '',
                      display_name: '',
                      slug: '',
                      affiliate_type: 'enseigne',
                    }));
                    setEntitySearch('');
                  }}
                >
                  <Store className="h-4 w-4 mr-2" />
                  Enseigne
                </ButtonV2>
              </div>
            </div>

            {/* Recherche et sélection d'entité */}
            <div className="grid gap-2">
              <Label>
                {formData.entity_type === 'organisation'
                  ? 'Organisation'
                  : 'Enseigne'}{' '}
                *
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={`Rechercher une ${formData.entity_type}...`}
                  value={entitySearch}
                  onChange={e => setEntitySearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              {/* Liste des entités disponibles */}
              <div className="max-h-48 overflow-y-auto border rounded-md">
                {(filteredEntities as (Organisation | Enseigne)[]).length ===
                0 ? (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    {entitySearch
                      ? 'Aucun résultat'
                      : formData.entity_type === 'organisation'
                        ? `${availableOrganisations.length} organisation(s) disponible(s)`
                        : `${availableEnseignes.length} enseigne(s) disponible(s)`}
                  </div>
                ) : (
                  <div className="divide-y">
                    {(filteredEntities as (Organisation | Enseigne)[])
                      .slice(0, 10)
                      .map(entity => {
                        const isOrg = formData.entity_type === 'organisation';
                        const name = isOrg
                          ? ((entity as Organisation).trade_name ??
                            (entity as Organisation).legal_name)
                          : (entity as Enseigne).name;
                        const isSelected = formData.entity_id === entity.id;

                        return (
                          <button
                            key={entity.id}
                            type="button"
                            onClick={() => handleEntitySelect(entity.id)}
                            className={`w-full p-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors ${
                              isSelected
                                ? 'bg-blue-50 border-l-4 border-blue-500'
                                : ''
                            }`}
                          >
                            <div
                              className={`p-2 rounded-full ${isOrg ? 'bg-blue-100' : 'bg-purple-100'}`}
                            >
                              {isOrg ? (
                                <Briefcase className="h-4 w-4 text-blue-600" />
                              ) : (
                                <Store className="h-4 w-4 text-purple-600" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{name}</p>
                              {isOrg && (entity as Organisation).trade_name && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {(entity as Organisation).legal_name}
                                </p>
                              )}
                            </div>
                            {isSelected && (
                              <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                            )}
                          </button>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>

            {/* Affichage du nom et slug auto-générés */}
            {formData.entity_id && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="display_name">Nom affiché</Label>
                  <Input
                    id="display_name"
                    value={formData.display_name}
                    onChange={e =>
                      setFormData({ ...formData, display_name: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="slug">Slug URL</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={e =>
                      setFormData({ ...formData, slug: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    URL: linkme.verone.fr/s/{formData.slug ?? 'votre-slug'}
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">Type d'affilié</Label>
                  <Select
                    value={formData.affiliate_type}
                    onValueChange={(value: AffiliateType) =>
                      setFormData({ ...formData, affiliate_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="enseigne">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          Enseigne
                        </div>
                      </SelectItem>
                      <SelectItem value="client_professionnel">
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4" />
                          Client Pro
                        </div>
                      </SelectItem>
                      <SelectItem value="client_particulier">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Particulier
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="bio">Bio / Description</Label>
                  <Input
                    id="bio"
                    value={formData.bio}
                    onChange={e =>
                      setFormData({ ...formData, bio: e.target.value })
                    }
                    placeholder="Description courte..."
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <ButtonV2
              variant="outline"
              onClick={() => {
                setIsCreateModalOpen(false);
                resetForm();
              }}
            >
              Annuler
            </ButtonV2>
            <ButtonV2
              onClick={() => {
                void handleCreateAffiliate().catch(error => {
                  console.error('[Affiliates] Create failed:', error);
                });
              }}
              disabled={
                saving ||
                !formData.entity_id ||
                !formData.display_name.trim() ||
                !formData.slug.trim()
              }
            >
              {saving ? 'Création...' : "Créer l'affilié"}
            </ButtonV2>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Modifier l'affilié</DialogTitle>
            <DialogDescription>
              Modifiez les informations de {selectedAffiliate?.display_name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit_display_name">Nom affiché *</Label>
              <Input
                id="edit_display_name"
                value={formData.display_name}
                onChange={e =>
                  setFormData({ ...formData, display_name: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_slug">Slug URL *</Label>
              <Input
                id="edit_slug"
                value={formData.slug}
                onChange={e =>
                  setFormData({ ...formData, slug: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_type">Type *</Label>
              <Select
                value={formData.affiliate_type}
                onValueChange={(value: AffiliateType) =>
                  setFormData({ ...formData, affiliate_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="enseigne">Enseigne</SelectItem>
                  <SelectItem value="client_professionnel">
                    Client Pro
                  </SelectItem>
                  <SelectItem value="client_particulier">
                    Particulier
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_bio">Bio / Description</Label>
              <Input
                id="edit_bio"
                value={formData.bio}
                onChange={e =>
                  setFormData({ ...formData, bio: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <ButtonV2
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
            >
              Annuler
            </ButtonV2>
            <ButtonV2
              onClick={() => {
                void handleUpdateAffiliate().catch(error => {
                  console.error('[Affiliates] Update failed:', error);
                });
              }}
              disabled={
                saving || !formData.display_name.trim() || !formData.slug.trim()
              }
            >
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </ButtonV2>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
