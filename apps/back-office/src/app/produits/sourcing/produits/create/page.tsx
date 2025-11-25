'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { SourcingQuickForm } from '@verone/products';
import { Badge } from '@verone/ui';
import { Button } from '@verone/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import { ArrowLeft, Zap, CheckCircle, Circle, ArrowRight } from 'lucide-react';

export default function NewSourcingPage() {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);

  const handleSuccess = (draftId: string) => {
    // Rediriger vers la page du produit sourcé
    router.push(`/produits/sourcing/produits/${draftId}`);
  };

  const handleBack = () => {
    if (showForm) {
      setShowForm(false);
    } else {
      router.push('/produits/sourcing');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header avec navigation */}
      <div className="bg-white border-b">
        <div className="w-full px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="flex items-center text-gray-600 hover:text-black"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {showForm
                ? 'Retour à la présentation'
                : 'Retour aux produits sourcing'}
            </Button>

            {/* Indicateur d'étape */}
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className="flex items-center">
                {showForm ? (
                  <CheckCircle className="h-4 w-4 text-blue-600 mr-1" />
                ) : (
                  <Circle className="h-4 w-4 mr-1" />
                )}
                Présentation
              </div>
              <ArrowRight className="h-3 w-3" />
              <div className="flex items-center">
                {showForm ? (
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

      <div className="w-full px-4 py-8 max-w-6xl">
        {!showForm ? (
          // ÉTAPE 1 - Présentation du Sourcing Rapide
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-black mb-4">
                Sourcing Rapide
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Ajout rapide d'un produit à sourcer avec les informations
                essentielles. Parfait pour une demande client ou une opportunité
                fournisseur.
              </p>
            </div>

            <div className="max-w-2xl mx-auto">
              {/* Carte explicative Sourcing Rapide */}
              <Card
                className="cursor-pointer hover:shadow-lg transition-all border-2 border-transparent hover:border-blue-200"
                onClick={() => setShowForm(true)}
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
                    <div className="text-sm font-medium text-blue-700 mb-2">
                      ⚡ Champs requis (seulement 3) :
                    </div>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>
                        • <strong>Image du produit</strong> (drag & drop)
                      </li>
                      <li>
                        • <strong>Nom du produit</strong>
                      </li>
                      <li>
                        • <strong>URL de la page fournisseur</strong>
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-800 mb-2">
                      📋 Champs facultatifs :
                    </div>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Prix coûtant fournisseur (HT)</li>
                      <li>• Fournisseur</li>
                      <li>• Client assigné</li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-800 mb-2">
                      🎯 Avantages :
                    </div>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>
                        • Création en <strong>moins de 2 minutes</strong>
                      </li>
                      <li>• Produit enregistré en brouillon</li>
                      <li>• Complétez les détails plus tard</li>
                    </ul>
                  </div>

                  <div className="pt-2">
                    <Badge
                      variant="outline"
                      className="text-blue-600 border-blue-200"
                    >
                      Temps estimé : 1-2 minutes
                    </Badge>
                  </div>

                  <div className="pt-4 text-center">
                    <Button
                      className="bg-blue-500 hover:bg-blue-600 text-white border-0 shadow-sm hover:shadow-md transition-all px-6 py-2 text-sm"
                      onClick={() => setShowForm(true)}
                    >
                      Commencer le sourcing rapide
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          // ÉTAPE 2 - Formulaire Sourcing Rapide
          <div className="max-w-4xl mx-auto">
            <SourcingQuickForm
              onSuccess={handleSuccess}
              onCancel={handleBack}
              showHeader
            />
          </div>
        )}
      </div>
    </div>
  );
}
