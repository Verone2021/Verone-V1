'use client';

import type { ShipmentItem } from '@verone/types';
import { ButtonV2 } from '@verone/ui';
import { Card } from '@verone/ui';
import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import {
  Package,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Shield,
} from 'lucide-react';

import type { PackageInfo, PacklinkService } from './types';
import { WizardSummaryPanel } from './WizardSummaryPanel';
import type { SalesOrderForShipment } from '@verone/orders/hooks';

interface StepPackageInfoProps {
  salesOrder: SalesOrderForShipment;
  packages: PackageInfo[];
  items: ShipmentItem[];
  contentDescription: string;
  setContentDescription: (v: string) => void;
  isSecondHand: boolean;
  setIsSecondHand: (v: boolean) => void;
  declaredValue: number;
  setDeclaredValue: (v: number) => void;
  wantsInsurance: boolean;
  setWantsInsurance: (v: boolean) => void;
  insurancePrice: number;
  selectedService: PacklinkService | null;
  customerName: string;
  addr: Record<string, string> | null;
  handleAddPackage: () => void;
  handleRemovePackage: (idx: number) => void;
  handlePackageChange: (
    idx: number,
    field: keyof PackageInfo,
    value: string
  ) => void;
  onBack: () => void;
  onNext: () => void;
}

export function StepPackageInfo({
  salesOrder,
  packages,
  items,
  contentDescription,
  setContentDescription,
  isSecondHand,
  setIsSecondHand,
  declaredValue,
  setDeclaredValue,
  wantsInsurance,
  setWantsInsurance,
  insurancePrice,
  selectedService,
  customerName,
  addr,
  handleAddPackage,
  handleRemovePackage,
  handlePackageChange,
  onBack,
  onNext,
}: StepPackageInfoProps) {
  return (
    <div className="flex gap-4">
      <div className="flex-1 space-y-5">
        <h3 className="font-semibold flex items-center gap-2">
          <Package className="h-4 w-4" />
          Informations colis
        </h3>

        {/* Addresses */}
        <div className="grid grid-cols-2 gap-4">
          <div className="border rounded-lg p-3">
            <Label className="text-xs text-muted-foreground">Expéditeur</Label>
            <p className="text-sm font-medium mt-1">Verone Collections</p>
            <p className="text-xs text-muted-foreground">
              4 rue du Perou, 91300 Massy
            </p>
          </div>
          <div className="border rounded-lg p-3">
            <Label className="text-xs text-muted-foreground">
              Destinataire
            </Label>
            <p className="text-sm font-medium mt-1">{customerName}</p>
            <p className="text-xs text-muted-foreground">
              {addr
                ? `${addr.address_line1 ?? addr.line1 ?? ''}, ${addr.postal_code ?? ''} ${addr.city ?? ''}`
                : ''}
            </p>
          </div>
        </div>

        {/* Multi-colis */}
        <div className="space-y-3">
          {packages.map((pkg, idx) => (
            <Card key={idx} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="font-medium text-sm">Colis {idx + 1}</p>
                {idx > 0 && (
                  <button
                    type="button"
                    onClick={() => handleRemovePackage(idx)}
                    className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                  >
                    <Trash2 className="h-3 w-3" />
                    Supprimer
                  </button>
                )}
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <Label className="text-xs">Poids (kg)</Label>
                  <Input
                    type="number"
                    min={0.1}
                    step={0.1}
                    value={pkg.weight}
                    onChange={e =>
                      handlePackageChange(idx, 'weight', e.target.value)
                    }
                    className="h-8 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Longueur (cm)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={pkg.length}
                    onChange={e =>
                      handlePackageChange(idx, 'length', e.target.value)
                    }
                    className="h-8 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Largeur (cm)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={pkg.width}
                    onChange={e =>
                      handlePackageChange(idx, 'width', e.target.value)
                    }
                    className="h-8 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Hauteur (cm)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={pkg.height}
                    onChange={e =>
                      handlePackageChange(idx, 'height', e.target.value)
                    }
                    className="h-8 mt-1"
                  />
                </div>
              </div>
            </Card>
          ))}

          <button
            type="button"
            onClick={handleAddPackage}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            <Plus className="h-4 w-4" />
            Ajouter un colis
          </button>
        </div>

        {/* Contenu envoyé */}
        <Card className="p-4 space-y-3">
          <p className="font-medium text-sm">Contenu envoyé</p>
          <div>
            <Label className="text-xs">Contenu</Label>
            <Input
              value={contentDescription}
              onChange={e => setContentDescription(e.target.value)}
              placeholder="Ex: Mobilier, tableau..."
              className="mt-1"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is-second-hand"
              checked={isSecondHand}
              onChange={e => setIsSecondHand(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="is-second-hand" className="text-sm cursor-pointer">
              Occasion
            </Label>
          </div>
          <div>
            <Label className="text-xs">Valeur déclarée (EUR)</Label>
            <Input
              type="number"
              min={0}
              step={0.01}
              value={declaredValue}
              onChange={e => setDeclaredValue(parseFloat(e.target.value) || 0)}
              className="mt-1"
            />
          </div>
        </Card>

        {/* Protection d'expédition */}
        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <div>
              <p className="font-medium text-sm">Protégez votre colis</p>
              <p className="text-xs text-muted-foreground">
                Obtenez un remboursement intégral en cas de perte ou de dommage.
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="insurance"
                checked={wantsInsurance}
                onChange={() => setWantsInsurance(true)}
                className="mt-0.5 h-4 w-4"
              />
              <span className="text-sm">
                Ajouter une protection d&apos;expédition —{' '}
                <span className="font-semibold">
                  {insurancePrice.toFixed(2)} €
                </span>
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="insurance"
                checked={!wantsInsurance}
                onChange={() => setWantsInsurance(false)}
                className="mt-0.5 h-4 w-4"
              />
              <span className="text-sm text-muted-foreground">
                Je suis prêt(e) à prendre le risque.
              </span>
            </label>
          </div>
        </Card>

        <div className="flex justify-between">
          <ButtonV2 variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour
          </ButtonV2>
          <ButtonV2 onClick={onNext}>
            Rechercher les transporteurs
            <ArrowRight className="h-4 w-4 ml-1" />
          </ButtonV2>
        </div>
      </div>

      {/* Summary panel */}
      <WizardSummaryPanel
        salesOrder={salesOrder}
        packages={packages}
        items={items}
        contentDescription={contentDescription}
        declaredValue={declaredValue}
        selectedService={selectedService}
        wantsInsurance={wantsInsurance}
      />
    </div>
  );
}
