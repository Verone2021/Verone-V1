/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState, Suspense, lazy } from 'react';

import { useRouter } from 'next/navigation';

// FIXME: CompleteProductWizard component can't be imported from apps/back-office in package
// import { CompleteProductWizard } from '@/components/business/complete-product-wizard';
import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import { cn } from '@verone/utils';
import {
  ArrowLeft,
  Package,
  Zap,
  Settings,
  CheckCircle,
  Circle,
  ArrowRight,
} from 'lucide-react';

// Le formulaire complet sera intégré directement plus tard
// Pour l'instant, on redirige vers le composant SourcingQuickForm pour les deux types

interface ProductCreationWizardProps {
  onSuccess?: (productId: string) => void;
  onCancel?: () => void;
  className?: string;
}

export type CreationType = 'sourcing' | 'complete' | null;

export function ProductCreationWizard({
  onSuccess,
  onCancel,
  className,
}: ProductCreationWizardProps) {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<CreationType>(null);

  // Gérer le retour en arrière
  const handleBack = () => {
    if (selectedType) {
      setSelectedType(null);
    } else if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  };

  // Gérer le succès et rediriger selon le type
  const handleSuccess = (productId: string) => {
    if (selectedType === 'sourcing') {
      // Rediriger vers la page sourcing
      router.push('/produits/sourcing/produits');
    } else {
      // Rediriger vers la page produit créé
      router.push(`/catalogue/${productId}`);
    }

    if (onSuccess) {
      onSuccess(productId);
    }
  };

  return (
    <div className={cn('min-h-screen bg-gray-50', className)}>
      {/* Header avec navigation */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <ButtonV2
              variant="ghost"
              onClick={handleBack}
              className="flex items-center text-gray-600 hover:text-black"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {selectedType ? 'Changer de type' : 'Retour au catalogue'}
            </ButtonV2>

            {/* Indicateur d'étape */}
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className="flex items-center">
                {selectedType ? (
                  <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                ) : (
                  <Circle className="h-4 w-4 mr-1" />
                )}
                Sélection du type
              </div>
              <ArrowRight className="h-3 w-3" />
              <div className="flex items-center">
                {selectedType ? (
                  <Circle className="h-4 w-4 text-blue-600 mr-1" />
                ) : (
                  <Circle className="h-4 w-4 text-gray-300 mr-1" />
                )}
                Création
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {!selectedType ? (
          // ÉTAPE 1 - Sélection du type
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-black mb-4">
                Création de produit
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Choisissez le type de création qui correspond à vos besoins.
                Vous pourrez toujours modifier et compléter les informations
                plus tard.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {/* Option Sourcing Rapide */}
              <Card
                className="cursor-pointer hover:shadow-lg transition-all border-2 border-transparent hover:border-blue-200"
                onClick={() => setSelectedType('sourcing')}
              >
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
                    <Zap className="h-8 w-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">Sourcing Rapide</CardTitle>
                  <CardDescription className="text-base">
                    Ajout rapide d'un produit à sourcer avec les informations
                    essentielles
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-green-700 mb-2">
                      ✅ Champs obligatoires (3) :
                    </div>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Image du produit</li>
                      <li>• Nom du produit</li>
                      <li>• URL page fournisseur</li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium text-blue-700 mb-2">
                      🎯 Idéal pour :
                    </div>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Sourcing interne (catalogue général)</li>
                      <li>• Sourcing client (consultation spécifique)</li>
                      <li>• Ajout rapide de références trouvées</li>
                    </ul>
                  </div>

                  <div className="pt-2">
                    <Badge
                      variant="outline"
                      className="text-blue-600 border-blue-200"
                    >
                      Temps estimé : 2-3 minutes
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Option Produit Complet */}
              <Card
                className="cursor-pointer hover:shadow-lg transition-all border-2 border-transparent hover:border-green-200"
                onClick={() => setSelectedType('complete')}
              >
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto mb-4 p-3 bg-green-100 rounded-full w-fit">
                    <Settings className="h-8 w-8 text-green-600" />
                  </div>
                  <CardTitle className="text-xl">
                    Nouveau Produit Complet
                  </CardTitle>
                  <CardDescription className="text-base">
                    Création détaillée avec toutes les informations produit
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-green-700 mb-2">
                      ✨ Champs disponibles :
                    </div>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Informations générales</li>
                      <li>• Catégorisation et famille</li>
                      <li>• Fournisseur et sourcing</li>
                      <li>• Tarification et coûts</li>
                      <li>• Caractéristiques techniques</li>
                      <li>• Images et médias</li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-800 mb-2">
                      🔄 Avantages :
                    </div>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>
                        • <strong>Aucun champ obligatoire</strong>
                      </li>
                      <li>• Sauvegarde progressive</li>
                      <li>• Finalisation quand vous voulez</li>
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
                </CardContent>
              </Card>
            </div>

            {/* Informations complémentaires */}
            <div className="text-center text-sm text-gray-500 max-w-2xl mx-auto">
              <Package className="h-5 w-5 mx-auto mb-2" />
              <p>
                <strong>Astuce :</strong> Vous pouvez commencer par un sourcing
                rapide et le compléter plus tard avec toutes les informations
                détaillées.
              </p>
            </div>
          </div>
        ) : (
          // ÉTAPE 2 - Wizard Produit Complet (utilisé pour tous les types)
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mr-3" />
                <span className="text-gray-600">
                  Chargement du formulaire complet...
                </span>
              </div>
            }
          >
            {/* FIXME: CompleteProductWizard component can't be imported from apps/back-office
            <CompleteProductWizard
              onSuccess={handleSuccess}
              onCancel={handleBack}
            />
            */}
            <div className="p-8 border rounded bg-gray-50">
              <p className="text-center text-gray-600">
                Formulaire de création produit (temporairement désactivé)
              </p>
            </div>
          </Suspense>
        )}
      </div>
    </div>
  );
}
