'use client';

import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { Globe, Link2, Share2, ShoppingCart } from 'lucide-react';

import type { CollectionData } from './types';

interface CollectionSharingCardProps {
  collection: CollectionData;
}

export function CollectionSharingCard({
  collection,
}: CollectionSharingCardProps) {
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Share2 className="h-5 w-5 mr-2" />
          Partage & Distribution
        </CardTitle>
        <p className="text-sm text-gray-600 mt-1">
          Paramètres de partage et intégration avec les canaux de vente
          (fonctionnalité à venir)
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* État actuel du partage */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <div className="text-xs font-medium text-gray-500 mb-1">
              Visibilité actuelle
            </div>
            <Badge
              variant={
                collection.visibility === 'public' ? 'secondary' : 'outline'
              }
              className="mt-1"
            >
              {collection.visibility === 'public' ? 'Publique' : 'Privée'}
            </Badge>
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500 mb-1">
              Lien de partage
            </div>
            <div className="flex items-center mt-1">
              {collection.shared_link_token ? (
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-800 border-green-200"
                >
                  <Link2 className="h-3 w-3 mr-1" />
                  Généré
                </Badge>
              ) : (
                <span className="text-sm text-gray-500">Non généré</span>
              )}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500 mb-1">
              Nombre de partages
            </div>
            <div className="text-2xl font-bold text-black mt-1">
              {collection.shared_count ?? 0}
            </div>
          </div>
        </div>

        {/* Canaux de distribution futurs */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Canaux de distribution disponibles
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <ButtonV2
              variant="outline"
              disabled
              className="h-auto py-4 cursor-not-allowed opacity-50 flex flex-col items-center justify-center space-y-2"
            >
              <Globe className="h-6 w-6" />
              <div className="text-sm font-medium">Site Web Vérone</div>
              <Badge variant="secondary" className="text-xs">
                Bientôt disponible
              </Badge>
            </ButtonV2>

            <ButtonV2
              variant="outline"
              disabled
              className="h-auto py-4 cursor-not-allowed opacity-50 flex flex-col items-center justify-center space-y-2"
            >
              <ShoppingCart className="h-6 w-6" />
              <div className="text-sm font-medium">Google Merchant</div>
              <Badge variant="secondary" className="text-xs">
                Bientôt disponible
              </Badge>
            </ButtonV2>

            <ButtonV2
              variant="outline"
              disabled
              className="h-auto py-4 cursor-not-allowed opacity-50 flex flex-col items-center justify-center space-y-2"
            >
              <Share2 className="h-6 w-6" />
              <div className="text-sm font-medium">Autres canaux</div>
              <Badge variant="secondary" className="text-xs">
                Bientôt disponible
              </Badge>
            </ButtonV2>
          </div>
          <p className="text-xs text-gray-500 mt-4 p-3 bg-blue-50 rounded-md border border-blue-100">
            💡 Ces options seront activées lors du développement des interfaces
            de vente et de leur connexion au back-office Vérone.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
