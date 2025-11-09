'use client';

import { useState, useEffect } from 'react';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import {
  Users,
  Package,
  Link,
  ArrowLeft,
  Plus,
  Search,
  Filter,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  Mail,
  Calendar,
  XCircle,
  Camera,
} from 'lucide-react';

import { useToast } from '@verone/common';
import { useConsultations } from '@verone/consultations';
import { useConsultationImages } from '@verone/consultations';

import { ConsultationImageViewerModal } from '../../components/business/consultation-image-viewer-modal';
import { ConsultationOrderInterface } from '../../components/business/consultation-order-interface';
import { Alert, AlertDescription } from '@verone/ui';
import { Badge } from '@verone/ui';
import { Button } from '@verone/ui';
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@verone/ui';

// Composant pour afficher une ligne de consultation avec miniature photo
interface ConsultationRowProps {
  consultation: any;
  onOpenPhotoModal: (id: string, title: string) => void;
  onViewDetails: () => void;
}

function ConsultationRow({
  consultation,
  onOpenPhotoModal,
  onViewDetails,
}: ConsultationRowProps) {
  const { primaryImage, hasImages, loading } = useConsultationImages({
    consultationId: consultation.id,
    autoFetch: true,
  });

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        {/* Miniature photo cliquable */}
        <div className="flex-shrink-0">
          {loading ? (
            <div className="w-12 h-12 bg-gray-100 animate-pulse rounded" />
          ) : hasImages && primaryImage ? (
            <button
              onClick={() =>
                onOpenPhotoModal(
                  consultation.id,
                  consultation.organisation_name
                )
              }
              className="relative w-12 h-12 overflow-hidden rounded border border-gray-200 hover:border-black transition-colors group"
              title="Cliquer pour voir toutes les photos"
            >
              <Image
                src={primaryImage.public_url || '/placeholder-consultation.svg'}
                alt={`Photo ${consultation.organisation_name}`}
                fill
                className="object-cover group-hover:scale-110 transition-transform"
                sizes="48px"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                <Eye className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
          ) : (
            <div className="w-12 h-12 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
              <Camera className="h-5 w-5 text-gray-400" />
            </div>
          )}
        </div>

        {/* Contenu consultation */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold">
              {consultation.organisation_name}
            </h3>
            <Badge
              variant="outline"
              className={
                consultation.status === 'en_attente'
                  ? 'border-gray-200 text-gray-800'
                  : consultation.status === 'en_cours'
                    ? 'border-blue-200 text-blue-700'
                    : consultation.status === 'terminee'
                      ? 'border-green-200 text-green-700'
                      : 'border-gray-200 text-gray-700'
              }
            >
              {consultation.status === 'en_attente' && (
                <Clock className="h-3 w-3 mr-1" />
              )}
              {consultation.status === 'en_cours' && (
                <AlertCircle className="h-3 w-3 mr-1" />
              )}
              {consultation.status === 'terminee' && (
                <CheckCircle className="h-3 w-3 mr-1" />
              )}
              {consultation.status === 'annulee' && (
                <XCircle className="h-3 w-3 mr-1" />
              )}
              {consultation.status.replace('_', ' ')}
            </Badge>
            <Badge
              variant="outline"
              className={
                consultation.priority_level <= 2
                  ? 'border-red-200 text-red-700'
                  : consultation.priority_level === 3
                    ? 'border-blue-200 text-blue-700'
                    : 'border-gray-200 text-gray-700'
              }
            >
              Priorité {consultation.priority_level}
            </Badge>
          </div>

          <p className="text-gray-600 text-sm line-clamp-2">
            {consultation.descriptif}
          </p>

          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center">
              <Mail className="h-4 w-4 mr-1" />
              {consultation.client_email}
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              {new Date(consultation.created_at).toLocaleDateString('fr-FR')}
            </div>
            {consultation.tarif_maximum && (
              <div className="flex items-center">
                <span>Budget: {consultation.tarif_maximum}€</span>
              </div>
            )}
          </div>
        </div>

        {/* Bouton voir détails */}
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={onViewDetails}>
            <Eye className="h-4 w-4 mr-1" />
            Voir détails
          </Button>
        </div>
      </div>
    </div>
  );
}

// Composant modal pour afficher les photos d'une consultation
interface ConsultationPhotoModalProps {
  consultationId: string;
  consultationTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

function ConsultationPhotoModal({
  consultationId,
  consultationTitle,
  isOpen,
  onClose,
}: ConsultationPhotoModalProps) {
  const { images } = useConsultationImages({
    consultationId,
    autoFetch: true,
  });

  const [selectedImageIndex] = useState(0);

  if (!isOpen) return null;

  return (
    <ConsultationImageViewerModal
      isOpen={isOpen}
      onClose={onClose}
      images={images as any}
      initialImageIndex={selectedImageIndex}
      consultationTitle={consultationTitle}
      allowEdit={false}
    />
  );
}

export default function ConsultationsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { consultations, loading, fetchConsultations } = useConsultations();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [selectedConsultationId, setSelectedConsultationId] = useState<
    string | null
  >(null);
  const [selectedConsultationTitle, setSelectedConsultationTitle] =
    useState('');

  useEffect(() => {
    fetchConsultations();
  }, []);

  // Filtrer les consultations
  const filteredConsultations = consultations.filter(consultation => {
    const matchesSearch =
      consultation.organisation_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      consultation.descriptif
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      consultation.client_email
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || consultation.status === statusFilter;
    const matchesPriority =
      priorityFilter === 'all' ||
      consultation.priority_level.toString() === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Grouper par statut
  const consultationsByStatus = {
    en_attente: filteredConsultations.filter(c => c.status === 'en_attente'),
    en_cours: filteredConsultations.filter(c => c.status === 'en_cours'),
    terminee: filteredConsultations.filter(c => c.status === 'terminee'),
    annulee: filteredConsultations.filter(c => c.status === 'annulee'),
  };

  const handleOpenPhotoModal = (
    consultationId: string,
    consultationTitle: string
  ) => {
    setSelectedConsultationId(consultationId);
    setSelectedConsultationTitle(consultationTitle);
    setPhotoModalOpen(true);
  };

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
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="flex items-center text-gray-600 hover:text-black"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-black">
                  Consultations Clients
                </h1>
                <p className="text-gray-600">
                  Gestion des consultations et associations produits
                </p>
              </div>
            </div>

            <Button
              onClick={() => router.push('/consultations/create')}
              className="bg-black hover:bg-gray-800 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle consultation
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-6">
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
                    <SelectItem value="1">Très urgent</SelectItem>
                    <SelectItem value="2">Urgent</SelectItem>
                    <SelectItem value="3">Normal</SelectItem>
                    <SelectItem value="4">Faible</SelectItem>
                    <SelectItem value="5">Très faible</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setPriorityFilter('all');
                  }}
                  className="w-full"
                >
                  Réinitialiser
                </Button>
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
                      router.push(`/consultations/${consultation.id}`)
                    }
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
          onClose={() => {
            setPhotoModalOpen(false);
            setSelectedConsultationId(null);
            setSelectedConsultationTitle('');
          }}
        />
      )}
    </div>
  );
}
