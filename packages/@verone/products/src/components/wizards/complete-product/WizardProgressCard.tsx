'use client';

import { CheckCircle, Loader2 } from 'lucide-react';

import { Card, CardDescription, CardHeader, CardTitle } from '@verone/ui';
import { Progress } from '@verone/ui';

interface WizardProgressCardProps {
  editMode: boolean;
  progress: number;
  isSaving: boolean;
}

export function WizardProgressCard({
  editMode,
  progress,
  isSaving,
}: WizardProgressCardProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold text-black">
              {editMode ? 'Édition du produit' : 'Nouveau Produit Complet'}
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Aucun champ n'est obligatoire. Complétez les informations à votre
              rythme.
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {progress}%
            </div>
            <div className="text-sm text-gray-500">Complété</div>
          </div>
        </div>

        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Progression globale</span>
            <div className="flex items-center space-x-2">
              {isSaving && (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Sauvegarde...</span>
                </>
              )}
              {progress === 100 && (
                <>
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <span className="text-green-600">Prêt à finaliser</span>
                </>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
