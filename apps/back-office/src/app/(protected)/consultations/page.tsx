'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@verone/ui';
import { ButtonUnified } from '@verone/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { Switch } from '@verone/ui';
import {
  Users,
  ArrowLeft,
  Plus,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';

import { ConsultationRow, ConsultationPhotoModal } from './consultation-row';
import { useConsultationsPage } from './use-consultations-page';

export default function ConsultationsPage() {
  const {
    consultations,
    filteredConsultations,
    consultationsByStatus,
    loading,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    showArchived,
    setShowArchived,
    photoModalOpen,
    selectedConsultationId,
    selectedConsultationTitle,
    deleteDialogOpen,
    setDeleteDialogOpen,
    handleArchive,
    handleUnarchive,
    handleConfirmDelete,
    handleRequestDelete,
    handleOpenPhotoModal,
    handleClosePhotoModal,
    handleResetFilters,
    handleNavigateToCreate,
    handleNavigateBack,
    handleNavigateToDetail,
  } = useConsultationsPage();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4" />
          <p className="text-gray-600">Chargement des consultations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="w-full px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <ButtonUnified
                variant="ghost"
                onClick={handleNavigateBack}
                className="flex items-center text-gray-600 hover:text-black"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </ButtonUnified>
              <div>
                <h1 className="text-2xl font-bold text-black">
                  Consultations Clients
                </h1>
                <p className="text-gray-600">
                  Gestion des consultations et associations produits
                </p>
              </div>
            </div>

            <ButtonUnified onClick={handleNavigateToCreate} variant="default">
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle consultation
            </ButtonUnified>
          </div>
        </div>
      </div>

      <div className="w-full px-4 py-8 space-y-6">
        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total consultations
              </CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{consultations.length}</div>
              <p className="text-xs text-gray-600">Toutes consultations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                En attente
              </CardTitle>
              <Clock className="h-4 w-4 text-gray-700" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {consultationsByStatus.en_attente.length}
              </div>
              <p className="text-xs text-gray-600">À traiter</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                En cours
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {consultationsByStatus.en_cours.length}
              </div>
              <p className="text-xs text-gray-600">En traitement</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Terminées
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {consultationsByStatus.terminee.length}
              </div>
              <p className="text-xs text-gray-600">Clôturées</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtres */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filtres et recherche
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Recherche</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Organisation, email, description..."
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Statut</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="en_attente">En attente</SelectItem>
                    <SelectItem value="en_cours">En cours</SelectItem>
                    <SelectItem value="terminee">Terminée</SelectItem>
                    <SelectItem value="annulee">Annulée</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Priorité</Label>
                <Select
                  value={priorityFilter}
                  onValueChange={setPriorityFilter}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les priorités</SelectItem>
                    <SelectItem value="5">Très urgent (5)</SelectItem>
                    <SelectItem value="4">Urgent (4)</SelectItem>
                    <SelectItem value="3">Normal+ (3)</SelectItem>
                    <SelectItem value="2">Normal (2)</SelectItem>
                    <SelectItem value="1">Faible (1)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col justify-end space-y-2">
                <ButtonUnified
                  variant="outline"
                  onClick={handleResetFilters}
                  className="w-full"
                >
                  Réinitialiser
                </ButtonUnified>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-archived"
                    checked={showArchived}
                    onCheckedChange={setShowArchived}
                  />
                  <Label
                    htmlFor="show-archived"
                    className="text-sm cursor-pointer"
                  >
                    Inclure les archivées
                  </Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liste des consultations */}
        <Card>
          <CardHeader>
            <CardTitle>
              Liste des consultations ({filteredConsultations.length})
            </CardTitle>
            <CardDescription>
              Cliquez sur la photo pour voir toutes les images, ou sur "Voir
              détails" pour gérer les produits
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredConsultations.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  Aucune consultation ne correspond à vos critères
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredConsultations.map(consultation => (
                  <ConsultationRow
                    key={consultation.id}
                    consultation={consultation}
                    onOpenPhotoModal={handleOpenPhotoModal}
                    onViewDetails={() =>
                      handleNavigateToDetail(consultation.id)
                    }
                    onArchive={() => {
                      void handleArchive(consultation.id).catch(error => {
                        console.error(
                          '[ConsultationsPage] Archive failed:',
                          error
                        );
                      });
                    }}
                    onUnarchive={() => {
                      void handleUnarchive(consultation.id).catch(error => {
                        console.error(
                          '[ConsultationsPage] Unarchive failed:',
                          error
                        );
                      });
                    }}
                    onDelete={() => handleRequestDelete(consultation.id)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal Photo Viewer */}
      {selectedConsultationId && (
        <ConsultationPhotoModal
          consultationId={selectedConsultationId}
          consultationTitle={selectedConsultationTitle}
          isOpen={photoModalOpen}
          onClose={handleClosePhotoModal}
        />
      )}

      {/* Dialog confirmation suppression */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la consultation ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La consultation sera définitivement
              supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                void handleConfirmDelete().catch(error => {
                  console.error('[ConsultationsPage] Delete failed:', error);
                });
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
