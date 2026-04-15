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

        {/* Filtres compacts */}
        <div className="bg-white border border-gray-200 rounded-xl px-3 py-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Rechercher..."
                className="pl-8 h-8 text-xs"
              />
            </div>
            <div className="h-5 w-px bg-gray-200" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-auto min-w-[110px] h-8 text-xs gap-1">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Statut</SelectItem>
                <SelectItem value="en_attente">En attente</SelectItem>
                <SelectItem value="en_cours">En cours</SelectItem>
                <SelectItem value="terminee">Terminée</SelectItem>
                <SelectItem value="annulee">Annulée</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-auto min-w-[100px] h-8 text-xs gap-1">
                <SelectValue placeholder="Priorité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Priorité</SelectItem>
                <SelectItem value="5">Très urgent</SelectItem>
                <SelectItem value="4">Urgent</SelectItem>
                <SelectItem value="3">Normal+</SelectItem>
                <SelectItem value="2">Normal</SelectItem>
                <SelectItem value="1">Faible</SelectItem>
              </SelectContent>
            </Select>
            <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
              <Switch
                checked={showArchived}
                onCheckedChange={setShowArchived}
                className="scale-75"
              />
              Archivées
            </label>
            {(statusFilter !== 'all' ||
              priorityFilter !== 'all' ||
              searchTerm) && (
              <>
                <div className="h-5 w-px bg-gray-200" />
                <button
                  onClick={handleResetFilters}
                  className="text-xs text-gray-500 hover:text-black px-2 py-1 rounded hover:bg-gray-100"
                >
                  Réinitialiser
                </button>
              </>
            )}
          </div>
        </div>

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
