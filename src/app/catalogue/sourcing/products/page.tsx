import Link from 'next/link'
import { Search, Package, Edit, Eye } from 'lucide-react'
import { Badge } from '../../../../components/ui/badge'
import { createClient } from '../../../../lib/supabase/client'

// Types pour les produits sourcing
interface SourcingProduct {
  id: string
  name: string
  sku: string
  status: string
  requires_sample: boolean
  creation_mode: string
  sourcing_type: string | null
  supplier_id: string | null
  supplier_price: number | null
  cost_price: number | null
  created_at: string
  updated_at: string
  supplier?: {
    name: string
  } | null
}

interface SourcingProductsFiltersProps {
  suppliers: Array<{ id: string; name: string }>
  searchParams: { [key: string]: string | string[] | undefined }
}

// Configuration des statuts
const STATUS_LABELS = {
  'draft': 'Prêt à finaliser',
  'sourcing': 'En sourcing',
  'pret_a_commander': 'Prêt à commander',
  'echantillon_a_commander': 'Échantillon à commander',
  'in_stock': 'Actif'
}

const STATUS_COLORS = {
  'draft': 'bg-blue-500',
  'sourcing': 'bg-gray-500',
  'pret_a_commander': 'bg-green-500',
  'echantillon_a_commander': 'bg-orange-500',
  'in_stock': 'bg-green-500'
}

const STATUS_ICONS = {
  'draft': '✓',
  'sourcing': '⏳',
  'pret_a_commander': '✅',
  'echantillon_a_commander': '⚠',
  'in_stock': '📦'
}

// Composant des filtres (simplifié pour éviter les erreurs)
function SourcingProductsFilters({ suppliers, searchParams }: SourcingProductsFiltersProps) {
  return (
    <div className="bg-white border border-gray-200 p-4">
      <p className="text-sm text-gray-600">
        Filtres disponibles : {suppliers.length} fournisseurs
      </p>
    </div>
  )
}

export default async function SourcingProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = createClient()

  // Paramètres de recherche - await pour Next.js 15
  const params = await searchParams
  const search = typeof params.search === 'string' ? params.search : ''
  const status = typeof params.status === 'string' ? params.status : ''
  const supplier = typeof params.supplier === 'string' ? params.supplier : ''

  // ✅ Requête corrigée : utiliser product_drafts avec supplier_price
  let query = supabase
    .from('product_drafts')
    .select(`
      id,
      name,
      sku,
      status,
      requires_sample,
      creation_mode,
      sourcing_type,
      supplier_id,
      supplier_price,
      cost_price,
      created_at,
      updated_at,
      supplier:organisations!supplier_id(name)
    `)
    .eq('creation_mode', 'sourcing')
    .order('updated_at', { ascending: false })

  // Filtres
  if (search) {
    query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`)
  }
  if (status) {
    query = query.eq('status', status)
  }
  if (supplier) {
    query = query.eq('supplier_id', supplier)
  }

  const { data: products, error } = await query

  if (error) {
    console.error('❌ Erreur chargement produits sourcing:', error)
    return <div>Erreur lors du chargement des produits</div>
  }

  // Statistiques
  const totalProducts = products?.length || 0
  const readyToOrder = products?.filter(p => p.status === 'draft').length || 0
  const needsSample = products?.filter(p => p.requires_sample).length || 0

  // Fournisseurs uniques pour le filtre
  const suppliers = await supabase
    .from('organisations')
    .select('id, name')
    .eq('type', 'supplier')
    .order('name')

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-black">
            Sourcing Produits
          </h1>
          <p className="text-gray-600 mt-2">
            Produits sourcés sauvegardés et prêts pour finalisation
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/catalogue/sourcing"
            className="inline-flex items-center px-4 py-2 border border-black text-sm font-medium text-black bg-white hover:bg-gray-50 transition-colors"
          >
            <Search className="h-4 w-4 mr-2" />
            Nouveau Sourcing
          </Link>
          <Link
            href="/catalogue"
            className="inline-flex items-center px-4 py-2 bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <Package className="h-4 w-4 mr-2" />
            Catalogue Principal
          </Link>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 p-4">
          <div className="text-2xl font-bold text-black">{totalProducts}</div>
          <div className="text-sm text-gray-600">Produits sourcés</div>
        </div>
        <div className="bg-white border border-gray-200 p-4">
          <div className="text-2xl font-bold text-green-600">{readyToOrder}</div>
          <div className="text-sm text-gray-600">Prêts à commander</div>
        </div>
        <div className="bg-white border border-gray-200 p-4">
          <div className="text-2xl font-bold text-orange-600">{needsSample}</div>
          <div className="text-sm text-gray-600">Échantillons requis</div>
        </div>
      </div>

      {/* Filtres */}
      <SourcingProductsFilters
        suppliers={suppliers?.data || []}
        searchParams={params}
      />

      {/* Liste des produits */}
      {totalProducts === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200">
          <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucun produit sourcé
          </h3>
          <p className="text-gray-600 mb-4">
            Commencez par sourcer des produits pour les voir apparaître ici
          </p>
          <Link
            href="/catalogue/sourcing"
            className="inline-flex items-center px-4 py-2 bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <Search className="h-4 w-4 mr-2" />
            Commencer le sourcing
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {products?.map((product) => (
            <div key={product.id} className="bg-white border border-gray-200 p-6 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-black">
                      {product.name}
                    </h3>
                    <Badge
                      className={`${STATUS_COLORS[product.status as keyof typeof STATUS_COLORS]} text-white`}
                    >
                      {STATUS_ICONS[product.status as keyof typeof STATUS_ICONS]}
                      {STATUS_LABELS[product.status as keyof typeof STATUS_LABELS]}
                    </Badge>
                    {product.requires_sample && (
                      <Badge variant="outline" className="border-orange-500 text-orange-700">
                        📋 Échantillon requis
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                    <div>
                      <span className="font-medium">SKU:</span> {product.sku}
                    </div>
                    <div>
                      <span className="font-medium">Fournisseur:</span>{' '}
                      {product.supplier?.name || 'Non défini'}
                    </div>
                    <div>
                      <span className="font-medium">Prix fournisseur:</span>{' '}
                      {product.supplier_price ? `${product.supplier_price}€` : 'Non défini'}
                    </div>
                    <div>
                      <span className="font-medium">Type:</span>{' '}
                      {product.sourcing_type || 'Standard'}
                    </div>
                  </div>

                  <div className="text-xs text-gray-500">
                    Mis à jour le {new Date(product.updated_at).toLocaleDateString('fr-FR')}
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  {/* ✅ Navigation vers page d'édition pour les drafts */}
                  <Link
                    href={`/catalogue/edit/${product.id}`}
                    className="inline-flex items-center px-3 py-1.5 text-sm bg-black text-white hover:bg-gray-800 transition-colors"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Finaliser
                  </Link>

                  <Link
                    href={`/catalogue/sourcing/products/${product.id}`}
                    className="inline-flex items-center px-3 py-1.5 text-sm border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Voir
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}