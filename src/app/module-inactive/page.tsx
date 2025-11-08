/**
 * 🚧 Page Module Non Déployé
 *
 * Affichée lorsqu'un utilisateur tente d'accéder à un module désactivé (Phase 2+).
 * Middleware redirige automatiquement vers cette page.
 */

'use client';

import { Suspense } from 'react';

import { useSearchParams, useRouter } from 'next/navigation';

import { ButtonV2 } from '@verone/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import { AlertCircle, Lock, ArrowLeft, Calendar } from 'lucide-react';

// Mapping noms modules pour affichage convivial
const MODULE_NAMES: Record<string, string> = {
  produits: 'Produits & Catalogue',
  stocks: 'Stocks & Inventaire',
  commandes: 'Commandes (Achats/Ventes)',
  ventes: 'Ventes',
  interactions: 'Interactions & Consultations',
  consultations: 'Consultations',
  'canaux-vente': 'Canaux de Vente',
  finance: 'Finance & Trésorerie',
  factures: 'Facturation',
  tresorerie: 'Trésorerie',
  notifications: 'Notifications',
  'tests-essentiels': 'Tests Essentiels',
};

// Phases prévues par module
const MODULE_PHASES: Record<string, string> = {
  produits: 'Phase 2',
  stocks: 'Phase 2',
  commandes: 'Phase 2',
  ventes: 'Phase 2',
  interactions: 'Phase 3',
  consultations: 'Phase 3',
  'canaux-vente': 'Phase 3',
  finance: 'Phase 3',
  factures: 'Phase 3',
  tresorerie: 'Phase 3',
  notifications: 'Phase 3',
  'tests-essentiels': 'Phase 4 (Dev uniquement)',
};

function ModuleInactiveContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const moduleName = searchParams.get('module') || 'inconnu';
  const requestedPath = searchParams.get('path') || '/';

  const displayName = MODULE_NAMES[moduleName] || moduleName;
  const plannedPhase = MODULE_PHASES[moduleName] || 'Prochainement';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full shadow-xl border-2">
        <CardHeader className="text-center space-y-4 pb-6">
          <div className="flex justify-center">
            <div className="rounded-full bg-yellow-100 p-4">
              <Lock className="h-12 w-12 text-yellow-600" />
            </div>
          </div>

          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Module Non Déployé
            </CardTitle>
            <CardDescription className="text-lg text-gray-600">
              <span className="font-semibold text-gray-900">{displayName}</span>{' '}
              n'est pas encore disponible
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Informations module */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-2 flex-1">
                <p className="text-sm text-yellow-900 font-medium">
                  Ce module fait partie du déploiement progressif de Vérone.
                </p>
                <p className="text-sm text-yellow-800">
                  Nous activons les modules étape par étape pour garantir
                  stabilité et qualité.
                </p>
              </div>
            </div>
          </div>

          {/* Phase prévue */}
          <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Calendar className="h-5 w-5 text-blue-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">
                Déploiement prévu :{' '}
                <span className="font-bold">{plannedPhase}</span>
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Vous serez notifié lors de l'activation
              </p>
            </div>
          </div>

          {/* Modules actuellement actifs */}
          <div className="border-t pt-4">
            <p className="text-sm font-medium text-gray-700 mb-3">
              Modules actuellement disponibles (Phase 1) :
            </p>
            <ul className="grid grid-cols-2 gap-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Dashboard
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Profil Utilisateur
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Organisations & Contacts
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Administration
              </li>
            </ul>
          </div>

          {/* Chemin demandé (debug info) */}
          {requestedPath !== '/' && (
            <div className="text-xs text-gray-500 px-4 py-2 bg-gray-50 rounded border">
              <span className="font-mono">{requestedPath}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <ButtonV2
              variant="outline"
              className="flex-1"
              icon={ArrowLeft}
              onClick={() => router.back()}
            >
              Retour
            </ButtonV2>

            <ButtonV2
              variant="primary"
              className="flex-1"
              onClick={() => router.push('/dashboard')}
            >
              Aller au Dashboard
            </ButtonV2>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ModuleInactivePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      }
    >
      <ModuleInactiveContent />
    </Suspense>
  );
}
