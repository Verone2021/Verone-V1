'use client';

import { useState, useMemo, useEffect } from 'react';

import Link from 'next/link';

import {
  useEnseignes,
  useEnseigne,
  EnseigneLogoUploadButton,
  AssignOrganisationsModal,
  type Enseigne,
  type CreateEnseigneData,
  type UpdateEnseigneData,
  type EnseigneOrganisation,
} from '@verone/organisations';
import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { Input } from '@verone/ui';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@verone/ui';
import { Label } from '@verone/ui';
import { Textarea } from '@verone/ui';
import { Switch } from '@verone/ui';
import { spacing, colors } from '@verone/ui/design-system';
import { cn } from '@verone/utils';
import {
  Search,
  Plus,
  ArrowLeft,
  Building,
  Users,
  Star,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Eye,
  LayoutGrid,
  List,
} from 'lucide-react';

export default function EnseignesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'inactive' | 'all'>(
    'active'
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const itemsPerPage = 12;

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingEnseigne, setEditingEnseigne] = useState<Enseigne | null>(null);
  const [deleteConfirmEnseigne, setDeleteConfirmEnseigne] =
    useState<Enseigne | null>(null);
  const [assignOrgsEnseigne, setAssignOrgsEnseigne] = useState<Enseigne | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateEnseigneData>({
    name: '',
    description: '',
    logo_url: '',
    is_active: true,
  });

  // Filtres selon l'onglet
  const filters = useMemo(() => {
    const base: { is_active?: boolean; search?: string } = {};

    if (activeTab === 'active') {
      base.is_active = true;
    } else if (activeTab === 'inactive') {
      base.is_active = false;
    }
    // 'all' → pas de filtre is_active

    if (searchQuery) {
      base.search = searchQuery;
    }

    return base;
  }, [activeTab, searchQuery]);

  const {
    enseignes,
    loading,
    error,
    refetch,
    createEnseigne,
    updateEnseigne,
    deleteEnseigne,
    toggleEnseigneStatus,
    linkOrganisationToEnseigne,
    unlinkOrganisationFromEnseigne,
  } = useEnseignes(filters);

  // Hook pour récupérer les organisations de l'enseigne sélectionnée (pour le modal d'attribution)
  const { enseigne: enseigneWithOrgs } = useEnseigne(
    assignOrgsEnseigne?.id || ''
  );

  // Stats
  const stats = useMemo(() => {
    return {
      total: enseignes.length,
      active: enseignes.filter(e => e.is_active).length,
      inactive: enseignes.filter(e => !e.is_active).length,
      totalMembers: enseignes.reduce((sum, e) => sum + e.member_count, 0),
    };
  }, [enseignes]);

  // Pagination
  const paginatedEnseignes = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return enseignes.slice(startIndex, startIndex + itemsPerPage);
  }, [enseignes, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(enseignes.length / itemsPerPage);

  // Reset page quand recherche ou tab change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab]);

  // Handlers
  const handleOpenCreateModal = () => {
    setFormData({
      name: '',
      description: '',
      logo_url: '',
      is_active: true,
    });
    setEditingEnseigne(null);
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (enseigne: Enseigne) => {
    setFormData({
      name: enseigne.name,
      description: enseigne.description || '',
      logo_url: enseigne.logo_url || '',
      is_active: enseigne.is_active,
    });
    setEditingEnseigne(enseigne);
    setIsCreateModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setEditingEnseigne(null);
    setFormData({
      name: '',
      description: '',
      logo_url: '',
      is_active: true,
    });
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingEnseigne) {
        // En mode édition, ne pas inclure logo_url car géré par EnseigneLogoUploadButton
        const { logo_url, ...updateData } = formData;
        await updateEnseigne({
          id: editingEnseigne.id,
          ...updateData,
        });
      } else {
        // En mode création, pas de logo_url (sera ajouté après)
        const { logo_url, ...createData } = formData;
        await createEnseigne(createData);
      }
      handleCloseModal();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmEnseigne) return;

    setIsSubmitting(true);
    try {
      await deleteEnseigne(deleteConfirmEnseigne.id);
      setDeleteConfirmEnseigne(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (enseigne: Enseigne) => {
    await toggleEnseigneStatus(enseigne.id);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div
        className="flex justify-between items-start"
        style={{ marginBottom: spacing[6] }}
      >
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/contacts-organisations">
              <ButtonV2 variant="ghost" size="sm" icon={ArrowLeft}>
                Organisations
              </ButtonV2>
            </Link>
          </div>
          <h1
            className="text-3xl font-semibold"
            style={{ color: colors.text.DEFAULT }}
          >
            Enseignes
          </h1>
          <p className="mt-2" style={{ color: colors.text.subtle }}>
            Gestion des enseignes et groupes de franchises
          </p>
        </div>
        <ButtonV2 variant="primary" onClick={handleOpenCreateModal} icon={Plus}>
          Nouvelle Enseigne
        </ButtonV2>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent style={{ padding: spacing[4] }}>
            <div
              className="text-2xl font-bold"
              style={{ color: colors.text.DEFAULT }}
            >
              {stats.total}
            </div>
            <p className="text-sm" style={{ color: colors.text.subtle }}>
              Total enseignes
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent style={{ padding: spacing[4] }}>
            <div
              className="text-2xl font-bold"
              style={{ color: colors.success[500] }}
            >
              {stats.active}
            </div>
            <p className="text-sm" style={{ color: colors.text.subtle }}>
              Actives
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent style={{ padding: spacing[4] }}>
            <div
              className="text-2xl font-bold"
              style={{ color: colors.text.muted }}
            >
              {stats.inactive}
            </div>
            <p className="text-sm" style={{ color: colors.text.subtle }}>
              Inactives
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent style={{ padding: spacing[4] }}>
            <div
              className="text-2xl font-bold"
              style={{ color: colors.primary[500] }}
            >
              {stats.totalMembers}
            </div>
            <p className="text-sm" style={{ color: colors.text.subtle }}>
              Organisations membres
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et Recherche */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setActiveTab('active')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-all',
            activeTab === 'active'
              ? 'bg-black text-white'
              : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
          )}
        >
          Actives
          <span className="ml-2 opacity-70">
            ({enseignes.filter(e => e.is_active).length})
          </span>
        </button>

        <button
          onClick={() => setActiveTab('inactive')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-all',
            activeTab === 'inactive'
              ? 'bg-black text-white'
              : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
          )}
        >
          Inactives
          <span className="ml-2 opacity-70">
            ({enseignes.filter(e => !e.is_active).length})
          </span>
        </button>

        <button
          onClick={() => setActiveTab('all')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-all',
            activeTab === 'all'
              ? 'bg-black text-white'
              : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
          )}
        >
          Toutes
          <span className="ml-2 opacity-70">({enseignes.length})</span>
        </button>

        {/* Barre de recherche */}
        <div className="relative w-64">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
            style={{ color: colors.text.muted }}
          />
          <Input
            placeholder="Rechercher par nom..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 h-10 rounded-lg"
            style={{
              borderColor: colors.border.DEFAULT,
              color: colors.text.DEFAULT,
            }}
          />
        </div>

        {/* Toggle Grid/List View */}
        <div className="flex gap-1 ml-auto">
          <ButtonV2
            variant={viewMode === 'grid' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            icon={LayoutGrid}
            className="h-10 px-3"
            aria-label="Vue grille"
          />
          <ButtonV2
            variant={viewMode === 'list' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            icon={List}
            className="h-10 px-3"
            aria-label="Vue liste"
          />
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div
          className="p-4 rounded-lg"
          style={{
            backgroundColor: colors.danger[50],
            color: colors.danger[700],
          }}
        >
          {error}
        </div>
      )}

      {/* Enseignes Grid */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader style={{ padding: spacing[3] }}>
                    <div className="h-5 bg-gray-200 rounded w-3/4" />
                  </CardHeader>
                  <CardContent style={{ padding: spacing[3] }}>
                    <div className="h-3 bg-gray-200 rounded w-full mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-2/3" />
                  </CardContent>
                </Card>
              ))
            : paginatedEnseignes.map(enseigne => (
                <Card
                  key={enseigne.id}
                  className="hover:shadow-lg transition-all duration-200 relative group"
                >
                  <CardContent style={{ padding: spacing[4] }}>
                    {/* Header avec logo et statut */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {/* Logo ou icône */}
                        <div
                          className="w-12 h-12 rounded-lg flex items-center justify-center"
                          style={{
                            backgroundColor: colors.primary[100],
                            color: colors.primary[600],
                          }}
                        >
                          {enseigne.logo_url ? (
                            <img
                              src={enseigne.logo_url}
                              alt={enseigne.name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <Building className="w-6 h-6" />
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-base font-semibold line-clamp-1">
                            {enseigne.name}
                          </CardTitle>
                          <Badge
                            variant={
                              enseigne.is_active ? 'default' : 'secondary'
                            }
                            className="mt-1"
                          >
                            {enseigne.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    {enseigne.description && (
                      <p
                        className="text-sm line-clamp-2 mb-3"
                        style={{ color: colors.text.subtle }}
                      >
                        {enseigne.description}
                      </p>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-1.5">
                        <Users
                          className="w-4 h-4"
                          style={{ color: colors.text.muted }}
                        />
                        <span
                          className="text-sm font-medium"
                          style={{ color: colors.text.DEFAULT }}
                        >
                          {enseigne.member_count}
                        </span>
                        <span
                          className="text-sm"
                          style={{ color: colors.text.subtle }}
                        >
                          membres
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-3 border-t flex-wrap">
                      <ButtonV2
                        variant="outline"
                        size="sm"
                        icon={Users}
                        onClick={() => setAssignOrgsEnseigne(enseigne)}
                      >
                        Organisations
                      </ButtonV2>
                      <ButtonV2
                        variant="ghost"
                        size="sm"
                        icon={Edit2}
                        onClick={() => handleOpenEditModal(enseigne)}
                      />
                      <ButtonV2
                        variant="ghost"
                        size="sm"
                        icon={enseigne.is_active ? ToggleRight : ToggleLeft}
                        onClick={() => handleToggleStatus(enseigne)}
                      />
                      <ButtonV2
                        variant="ghost"
                        size="sm"
                        icon={Trash2}
                        onClick={() => setDeleteConfirmEnseigne(enseigne)}
                        className="text-red-500 hover:text-red-700"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
        </div>
      ) : (
        /* List View */
        <Card>
          <CardContent style={{ padding: 0 }}>
            <table className="w-full">
              <thead>
                <tr
                  className="border-b"
                  style={{ borderColor: colors.border.DEFAULT }}
                >
                  <th className="text-left p-4 font-medium">Enseigne</th>
                  <th className="text-left p-4 font-medium">Description</th>
                  <th className="text-center p-4 font-medium">Membres</th>
                  <th className="text-center p-4 font-medium">Statut</th>
                  <th className="text-right p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="p-4">
                        <div className="h-4 bg-gray-200 rounded w-32" />
                      </td>
                      <td className="p-4">
                        <div className="h-4 bg-gray-200 rounded w-48" />
                      </td>
                      <td className="p-4">
                        <div className="h-4 bg-gray-200 rounded w-8 mx-auto" />
                      </td>
                      <td className="p-4">
                        <div className="h-4 bg-gray-200 rounded w-16 mx-auto" />
                      </td>
                      <td className="p-4">
                        <div className="h-4 bg-gray-200 rounded w-24 ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : paginatedEnseignes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center">
                      <p style={{ color: colors.text.subtle }}>
                        Aucune enseigne trouvée
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedEnseignes.map(enseigne => (
                    <tr
                      key={enseigne.id}
                      className="border-b hover:bg-neutral-50"
                      style={{ borderColor: colors.border.DEFAULT }}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{
                              backgroundColor: colors.primary[100],
                              color: colors.primary[600],
                            }}
                          >
                            {enseigne.logo_url ? (
                              <img
                                src={enseigne.logo_url}
                                alt={enseigne.name}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <Building className="w-5 h-5" />
                            )}
                          </div>
                          <span className="font-medium">{enseigne.name}</span>
                        </div>
                      </td>
                      <td
                        className="p-4 max-w-xs truncate"
                        style={{ color: colors.text.subtle }}
                      >
                        {enseigne.description || '-'}
                      </td>
                      <td className="p-4 text-center">
                        <span className="font-medium">
                          {enseigne.member_count}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <Badge
                          variant={enseigne.is_active ? 'default' : 'secondary'}
                        >
                          {enseigne.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/contacts-organisations/enseignes/${enseigne.id}`}
                          >
                            <ButtonV2 variant="ghost" size="sm" icon={Eye} />
                          </Link>
                          <ButtonV2
                            variant="ghost"
                            size="sm"
                            icon={Edit2}
                            onClick={() => handleOpenEditModal(enseigne)}
                          />
                          <ButtonV2
                            variant="ghost"
                            size="sm"
                            icon={enseigne.is_active ? ToggleRight : ToggleLeft}
                            onClick={() => handleToggleStatus(enseigne)}
                          />
                          <ButtonV2
                            variant="ghost"
                            size="sm"
                            icon={Trash2}
                            onClick={() => setDeleteConfirmEnseigne(enseigne)}
                            className="text-red-500 hover:text-red-700"
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination className="mt-6">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className={cn(
                  currentPage === 1 && 'pointer-events-none opacity-50'
                )}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <PaginationItem key={page}>
                <PaginationLink
                  onClick={() => setCurrentPage(page)}
                  isActive={currentPage === page}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className={cn(
                  currentPage === totalPages && 'pointer-events-none opacity-50'
                )}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingEnseigne ? "Modifier l'enseigne" : 'Nouvelle enseigne'}
            </DialogTitle>
            <DialogDescription>
              {editingEnseigne
                ? "Modifiez les informations de l'enseigne"
                : 'Créez une nouvelle enseigne pour regrouper vos clients franchisés'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e =>
                  setFormData(prev => ({ ...prev, name: e.target.value }))
                }
                placeholder="Ex: Pokawa, Black and White..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Description de l'enseigne..."
                rows={3}
              />
            </div>

            {/* Logo Upload - uniquement en mode édition */}
            {editingEnseigne ? (
              <div className="space-y-2">
                <Label>Logo</Label>
                <EnseigneLogoUploadButton
                  enseigneId={editingEnseigne.id}
                  enseigneName={editingEnseigne.name}
                  currentLogoUrl={editingEnseigne.logo_url}
                  onUploadSuccess={() => refetch()}
                  size="md"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label className="text-muted-foreground">Logo</Label>
                <p className="text-sm text-muted-foreground">
                  Le logo pourra être ajouté après la création de l'enseigne.
                </p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Enseigne active</Label>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={checked =>
                  setFormData(prev => ({ ...prev, is_active: checked }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <ButtonV2 variant="ghost" onClick={handleCloseModal}>
              Annuler
            </ButtonV2>
            <ButtonV2
              variant="primary"
              onClick={handleSubmit}
              loading={isSubmitting}
              disabled={!formData.name.trim()}
            >
              {editingEnseigne ? 'Enregistrer' : 'Créer'}
            </ButtonV2>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog
        open={!!deleteConfirmEnseigne}
        onOpenChange={() => setDeleteConfirmEnseigne(null)}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Supprimer l'enseigne</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer l'enseigne "
              {deleteConfirmEnseigne?.name}" ? Les organisations membres seront
              dissociées mais pas supprimées.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <ButtonV2
              variant="ghost"
              onClick={() => setDeleteConfirmEnseigne(null)}
            >
              Annuler
            </ButtonV2>
            <ButtonV2
              variant="destructive"
              onClick={handleDelete}
              loading={isSubmitting}
            >
              Supprimer
            </ButtonV2>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Organisations Modal */}
      <AssignOrganisationsModal
        open={!!assignOrgsEnseigne}
        onOpenChange={open => {
          if (!open) setAssignOrgsEnseigne(null);
        }}
        enseigne={assignOrgsEnseigne}
        currentOrganisations={enseigneWithOrgs?.organisations || []}
        onAssign={async (organisationId, isParent) => {
          if (!assignOrgsEnseigne) return false;
          return await linkOrganisationToEnseigne(
            organisationId,
            assignOrgsEnseigne.id,
            isParent
          );
        }}
        onUnassign={async organisationId => {
          return await unlinkOrganisationFromEnseigne(organisationId);
        }}
        onSuccess={() => {
          refetch();
        }}
      />
    </div>
  );
}
