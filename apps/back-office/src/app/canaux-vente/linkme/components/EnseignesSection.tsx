'use client';

import { useState, useMemo } from 'react';

import Image from 'next/image';

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
import { Skeleton } from '@verone/ui';
import { Textarea } from '@verone/ui';
import { Switch } from '@verone/ui';
import {
  Plus,
  Search,
  Building2,
  Store,
  Users,
  Layers,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Eye,
  ImagePlus,
} from 'lucide-react';

import {
  useLinkMeEnseignes,
  useLinkMeEnseigne,
  useLinkMeEnseigneOrganisations,
  useCreateEnseigne,
  useUpdateEnseigne,
  useDeleteEnseigne,
  useToggleEnseigneActive,
  type EnseigneWithStats,
  type CreateEnseigneInput,
} from '../hooks/use-linkme-enseignes';

/**
 * EnseignesSection - Gestion des enseignes LinkMe
 *
 * Hiérarchie : Enseigne → Organisations → Users
 * Permet de créer, modifier, activer/désactiver des enseignes
 */
export function EnseignesSection() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'inactive'
  >('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedEnseigne, setSelectedEnseigne] =
    useState<EnseigneWithStats | null>(null);

  // Hooks queries
  const { data: enseignes, isLoading, refetch } = useLinkMeEnseignes();
  const { data: selectedEnseigneOrgs } = useLinkMeEnseigneOrganisations(
    isDetailModalOpen ? (selectedEnseigne?.id ?? null) : null
  );

  // Hooks mutations
  const createEnseigne = useCreateEnseigne();
  const updateEnseigne = useUpdateEnseigne();
  const deleteEnseigne = useDeleteEnseigne();
  const toggleActive = useToggleEnseigneActive();

  // Form state
  const [formData, setFormData] = useState<CreateEnseigneInput>({
    name: '',
    description: '',
    logo_url: null,
    is_active: true,
  });

  // Filtered enseignes
  const filteredEnseignes = useMemo(() => {
    if (!enseignes) return [];

    return enseignes.filter(enseigne => {
      // Search filter
      const matchesSearch =
        searchTerm === '' ||
        enseigne.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enseigne.description?.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && enseigne.is_active) ||
        (statusFilter === 'inactive' && !enseigne.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [enseignes, searchTerm, statusFilter]);

  // Handlers
  const handleCreateEnseigne = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Erreur',
        description: "Le nom de l'enseigne est obligatoire",
        variant: 'destructive',
      });
      return;
    }

    try {
      await createEnseigne.mutateAsync(formData);
      toast({
        title: 'Succès',
        description: `Enseigne "${formData.name}" créée avec succès`,
      });
      setIsCreateModalOpen(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error?.message || 'Erreur lors de la création',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateEnseigne = async () => {
    if (!selectedEnseigne || !formData.name.trim()) return;

    try {
      await updateEnseigne.mutateAsync({
        enseigneId: selectedEnseigne.id,
        input: formData,
      });
      toast({
        title: 'Succès',
        description: `Enseigne "${formData.name}" mise à jour`,
      });
      setIsEditModalOpen(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error?.message || 'Erreur lors de la mise à jour',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteEnseigne = async (enseigne: EnseigneWithStats) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${enseigne.name}" ?`))
      return;

    try {
      await deleteEnseigne.mutateAsync(enseigne.id);
      toast({
        title: 'Succès',
        description: `Enseigne "${enseigne.name}" supprimée`,
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error?.message || 'Erreur lors de la suppression',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (enseigne: EnseigneWithStats) => {
    try {
      await toggleActive.mutateAsync({
        enseigneId: enseigne.id,
        isActive: !enseigne.is_active,
      });
      toast({
        title: 'Succès',
        description: `Enseigne ${enseigne.is_active ? 'désactivée' : 'activée'}`,
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error?.message || 'Erreur lors du changement de statut',
        variant: 'destructive',
      });
    }
  };

  const openEditModal = (enseigne: EnseigneWithStats) => {
    setSelectedEnseigne(enseigne);
    setFormData({
      name: enseigne.name,
      description: enseigne.description || '',
      logo_url: enseigne.logo_url,
      is_active: enseigne.is_active,
    });
    setIsEditModalOpen(true);
  };

  const openDetailModal = (enseigne: EnseigneWithStats) => {
    setSelectedEnseigne(enseigne);
    setIsDetailModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      logo_url: null,
      is_active: true,
    });
    setSelectedEnseigne(null);
  };

  // Logo URL helper
  const getLogoUrl = (logoPath: string | null) => {
    if (!logoPath) return null;
    if (logoPath.startsWith('http')) return logoPath;
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/organisation-logos/${logoPath}`;
  };

  // Stats summary
  const stats = useMemo(() => {
    if (!enseignes) return { total: 0, active: 0, inactive: 0, totalOrgs: 0 };
    return {
      total: enseignes.length,
      active: enseignes.filter(e => e.is_active).length,
      inactive: enseignes.filter(e => !e.is_active).length,
      totalOrgs: enseignes.reduce((sum, e) => sum + e.organisations_count, 0),
    };
  }, [enseignes]);

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Enseignes</h2>
          <p className="text-muted-foreground">
            Gérez vos enseignes et leurs organisations rattachées
          </p>
        </div>
        <ButtonV2 onClick={() => setIsCreateModalOpen(true)} icon={Plus}>
          Nouvelle enseigne
        </ButtonV2>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">enseignes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actives</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.active}
            </div>
            <p className="text-xs text-muted-foreground">enseignes actives</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactives</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.inactive}
            </div>
            <p className="text-xs text-muted-foreground">enseignes inactives</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organisations</CardTitle>
            <Store className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.totalOrgs}
            </div>
            <p className="text-xs text-muted-foreground">shops rattachés</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and filters */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des enseignes</CardTitle>
          <CardDescription>
            Recherchez et filtrez les enseignes de votre réseau
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher une enseigne..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <ButtonV2
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                Toutes
              </ButtonV2>
              <ButtonV2
                variant={statusFilter === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('active')}
              >
                Actives
              </ButtonV2>
              <ButtonV2
                variant={statusFilter === 'inactive' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('inactive')}
              >
                Inactives
              </ButtonV2>
            </div>
          </div>

          {/* Enseignes grid */}
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map(i => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-16 w-16 rounded-lg mb-4" />
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredEnseignes.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">Aucune enseigne</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all'
                  ? 'Aucun résultat pour ces critères'
                  : 'Créez votre première enseigne pour commencer'}
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <ButtonV2
                  className="mt-4"
                  onClick={() => setIsCreateModalOpen(true)}
                  icon={Plus}
                >
                  Créer une enseigne
                </ButtonV2>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredEnseignes.map(enseigne => (
                <Card
                  key={enseigne.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => openDetailModal(enseigne)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      {/* Logo */}
                      <div className="h-16 w-16 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden border">
                        {enseigne.logo_url ? (
                          <Image
                            src={getLogoUrl(enseigne.logo_url) || ''}
                            alt={enseigne.name}
                            width={64}
                            height={64}
                            className="object-contain"
                          />
                        ) : (
                          <Building2 className="h-8 w-8 text-gray-400" />
                        )}
                      </div>
                      {/* Status badge */}
                      <Badge
                        variant={enseigne.is_active ? 'default' : 'secondary'}
                      >
                        {enseigne.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>

                    {/* Name and description */}
                    <h3 className="font-semibold text-lg mb-1">
                      {enseigne.name}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {enseigne.description || 'Aucune description'}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Store className="h-4 w-4" />
                        <span>{enseigne.organisations_count} shops</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{enseigne.affiliates_count} affiliés</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Layers className="h-4 w-4" />
                        <span>{enseigne.selections_count} sélections</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                      <ButtonV2
                        variant="outline"
                        size="sm"
                        icon={Eye}
                        onClick={e => {
                          e.stopPropagation();
                          openDetailModal(enseigne);
                        }}
                      >
                        Détails
                      </ButtonV2>
                      <ButtonV2
                        variant="outline"
                        size="sm"
                        icon={Edit}
                        onClick={e => {
                          e.stopPropagation();
                          openEditModal(enseigne);
                        }}
                      >
                        Modifier
                      </ButtonV2>
                      <ButtonV2
                        variant="ghost"
                        size="sm"
                        icon={Trash2}
                        onClick={e => {
                          e.stopPropagation();
                          handleDeleteEnseigne(enseigne);
                        }}
                        className="text-red-600 hover:text-red-700"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nouvelle enseigne</DialogTitle>
            <DialogDescription>
              Créez une nouvelle enseigne pour votre réseau d'affiliation
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de l'enseigne *</Label>
              <Input
                id="name"
                placeholder="ex: POKAWA"
                value={formData.name}
                onChange={e =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Description de l'enseigne..."
                value={formData.description || ''}
                onChange={e =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="is_active">Active</Label>
                <p className="text-xs text-muted-foreground">
                  L'enseigne sera visible et utilisable
                </p>
              </div>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={checked =>
                  setFormData({ ...formData, is_active: checked })
                }
              />
            </div>
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
              onClick={handleCreateEnseigne}
              loading={createEnseigne.isPending}
            >
              {createEnseigne.isPending ? 'Création...' : 'Créer'}
            </ButtonV2>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Modifier l'enseigne</DialogTitle>
            <DialogDescription>
              Modifiez les informations de l'enseigne
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nom de l'enseigne *</Label>
              <Input
                id="edit-name"
                placeholder="ex: POKAWA"
                value={formData.name}
                onChange={e =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                placeholder="Description de l'enseigne..."
                value={formData.description || ''}
                onChange={e =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="edit-is_active">Active</Label>
                <p className="text-xs text-muted-foreground">
                  L'enseigne sera visible et utilisable
                </p>
              </div>
              <Switch
                id="edit-is_active"
                checked={formData.is_active}
                onCheckedChange={checked =>
                  setFormData({ ...formData, is_active: checked })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <ButtonV2
              variant="outline"
              onClick={() => {
                setIsEditModalOpen(false);
                resetForm();
              }}
            >
              Annuler
            </ButtonV2>
            <ButtonV2
              onClick={handleUpdateEnseigne}
              loading={updateEnseigne.isPending}
            >
              {updateEnseigne.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </ButtonV2>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedEnseigne?.logo_url && (
                <div className="h-10 w-10 rounded-lg bg-gray-100 overflow-hidden border">
                  <Image
                    src={getLogoUrl(selectedEnseigne.logo_url) || ''}
                    alt={selectedEnseigne.name}
                    width={40}
                    height={40}
                    className="object-contain"
                  />
                </div>
              )}
              {selectedEnseigne?.name}
              <Badge
                variant={selectedEnseigne?.is_active ? 'default' : 'secondary'}
              >
                {selectedEnseigne?.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              {selectedEnseigne?.description || 'Aucune description'}
            </DialogDescription>
          </DialogHeader>

          {selectedEnseigne && (
            <div className="space-y-6 py-4">
              {/* KPIs */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Store className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-2xl font-bold">
                          {selectedEnseigne.organisations_count}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Organisations
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-2xl font-bold">
                          {selectedEnseigne.affiliates_count}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Affiliés
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Layers className="h-5 w-5 text-purple-600" />
                      <div>
                        <p className="text-2xl font-bold">
                          {selectedEnseigne.selections_count}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Sélections
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Organisations list */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Store className="h-4 w-4" />
                  Organisations rattachées
                </h4>
                {selectedEnseigneOrgs && selectedEnseigneOrgs.length > 0 ? (
                  <div className="space-y-2">
                    {selectedEnseigneOrgs.map(org => (
                      <div
                        key={org.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          {org.logo_url ? (
                            <Image
                              src={getLogoUrl(org.logo_url) || ''}
                              alt={org.name}
                              width={32}
                              height={32}
                              className="rounded-md object-contain"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-md bg-gray-200 flex items-center justify-center">
                              <Store className="h-4 w-4 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{org.name}</p>
                            {org.is_enseigne_parent && (
                              <Badge variant="outline" className="text-xs">
                                Siège
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Badge
                          variant={org.is_active ? 'default' : 'secondary'}
                        >
                          {org.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    Aucune organisation rattachée
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <ButtonV2
              variant="outline"
              onClick={() => {
                if (selectedEnseigne) {
                  handleToggleActive(selectedEnseigne);
                }
              }}
            >
              {selectedEnseigne?.is_active ? 'Désactiver' : 'Activer'}
            </ButtonV2>
            <ButtonV2
              onClick={() => {
                if (selectedEnseigne) {
                  setIsDetailModalOpen(false);
                  openEditModal(selectedEnseigne);
                }
              }}
              icon={Edit}
            >
              Modifier
            </ButtonV2>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
