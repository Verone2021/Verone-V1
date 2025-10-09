'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Edit, Trash2, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
  usePriceList,
  usePriceListItems,
  useDeletePriceListItem,
  type PriceListType
} from '@/hooks/use-price-lists'
import { PriceListItemFormModal } from '@/components/business/price-list-item-form-modal'
import { formatCurrency } from '@/lib/utils'

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

export default function PriceListDetailPage() {
  const params = useParams()
  const router = useRouter()
  const priceListId = params.id as string

  const [showAddItemModal, setShowAddItemModal] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)

  // Hooks
  const { data: priceList, isLoading: listLoading } = usePriceList(priceListId)
  const { data: items, isLoading: itemsLoading } = usePriceListItems(priceListId)
  const { mutate: deleteItem } = useDeletePriceListItem()

  const handleDeleteItem = (itemId: string, productName: string) => {
    if (confirm(`Supprimer le produit "${productName}" de cette liste ?`)) {
      deleteItem({ itemId, priceListId })
    }
  }

  // Grouper items par produit (pour afficher tous les paliers d'un produit ensemble)
  const groupedItems = items?.reduce((acc, item) => {
    const productId = item.product_id
    if (!acc[productId]) {
      acc[productId] = {
        product: item.products,
        tiers: []
      }
    }
    acc[productId].tiers.push(item)
    return acc
  }, {} as Record<string, { product: any; tiers: typeof items }>)

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('fr-FR')
  }

  if (listLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-12">
          <p className="text-gray-500">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!priceList) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-12">
          <p className="text-red-600">Liste de prix introuvable</p>
          <Button onClick={() => router.push('/admin/pricing/lists')} className="mt-4">
            Retour aux listes
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      {/* En-tête avec retour */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push('/admin/pricing/lists')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-black">{priceList.name}</h1>
            <Badge variant="outline" className={listTypeColors[priceList.list_type]}>
              {listTypeLabels[priceList.list_type]}
            </Badge>
            <Badge variant={priceList.is_active ? 'default' : 'secondary'}>
              {priceList.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <div className="flex items-center gap-6 mt-2 text-sm text-gray-600">
            <span>Code: <span className="font-mono">{priceList.code}</span></span>
            <span>Priorité: <Badge variant="secondary">{priceList.priority}</Badge></span>
            <span>Devise: <span className="font-medium">{priceList.currency}</span></span>
          </div>
          {priceList.description && (
            <p className="text-gray-600 mt-2">{priceList.description}</p>
          )}
        </div>
        <Button onClick={() => setShowAddItemModal(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Ajouter Produit
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-black">
              {groupedItems ? Object.keys(groupedItems).length : 0}
            </div>
            <p className="text-sm text-gray-600">Produits dans la liste</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-black">
              {items?.length || 0}
            </div>
            <p className="text-sm text-gray-600">Paliers de prix configurés</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-black">
              {formatDate(priceList.valid_from)} - {formatDate(priceList.valid_until)}
            </div>
            <p className="text-sm text-gray-600">Période de validité</p>
          </CardContent>
        </Card>
      </div>

      {/* Tableau des produits avec paliers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="h-5 w-5" />
            Produits et Paliers de Prix
          </CardTitle>
        </CardHeader>
        <CardContent>
          {itemsLoading ? (
            <div className="text-center py-8 text-gray-500">
              Chargement des produits...
            </div>
          ) : groupedItems && Object.keys(groupedItems).length > 0 ? (
            <div className="space-y-6">
              {Object.entries(groupedItems).map(([productId, { product, tiers }]) => (
                <div key={productId} className="border rounded-lg p-4">
                  {/* En-tête produit */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg text-black">{product?.name}</h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                        <span>SKU: <span className="font-mono">{product?.sku}</span></span>
                        <span>Prix catalogue: <span className="font-medium">{formatCurrency(product?.price_ht)}</span></span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddItemModal(true)}
                      className="gap-2"
                    >
                      <Plus className="h-3 w-3" />
                      Ajouter Palier
                    </Button>
                  </div>

                  {/* Tableau paliers */}
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Quantité Min</TableHead>
                          <TableHead>Quantité Max</TableHead>
                          <TableHead>Prix HT</TableHead>
                          <TableHead>Remise</TableHead>
                          <TableHead>Marge</TableHead>
                          <TableHead>Validité</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tiers
                          .sort((a, b) => a.min_quantity - b.min_quantity)
                          .map((tier) => (
                            <TableRow key={tier.id}>
                              <TableCell>
                                <Badge variant="secondary">{tier.min_quantity}</Badge>
                              </TableCell>
                              <TableCell>
                                {tier.max_quantity ? (
                                  <Badge variant="secondary">{tier.max_quantity}</Badge>
                                ) : (
                                  <span className="text-gray-400">∞</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <span className="font-semibold">{formatCurrency(tier.price_ht)}</span>
                              </TableCell>
                              <TableCell>
                                {tier.discount_rate ? (
                                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    -{(tier.discount_rate * 100).toFixed(1)}%
                                  </Badge>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {tier.margin_rate ? (
                                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                    +{(tier.margin_rate * 100).toFixed(1)}%
                                  </Badge>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="text-xs text-gray-600">
                                  <div>{formatDate(tier.valid_from)}</div>
                                  <div>{formatDate(tier.valid_until)}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={tier.is_active ? 'default' : 'secondary'}>
                                  {tier.is_active ? 'Actif' : 'Inactif'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setEditingItemId(tier.id)}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteItem(tier.id, product?.name)}
                                    className="text-red-600 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Notes si présentes */}
                  {tiers.some(t => t.notes) && (
                    <div className="mt-3 p-3 bg-gray-50 rounded border border-gray-200">
                      <p className="text-xs font-medium text-gray-700">Notes:</p>
                      {tiers.filter(t => t.notes).map((tier) => (
                        <p key={tier.id} className="text-xs text-gray-600 mt-1">
                          • {tier.notes}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Aucun produit dans cette liste</p>
              <p className="text-sm mt-1">
                Ajoutez votre premier produit pour commencer à définir les prix
              </p>
              <Button onClick={() => setShowAddItemModal(true)} className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                Ajouter Produit
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Ajout/Édition Item */}
      <PriceListItemFormModal
        open={showAddItemModal || !!editingItemId}
        onClose={() => {
          setShowAddItemModal(false)
          setEditingItemId(null)
        }}
        priceListId={priceListId}
        itemId={editingItemId}
      />
    </div>
  )
}
