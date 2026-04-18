'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { CompleteProductWizard } from '@verone/products';
import { Badge } from '@verone/ui';
import { ButtonUnified } from '@verone/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import {
  ArrowLeft,
  Settings,
  CheckCircle,
  Circle,
  ArrowRight,
} from 'lucide-react';

export default function NouveauProduitPage() {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);

  const handleSuccess = (productId: string) => {
    // Rediriger vers la page du produit créé
    router.push(`/produits/catalogue/${productId}`);
  };

  const handleBack = () => {
    if (showForm) {
      setShowForm(false);
    } else {
      router.push('/produits/catalogue');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header avec navigation */}
      <div className="bg-white border-b">
        <div className="w-full px-4 py-4">
          <div className="flex items-center justify-between">
            <ButtonUnified
              variant="outline"
              onClick={handleBack}
              icon={ArrowLeft}
              iconPosition="left"
              className="text-gray-600 hover:text-black"
            >
              {showForm ? 'Retour à la présentation' : 'Retour au catalogue'}
            </ButtonUnified>

            {/* Indicateur d'étape */}
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className="flex items-center">
                {showForm ? (
                  <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                ) : (
                  <Circle className="h-4 w-4 mr-1" />
                )}
                Présentation
              </div>
              <ArrowRight className="h-3 w-3" />
              <div className="flex items-center">
                {showForm ? (
                  <Circle className="h-4 w-4 text-green-600 mr-1" />
                ) : (
                  <Circle className="h-4 w-4 text-gray-300 mr-1" />
                )}
                Création
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-4 py-8">
        {!showForm ? (
          // ÉTAPE 1 - Présentation du Produit Complet
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-black mb-4">
                Nouveau Produit Complet
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Création détaillée avec toutes les informations produit. Wizard
                guidé en 6 étapes pour un produit prêt à vendre.
              </p>
            </div>

            <div className="max-w-2xl mx-auto">
              {/* Carte explicative Produit Complet */}
              <Card
                className="cursor-pointer hover:shadow-lg transition-all border-2 border-transparent hover:border-green-200"
                onClick={() => setShowForm(true)}
              >
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto mb-4 p-3 bg-green-100 rounded-full w-fit">
                    <Settings className="h-8 w-8 text-green-600" />
                  </div>
                  <CardTitle className="text-xl">
                    Wizard Produit Complet
                  </CardTitle>
                  <CardDescription className="text-base">
                    Création guidée avec toutes les informations produit
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-green-700 mb-2">
                      ✨ 6 sections disponibles :
                    </div>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>
                        • <strong>Informations générales</strong> (nom,
                        description, catégorie)
                      </li>
                      <li>
                        • <strong>Fournisseur</strong> (sourcing, référence)
                      </li>
                      <li>
                        • <strong>Tarification</strong> (prix, marges, coûts)
                      </li>
                      <li>
                        • <strong>Caractéristiques techniques</strong>{' '}
                        (dimensions, poids)
                      </li>
                      <li>
                        • <strong>Images</strong> (galerie produit)
                      </li>
                      <li>
                        • <strong>Stock</strong> (quantités, alertes)
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-800 mb-2">
                      🔄 Flexibilité totale :
                    </div>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>
                        • <strong>Aucun champ obligatoire</strong>
                      </li>
                      <li>• Sauvegarde progressive</li>
                      <li>• Navigation libre entre les sections</li>
                      <li>• Finalisation quand vous voulez</li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-800 mb-2">
                      🎯 Idéal pour :
                    </div>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Produits catalogue complets</li>
                      <li>• Produits prêts à vendre</li>
                      <li>• Références détaillées</li>
                    </ul>
                  </div>

                  <div className="pt-2">
                    <Badge
                      variant="outline"
                      className="text-green-600 border-green-200"
                    >
                      Temps estimé : 5-15 minutes
                    </Badge>
                  </div>

                  <div className="pt-4 text-center">
                    <ButtonUnified
                      variant="success"
                      className="shadow-sm hover:shadow-md transition-all px-6 py-2 text-sm"
                      onClick={() => setShowForm(true)}
                    >
                      Commencer la création complète
                    </ButtonUnified>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          // ÉTAPE 2 - Wizard Produit Complet
          <div className="w-full">
            <CompleteProductWizard
              onSuccess={handleSuccess}
              onCancel={handleBack}
            />
          </div>
        )}
      </div>
    </div>
  );
}
