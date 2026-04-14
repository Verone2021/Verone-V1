'use client';

import {
  ChevronLeft,
  ChevronRight,
  Save,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';

import { Alert, AlertDescription } from '@verone/ui';
import { Button } from '@verone/ui';
import { Card, CardContent } from '@verone/ui';

import { WIZARD_SECTIONS } from './types';

interface WizardNavigationCardProps {
  currentSection: number;
  progress: number;
  isLoading: boolean;
  isSaving: boolean;
  draftIdState: string | null;
  onPrev: () => void;
  onNext: () => void;
  onSave: () => void;
  onCancel?: () => void;
  onFinalize: () => void;
}

export function WizardNavigationCard({
  currentSection,
  progress,
  isLoading,
  isSaving,
  draftIdState,
  onPrev,
  onNext,
  onSave,
  onCancel,
  onFinalize,
}: WizardNavigationCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={onPrev}
              disabled={currentSection === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Précédent
            </Button>

            <Button
              variant="outline"
              onClick={onNext}
              disabled={currentSection === WIZARD_SECTIONS.length - 1}
            >
              Suivant
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>

          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={onSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder
                </>
              )}
            </Button>

            {onCancel && (
              <Button variant="ghost" onClick={onCancel}>
                Annuler
              </Button>
            )}

            <Button
              onClick={onFinalize}
              disabled={isLoading || !draftIdState}
              className="bg-black hover:bg-gray-800 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Finalisation...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Finaliser le produit
                </>
              )}
            </Button>
          </div>
        </div>

        {progress < 30 && (
          <Alert className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Astuce :</strong> Vous pouvez finaliser le produit à tout
              moment, même avec des informations partielles. Complétez au
              minimum le nom pour une meilleure organisation.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
