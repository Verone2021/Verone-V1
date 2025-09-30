"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, Plus, Edit3, Trash2, Eye, EyeOff, ExternalLink, Package, Archive } from "lucide-react"
import { Button } from "../../../components/ui/button"
import { Badge } from "../../../components/ui/badge"
import { cn } from "../../../lib/utils"
import { useCollections, Collection, CollectionFilters, CreateCollectionData } from "@/hooks/use-collections"
import { CollectionCreationWizard, CreateCollectionInput } from "@/components/business/collection-creation-wizard"
import { CollectionProductsModal } from "@/components/business/collection-products-modal"
import { useToast } from "@/hooks/use-toast"

// Interface filtres collections
interface LocalCollectionFilters {
  search: string
  status: 'all' | 'active' | 'inactive'
  visibility: 'all' | 'public' | 'private'
}

// Helper pour formater le style de collection
const formatCollectionStyle = (style?: string): string => {
  if (!style) return ''
  const styleMap: Record<string, string> = {
    'minimaliste': 'Minimaliste',
    'contemporain': 'Contemporain',
    'moderne': 'Moderne',
    'scandinave': 'Scandinave',
    'industriel': 'Industriel',
    'classique': 'Classique',
    'boheme': 'Bohème',
    'art_deco': 'Art Déco'
  }
  return styleMap[style] || style
}

// Helper pour formater la catégorie de pièce
const formatRoomCategory = (roomCategory?: string): string => {
  if (!roomCategory) return ''
  const roomMap: Record<string, string> = {
    'chambre': 'Chambre',
    'wc_salle_bain': 'Salle de bain',
    'salon': 'Salon',
    'cuisine': 'Cuisine',
    'bureau': 'Bureau',
    'salle_a_manger': 'Salle à manger',
    'entree': 'Entrée',
    'plusieurs_pieces': 'Plusieurs pièces',
    'exterieur_balcon': 'Balcon',
    'exterieur_jardin': 'Jardin'
  }
  return roomMap[roomCategory] || roomCategory
}

export default function CollectionsPage() {
  const { toast } = useToast()
  const router = useRouter()

  // États pour la gestion des filtres et de l'interface
  const [filters, setFilters] = useState<LocalCollectionFilters>({
    search: "",
    status: 'all',
    visibility: 'all'
  })
  const [selectedCollections, setSelectedCollections] = useState<string[]>([])
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [managingProductsCollection, setManagingProductsCollection] = useState<Collection | null>(null)
  const [showProductsModal, setShowProductsModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active')
  const [archivedCollections, setArchivedCollections] = useState<Collection[]>([])
  const [archivedLoading, setArchivedLoading] = useState(false)

  // Hook pour récupérer les collections réelles depuis Supabase
  const {
    collections,
    loading,
    error,
    refetch,
    loadArchivedCollections,
    createCollection,
    updateCollection,
    deleteCollection,
    toggleCollectionStatus,
    archiveCollection,
    unarchiveCollection
  } = useCollections({
    search: filters.search || undefined,
    status: filters.status,
    visibility: filters.visibility
  })

  // Fonction pour charger les collections archivées
  const loadArchivedCollectionsData = async () => {
    setArchivedLoading(true)
    try {
      const result = await loadArchivedCollections()
      setArchivedCollections(result)
    } catch (error) {
      console.error('Erreur chargement collections archivées:', error)
    } finally {
      setArchivedLoading(false)
    }
  }

  // Charger les collections archivées quand on change d'onglet
  useEffect(() => {
    if (activeTab === 'archived') {
      loadArchivedCollectionsData()
    }
  }, [activeTab])

  // Pas besoin de filtrage manuel, le hook s'en charge
  const filteredCollections = collections

  // Fonctions utilitaires
  const toggleCollectionSelection = (collectionId: string) => {
    setSelectedCollections(prev =>
      prev.includes(collectionId)
        ? prev.filter(id => id !== collectionId)
        : [...prev, collectionId]
    )
  }


  const handleBulkStatusToggle = async () => {
    let successCount = 0
    for (const collectionId of selectedCollections) {
      const success = await toggleCollectionStatus(collectionId)
      if (success) successCount++
    }
    setSelectedCollections([])
    toast({
      title: "Statut mis à jour",
      description: `${successCount} collection(s) modifiée(s) avec succès`,
    })
  }

  const formatPrice = (priceInCents: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(priceInCents / 100)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const handleEditCollection = useCallback((collection: Collection) => {
    setEditingCollection(collection)
    setShowEditModal(true)
  }, [])

  const handleManageProducts = useCallback((collection: Collection) => {
    setManagingProductsCollection(collection)
    setShowProductsModal(true)
  }, [])

  const handleCreateCollection = useCallback(() => {
    setEditingCollection(null)
    setShowEditModal(true)
  }, [])

  const handleSaveCollection = useCallback(async (data: CreateCollectionInput) => {
    if (editingCollection) {
      // Mode édition
      const result = await updateCollection(editingCollection.id, data)
      if (result) {
        toast({
          title: "Collection modifiée",
          description: "La collection a été modifiée avec succès",
        })
        setShowEditModal(false)
        setEditingCollection(null)
        return true
      }
    } else {
      // Mode création
      const result = await createCollection(data)
      if (result) {
        toast({
          title: "Collection créée",
          description: "La nouvelle collection a été créée avec succès",
        })
        setShowEditModal(false)
        return true
      }
    }
    return false
  }, [editingCollection, createCollection, updateCollection, toast])

  const handleArchiveCollection = useCallback(async (collection: Collection) => {
    try {
      if (collection.archived_at) {
        await unarchiveCollection(collection.id)
        console.log('✅ Collection restaurée:', collection.name)
        toast({
          title: "Collection restaurée",
          description: "La collection a été restaurée avec succès",
        })
        // Rafraîchir la liste des archivées après restauration
        await loadArchivedCollectionsData()
      } else {
        await archiveCollection(collection.id)
        console.log('✅ Collection archivée:', collection.name)
        toast({
          title: "Collection archivée",
          description: "La collection a été archivée avec succès",
        })
        // Rafraîchir la liste des archivées après archivage
        await loadArchivedCollectionsData()
      }
    } catch (error) {
      console.error('❌ Erreur archivage collection:', error)
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'archivage",
        variant: "destructive"
      })
    }
  }, [archiveCollection, unarchiveCollection, toast, loadArchivedCollectionsData])

  // Composant Collection Card
  const renderCollectionCard = (collection: Collection) => {
    const isSelected = selectedCollections.includes(collection.id)

    return (
      <div className={cn(
        "bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow",
        isSelected && "ring-2 ring-black"
      )}>
        {/* En-tête avec sélection */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleCollectionSelection(collection.id)}
                className="mt-1 h-4 w-4 rounded border-gray-300"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 truncate">
                  {collection.name}
                </h3>
                {collection.description && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {collection.description}
                  </p>
                )}
                <div className="flex items-center flex-wrap gap-2 mt-2">
                  <Badge variant={collection.is_active ? "default" : "secondary"}>
                    {collection.is_active ? "Actif" : "Inactif"}
                  </Badge>
                  <Badge variant={collection.visibility === 'public' ? "outline" : "secondary"}>
                    {collection.visibility === 'public' ? "Public" : "Privé"}
                  </Badge>
                  {collection.style && (
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                      {formatCollectionStyle(collection.style)}
                    </Badge>
                  )}
                  {collection.room_category && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {formatRoomCategory(collection.room_category)}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Actions rapides */}
            <div className="flex items-center space-x-2 ml-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleCollectionStatus(collection.id)}
                title={collection.is_active ? "Désactiver" : "Activer"}
              >
                {collection.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleManageProducts(collection)}
                className="text-purple-600"
                title="Gérer les produits"
              >
                <Package className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleArchiveCollection(collection)}
                className="text-orange-600"
                title={collection.archived_at ? "Restaurer" : "Archiver"}
              >
                <Archive className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/catalogue/collections/${collection.id}`)}
                className="text-blue-600"
                title="Voir détail"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEditCollection(collection)}
                title="Modifier"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Aperçu des produits */}
        <div className="p-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
            <span>{collection.product_count} produit{collection.product_count !== 1 ? 's' : ''}</span>
            <span>
              Créé le {formatDate(collection.created_at)}
            </span>
          </div>

          {/* Mini-galerie produits */}
          {collection.products && (
            <div className="flex space-x-2 overflow-x-auto">
              {collection.products.slice(0, 4).map(product => (
                <div key={product.id} className="flex-shrink-0 w-20 h-20 rounded bg-gray-100 overflow-hidden">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
              {collection.product_count > 4 && (
                <div className="flex-shrink-0 w-20 h-20 rounded bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                  +{collection.product_count - 4}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    )
  }

  // Optimisation: Memoization des collections filtrées
  const stats = useMemo(() => ({
    total: collections.length,
    active: collections.filter(c => c.is_active).length,
    archived: archivedCollections.length,
  }), [collections, archivedCollections])

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light text-black">Collections</h1>
          <p className="text-gray-600 mt-1">
            Créez et partagez des sélections thématiques de produits
          </p>
        </div>
        <div>
          <Button
            onClick={handleCreateCollection}
            className="bg-black text-white hover:bg-gray-800"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle collection
          </Button>
        </div>
      </div>

      {/* Onglets collections actives/archivées */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'active'
              ? 'border-b-2 border-black text-black'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Collections Actives ({collections.length})
        </button>
        <button
          onClick={() => setActiveTab('archived')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'archived'
              ? 'border-b-2 border-black text-black'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Collections Archivées ({archivedCollections.length})
        </button>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Rechercher une collection..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
          />
        </div>

        <div className="flex space-x-2">
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actives</option>
            <option value="inactive">Inactives</option>
          </select>

          <select
            value={filters.visibility}
            onChange={(e) => setFilters(prev => ({ ...prev, visibility: e.target.value as any }))}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="all">Toutes visibilités</option>
            <option value="public">Publiques</option>
            <option value="private">Privées</option>
          </select>

        </div>
      </div>

      {/* Actions groupées */}
      {selectedCollections.length > 0 && (
        <div className="flex items-center space-x-2 p-4 bg-blue-50 rounded-md">
          <span className="text-sm text-gray-700">
            {selectedCollections.length} collection{selectedCollections.length !== 1 ? 's' : ''} sélectionnée{selectedCollections.length !== 1 ? 's' : ''}
          </span>
          <Button variant="ghost" size="sm" onClick={handleBulkStatusToggle}>
            Changer le statut
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // TODO: Implémenter partage en lot
            }}
            className="text-blue-600 hover:text-blue-700"
          >
            Partager
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // TODO: Implémenter suppression en lot
            }}
            className="text-red-600 hover:text-red-700"
          >
            Supprimer
          </Button>
        </div>
      )}

      {/* Grille des collections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {((activeTab === 'active' && loading) || (activeTab === 'archived' && archivedLoading)) ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 animate-pulse">
              <div className="p-4 border-b border-gray-200">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="p-4">
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))
        ) : error ? (
          <div className="col-span-full p-8 text-center text-red-500 bg-white rounded-lg border border-red-200">
            Erreur lors du chargement des collections: {error}
          </div>
        ) : (
          (() => {
            const currentCollections = activeTab === 'active' ? filteredCollections : archivedCollections
            return currentCollections.length > 0 ? (
              currentCollections.map(collection => (
                <div key={collection.id}>{renderCollectionCard(collection)}</div>
              ))
            ) : (
              <div className="col-span-full p-8 text-center text-gray-500 bg-white rounded-lg border border-gray-200">
                {activeTab === 'active'
                  ? 'Aucune collection trouvée pour les critères sélectionnés'
                  : 'Aucune collection archivée'
                }
              </div>
            )
          })()
        )}
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-light text-black">
            {loading ? '...' : stats.total}
          </div>
          <div className="text-sm text-gray-600">Collections totales</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-light text-black">
            {loading ? '...' : stats.active}
          </div>
          <div className="text-sm text-gray-600">Collections actives</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-light text-black">
            {archivedLoading ? '...' : stats.archived}
          </div>
          <div className="text-sm text-gray-600">Collections archivées</div>
        </div>
      </div>

      {/* Modal de création de collection avec wizard complet */}
      <CollectionCreationWizard
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleSaveCollection}
        editingCollection={editingCollection}
      />

      {/* Modal de gestion des produits */}
      <CollectionProductsModal
        collection={managingProductsCollection}
        isOpen={showProductsModal}
        onClose={() => setShowProductsModal(false)}
        onUpdate={refetch}
      />
    </div>
  )
}