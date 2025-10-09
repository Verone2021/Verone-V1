'use client'

import { useState } from 'react'
import { Plus, Edit, Trash2, Search, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  usePriceLists,
  useDeletePriceList,
  type PriceListType,
  type PriceList
} from '@/hooks/use-price-lists'
import { PriceListFormModal } from '@/components/business/price-list-form-modal'

// Labels et couleurs par type de liste
const listTypeLabels: Record<PriceListType, string> = {
  base: 'Base Catalogue',
  customer_group: 'Groupe Client',
  channel: 'Canal de Vente',
  promotional: 'Promotionnelle',
  contract: 'Contrat Client'
}

const listTypeColors: Record<PriceListType, string> = {
  base: 'bg-gray-100 text-gray-800 border-gray-200',
  customer_group: 'bg-blue-100 text-blue-800 border-blue-200',
  channel: 'bg-green-100 text-green-800 border-green-200',
  promotional: 'bg-orange-100 text-orange-800 border-orange-200',
  contract: 'bg-purple-100 text-purple-800 border-purple-200'
}

export default function PriceListsAdminPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<PriceListType | 'all'>('all')
  const [filterActive, setFilterActive] = useState<boolean | 'all'>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingPriceList, setEditingPriceList] = useState<PriceList | null>(null)

  // Hooks
  const { data: priceLists, isLoading } = usePriceLists({
    list_type: filterType !== 'all' ? filterType : undefined,
    is_active: filterActive !== 'all' ? filterActive : undefined
  })
  const { mutate: deletePriceList } = useDeletePriceList()

  // Filtrer par recherche
  const filteredLists = priceLists?.filter(list =>
    list.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    list.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDelete = (priceList: PriceList) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la liste "${priceList.name}" ?`)) {
      deletePriceList(priceList.id)
    }
  }

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('fr-FR')
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black">Listes de Prix</h1>
          <p className="text-gray-600 mt-1">
            Gestion administrative des listes de prix et paliers quantités
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouvelle Liste
        </Button>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher par nom ou code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtre Type */}
            <Select
              value={filterType}
              onValueChange={(value) => setFilterType(value as PriceListType | 'all')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tous les types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="base">Base Catalogue</SelectItem>
                <SelectItem value="customer_group">Groupe Client</SelectItem>
                <SelectItem value="channel">Canal de Vente</SelectItem>
                <SelectItem value="promotional">Promotionnelle</SelectItem>
                <SelectItem value="contract">Contrat Client</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtre Actif */}
            <Select
              value={filterActive === 'all' ? 'all' : filterActive ? 'active' : 'inactive'}
              onValueChange={(value) => {
                if (value === 'all') setFilterActive('all')
                else setFilterActive(value === 'active')
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Toutes les listes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les listes</SelectItem>
                <SelectItem value="active">Actives uniquement</SelectItem>
                <SelectItem value="inactive">Inactives uniquement</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tableau */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {filteredLists?.length || 0} liste{(filteredLists?.length || 0) > 1 ? 's' : ''} de prix
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">
              Chargement...
            </div>
          ) : filteredLists && filteredLists.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Priorité</TableHead>
                    <TableHead>Validité</TableHead>
                    <TableHead>Devise</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLists.map((list) => (
                    <TableRow key={list.id}>
                      <TableCell>
                        <span className="font-mono text-sm">{list.code}</span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{list.name}</p>
                          {list.description && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {list.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={listTypeColors[list.list_type]}>
                          {listTypeLabels[list.list_type]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {list.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="text-gray-600">
                            Du {formatDate(list.valid_from)}
                          </p>
                          <p className="text-gray-600">
                            Au {formatDate(list.valid_until)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{list.currency}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={list.is_active ? 'default' : 'secondary'}>
                          {list.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => router.push(`/admin/pricing/lists/${list.id}`)}
                            title="Gérer les items et paliers"
                          >
                            Gérer Items
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingPriceList(list)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(list)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg font-medium">Aucune liste de prix trouvée</p>
              <p className="text-sm mt-1">
                Créez votre première liste de prix pour commencer
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Création/Édition */}
      <PriceListFormModal
        open={showCreateModal || !!editingPriceList}
        onClose={() => {
          setShowCreateModal(false)
          setEditingPriceList(null)
        }}
        priceList={editingPriceList}
      />
    </div>
  )
}
