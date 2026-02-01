import Link from 'next/link';

import { Badge } from '@verone/ui';
import { ButtonUnified } from '@verone/ui';
import { ArrowLeft, Package, RotateCcw, Trash2 } from 'lucide-react';

export default function ArchivedProductsPage() {
  // Données mockées pour l'interface
  const archivedProducts: any[] = [];

  const statusConfig = {
    archived: { label: '📦 Archivé', className: 'bg-gray-600 text-white' },
    discontinued: { label: '⛔ Arrêté', className: 'bg-red-600 text-white' },
    end_of_life: {
      label: '🔚 Fin de série',
      className: 'bg-gray-100 text-white',
    },
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/produits/catalogue"
            className="inline-flex items-center px-3 py-1.5 text-sm border border-black text-black bg-white hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au catalogue
          </Link>

          <div>
            <h1 className="text-3xl font-bold tracking-tight text-black">
              Produits Archivés
            </h1>
            <p className="text-gray-600 mt-2">
              Produits archivés, arrêtés et en fin de série
            </p>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 p-4">
          <div className="text-2xl font-bold text-black">0</div>
          <div className="text-sm text-gray-600">Total archivé</div>
        </div>
        <div className="bg-white border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-600">0</div>
          <div className="text-sm text-gray-600">Archivés</div>
        </div>
        <div className="bg-white border border-gray-200 p-4">
          <div className="text-2xl font-bold text-red-600">0</div>
          <div className="text-sm text-gray-600">Arrêtés</div>
        </div>
        <div className="bg-white border border-gray-200 p-4">
          <div className="text-2xl font-bold text-black">0</div>
          <div className="text-sm text-gray-600">Fin de série</div>
        </div>
      </div>

      {/* Liste des produits archivés */}
      {archivedProducts.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200">
          <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucun produit archivé
          </h3>
          <p className="text-gray-600 mb-4">
            Les produits archivés, arrêtés ou en fin de série apparaîtront ici
          </p>
          <Link
            href="/produits/catalogue"
            className="inline-flex items-center px-4 py-2 bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <Package className="h-4 w-4 mr-2" />
            Voir le catalogue actif
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {archivedProducts.map((product: any) => (
            <div
              key={product.id}
              className="bg-white border border-gray-200 p-6 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-black">
                      {product.name}
                    </h3>
                    <Badge
                      className={
                        statusConfig[
                          product.status as keyof typeof statusConfig
                        ]?.className || 'bg-gray-600 text-white'
                      }
                    >
                      {statusConfig[product.status as keyof typeof statusConfig]
                        ?.label ?? '📦 Archivé'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                    <div>
                      <span className="font-medium">SKU:</span> {product.sku}
                    </div>
                    <div>
                      <span className="font-medium">Prix HT:</span>{' '}
                      {product.price_ht ? `${product.price_ht}€` : 'Non défini'}
                    </div>
                    <div>
                      <span className="font-medium">Archivé le:</span>{' '}
                      {new Date(product.archived_at).toLocaleDateString(
                        'fr-FR'
                      )}
                    </div>
                    <div>
                      <span className="font-medium">Raison:</span>{' '}
                      {product.archived_reason ?? 'Non spécifiée'}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <ButtonUnified
                    variant="success"
                    size="sm"
                    icon={RotateCcw}
                    iconPosition="left"
                    className="text-xs"
                  >
                    Restaurer
                  </ButtonUnified>

                  <ButtonUnified
                    variant="danger"
                    size="sm"
                    icon={Trash2}
                    iconPosition="left"
                    className="text-xs"
                  >
                    Supprimer
                  </ButtonUnified>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Note explicative */}
      <div className="bg-blue-50 border border-blue-200 p-4">
        <h4 className="font-medium text-blue-900 mb-2">
          À propos des produits archivés
        </h4>
        <div className="text-sm text-blue-700 space-y-1">
          <p>
            <strong>📦 Archivé :</strong> Produits temporairement retirés du
            catalogue actif
          </p>
          <p>
            <strong>⛔ Arrêté :</strong> Produits définitivement arrêtés par le
            fabricant
          </p>
          <p>
            <strong>🔚 Fin de série :</strong> Produits en fin de vie
            commerciale
          </p>
        </div>
      </div>
    </div>
  );
}
