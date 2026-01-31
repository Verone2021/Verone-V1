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
} from '@verone/organisations';
import { Badge } from '@verone/ui';
import { ButtonV2, IconButton } from '@verone/ui';
import { Card, CardContent, CardHeader } from '@verone/ui';
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
import { Switch } from '@verone/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import { spacing, colors } from '@verone/ui/design-system';
import { cn } from '@verone/utils';
import { createClient } from '@verone/utils/supabase/client';
import {
  Search,
  Plus,
  ArrowLeft,
  Building,
  Users,
  Pencil,
  Trash2,
  Eye,
  LayoutGrid,
  List,
  Archive,
  ArchiveRestore,
  AlertTriangle,
} from 'lucide-react';

export default function EnseignesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'archived' | 'all'>(
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

  // Archived enseignes state
  const [archivedEnseignes, setArchivedEnseignes] = useState<Enseigne[]>([]);
  const [archivedLoading, setArchivedLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateEnseigneData>({
    name: '',
    description: '',
    logo_url: '',
    is_active: true,
  });

  // Filtres selon l'onglet - actives seulement pour l'onglet actif
  const filters = useMemo(() => {
    const base: { is_active?: boolean; search?: string } = {};

    if (activeTab === 'active') {
      base.is_active = true;
    }
    // 'archived' et 'all' gérés séparément

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
    assignOrgsEnseigne?.id ?? ''
  );

  // Charger les enseignes archivées
  const loadArchivedEnseignes = async () => {
    setArchivedLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('enseignes')
        .select(
          `
          *,
          enseigne_organisations!enseigne_organisations_enseigne_id_fkey(
            organisation_id
          )
        `
        )
        .eq('is_active', false)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Transformer les données pour avoir member_count
      const transformedData = (data ?? []).map(e => ({
        ...e,
        member_count: e.enseigne_organisations?.length ?? 0,
      }));

      setArchivedEnseignes(transformedData as unknown as Enseigne[]);
    } catch (err) {
      console.error('Erreur chargement enseignes archivées:', err);
    } finally {
      setArchivedLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'archived') {
      void loadArchivedEnseignes().catch(error => {
        console.error('[Enseignes] Load archived data failed:', error);
      });
    }
  }, [activeTab]);

  // Stats - combiner actives et archivées
  const stats = useMemo(() => {
    const activeCount = enseignes.filter(e => e.is_active).length;
    const archivedCount = archivedEnseignes.length;
    const totalMembers =
      enseignes.reduce((sum, e) => sum + e.member_count, 0) +
      archivedEnseignes.reduce((sum, e) => sum + e.member_count, 0);

    return {
      total: activeCount + archivedCount,
      active: activeCount,
      archived: archivedCount,
      totalMembers,
    };
  }, [enseignes, archivedEnseignes]);

  // Enseignes à afficher selon l'onglet
  const displayedEnseignes = useMemo(() => {
    if (activeTab === 'active') {
      return enseignes.filter(e => e.is_active);
    } else if (activeTab === 'archived') {
      // Filtrer par recherche si nécessaire
      if (searchQuery) {
        return archivedEnseignes.filter(e =>
          e.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      return archivedEnseignes;
    } else {
      // 'all' - combiner actives et archivées
      const all = [...enseignes, ...archivedEnseignes];
      if (searchQuery) {
        return all.filter(e =>
          e.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      return all;
    }
  }, [activeTab, enseignes, archivedEnseignes, searchQuery]);

  // Pagination
  const paginatedEnseignes = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return displayedEnseignes.slice(startIndex, startIndex + itemsPerPage);
  }, [displayedEnseignes, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(displayedEnseignes.length / itemsPerPage);

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
      description: enseigne.description ?? '',
      logo_url: enseigne.logo_url ?? '',
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
        const { logo_url: _logo_url, ...updateData } = formData;
        await updateEnseigne({
          id: editingEnseigne.id,
          ...updateData,
        });
      } else {
        // En mode création, pas de logo_url (sera ajouté après)
        const { logo_url: _logo_url2, ...createData } = formData;
        await createEnseigne(createData);
      }
      handleCloseModal();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Archiver/Désarchiver une enseigne
  const handleArchive = async (enseigne: Enseigne) => {
    await toggleEnseigneStatus(enseigne.id);
    void refetch().catch(error => {
      console.error('[Enseignes] Refetch after archive failed:', error);
    });
    void loadArchivedEnseignes().catch(error => {
      console.error('[Enseignes] Load archived after archive failed:', error);
    });
  };

  // Supprimer une enseigne (avec dissociation des organisations)
  const handleDelete = async () => {
    if (!deleteConfirmEnseigne) return;

    setIsSubmitting(true);
    try {
      // Les organisations seront automatiquement dissociées par la cascade FK
      await deleteEnseigne(deleteConfirmEnseigne.id);
      setDeleteConfirmEnseigne(null);
      void refetch().catch(error => {
        console.error('[Enseignes] Refetch after delete failed:', error);
      });
      void loadArchivedEnseignes().catch(error => {
        console.error('[Enseignes] Load archived after delete failed:', error);
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = activeTab === 'archived' ? archivedLoading : loading;

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
              {stats.archived}
            </div>
            <p className="text-sm" style={{ color: colors.text.subtle }}>
              Archivées
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
          <span className="ml-2 opacity-70">({stats.active})</span>
        </button>

        <button
          onClick={() => setActiveTab('archived')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-all',
            activeTab === 'archived'
              ? 'bg-black text-white'
              : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
          )}
        >
          Archivées
          <span className="ml-2 opacity-70">({stats.archived})</span>
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
          <span className="ml-2 opacity-70">({stats.total})</span>
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

      {/* Enseignes Grid ou List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {isLoading
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
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() =>
                    (window.location.href = `/contacts-organisations/enseignes/${enseigne.id}`)
                  }
                >
                  <CardContent className="p-6">
                    {/* Header: Logo à gauche, Badge à droite */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="h-16 w-16 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden border">
                        {enseigne.logo_url ? (
                          <img
                            src={enseigne.logo_url}
                            alt={enseigne.name}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <Building className="h-8 w-8 text-gray-400" />
                        )}
                      </div>
                      <Badge
                        variant={enseigne.is_active ? 'default' : 'secondary'}
                      >
                        {enseigne.is_active ? 'Active' : 'Archivée'}
                      </Badge>
                    </div>

                    {/* Nom */}
                    <h3 className="font-semibold text-lg mb-4">
                      {enseigne.name}
                    </h3>

                    {/* Stats sur une ligne */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{enseigne.member_count} organisation(s)</span>
                      </div>
                    </div>

                    {/* Actions - IconButton 32x32px UNIQUEMENT */}
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                      {enseigne.is_active ? (
                        <>
                          <IconButton
                            icon={Eye}
                            label="Voir"
                            variant="outline"
                            size="sm"
                            onClick={e => {
                              e.stopPropagation();
                              window.location.href = `/contacts-organisations/enseignes/${enseigne.id}`;
                            }}
                          />
                          <IconButton
                            icon={Pencil}
                            label="Modifier"
                            variant="outline"
                            size="sm"
                            onClick={e => {
                              e.stopPropagation();
                              handleOpenEditModal(enseigne);
                            }}
                          />
                          <IconButton
                            icon={Archive}
                            label="Archiver"
                            variant="danger"
                            size="sm"
                            onClick={e => {
                              e.stopPropagation();
                              void handleArchive(enseigne).catch(error => {
                                console.error(
                                  '[Enseignes] Archive action failed:',
                                  error
                                );
                              });
                            }}
                          />
                        </>
                      ) : (
                        <>
                          <IconButton
                            icon={Eye}
                            label="Voir"
                            variant="outline"
                            size="sm"
                            onClick={e => {
                              e.stopPropagation();
                              window.location.href = `/contacts-organisations/enseignes/${enseigne.id}`;
                            }}
                          />
                          <IconButton
                            icon={ArchiveRestore}
                            label="Restaurer"
                            variant="success"
                            size="sm"
                            onClick={e => {
                              e.stopPropagation();
                              void handleArchive(enseigne).catch(error => {
                                console.error(
                                  '[Enseignes] Archive action failed:',
                                  error
                                );
                              });
                            }}
                          />
                          <IconButton
                            icon={Trash2}
                            label="Supprimer"
                            variant="danger"
                            size="sm"
                            onClick={e => {
                              e.stopPropagation();
                              setDeleteConfirmEnseigne(enseigne);
                            }}
                          />
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
        </div>
      ) : (
        /* List View */
        <div
          className="rounded-lg border"
          style={{ borderColor: colors.border.DEFAULT }}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead style={{ color: colors.text.DEFAULT }}>
                  Enseigne
                </TableHead>
                <TableHead
                  className="text-center"
                  style={{ color: colors.text.DEFAULT }}
                >
                  Organisations
                </TableHead>
                <TableHead
                  className="text-center"
                  style={{ color: colors.text.DEFAULT }}
                >
                  Statut
                </TableHead>
                <TableHead
                  className="text-right"
                  style={{ color: colors.text.DEFAULT }}
                >
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="animate-pulse">
                    <TableCell>
                      <div className="h-4 bg-gray-200 rounded w-32" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-gray-200 rounded w-8 mx-auto" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-gray-200 rounded w-16 mx-auto" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-gray-200 rounded w-24 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : paginatedEnseignes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="p-8 text-center">
                    <p style={{ color: colors.text.subtle }}>
                      Aucune enseigne trouvée
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedEnseignes.map(enseigne => (
                  <TableRow key={enseigne.id} className="hover:bg-neutral-50">
                    <TableCell>
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
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-medium">
                        {enseigne.member_count}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={enseigne.is_active ? 'default' : 'secondary'}
                      >
                        {enseigne.is_active ? 'Active' : 'Archivée'}
                      </Badge>
                    </TableCell>
                    {/* Actions - Pattern Catalogue IconButton */}
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        {enseigne.is_active ? (
                          <>
                            <Link
                              href={`/contacts-organisations/enseignes/${enseigne.id}`}
                            >
                              <IconButton
                                variant="outline"
                                size="sm"
                                icon={Eye}
                                label="Voir détails"
                              />
                            </Link>
                            <IconButton
                              variant="outline"
                              size="sm"
                              icon={Pencil}
                              label="Modifier"
                              onClick={() => handleOpenEditModal(enseigne)}
                            />
                            <IconButton
                              variant="danger"
                              size="sm"
                              icon={Archive}
                              label="Archiver"
                              onClick={() => {
                                void handleArchive(enseigne).catch(error => {
                                  console.error(
                                    '[Enseignes] Archive action failed:',
                                    error
                                  );
                                });
                              }}
                            />
                          </>
                        ) : (
                          <>
                            <IconButton
                              variant="success"
                              size="sm"
                              icon={ArchiveRestore}
                              label="Restaurer"
                              onClick={() => {
                                void handleArchive(enseigne).catch(error => {
                                  console.error(
                                    '[Enseignes] Archive action failed:',
                                    error
                                  );
                                });
                              }}
                            />
                            <IconButton
                              variant="danger"
                              size="sm"
                              icon={Trash2}
                              label="Supprimer"
                              onClick={() => setDeleteConfirmEnseigne(enseigne)}
                            />
                            <Link
                              href={`/contacts-organisations/enseignes/${enseigne.id}`}
                            >
                              <IconButton
                                variant="outline"
                                size="sm"
                                icon={Eye}
                                label="Voir détails"
                              />
                            </Link>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
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

            {/* Logo Upload - uniquement en mode édition */}
            {editingEnseigne ? (
              <div className="space-y-2">
                <Label>Logo</Label>
                <EnseigneLogoUploadButton
                  enseigneId={editingEnseigne.id}
                  enseigneName={editingEnseigne.name}
                  currentLogoUrl={editingEnseigne.logo_url}
                  onUploadSuccess={() => {
                    void refetch().catch(error => {
                      console.error(
                        '[Enseignes] Refetch after upload failed:',
                        error
                      );
                    });
                  }}
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
              onClick={() => {
                void handleSubmit().catch(error => {
                  console.error('[Enseignes] Submit failed:', error);
                });
              }}
              loading={isSubmitting}
              disabled={!formData.name.trim()}
            >
              {editingEnseigne ? 'Enregistrer' : 'Créer'}
            </ButtonV2>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal - avec avertissement organisations */}
      <Dialog
        open={!!deleteConfirmEnseigne}
        onOpenChange={() => setDeleteConfirmEnseigne(null)}
      >
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Supprimer l'enseigne
            </DialogTitle>
            <DialogDescription className="pt-2">
              Êtes-vous sûr de vouloir supprimer l'enseigne "
              <strong>{deleteConfirmEnseigne?.name}</strong>" ?
            </DialogDescription>
          </DialogHeader>

          {/* Avertissement si des organisations sont liées */}
          {deleteConfirmEnseigne && deleteConfirmEnseigne.member_count > 0 && (
            <div
              className="p-4 rounded-lg flex items-start gap-3"
              style={{
                backgroundColor: colors.warning[50],
                borderColor: colors.warning[200],
              }}
            >
              <AlertTriangle
                className="h-5 w-5 flex-shrink-0 mt-0.5"
                style={{ color: colors.warning[600] }}
              />
              <div>
                <p
                  className="text-sm font-medium"
                  style={{ color: colors.warning[800] }}
                >
                  {deleteConfirmEnseigne.member_count} organisation(s) liée(s)
                </p>
                <p
                  className="text-sm mt-1"
                  style={{ color: colors.warning[700] }}
                >
                  Les organisations seront automatiquement dissociées de cette
                  enseigne mais ne seront pas supprimées.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="mt-4">
            <ButtonV2
              variant="ghost"
              onClick={() => setDeleteConfirmEnseigne(null)}
            >
              Annuler
            </ButtonV2>
            <ButtonV2
              variant="destructive"
              onClick={() => {
                void handleDelete().catch(error => {
                  console.error('[Enseignes] Delete failed:', error);
                });
              }}
              loading={isSubmitting}
            >
              Supprimer définitivement
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
        currentOrganisations={enseigneWithOrgs?.organisations ?? []}
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
          void refetch().catch(error => {
            console.error(
              '[Enseignes] Refetch after assign success failed:',
              error
            );
          });
        }}
      />
    </div>
  );
}
