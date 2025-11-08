'use client';

import { useState } from 'react';

import {
  CheckCircle,
  AlertCircle,
  Package,
  Clock,
  User,
  FileText,
  Settings,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@verone/utils';
import { SampleOrderButton } from '@/shared/modules/ui/components/buttons/SampleOrderButton';

interface SampleRequirementSectionProps {
  // Données de base
  requiresSample: boolean;
  isProduct?: boolean; // true pour produit, false pour brouillon
  onRequirementChange?: (requiresSample: boolean) => void;

  // Métadonnées optionnelles pour l'affichage
  productId?: string; // ID du produit pour commander échantillon
  productName?: string;
  productType?: 'standard' | 'custom';
  assignedClientId?: string;
  assignedClient?: {
    id: string;
    name: string;
    type: string;
  };
  supplierName?: string; // Nom du fournisseur
  costPrice?: number; // Prix d'achat

  // État d'édition
  disabled?: boolean;
  className?: string;
}

export function SampleRequirementSection({
  requiresSample,
  isProduct = false,
  onRequirementChange,
  productId,
  productName,
  productType = 'standard',
  assignedClientId,
  assignedClient,
  supplierName,
  costPrice,
  disabled = false,
  className,
}: SampleRequirementSectionProps) {
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);

  const handleToggle = (newValue: boolean) => {
    onRequirementChange?.(newValue);
  };

  const getSampleStatusBadge = () => {
    if (requiresSample) {
      return (
        <Badge className="bg-gray-100 text-gray-900 border-gray-200">
          <AlertCircle className="h-3 w-3 mr-1" />
          Échantillon requis
        </Badge>
      );
    } else {
      return (
        <Badge
          variant="outline"
          className="bg-green-50 text-green-700 border-green-200"
        >
          <CheckCircle className="h-3 w-3 mr-1" />
          Aucun échantillon
        </Badge>
      );
    }
  };

  const getWorkflowInfo = () => {
    if (!requiresSample) {
      return (
        <div className="space-y-3">
          <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg border border-green-200">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium">Processus normal</span>
            </div>
            <p className="mt-1 text-green-700">
              Ce produit peut être commandé ou validé directement sans
              échantillon préalable.
            </p>
          </div>

          {/* Bouton Commander échantillon si produit existe */}
          {isProduct && productId && productName && (
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm">
                <p className="font-medium text-blue-900">
                  Besoin de tester le produit ?
                </p>
                <p className="text-blue-700">
                  Commandez un échantillon pour validation qualité
                </p>
              </div>
              <SampleOrderButton
                productId={productId}
                productName={productName}
                supplierName={supplierName}
                costPrice={costPrice}
                size="sm"
              />
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="text-sm text-black bg-gray-50 p-3 rounded-lg border border-gray-200">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span className="font-medium">Workflow d'échantillonnage</span>
        </div>
        <div className="mt-2 space-y-1 text-gray-800">
          <p>1. Demande d'échantillon</p>
          <p>2. Validation de l'échantillon</p>
          <p>3. Commande ou validation du produit</p>
        </div>
        {isProduct && (
          <p className="mt-2 text-xs text-black">
            <FileText className="h-3 w-3 inline mr-1" />
            Un workflow sera créé automatiquement lors de la première commande
          </p>
        )}
      </div>
    );
  };

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Gestion des échantillons
          </CardTitle>
          {getSampleStatusBadge()}
        </div>
        {productName && (
          <p className="text-sm text-gray-600">
            {productName}
            {assignedClient && (
              <span className="ml-2">
                <Badge variant="outline" className="text-xs">
                  <User className="h-3 w-3 mr-1" />
                  {assignedClient.name}
                </Badge>
              </span>
            )}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Contrôle principal */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-1">
            <Label className="text-base font-medium">
              Ce produit nécessite un échantillon
            </Label>
            <p className="text-sm text-gray-600">
              Active le workflow d'échantillonnage pour ce produit
            </p>
          </div>
          <Switch
            checked={requiresSample}
            onCheckedChange={handleToggle}
            disabled={disabled}
          />
        </div>

        {/* Informations de workflow */}
        {getWorkflowInfo()}

        {/* Information sur le type de produit */}
        {productType === 'custom' && assignedClient && (
          <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="font-medium">Produit sur-mesure</span>
            </div>
            <p className="mt-1 text-blue-700">
              L'échantillon sera spécifiquement créé pour {assignedClient.name}
            </p>
          </div>
        )}

        {/* Notes optionnelles */}
        {requiresSample && (
          <div className="space-y-3">
            <Separator />

            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Notes sur l'échantillonnage
              </Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNotes(!showNotes)}
              >
                <Settings className="h-4 w-4" />
                {showNotes ? 'Masquer' : 'Ajouter des notes'}
              </Button>
            </div>

            {showNotes && (
              <Textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Instructions spéciales pour l'échantillonnage, matériaux, couleurs, dimensions..."
                rows={3}
                disabled={disabled}
              />
            )}
          </div>
        )}

        {/* Informations futures */}
        {requiresSample && !isProduct && (
          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded border">
            <FileText className="h-4 w-4 inline mr-1" />
            <strong>À venir :</strong> Interface de gestion complète des
            échantillons avec suivi des demandes, validation, et historique sera
            disponible prochainement.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
