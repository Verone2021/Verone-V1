"use client"

import { useState, useMemo } from "react"
import { Search, Plus, Edit3, Trash2, Share2, Eye, EyeOff, ExternalLink, Copy } from "lucide-react"
import { Button } from "../../../components/ui/button"
import { Badge } from "../../../components/ui/badge"
import { cn } from "../../../lib/utils"
import { checkSLOCompliance } from "../../../lib/utils"
import { useCollections, Collection, CollectionFilters } from "@/hooks/use-collections"

// Interface filtres collections
interface LocalCollectionFilters {
  search: string
  status: 'all' | 'active' | 'inactive'
  visibility: 'all' | 'public' | 'private'
  shared: 'all' | 'shared' | 'not_shared'
}

export default function CollectionsPage() {
  const startTime = performance.now()

  // États pour la gestion des filtres et de l'interface
  const [filters, setFilters] = useState<LocalCollectionFilters>({
    search: "",
    status: 'all',
    visibility: 'all',
    shared: 'all'
  })
  const [selectedCollections, setSelectedCollections] = useState<string[]>([])
  const [showShareModal, setShowShareModal] = useState<string | null>(null)

  // Hook pour récupérer les collections réelles depuis Supabase
  const {
    collections,
    loading,
    error,
    refetch,
    createCollection,
    deleteCollection,
    toggleCollectionStatus,
    generateShareToken,
    recordShare
  } = useCollections({
    search: filters.search || undefined,
    status: filters.status,
    visibility: filters.visibility,
    shared: filters.shared
  })

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

  const handleShareCollection = async (collection: Collection) => {
    if (collection.shared_link_token) {
      const shareUrl = `${window.location.origin}/c/${collection.shared_link_token}`
      navigator.clipboard.writeText(shareUrl)
      await recordShare(collection.id, 'link')
      console.log(`Lien copié: ${shareUrl}`)
    } else {
      const token = await generateShareToken(collection.id)
      if (token) {
        const shareUrl = `${window.location.origin}/c/${token}`
        navigator.clipboard.writeText(shareUrl)
        await recordShare(collection.id, 'link')
        console.log(`Lien généré et copié: ${shareUrl}`)
      }
    }
  }

  const handleBulkStatusToggle = async () => {
    console.log("Changement de statut en lot pour :", selectedCollections)
    for (const collectionId of selectedCollections) {
      await toggleCollectionStatus(collectionId)
    }
    setSelectedCollections([])
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

  // Composant Collection Card
  const CollectionCard = ({ collection }: { collection: Collection }) => {
    const isSelected = selectedCollections.includes(collection.id)
    const hasSharedLink = collection.shared_link_token

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
                <div className="flex items-center space-x-2 mt-2">
                  <Badge variant={collection.is_active ? "default" : "secondary"}>
                    {collection.is_active ? "Actif" : "Inactif"}
                  </Badge>
                  <Badge variant={collection.visibility === 'public' ? "outline" : "secondary"}>
                    {collection.visibility === 'public' ? "Public" : "Privé"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Actions rapides */}
            <div className="flex items-center space-x-1 ml-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleCollectionStatus(collection.id)}
              >
                {collection.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleShareCollection(collection)}
                className={cn(hasSharedLink && "text-blue-600")}
              >
                {hasSharedLink ? <Copy className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => console.log(`Edit collection ${collection.id}`)}
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
              {collection.shared_count} partage{collection.shared_count !== 1 ? 's' : ''}
              {collection.last_shared && (
                <span className="ml-1">• {formatDate(collection.last_shared)}</span>
              )}
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

          {/* Lien de partage */}
          {hasSharedLink && (
            <div className="mt-3 p-2 bg-blue-50 rounded text-xs">
              <div className="flex items-center space-x-2">
                <ExternalLink className="h-3 w-3 text-blue-600" />
                <span className="text-blue-600 font-mono truncate flex-1">
                  /c/{collection.shared_link_token}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Vérification performance SLO (<2s)
  const loadTime = performance.now() - startTime
  checkSLOCompliance('collections_page', loadTime, 2000)

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
        <Button
          onClick={() => console.log("Créer une nouvelle collection")}
          className="bg-black text-white hover:bg-gray-800"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle collection
        </Button>
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

          <select
            value={filters.shared}
            onChange={(e) => setFilters(prev => ({ ...prev, shared: e.target.value as any }))}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="all">Tous</option>
            <option value="shared">Partagées</option>
            <option value="not_shared">Non partagées</option>
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
            onClick={() => console.log("Partage en lot")}
            className="text-blue-600 hover:text-blue-700"
          >
            Partager
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => console.log("Suppression en lot")}
            className="text-red-600 hover:text-red-700"
          >
            Supprimer
          </Button>
        </div>
      )}

      {/* Grille des collections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
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
        ) : filteredCollections.length > 0 ? (
          filteredCollections.map(collection => (
            <CollectionCard key={collection.id} collection={collection} />
          ))
        ) : (
          <div className="col-span-full p-8 text-center text-gray-500 bg-white rounded-lg border border-gray-200">
            Aucune collection trouvée pour les critères sélectionnés
          </div>
        )}
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-light text-black">
            {loading ? '...' : collections.length}
          </div>
          <div className="text-sm text-gray-600">Collections totales</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-light text-black">
            {loading ? '...' : collections.filter(c => c.is_active).length}
          </div>
          <div className="text-sm text-gray-600">Collections actives</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-light text-black">
            {loading ? '...' : collections.filter(c => c.shared_link_token).length}
          </div>
          <div className="text-sm text-gray-600">Collections partagées</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-light text-black">
            {loading ? '...' : collections.reduce((sum, c) => sum + c.shared_count, 0)}
          </div>
          <div className="text-sm text-gray-600">Partages totaux</div>
        </div>
      </div>
    </div>
  )
}